"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.degreesToRadians = degreesToRadians;
exports.radiansToDegrees = radiansToDegrees;
exports.haversineDistanceMeters = haversineDistanceMeters;
exports.calculateBearing = calculateBearing;
exports.interpolate = interpolate;
/**
 * Utilidades Geográficas y Cinemáticas para el Movimiento de Colectivos en Ipiales
 */
const EARTH_RADIUS_METERS = 6371000.0;
function degreesToRadians(deg) {
    return deg * (Math.PI / 180.0);
}
function radiansToDegrees(rad) {
    return rad * (180.0 / Math.PI);
}
/**
 * Distancia ortodrómica en metros entre dos coordenadas (Fórmula de Haversine)
 */
function haversineDistanceMeters(p1, p2) {
    const dLat = degreesToRadians(p2.lat - p1.lat);
    const dLng = degreesToRadians(p2.lng - p1.lng);
    const lat1Rad = degreesToRadians(p1.lat);
    const lat2Rad = degreesToRadians(p2.lat);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
}
/**
 * Cálculo del rumbo (bearing/orientación) en grados (0 a 360)
 */
function calculateBearing(start, end) {
    const startLat = degreesToRadians(start.lat);
    const startLng = degreesToRadians(start.lng);
    const endLat = degreesToRadians(end.lat);
    const endLng = degreesToRadians(end.lng);
    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    let brng = radiansToDegrees(Math.atan2(y, x));
    return (brng + 360) % 360;
}
/**
 * Interpolación lineal entre dos coordenadas
 */
function interpolate(p1, p2, fraction) {
    const f = Math.max(0.0, Math.min(1.0, fraction));
    return {
        lat: p1.lat + (p2.lat - p1.lat) * f,
        lng: p1.lng + (p2.lng - p1.lng) * f
    };
}
