"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusEngine = void 0;
const geo_utils_1 = require("./geo_utils");
/**
 * Motor Cinemático de Movimiento de un Colectivo en Servidor
 * Sigue la geometría vial real de las calles de Ipiales y respeta tiempos de detención reglados.
 */
class BusEngine {
    config;
    ruta;
    currentSegmentIndex = 0;
    segmentProgress = 0.0; // 0.0 a 1.0 en el segmento actual
    currentPosition;
    currentBearing = 0.0;
    currentSpeedKmh = 0.0;
    dwellRemainingSec = 0;
    estado = 'enRecorrido';
    sentido = 'ida';
    // Parada en la que acaba de detenerse para no volver a detenerse inmediatamente
    ultimaParadaVisitadaId = null;
    constructor(config, ruta) {
        this.config = config;
        this.ruta = ruta;
        if (ruta.polyline.length < 2) {
            throw new Error(`La ruta ${ruta.codigo} debe tener al menos 2 coordenadas.`);
        }
        // Inicializar posición según progreso inicial escalonado
        const totalSegments = ruta.polyline.length - 1;
        const initialSegment = Math.floor(config.progresoInicial * totalSegments);
        this.currentSegmentIndex = Math.min(initialSegment, totalSegments - 1);
        this.segmentProgress = (config.progresoInicial * totalSegments) - this.currentSegmentIndex;
        const p1 = ruta.polyline[this.currentSegmentIndex];
        const p2 = ruta.polyline[this.currentSegmentIndex + 1];
        this.currentPosition = (0, geo_utils_1.interpolate)(p1, p2, this.segmentProgress);
        this.currentBearing = (0, geo_utils_1.calculateBearing)(p1, p2);
        this.currentSpeedKmh = config.velocidadCruceroKmh;
    }
    /**
     * Restaura el estado cinemático desde el último documento guardado en Firestore
     * Evita saltos de posición al reiniciar el Background Worker en Render.
     */
    restoreFromFirestore(data) {
        const totalSegments = this.ruta.polyline.length - 1;
        if (typeof data.currentSegmentIndex === 'number' &&
            data.currentSegmentIndex >= 0 &&
            data.currentSegmentIndex < totalSegments) {
            this.currentSegmentIndex = data.currentSegmentIndex;
            this.segmentProgress = Math.max(0.0, Math.min(1.0, data.segmentProgress ?? 0.0));
            this.sentido = data.sentido === 'retorno' ? 'retorno' : 'ida';
            if (typeof data.latitud === 'number' && typeof data.longitud === 'number') {
                this.currentPosition = { lat: data.latitud, lng: data.longitud };
            }
            else {
                const p1 = this.ruta.polyline[this.currentSegmentIndex];
                const p2 = this.ruta.polyline[this.currentSegmentIndex + 1];
                this.currentPosition = (0, geo_utils_1.interpolate)(p1, p2, this.segmentProgress);
            }
            this.currentBearing = typeof data.bearing === 'number' ? data.bearing : this.currentBearing;
            this.dwellRemainingSec = data.tiempoDetencionRestanteSec ?? 0;
            this.estado = data.estado ?? (this.dwellRemainingSec > 0 ? 'detenidoEnParada' : 'enRecorrido');
            this.currentSpeedKmh = this.estado === 'detenidoEnParada' ? 0.0 : this.config.velocidadCruceroKmh;
        }
    }
    /**
     * Avanza la cinemática del colectivo en un intervalo de tiempo (deltaSeconds)
     */
    tick(deltaSeconds) {
        // 1. Manejo de parada reglada (Dwell time)
        if (this.dwellRemainingSec > 0) {
            this.dwellRemainingSec = Math.max(0, this.dwellRemainingSec - deltaSeconds);
            this.currentSpeedKmh = 0.0;
            this.estado = 'detenidoEnParada';
            if (this.dwellRemainingSec === 0) {
                // Fin de la detención: reanudar marcha
                this.estado = 'enRecorrido';
                this.currentSpeedKmh = this.config.velocidadCruceroKmh;
            }
            return;
        }
        // 2. Avance en tramo vial
        this.estado = 'enRecorrido';
        this.currentSpeedKmh = this.config.velocidadCruceroKmh;
        const speedMs = (this.currentSpeedKmh * 1000.0) / 3600.0;
        let distanceToCoverMeters = speedMs * deltaSeconds;
        const poly = this.ruta.polyline;
        const totalSegments = poly.length - 1;
        while (distanceToCoverMeters > 0) {
            const p1 = poly[this.currentSegmentIndex];
            const p2 = poly[this.currentSegmentIndex + 1];
            const segmentLength = (0, geo_utils_1.haversineDistanceMeters)(p1, p2);
            if (segmentLength <= 0.001) {
                // Vértices idénticos, pasar al siguiente
                this._advanceSegment(totalSegments);
                continue;
            }
            const remainingInSegmentMeters = (1.0 - this.segmentProgress) * segmentLength;
            if (distanceToCoverMeters < remainingInSegmentMeters) {
                // El avance queda dentro del segmento actual
                this.segmentProgress += distanceToCoverMeters / segmentLength;
                this.currentPosition = (0, geo_utils_1.interpolate)(p1, p2, this.segmentProgress);
                this.currentBearing = (0, geo_utils_1.calculateBearing)(p1, p2);
                distanceToCoverMeters = 0;
            }
            else {
                // Supera el segmento actual, avanzar al siguiente
                distanceToCoverMeters -= remainingInSegmentMeters;
                this.segmentProgress = 0.0;
                this._advanceSegment(totalSegments);
            }
        }
        // 3. Comprobar si el bus acaba de arribar a una parada oficial
        this._checkStopArrival();
    }
    _advanceSegment(totalSegments) {
        if (this.sentido === 'ida') {
            if (this.currentSegmentIndex < totalSegments - 1) {
                this.currentSegmentIndex++;
            }
            else {
                // Fin de la ruta: alternar a retorno o bucle
                this.currentSegmentIndex = 0; // Bucle circular continuo
                this.ultimaParadaVisitadaId = null;
            }
        }
    }
    _checkStopArrival() {
        if (!this.ruta.paradasSecuencia || this.ruta.paradasSecuencia.length === 0) {
            return;
        }
        const STOP_THRESHOLD_METERS = 38.0;
        for (const stop of this.ruta.paradasSecuencia) {
            if (this.ultimaParadaVisitadaId === stop.parada_id) {
                continue; // Ya se atendió recientemente esta parada
            }
            const dist = (0, geo_utils_1.haversineDistanceMeters)(this.currentPosition, stop.posicion);
            if (dist <= STOP_THRESHOLD_METERS) {
                // Iniciar detención reglada en la parada
                this.dwellRemainingSec = stop.tiempo_detencion_dwell_sec || this.config.tiempoParadaDefectoSec;
                this.estado = 'detenidoEnParada';
                this.currentSpeedKmh = 0.0;
                this.ultimaParadaVisitadaId = stop.parada_id;
                break;
            }
        }
        // Limpiar última parada cuando el bus se aleja más de 80 metros
        if (this.ultimaParadaVisitadaId) {
            const currentStop = this.ruta.paradasSecuencia.find((s) => s.parada_id === this.ultimaParadaVisitadaId);
            if (currentStop) {
                const dist = (0, geo_utils_1.haversineDistanceMeters)(this.currentPosition, currentStop.posicion);
                if (dist > 80.0) {
                    this.ultimaParadaVisitadaId = null;
                }
            }
        }
    }
    /**
     * Calcula la próxima parada en el recorrido y la distancia/ETA
     */
    _calculateNextStop() {
        if (!this.ruta.paradasSecuencia || this.ruta.paradasSecuencia.length === 0) {
            return {};
        }
        let closestNextStop = null;
        let minDistance = Number.MAX_VALUE;
        for (const stop of this.ruta.paradasSecuencia) {
            const dist = (0, geo_utils_1.haversineDistanceMeters)(this.currentPosition, stop.posicion);
            // Paradas a más de 30m para ser la próxima
            if (dist > 25.0 && dist < minDistance) {
                minDistance = dist;
                closestNextStop = stop;
            }
        }
        if (!closestNextStop) {
            closestNextStop = this.ruta.paradasSecuencia[0];
            minDistance = (0, geo_utils_1.haversineDistanceMeters)(this.currentPosition, closestNextStop.posicion);
        }
        const speedMs = Math.max(2.0, (this.config.velocidadCruceroKmh * 1000.0) / 3600.0);
        const etaSeg = Math.round(minDistance / speedMs);
        return {
            proximaParadaId: closestNextStop.parada_id,
            proximaParadaNombre: closestNextStop.nombre_parada,
            distanciaM: Math.round(minDistance),
            etaSeg
        };
    }
    /**
     * Genera el payload oficial para persistir en Cloud Firestore
     */
    toFirestorePayload(workerVersion) {
        const nextStop = this._calculateNextStop();
        return {
            vehiculoId: this.config.vehiculoId,
            numeroMovil: this.config.numeroMovil,
            placa: this.config.placa,
            rutaId: this.config.rutaId,
            codigoRuta: this.config.codigoRuta,
            conductorId: this.config.conductorId,
            conductorNombre: this.config.conductorNombre,
            latitud: Number(this.currentPosition.lat.toFixed(6)),
            longitud: Number(this.currentPosition.lng.toFixed(6)),
            bearing: Number(this.currentBearing.toFixed(1)),
            velocidadKmh: Number(this.currentSpeedKmh.toFixed(1)),
            estado: this.estado,
            proximaParadaId: nextStop.proximaParadaId,
            proximaParadaNombre: nextStop.proximaParadaNombre,
            distanciaProximaParadaM: nextStop.distanciaM,
            etaProximaParadaSeg: nextStop.etaSeg,
            currentSegmentIndex: this.currentSegmentIndex,
            segmentProgress: Number(this.segmentProgress.toFixed(4)),
            sentido: this.sentido,
            tiempoDetencionRestanteSec: Math.round(this.dwellRemainingSec),
            ultimaActualizacion: new Date().toISOString(),
            estadoConexion: 'online',
            fuente: 'render_background_worker',
            workerVersion,
            esGpsReal: false // Distingue internamente el movimiento de bus programado en servidor
        };
    }
}
exports.BusEngine = BusEngine;
