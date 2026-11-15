# Estructura del Proyecto y Arquitectura de Carpetas — AppTaxi (TaxiApp)

Este documento define la estructura oficial de carpetas y módulos del monorepo **AppTaxi (`TaxiApp/`)**, diseñada para el trabajo paralelo de **3 desarrolladores** sobre arquitectura **Multi-tenant**, **Panel SuperAdmin** y **App Móvil**.

---

## 1. Arquitectura General del Monorepo

```text
TaxiApp/
├── .gitignore                         # Reglas de ignorado (node_modules, .env, dist, build, *.tsbuildinfo)
├── .nvmrc                             # Versión fijada de Node.js (22 LTS)
├── package.json                       # npm workspaces ("shared", "backend", "admin-panel") y scripts raíz
├── package-lock.json
├── README.md                          # Guía rápida de instalación, ramas Git y arranque local
├── chat.md                            # Requerimientos funcionales iniciales del equipo
├── Instrucciones-Agents/              # Documentación interna y contexto para agentes/equipo
│   ├── chat.md
│   ├── Context.md
│   └── Esctrutura-y-Doc/
│       └── Estructura.md              # Este archivo
├── shared/                            # @taxiapp/shared — Catálogos, enums y DTOs compartidos
├── backend/                           # @taxiapp/backend — API REST + WebSockets (NestJS 11)
├── admin-panel/                       # @taxiapp/admin-panel — Panel SuperAdmin / Admin (React 19 + Vite 6)
└── mobile/                            # App Móvil Conductores y Pasajeros (Flutter 3.x)
```

---

## 2. Detalle de `shared/` (`@taxiapp/shared`)

Paquete TypeScript compartido entre `backend/` y `admin-panel/` para evitar duplicación de tipos y reglas de negocio.

```text
shared/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts                       # Exportaciones principales:
                                       # - BOLIVIA_DEPARTMENTS (9 departamentos de Bolivia para Expedido)
                                       # - ExpedidoCode ('LP' | 'CB' | 'SC' | 'OR' | 'PT' | 'TJ' | 'CH' | 'BE' | 'PD')
                                       # - UserRole ('SUPERADMIN' | 'TENANT_ADMIN' | 'DRIVER' | 'PASSENGER')
                                       # - AffiliateType ('SOCIO_TITULAR' | 'INQUILINO' | 'ASALARIADO')
                                       # - Interfaces: Tenant, DriverDto, VehicleBrandDto, VehicleModelDto,
                                       #   VehicleDto, PartnerDto, MobileGroupDto, MobileTypeDto,
                                       #   MobileUnitDto, KardexItemDto
```

---

## 3. Detalle de `backend/` (`@taxiapp/backend` — NestJS 11)

Arquitectura modular por dominio, con aislamiento estricto por `tenant_id` y prefijo global `/api/v1`.

```text
backend/
├── .env.example                       # Variables requeridas (PORT, DATABASE_URL, SUPABASE_*, REDIS_*, JWT_*)
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts                        # Bootstrap NestJS, prefijo /api/v1, CORS, ValidationPipe y Swagger (/docs)
    ├── app.module.ts                  # Módulo raíz que orquesta database, auth y módulos de negocio
    ├── app.controller.ts              # Endpoints base (/api/v1/health, /api/v1/catalogs/bolivia-departments)
    ├── common/
    │   ├── decorators/
    │   │   ├── current-tenant.decorator.ts  # @CurrentTenant() -> lee header x-tenant-id / JWT
    │   │   ├── current-user.decorator.ts    # @CurrentUser() -> extrae usuario autenticado del request
    │   │   └── roles.decorator.ts           # @Roles(...roles) -> define roles permitidos
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts            # Valida token Bearer JWT
    │   │   ├── roles.guard.ts               # Valida UserRole (SUPERADMIN, TENANT_ADMIN, etc.)
    │   │   └── tenant.guard.ts              # Resuelve y valida el tenant activo por petición
    │   └── interceptors/
    │       └── tenant-context.interceptor.ts
    ├── database/
    │   ├── database.module.ts         # Conexión PostgreSQL + PostGIS (Supabase) y Storage client
    │   ├── migrations/                # Migraciones SQL / ORM (tenants, users, drivers, vehicles, mobiles, kardex)
    │   └── seeds/
    │       └── seed-superadmins.ts    # Script `npm run seed` que crea las 3 cuentas SUPERADMIN y tenants iniciales
    └── modules/
        ├── auth/                      # POST /auth/login, POST /auth/register-passenger, GET /auth/me (JWT + bcrypt)
        ├── tenants/                   # CRUD de empresas/radiotaxis y creación de cuentas TENANT_ADMIN (solo SUPERADMIN)
        ├── drivers/                   # CRUD de conductores + subida de fotos (perfil y CI) a Supabase Storage
        ├── vehicles/                  # Catálogo en cascada Marcas -> Modelos + CRUD de vehículos + foto vehículo
        ├── partners/                  # CRUD de Socios titulares e Inquilinos (fecha ingreso dd/mm/aaaa, celular, afiliado)
        ├── mobiles/                   # Grupos dinámicos, Tipos de móvil (multi-select), Nros disponibles y CRUD de Móviles
        ├── kardex/                    # Kardex de Conductores, Vehículos, Líneas Titulares y Ficha Técnica Línea
        └── realtime/                  # Gateway WebSockets (Socket.io) + Redis Adapter para ubicaciones en tiempo real
```

