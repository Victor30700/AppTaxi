# TaxiApp Mobile (Flutter)

Aplicación móvil para **Conductores** y **Pasajeros** conectada al backend NestJS Multi-tenant, PostgreSQL + PostGIS y WebSockets + Redis para ubicaciones en tiempo real.

## Entorno Verificado

- **Flutter**: `3.47.9` (canal `stable`)
- **Dart**: `3.13.7`

## Inicialización del Proyecto Flutter

Desde esta carpeta (`mobile/`), ejecutar una sola vez para generar la estructura nativa de Android/iOS:

```bash
flutter create --org com.taxiapp --project-name taxiapp_mobile .
```

## Estructura Recomendada de `lib/`

```text
mobile/lib/
├── core/
│   ├── config/        # URLs del backend, tenantId y variables de entorno
│   ├── network/       # Cliente HTTP (header x-tenant-id + JWT)
│   └── realtime/      # Cliente Socket.io / WebSocket para ubicaciones con Redis
├── features/
│   ├── driver/        # Módulo Conductor (estado en línea, envío GPS en tiempo real, viajes)
│   └── passenger/     # Módulo Pasajero (búsqueda de móviles cercanos vía PostGIS, solicitud)
└── main.dart
```

## Integración con Backend y Tiempo Real

- **Multi-tenant**: Todas las peticiones HTTP y conexiones WebSocket deben enviar el identificador de empresa/radiotaxi (`x-tenant-id`).
- **Geolocalización (PostGIS + Redis)**:
  - Los conductores emiten coordenadas `(lat, lng)` vía WebSocket hacia el gateway de NestJS respaldado por Redis.
  - La consulta de vehículos disponibles en un radio cercano se resuelve mediante índices espaciales **PostGIS** en Supabase.
