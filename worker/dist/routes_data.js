"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLOTA_OFICIAL = exports.RUTAS_OFICIALES = void 0;
/**
 * Datos Geográficos Oficiales de Rutas y Paradas para Colectivos Ciudad de Ipiales S.A.
 * Utilizado por el Worker de Render para seguir la geometría vial de Ipiales.
 */
exports.RUTAS_OFICIALES = [
    {
        id: 'ruta_01_centro_lajas',
        codigo: 'R-01',
        nombre: 'Ruta 1 - Centro / Las Lajas',
        color_hex: '#E64A19',
        activa: true,
        frecuencia_despacho_min: 10,
        velocidad_promedio_kmh: 24,
        polyline: [
            { lat: 0.8175, lng: -77.6362 }, // Terminal de Transportes
            { lat: 0.8190, lng: -77.6370 }, // Cra 1 con Cll 5
            { lat: 0.8205, lng: -77.6380 }, // Cra 1 con Cll 7
            { lat: 0.8220, lng: -77.6390 }, // Cra 1 con Cll 10
            { lat: 0.8235, lng: -77.6398 }, // Giro Cll 13 con Cra 2
            { lat: 0.8250, lng: -77.6405 }, // Cll 13 con Cra 4
            { lat: 0.8262, lng: -77.6410 }, // Plaza de Mercado Central
            { lat: 0.8270, lng: -77.6420 }, // Cra 5 con Cll 11
            { lat: 0.8278, lng: -77.6432 }, // Cra 5 con Cll 9
            { lat: 0.8282, lng: -77.6440 }, // Cll 9 hacia Parque 20 de Julio
            { lat: 0.8286, lng: -77.6445 }, // Parque 20 de Julio (Cra 6 con Cll 9)
            { lat: 0.8296, lng: -77.6453 }, // Cra 6 con Cll 12
            { lat: 0.8306, lng: -77.6462 }, // Cra 6 con Cll 15
            { lat: 0.8318, lng: -77.6471 }, // Cra 6 con Cll 18
            { lat: 0.8328, lng: -77.6478 }, // Cra 6 con Cll 22
            { lat: 0.8335, lng: -77.6482 }, // Hospital Civil
            { lat: 0.8330, lng: -77.6460 }, // Cll 24 con Cra 4
            { lat: 0.8322, lng: -77.6430 }, // Cll 24 con Cra 2
            { lat: 0.8310, lng: -77.6390 }, // Av. Los Estudiantes
            { lat: 0.8280, lng: -77.6355 }, // Glorieta Este
            { lat: 0.8250, lng: -77.6310 }, // Vía al Oriente
            { lat: 0.8220, lng: -77.6250 }, // Parada Vía Las Lajas (Informal)
            { lat: 0.8205, lng: -77.6220 }, // Curva Vía 1001
            { lat: 0.8190, lng: -77.6185 },
            { lat: 0.8175, lng: -77.6145 },
            { lat: 0.8160, lng: -77.6100 }, // Mirador Cañón del Guáitara
            { lat: 0.8145, lng: -77.6060 },
            { lat: 0.8130, lng: -77.6020 },
            { lat: 0.8115, lng: -77.5995 },
            { lat: 0.8100, lng: -77.5980 }, // Corregimiento Las Lajas
            { lat: 0.8085, lng: -77.5945 },
            { lat: 0.8070, lng: -77.5915 },
            { lat: 0.8060, lng: -77.5880 },
            { lat: 0.8053, lng: -77.5861 } // Santuario Las Lajas
        ],
        paradasSecuencia: [
            { orden: 1, parada_id: 'parada_terminal_ipiales', nombre_parada: 'Terminal de Transportes', posicion: { lat: 0.8175, lng: -77.6362 }, distancia_acumulada_m: 0, tiempo_detencion_dwell_sec: 15 },
            { orden: 2, parada_id: 'parada_mercado_central', nombre_parada: 'Plaza de Mercado Central', posicion: { lat: 0.8262, lng: -77.6410 }, distancia_acumulada_m: 1200, tiempo_detencion_dwell_sec: 20 },
            { orden: 3, parada_id: 'parada_parque_20_julio', nombre_parada: 'Parque 20 de Julio (Centro)', posicion: { lat: 0.8286, lng: -77.6445 }, distancia_acumulada_m: 1850, tiempo_detencion_dwell_sec: 20 },
            { orden: 4, parada_id: 'parada_hospital_civil', nombre_parada: 'Hospital Civil de Ipiales', posicion: { lat: 0.8335, lng: -77.6482 }, distancia_acumulada_m: 2700, tiempo_detencion_dwell_sec: 15 },
            { orden: 5, parada_id: 'parada_via_lajas_mirador', nombre_parada: 'Mirador Cañón del Guáitara', posicion: { lat: 0.8160, lng: -77.6100 }, distancia_acumulada_m: 5400, tiempo_detencion_dwell_sec: 10 },
            { orden: 6, parada_id: 'parada_santuario_lajas', nombre_parada: 'Santuario de Las Lajas', posicion: { lat: 0.8053, lng: -77.5861 }, distancia_acumulada_m: 8600, tiempo_detencion_dwell_sec: 30 }
        ]
    },
    {
        id: 'ruta_02_panamericana_rumichaca',
        codigo: 'R-02',
        nombre: 'Ruta 2 - Terminal / Panamericana / Rumichaca',
        color_hex: '#1976D2',
        activa: true,
        frecuencia_despacho_min: 12,
        velocidad_promedio_kmh: 26,
        polyline: [
            { lat: 0.8175, lng: -77.6362 }, // Terminal
            { lat: 0.8190, lng: -77.6390 },
            { lat: 0.8210, lng: -77.6420 },
            { lat: 0.8248, lng: -77.6465 }, // Cra 7 con Cll 14
            { lat: 0.8265, lng: -77.6495 }, // Salida Panamericana Sur
            { lat: 0.8240, lng: -77.6530 }, // Panamericana Tramo 1
            { lat: 0.8210, lng: -77.6565 }, // Panamericana Tramo 2
            { lat: 0.8180, lng: -77.6590 }, // Panamericana Tramo 3
            { lat: 0.8155, lng: -77.6610 }, // Aproximación Aduana
            { lat: 0.8145, lng: -77.6625 } // Puente Internacional Rumichaca
        ],
        paradasSecuencia: [
            { orden: 1, parada_id: 'parada_terminal_ipiales', nombre_parada: 'Terminal de Transportes', posicion: { lat: 0.8175, lng: -77.6362 }, distancia_acumulada_m: 0, tiempo_detencion_dwell_sec: 15 },
            { orden: 2, parada_id: 'parada_panamericana_sur', nombre_parada: 'Acceso Panamericana Sur', posicion: { lat: 0.8240, lng: -77.6530 }, distancia_acumulada_m: 1900, tiempo_detencion_dwell_sec: 15 },
            { orden: 3, parada_id: 'parada_puente_rumichaca', nombre_parada: 'Puente Internacional Rumichaca', posicion: { lat: 0.8145, lng: -77.6625 }, distancia_acumulada_m: 4200, tiempo_detencion_dwell_sec: 30 }
        ]
    },
    {
        id: 'ruta_03_champagnat_charco',
        codigo: 'R-03',
        nombre: 'Ruta 3 - Circular Urbana / Champagnat / El Charco',
        color_hex: '#388E3C',
        activa: true,
        frecuencia_despacho_min: 15,
        velocidad_promedio_kmh: 20,
        polyline: [
            { lat: 0.8286, lng: -77.6445 }, // Parque 20 de Julio
            { lat: 0.8320, lng: -77.6470 }, // Cra 6 hacia Champagnat
            { lat: 0.8350, lng: -77.6485 }, // Colegio Champagnat
            { lat: 0.8340, lng: -77.6420 }, // Cll 25
            { lat: 0.8300, lng: -77.6350 }, // Barrio San Felipe
            { lat: 0.8240, lng: -77.6310 }, // Hacia El Charco
            { lat: 0.8198, lng: -77.6199 }, // Sede Colectivos El Charco (Cra 6 # 5E-20)
            { lat: 0.8220, lng: -77.6320 }, // Retorno hacia Centro
            { lat: 0.8262, lng: -77.6410 }, // Plaza de Mercado
            { lat: 0.8286, lng: -77.6445 } // Cierre en Parque 20 de Julio
        ],
        paradasSecuencia: [
            { orden: 1, parada_id: 'parada_parque_20_julio', nombre_parada: 'Parque 20 de Julio (Centro)', posicion: { lat: 0.8286, lng: -77.6445 }, distancia_acumulada_m: 0, tiempo_detencion_dwell_sec: 15 },
            { orden: 2, parada_id: 'parada_champagnat', nombre_parada: 'Colegio Champagnat', posicion: { lat: 0.8350, lng: -77.6485 }, distancia_acumulada_m: 1100, tiempo_detencion_dwell_sec: 15 },
            { orden: 3, parada_id: 'parada_charco_sede', nombre_parada: 'Sede Colectivos El Charco', posicion: { lat: 0.8198, lng: -77.6199 }, distancia_acumulada_m: 3500, tiempo_detencion_dwell_sec: 25 }
        ]
    }
];
exports.FLOTA_OFICIAL = [
    {
        vehiculoId: 'movil_24',
        numeroMovil: '24',
        placa: 'SOV-814',
        rutaId: 'ruta_01_centro_lajas',
        codigoRuta: 'R-01',
        conductorId: 'driver_01',
        conductorNombre: 'Carlos Benavides',
        velocidadCruceroKmh: 24.0,
        tiempoParadaDefectoSec: 15,
        progresoInicial: 0.05
    },
    {
        vehiculoId: 'movil_12',
        numeroMovil: '12',
        placa: 'SKL-512',
        rutaId: 'ruta_02_panamericana_rumichaca',
        codigoRuta: 'R-02',
        conductorId: 'driver_02',
        conductorNombre: 'Mario Montenegro',
        velocidadCruceroKmh: 26.0,
        tiempoParadaDefectoSec: 15,
        progresoInicial: 0.15
    },
    {
        vehiculoId: 'movil_08',
        numeroMovil: '08',
        placa: 'SOV-308',
        rutaId: 'ruta_03_champagnat_charco',
        codigoRuta: 'R-03',
        conductorId: 'driver_03',
        conductorNombre: 'Germán Revelo',
        velocidadCruceroKmh: 22.0,
        tiempoParadaDefectoSec: 15,
        progresoInicial: 0.25
    }
];
