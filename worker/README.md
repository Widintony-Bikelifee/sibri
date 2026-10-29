# SIBRI - Servicio Centralizado de Movimiento de Buses (Render Background Worker)

Servicio de ejecución continua (Background Worker) para la flota de **Colectivos Ciudad de Ipiales S.A.** Desarrollado en Node.js y TypeScript con Firebase Admin SDK.

Este componente actúa como la **única fuente de verdad** del movimiento de los colectivos en la red vial de Ipiales, garantizando que todos los pasajeros y conductores visualicen exactamente las mismas coordenadas en tiempo real sin cálculos dispersos en cada dispositivo.

---

## 1. Arquitectura y Flujo de Datos

```
┌────────────────────────────────┐
│    Render Background Worker    │  Calcula cinemática vial
│  (sibri-bus-movement-worker)   │  y paradas cada 2500ms
└───────────────┬────────────────┘
                │
                │ Batch Commit (Admin SDK)
                ▼
┌────────────────────────────────┐
│   Firebase Cloud Firestore     │  Colección:
│   (posiciones_vehiculos)       │  - SOV-814 (Ruta 1)
└───────────────┬────────────────┘  - SKL-512 (Ruta 2)
                │                   - SOV-308 (Ruta 3)
                │ Real-time Stream
                ▼
┌────────────────────────────────┐
│   Aplicación Móvil Flutter     │  Renderiza marcadores con
│   (Pasajeros y Conductores)    │  SmoothBusMarkerLayer (2.3s lerp)
└────────────────────────────────┘
```

1. **Worker:** Ejecuta un ciclo continuo cada 2.5 segundos (`UPDATE_INTERVAL_MS`), avanzando cada bus a lo largo de las polilíneas de las calles oficiales de Ipiales, respetando detenciones en paraderos (15–20s) y curvas de giro (rumbo/bearing).
2. **Firestore:** Almacena los documentos en `posiciones_vehiculos/{vehiculoId}` con reglas que impiden modificaciones desde clientes móviles (`allow write: if false`).
3. **Flutter:** La aplicación se suscribe en tiempo real a la colección mediante `CentralTrackingService.escucharVehiculos()` y renderiza con interpolación visual fluida (`SmoothBusMarkerLayer`).

---

## 2. Variables de Entorno en Render

En el panel de Render (**Dashboard > Worker > Environment**), configura las siguientes variables:

| Variable | Tipo | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Secret | Contenido JSON completo de la clave de cuenta de servicio de Firebase | `{"type":"service_account","project_id":"sibri-transporte",...}` |
| `FIREBASE_PROJECT_ID` | String | ID del proyecto de Firebase (opcional si usas la variable anterior) | `sibri-transporte` |
| `FIREBASE_CLIENT_EMAIL` | String | Email de la cuenta de servicio | `firebase-adminsdk-xxx@sibri-transporte.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Secret | Clave privada RSA formateada con `\n` | `"-----BEGIN PRIVATE KEY-----\nMIIE..."` |
| `UPDATE_INTERVAL_MS` | Number | Intervalo de cálculo y sincronización en milisegundos | `2500` (por defecto) |
| `NODE_ENV` | String | Entorno de ejecución | `production` |

> **Nota de Seguridad:** NUNCA subas el archivo JSON de credenciales al repositorio Git. En Render, utilízalo exclusivamente como una variable de entorno secreta (**Environment Secret**).

---

## 3. Despliegue en Render

### Opción A: Despliegue Automático con Blueprint (`render.yaml`)

El proyecto incluye el archivo [`render.yaml`](../render.yaml) en la raíz del repositorio.

1. Ve a [Render Dashboard](https://dashboard.render.com).
2. Haz clic en **Blueprints > New Blueprint Instance**.
3. Conecta el repositorio de GitHub de Sibri.
4. Render detectará automáticamente el servicio `sibri-bus-movement-worker` de tipo `worker`.
5. Agrega la variable secreta `FIREBASE_SERVICE_ACCOUNT_KEY`.
6. Haz clic en **Apply**.

### Opción B: Creación Manual en Render

1. En Render Dashboard, haz clic en **New + > Background Worker**.
2. Conecta el repositorio Git de Sibri.
3. Configura los campos:
   - **Name:** `sibri-bus-movement-worker`
   - **Root Directory:** `worker`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Starter` ($7/mes - necesario para ejecución continua 24/7).
