# Contexto Maestro del Proyecto y Forma de Trabajo — AppTaxi (TaxiApp)

Este documento resume **todo lo logrado hasta la fecha** y establece las **reglas oficiales de trabajo** para el equipo de **3 desarrolladores** y los agentes de asistencia en futuras sesiones.

---

## 1. Resumen de Lo Logrado Hasta Ahora

### A. Entorno y Monorepo Base (`TaxiApp/`) — *Fase 1 Completada*
- **Entorno verificado:** Node.js `v22.12.0` LTS, npm `11.0.0`, Git `2.47.1`, Flutter `3.47.9` (Dart `3.13.7`).
- **Monorepo con npm workspaces** (`package.json` raíz + `.nvmrc` fijado en `22`):
  - `shared/` (`@taxiapp/shared`): Catálogo de los **9 departamentos de Bolivia** (`BOLIVIA_DEPARTMENTS`), `AffiliateType`, `ExpedidoCode` e interfaces/DTOs Multi-tenant.
  - `backend/` (`@taxiapp/backend`): API REST con **NestJS 11** + **Swagger UI (`/docs`)** configurado con autenticación `Bearer` y parámetro global `x-tenant-id`. Endpoints base activos: `GET /api/v1/health` (con verificación de conexión a Supabase PostgreSQL + PostGIS) y `GET /api/v1/catalogs/bolivia-departments`.
  - `admin-panel/` (`@taxiapp/admin-panel`): Base **React 19 + Vite 6 + TypeScript** con selector de Tenant activo y Sidebar `ADMINISTRACIÓN -> Conductores` (11 sub-vistas).
  - `mobile/`: Guía de inicialización y arquitectura para **Flutter** (`lib/core/`, `lib/features/driver/`, `lib/features/passenger/`).
- **Compilación verificada:** `npm install` y `npm run build` compilan `@taxiapp/shared`, `@taxiapp/backend` y `@taxiapp/admin-panel` sin errores.

### B. Base de Datos Supabase (PostgreSQL + PostGIS + Storage) y Seed — *Fase 2 Completada*
- **Proyecto Supabase conectado:** `zhgzhnzfaiwxbbueiopf` (BD `AppTaxi`, Session Pooler `aws-0-us-east-2.pooler.supabase.com:5432`). Variables locales en `backend/.env` (ignorado por Git) y plantilla en `backend/.env.example`.
- **Módulo de Base de Datos (`backend/src/database/`):**
  - `database.module.ts` (`@Global()`) y `database.service.ts` usando `pg` (`Pool`) y `@supabase/supabase-js`.
- **Migración inicial aplicada (`npm --workspace=@taxiapp/backend run migrate` / `npm run db:migrate`):**
  - Archivo `backend/src/database/migrations/001_initial_schema.sql` ejecutado por `backend/src/database/migrate.ts`.
  - Extensiones habilitadas: `pgcrypto` y **`PostGIS 3.3`** (`USE_GEOS=1 USE_PROJ=1 USE_STATS=1`).
  - **12 tablas de negocio creadas en esquema `public`:** `tenants`, `users`, `drivers`, `vehicle_brands`, `vehicle_models`, `vehicles`, `partners`, `mobile_groups`, `mobile_types`, `mobiles`, `mobile_unit_types` y `kardex_items` (junto con `spatial_ref_sys` de PostGIS).
- **Supabase Storage y Seed inicial ejecutado (`npm --workspace=@taxiapp/backend run seed` / `npm run db:seed`):**
  - **Bucket público `taxiapp-media`** creado en Supabase Storage (límite 5 MB, JPG/PNG/WEBP) para `drivers-profile`, `drivers-id` y `vehicles`.
  - **3 cuentas `SUPERADMIN`** (`tenant_id = NULL`, password inicial `AppTaxi2026` configurable vía `.env`): `gsaldana709@gmail.com`, `superadmin2@taxiapp.bo`, `superadmin3@taxiapp.bo`.
  - **2 Tenants iniciales y sus `TENANT_ADMIN`:** `Radio Taxi Central (La Paz)` (`admin.central@taxiapp.bo`) y `Sindicato 1ro de Mayo (Cochabamba)` (`admin.1romayo@taxiapp.bo`).
  - **Catálogo base de vehículos:** 5 marcas (`Toyota`, `Suzuki`, `Nissan`, `Hyundai`, `Kia`) con sus respectivos modelos.

