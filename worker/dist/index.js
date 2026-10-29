"use strict";
/**
 * SIBRI - Render Background Worker
 * Colectivos Ciudad de Ipiales S.A.
 *
 * Proceso centralizado continuo para el cálculo y publicación autorizada del movimiento
 * de la flota de colectivos en Cloud Firestore.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
const bus_engine_1 = require("./bus_engine");
const routes_data_1 = require("./routes_data");
dotenv.config();
const WORKER_VERSION = '1.0.0';
const UPDATE_INTERVAL_MS = parseInt(process.env.UPDATE_INTERVAL_MS || '2500', 10);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    'sibri-523ab';
let isShuttingDown = false;
let db = null;
const busEngines = [];
/**
 * 1. Inicialización Autorizada de Firebase Admin SDK
 */
function initFirebase() {
    if (admin.apps.length > 0) {
        return admin.firestore();
    }
    // Opción A: Variable con JSON de cuenta de servicio completa (Recomendado en Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
            const serviceAccount = JSON.parse(rawJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
            console.log('✅ Firebase Admin SDK inicializado con FIREBASE_SERVICE_ACCOUNT_KEY.');
            return admin.firestore();
        }
        catch (e) {
            console.error('⚠️ Error parseando FIREBASE_SERVICE_ACCOUNT_KEY:', e);
        }
    }
    // Opción B: Variables individuales (FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY)
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey
                }),
                projectId: PROJECT_ID
            });
            console.log('✅ Firebase Admin SDK inicializado con CLIENT_EMAIL y PRIVATE_KEY.');
            return admin.firestore();
        }
        catch (e) {
            console.error('⚠️ Error inicializando con credenciales individuales:', e);
        }
    }
    // Opción C: Emulador local o credenciales de entorno predeterminadas de Google Cloud
    try {
        admin.initializeApp({ projectId: PROJECT_ID });
        console.log(`ℹ️ Firebase Admin SDK inicializado con project ID "${PROJECT_ID}".`);
        return admin.firestore();
    }
    catch (e) {
        console.warn('⚠️ No se detectaron credenciales remotas. Operando en modo local/tolerante.');
        return admin.firestore();
    }
}
/**
 * 2. Recuperar el último estado de cada bus desde Firestore para evitar saltos
 */
async function restoreBusStates(firestore) {
    console.log('🔄 Recuperando posiciones previas de la flota desde Firestore...');
    try {
        const snap = await firestore.collection('posiciones_vehiculos').get();
        const map = new Map();
        snap.forEach((doc) => {
            map.set(doc.id, doc.data());
        });
        for (const engine of busEngines) {
            const prev = map.get(engine.config.vehiculoId);
            if (prev) {
                engine.restoreFromFirestore(prev);
                console.log(`   • ${engine.config.vehiculoId} (${engine.config.codigoRuta}): Reanudado en segmento ${prev.currentSegmentIndex}`);
            }
            else {
                console.log(`   • ${engine.config.vehiculoId} (${engine.config.codigoRuta}): Iniciando en paradero inicial`);
            }
        }
    }
    catch (error) {
        console.warn('⚠️ No fue posible leer posiciones previas (primer inicio o sin conexión). Iniciando desde paraderos base.');
    }
}
/**
 * 3. Ejecutar un Tick de Movimiento y Guardar en Firestore
 */
async function performTick(deltaSeconds) {
    if (isShuttingDown || !db)
        return;
    const payloads = [];
    for (const engine of busEngines) {
        engine.tick(deltaSeconds);
        payloads.push(engine.toFirestorePayload(WORKER_VERSION));
    }
    // Guardar en Firestore de forma atómica y controlada
    try {
        const batch = db.batch();
        for (const item of payloads) {
            const ref = db.collection('posiciones_vehiculos').doc(item.vehiculoId);
            batch.set(ref, item, { merge: true });
        }
        await batch.commit();
    }
    catch (error) {
        console.error(`⚠️ Error al escribir en Firestore (${error.code || error.message}). Reintentando en el próximo ciclo...`);
    }
}
/**
 * 4. Bucle Principal de Ejecución
 */
async function startWorker() {
    console.log('===============================================================');
    console.log(`🚍 INICIANDO SIBRI BACKGROUND WORKER v${WORKER_VERSION} EN RENDER`);
    console.log(`🏢 Colectivos Ciudad de Ipiales S.A. - NIT 891.200.412-1`);
    console.log(`⏱️  Intervalo de actualización en Firestore: ${UPDATE_INTERVAL_MS} ms`);
    console.log('===============================================================');
    db = initFirebase();
    // Instanciar motores cinemáticos para cada bus oficial
    for (const vConfig of routes_data_1.FLOTA_OFICIAL) {
        const ruta = routes_data_1.RUTAS_OFICIALES.find((r) => r.id === vConfig.rutaId);
        if (!ruta) {
            console.error(`❌ Ruta "${vConfig.rutaId}" no encontrada para vehículo ${vConfig.vehiculoId}`);
            continue;
        }
        busEngines.push(new bus_engine_1.BusEngine(vConfig, ruta));
    }
    // Recuperar estado previo
    await restoreBusStates(db);
    // Modo de verificación CLI (--test)
    if (process.argv.includes('--test')) {
        console.log('🧪 Ejecutando prueba de un solo ciclo (--test)...');
        await performTick(UPDATE_INTERVAL_MS / 1000.0);
        console.log('✅ Prueba de ciclo completada con éxito.');
        process.exit(0);
        return;
    }
    const deltaSeconds = UPDATE_INTERVAL_MS / 1000.0;
    let tickCount = 0;
    const intervalId = setInterval(async () => {
        tickCount++;
        await performTick(deltaSeconds);
        // Heartbeat cada 30 segundos (12 ciclos de 2.5s)
        if (tickCount % 12 === 0) {
            const nowStr = new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' });
            console.log(`[${nowStr}] 💓 Worker activo: 3 colectivos transmitiendo en vivo a Firestore.`);
        }
    }, UPDATE_INTERVAL_MS);
    // Manejador de apagado suave (Graceful Shutdown)
    const shutdown = async (signal) => {
        if (isShuttingDown)
            return;
        isShuttingDown = true;
        console.log(`\n🛑 Recibida señal ${signal}. Deteniendo el Background Worker de forma segura...`);
        clearInterval(intervalId);
        if (db) {
            try {
                console.log('💾 Guardando últimas coordenadas y marcando estado antes del cierre...');
                const batch = db.batch();
                for (const engine of busEngines) {
                    const payload = engine.toFirestorePayload(WORKER_VERSION);
                    payload.estadoConexion = 'offline';
                    const ref = db.collection('posiciones_vehiculos').doc(payload.vehiculoId);
                    batch.set(ref, payload, { merge: true });
                }
                await batch.commit();
                console.log('✅ Estado final guardado en Firestore.');
            }
            catch (e) {
                console.error('Error al guardar estado de cierre:', e);
            }
        }
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
// Iniciar Worker
startWorker().catch((err) => {
    console.error('💥 Error crítico en SIBRI Background Worker:', err);
    process.exit(1);
});
