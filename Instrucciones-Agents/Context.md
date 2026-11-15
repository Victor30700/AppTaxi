# Contexto Maestro del Proyecto y Forma de Trabajo — AppTaxi (TaxiApp)

Este documento resume **todo lo logrado en la sesión inicial de arquitectura y planificación** y establece las **reglas oficiales de trabajo** para el equipo de **3 desarrolladores** y los agentes de asistencia en futuras sesiones.

---

## 1. Resumen de Lo Logrado Hasta Ahora

### A. Entorno y Monorepo Base (`TaxiApp/`)
- **Entorno verificado:** Node.js `v22.12.0` LTS, npm `11.0.0`, Git `2.47.1`, Flutter `3.47.9` (Dart `3.13.7`).
- **Monorepo con npm workspaces** (`package.json` raíz + `.nvmrc` fijado en `22`):
  - `shared/` (`@taxiapp/shared`): Catálogo de los **9 departamentos de Bolivia** (`BOLIVIA_DEPARTMENTS`), `AffiliateType`, `ExpedidoCode` e interfaces/DTOs Multi-tenant.
  - `backend/` (`@taxiapp/backend`): API REST con **NestJS 11** + **Swagger UI (`/docs`)** configurado con autenticación `Bearer` y parámetro global `x-tenant-id`. Endpoints base activos: `GET /api/v1/health` y `GET /api/v1/catalogs/bolivia-departments`.
  - `admin-panel/` (`@taxiapp/admin-panel`): Base **React 19 + Vite 6 + TypeScript** con selector de Tenant activo y Sidebar `ADMINISTRACIÓN -> Conductores` (11 sub-vistas).
  - `mobile/`: Guía de inicialización y arquitectura para **Flutter** (`lib/core/`, `lib/features/driver/`, `lib/features/passenger/`).
- **Compilación verificada:** `npm install` y `npm run build` compilan `@taxiapp/shared`, `@taxiapp/backend` y `@taxiapp/admin-panel` sin errores.

### B. Documentación Técnica en el Repositorio
- `Instrucciones-Agents/chat.md`: Requerimientos funcionales originales del equipo para el módulo `ADMINISTRACIÓN -> Conductores`.
- `Instrucciones-Agents/Esctrutura-y-Doc/Estructura.md`: Árbol completo de carpetas del monorepo y modelo de autenticación para los **4 roles Multi-tenant**.
- `Instrucciones-Agents/Esctrutura-y-Doc/APIs.md`: Contratos completos de todos los endpoints REST (`/api/v1`) y eventos WebSocket (`Socket.io + Redis`).
- `Instrucciones-Agents/Context.md`: Este documento de contexto y reglas de trabajo.

### C. Repositorio en GitHub
- **URL:** `https://github.com/Victor30700/AppTaxi.git`
- **Ramas activas:** `main` (estable) y `develop` (integración del equipo), con los colaboradores ya agregados.

### D. Organización del Proyecto en Notion (MCP Conectado)
- **Workspace:** `Espacio de Germany Saldaňa` (`gsaldana709@gmail.com`)
- **Página principal:** [TaxiApp — Plataforma Multi-tenant & Panel SuperAdmin](https://app.notion.com/p/419c79a5fbef817a9cf0d2a1286b56fe)
- **Documentos y Especificaciones:** [Documentos y Especificaciones — TaxiApp](https://app.notion.com/p/419c79a5fbef81b89523e4f3d2549964)
  1. `Arquitectura Multi-tenant, Flujo GitHub y Guía de Equipo (3 Devs)` (incluye Sección 5 sobre Auth Multi-tenant y 4 roles).
  2. `Especificación Funcional: Módulo Administración -> Conductores, Vehículos y Móviles`.
  3. `Catálogo y Estructura de APIs REST + WebSockets (Swagger /docs)`.
- **Tablero de Tareas (`27 tareas`):** [Plan de Trabajo y Tareas — TaxiApp](https://app.notion.com/p/419c79a5fbef81f993fde0a561750824)
  - `TAXI-01` a `TAXI-05` marcadas como **Completado**.
  - Separación visual por prefijos e iconos: 🗄️ `[BD / BACKEND]`, ⚙️ `[BACKEND]`, 🎨 `[FRONTEND UI]`, 📱 `[MOBILE]`, 🚀 `[DEVOPS]`.
  - Columna **`Estado Diseño UI`** (`N/A (Solo Backend/BD)`, `Pendiente definir UI con equipo`, `Diseño UI en propuesta`, `Diseño UI Aprobado`).
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

### 2. Orden de Ejecución: Backend primero, Diseño UI consensuado antes de Frontend
- **Backend y Base de Datos (`[BD / BACKEND]` y `[BACKEND]`):** Ya están listos para programarse siguiendo `Estructura.md` y `APIs.md`.
  - **Prioridad inmediata:** Conectar Supabase (PostgreSQL + PostGIS + Storage), migrar esquema `tenants` + `users`, ejecutar **Seed de los 3 SuperAdmins** (`TAXI-06`, `TAXI-07`, `TAXI-07B`) e implementar Auth JWT + Guards Multi-tenant (`TAXI-11`, `TAXI-11B`).
- **Frontend UI (`[FRONTEND UI]`):** Todas las tarjetas de interfaz tienen `Estado Diseño UI = Pendiente definir UI con equipo`. Antes de construir las vistas finales de React + Vite, el equipo debe definir el **Sistema de Diseño de última generación** (paleta, tipografía, librería de componentes como Tailwind + shadcn/ui, layout y estándar visual en un `DESIGN.md`) y pasar cada tarjeta a `Diseño UI Aprobado`.

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