### C. Sistema de Diseño UI Oficial (`DESIGN.md`)
- Definido a partir de la referencia visual `image.png` e implementado en `Instrucciones-Agents/Esctrutura-y-Doc/DESIGN.md` bajo la estética **"Taxi Gold & Carbon Obsidian"**:
  - **Sidebar oscuro:** `#111311` (Carbón Obsidiana), tarjeta inferior operativa `#1C1F1C`, ítem activo `#F5C518` con texto `#111311`.
  - **Lienzo y Superficies:** Canvas `#F6F6F3` (Alabastro Cálido), Cards y Topbar `#FFFFFF` (`border: 1px solid #EAEAE6`, `border-radius: 14px`).
  - **Acentos y Controles:** CTA primario Amarillo Taxi `#F5C518` (hover `#E5B610`), filtro/tab activo Verde Bosque Carbón `#1E2E22` con texto `#FFFFFF`, badges semánticos con punto (`#DCFCE7`/`#15803D`, `#FEF3C7`/`#A16207`, `#FEE2E2`/`#B91C1C`) y tipografía `Inter` con `tabular-nums`.

### D. Documentación Técnica en el Repositorio
- `Instrucciones-Agents/chat.md`: Requerimientos funcionales originales del equipo para el módulo `ADMINISTRACIÓN -> Conductores`.
- `Instrucciones-Agents/Esctrutura-y-Doc/Estructura.md`: Árbol completo de carpetas del monorepo y modelo de autenticación para los **4 roles Multi-tenant**.
- `Instrucciones-Agents/Esctrutura-y-Doc/APIs.md`: Contratos completos de todos los endpoints REST (`/api/v1`) y eventos WebSocket (`Socket.io + Redis`).
- `Instrucciones-Agents/Esctrutura-y-Doc/DESIGN.md`: Sistema de diseño UI oficial (`image.png`) con tokens CSS, paleta, tipografía y componentes.
- `Instrucciones-Agents/Context.md`: Este documento de contexto y reglas de trabajo.

### E. Repositorio en GitHub
- **URL:** `https://github.com/Victor30700/AppTaxi.git`
- **Ramas activas:** `main` (estable) y `develop` (integración del equipo), con los colaboradores ya agregados.