---

## 4. Detalle de `admin-panel/` (`@taxiapp/admin-panel` — React 19 + Vite 6)

Panel web con diseño **SuperAdmin Multi-tenant**, autenticación JWT y el módulo **`ADMINISTRACIÓN -> Conductores`**.

```text
admin-panel/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx                       # Punto de entrada React
    ├── index.css                      # Estilos globales del panel
    ├── App.tsx                        # Enrutador principal y shell del panel
    ├── lib/
    │   └── api-client.ts              # Cliente HTTP con interceptores de Authorization (JWT) y header x-tenant-id
    ├── auth/
    │   ├── AuthContext.tsx            # Estado global de sesión (user, role, activeTenantId, login, logout)
    │   ├── ProtectedRoute.tsx         # Bloquea rutas privadas y valida rol SUPERADMIN / TENANT_ADMIN
    │   └── LoginPage.tsx              # Pantalla /login (correo, contraseña, manejo de errores)
    ├── layouts/
    │   └── SuperAdminLayout.tsx       # Topbar (selector de Tenant para SUPERADMIN o fijo para TENANT_ADMIN) + Sidebar
    └── features/
        ├── tenants/                   # (Solo SUPERADMIN) Listado/creación de Empresas (Tenants) y sus TENANT_ADMIN
        └── conductores/               # Módulo ADMINISTRACIÓN -> Conductores (11 sub-vistas):
            ├── ListaMovilesPage.tsx
            ├── NuevoMovilPage.tsx     # Reglas dinámicas: Propietario/Socio -> Nro. Móvil, Grupo, Tipos, Autocompletado Vehículo
            ├── NuevoConductorPage.tsx # Registro/Actualización con los 9 deptos de Bolivia y upload de 2 fotos
            ├── ListaConductoresPage.tsx
            ├── KardexConductoresPage.tsx
            ├── NuevoVehiculoPage.tsx  # Select dependiente Marca -> Modelo vía API + foto del vehículo
            ├── ListaVehiculosPage.tsx
            ├── KardexVehiculosPage.tsx
            ├── SociosInquilinosPage.tsx
            ├── KardexLineasTitularesPage.tsx
            └── FichaTecnicaLineaPage.tsx
```

---

## 5. Detalle de `mobile/` (App Móvil — Flutter 3.x)

Estructura base preparada para los perfiles de **Conductor** y **Pasajero**.

```text
mobile/
├── README.md                          # Instrucciones de inicialización (`flutter create`) y arquitectura
└── lib/
    ├── main.dart
    ├── core/
    │   ├── config/                    # URLs de API, socket y x-tenant-id
    │   ├── network/                   # Cliente HTTP + manejo de JWT
    │   └── realtime/                  # Socket.io / WebSocket para streaming de GPS hacia Redis
    └── features/
        ├── driver/                    # Flujo Conductor (login, estado en línea, transmisión GPS, viajes asignados)
        └── passenger/                 # Flujo Pasajero (registro libre, búsqueda PostGIS de taxis cercanos, solicitud)
```

---

## 6. Flujo de Inicio de Sesión y Creación de Cuentas (4 Roles Multi-tenant)

| Rol (`UserRole`) | Plataforma de acceso | Cómo se crea la cuenta | Aislamiento (`tenant_id`) |
| :--- | :--- | :--- | :--- |
| **`SUPERADMIN`** *(Equipo de 3 Devs)* | Panel Web (`/login`) | **Script Seed (`npm run seed`)** en `backend/src/database/seeds/seed-superadmins.ts`. Nunca mediante registro público. | `null` (Global): puede crear Tenants, crear `TENANT_ADMIN` y cambiar de Tenant en el selector superior. |
| **`TENANT_ADMIN`** *(Admin de Radiotaxi)* | Panel Web (`/login`) | Lo crea un **`SUPERADMIN`** desde la gestión de Tenants (`POST /api/v1/tenants/:id/admins`). | Fijo al `tenant_id` de su empresa; no puede ver ni cambiar a otros Tenants. |
| **`DRIVER`** *(Conductor / Taxista)* | App Móvil Flutter | Se genera al registrar al conductor desde **`ADMINISTRACIÓN -> Conductores -> Nuevo conductor`** (credenciales iniciales por DNI/Teléfono). | Fijo al `tenant_id` del radiotaxi donde opera. |
| **`PASSENGER`** *(Pasajero / Cliente)* | App Móvil Flutter | **Registro público (Sign Up)** desde la App Móvil (`POST /api/v1/auth/register-passenger`). | Usuario cliente que solicita viajes dentro de la plataforma. |