4. Agrega las variables de entorno especificadas en la sección anterior.
5. Haz clic en **Create Background Worker**.

### Opción C: Contenedor Docker

El worker dispone de su propio [`Dockerfile`](Dockerfile) multi-etapa optimizado con Alpine Linux. En Render puedes seleccionar el entorno **Docker** y utilizará automáticamente este archivo.

---

## 4. Análisis de Costos y Cuotas de Firestore

### Cálculo de Escrituras

Con una flota inicial de **3 colectivos** activos:

| Frecuencia | Escrituras / Minuto | Escrituras / Hora | Escrituras / Día (16 horas operativas) | Escrituras / Día (24 horas) |
| :--- | :--- | :--- | :--- | :--- |
| **Cada 2.5s** | 72 | 4,320 | 69,120 | 103,680 |
| **Cada 3.0s** | 60 | 3,600 | 57,600 | 86,400 |

### Planes de Firebase

- **Plan Spark (Gratuito):** Incluye hasta **20,000 escrituras al día**. Es ideal para desarrollo y pruebas breves.
- **Plan Blaze (Pago por uso):**
  - Costo por escritura adicional: **\$0.18 USD por cada 100,000 escrituras**.
  - Con 103,680 escrituras diarias:
    $$\frac{103,680 - 20,000}{100,000} \times \$0.18 \approx \$0.15\text{ USD/día} \approx \$4.50\text{ USD/mes}$$
  - Costo altamente accesible para una empresa de transporte urbano.

---

## 5. Transición Hacia Dispositivos GPS Físicos Reales

La arquitectura implementada en Sibri fue diseñada para que la transición hacia hardware GPS real sea **100% transparente** para la aplicación móvil:

```
                               ┌─────────────────────────────────┐
  DISPOSITIVOS GPS REALES      │ Servidor / Webhook de Telemetría│
 (Teltonika FMB920 / Queclink) │ (o Cloud Function HTTPS)        │
              │                └────────────────┬────────────────┘
              │ 4G / TCP / MQTT                 │
              └─────────────────────────────────┤
                                                │ Escribe coordenadas reales
                                                ▼
                               ┌─────────────────────────────────┐
                               │   Firebase Cloud Firestore      │
                               │   posiciones_vehiculos/{id}     │
                               └────────────────┬────────────────┘
                                                │ Mismo canal en tiempo real
                                                ▼
                               ┌─────────────────────────────────┐
                               │   App Flutter (Sin cambios)     │
                               └─────────────────────────────────┘
```

### Pasos para Activar GPS Real:

1. **Instalación de Dispositivos:** Instalar rastreadores 4G (ej. Teltonika FMB920, Coban o Queclink) con chip SIM M2M en los buses de la cooperativa.
2. **Recepción de Tramas:** Configurar el IP/puerto del receptor (ej. servidor Traccar o Firebase Cloud Function que reciba los paquetes NMEA/AVL).
3. **Escritura en Firestore:** La función receptora actualiza el documento `posiciones_vehiculos/{vehiculoId}` con:
   ```json
   {
     "lat": 0.8285,
     "lng": -77.6441,
     "rumbo": 142.5,
     "velocidadKmh": 28.4,
     "enMovimiento": true,
     "ultimaActualizacion": "SERVER_TIMESTAMP"
   }
   ```
4. **Desactivación del Worker de Movimiento:** Basta con pausar el servicio en Render (`sibri-bus-movement-worker`).
5. **Impacto en la App:** **Cero modificaciones.** La aplicación Flutter continuará leyendo `posiciones_vehiculos/{vehiculoId}` con el mismo listener, mostrando la posición real satelital con la misma suavidad de movimiento.