### F. Organización del Proyecto en Notion (MCP Conectado)
- **Workspace:** `Espacio de Germany Saldaňa` (`gsaldana709@gmail.com`)
- **Página principal:** [TaxiApp — Plataforma Multi-tenant & Panel SuperAdmin](https://app.notion.com/p/419c79a5fbef817a9cf0d2a1286b56fe)
- **Documentos y Especificaciones:** [Documentos y Especificaciones — TaxiApp](https://app.notion.com/p/419c79a5fbef81b89523e4f3d2549964)
  1. `Arquitectura Multi-tenant, Flujo GitHub y Guía de Equipo (3 Devs)` (incluye Sección 5 sobre Auth Multi-tenant y 4 roles).
  2. `Especificación Funcional: Módulo Administración -> Conductores, Vehículos y Móviles`.
  3. `Catálogo y Estructura de APIs REST + WebSockets (Swagger /docs)`.
- **Tablero de Tareas (`27 tareas`):** [Plan de Trabajo y Tareas — TaxiApp](https://app.notion.com/p/419c79a5fbef81f993fde0a561750824)
  - **`TAXI-01` a `TAXI-10` (Fases 1 y 2 completas) marcadas como `Completado`.**
  - Todas las tareas de BD, Backend y Frontend detalladas con los campos exactos de formularios y reglas condicionales de `chat.md`.
  - Las **9 tareas `[FRONTEND UI]`** (`TAXI-03`, `TAXI-18`, `TAXI-18A`, `TAXI-18B`, `TAXI-19` a `TAXI-23`) actualizadas con la guía de estilos de `image.png` y con **`Estado Diseño UI = Diseño UI Aprobado`**.
  - Separación visual por prefijos e iconos: 🗄️ `[BD / BACKEND]`, ⚙️ `[BACKEND]`, 🎨 `[FRONTEND UI]`, 📱 `[MOBILE]`, 🚀 `[DEVOPS]`.
  - **3 vistas dedicadas en Notion:**
    1. `⚙️ Solo Backend y BD (Listo para programar)`
    2. `🎨 Solo Frontend (Diseño UI por definir)`
    3. `📊 Tablero Backend vs Frontend`

---

## 2. Cómo Debemos Trabajar en el Proyecto

### 1. Flujo Git en GitHub (Obligatorio para los 3 Devs)
1. **Nunca trabajar ni hacer push directo a `main`.**
2. Antes de tomar una tarea de Notion, sincronizar `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
3. Crear una rama por tarea vinculada al código de Notion:
   ```bash
   git checkout -b feat/TAXI-XX-nombre-corto
   ```
4. Al terminar y verificar que `npm run build` pasa sin errores, abrir un **Pull Request hacia `develop`** para que al menos **1 compañero** revise antes de hacer merge.

### 2. Orden de Ejecución: Prioridad Inmediata Actual (`Fase 3: Backend NestJS APIs`)
- **Ya Completado:** Fase 1 (`TAXI-01` a `TAXI-05`), Fase 2 completa (`TAXI-06` a `TAXI-10` — Supabase PostgreSQL + PostGIS, migración `001_initial_schema.sql`, Seed SuperAdmins/Tenants/Marcas y bucket `taxiapp-media`) y Diseño UI aprobado (`DESIGN.md` + `Estado Diseño UI = Diseño UI Aprobado` en Notion).
- **Prioridad Inmediata Actual — Fase 3 (`[BACKEND]`):**
  1. **`TAXI-11` y `TAXI-11B`:** Auth JWT (`POST /auth/login`, `POST /auth/register-passenger`, `GET /auth/me`), Guards Multi-tenant (`JwtAuthGuard`, `RolesGuard`, `TenantGuard`) y CRUD de Empresas (`Tenants`) + creación de cuentas `TENANT_ADMIN` (solo `SUPERADMIN`).
  2. **`TAXI-12` a `TAXI-17`:** CRUDs de Conductores + Uploads a Supabase Storage, Vehículos con cascada Marca -> Modelo, Socios/Inquilinos + Grupos dinámicos + Tipos de Móvil, Móviles con disponibilidad condicional de `Nro. Móvil`, Kardex + Ficha Técnica Línea y Gateway WebSockets (`Socket.io + Redis`).
- **Siguiente — Fase 4 (`[FRONTEND UI]`):** Todas las tarjetas (`TAXI-18` a `TAXI-23`) ya tienen **`Estado Diseño UI = Diseño UI Aprobado`** basado en `DESIGN.md` e `image.png`, listas para implementarse en `admin-panel/` en paralelo o conforme avancen las APIs de Fase 3.

### 3. Reglas de Arquitectura Multi-tenant y Roles
El sistema maneja **4 roles estrictos** (`UserRole`):
1. **`SUPERADMIN`** *(los 3 devs)*: Sus cuentas iniciales se crean **únicamente por script Seed (`npm --workspace=@taxiapp/backend run seed`)** con `tenant_id = NULL`. Pueden crear empresas (`Tenants`), crear `TENANT_ADMIN` y alternar el `x-tenant-id` en el selector del panel.
2. **`TENANT_ADMIN`** *(administrador de radiotaxi/sindicato)*: Lo crea el `SUPERADMIN`. Su `tenant_id` es fijo y el backend debe ignorar cualquier intento de cambiar de tenant vía header.
3. **`DRIVER`** *(taxista)*: Se crea al registrar al conductor en `ADMINISTRACIÓN -> Conductores -> Nuevo conductor`. Inicia sesión en la App Móvil Flutter bajo su `tenant_id`.
4. **`PASSENGER`** *(pasajero)*: Registro público libre desde la App Móvil Flutter.

### 4. Reglas de Negocio Clave del Módulo `ADMINISTRACIÓN -> Conductores`
- **Conductor:** `Nombre`, `Foto de Perfil`, `Fecha de Nacimiento`, `DNI`, `Foto Identificación`, `Expedido` (selector obligatorio con los **9 departamentos de Bolivia** de `@taxiapp/shared`), `Teléfono`, `Dirección`.
- **Vehículo:** `Placa`, `Foto del Vehículo`, `Marca`, `Modelo` (select en cascada dependiente de la Marca vía API `/api/v1/vehicle-brands/:brandId/models`), `Año`, `Color`.
- **Móvil:**
  - `Nro. Móvil`: solo lista números disponibles tras seleccionar **Propietario** y **Tipo de Afiliado** (y **Usuario de Móvil** si el conductor es el propietario).
  - `Grupo`: dinámico por tenant.
  - `Tipo de Móvil`: selección múltiple.
  - Al elegir `Vehículo`, autocompletar en solo lectura: `Foto del vehículo`, `Marca`, `Modelo`, `Placa`, `Año Vehículo` y `Color`.
  - Sección Propietario: switch *"El conductor es el propietario"*; si NO lo es, seleccionar `Socio` (`Nombre(s) y Apellido(s)`, `Fecha de Ingreso dd/mm/aaaa`, `Celular`, `Tipo de Afiliado`).

### 5. Sincronización Continua (Código + Documentos + Notion)
1. Cada nuevo endpoint o DTO creado en `backend/` debe llevar decoradores de **`@nestjs/swagger`** para reflejarse automáticamente en `/docs`.
2. Si cambia un contrato o ruta de API, actualizar **`Instrucciones-Agents/Esctrutura-y-Doc/APIs.md`**.
3. Al iniciar o terminar una tarea `TAXI-XX`, actualizar su estado en **Notion** (`En progreso` -> `En revisión` -> `Completado`).
