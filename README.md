# TaxiApp — Plataforma Multi-tenant & Panel SuperAdmin

Plataforma para gestión de empresas/sindicatos de taxis (**Multi-tenant**), panel administrativo (**SuperAdmin** y Admin por Tenant) y aplicaciones móviles para conductores y pasajeros con tracking geoespacial en tiempo real.

## Stack Tecnológico

| Capa | Tecnología | Uso |
| :--- | :--- | :--- |
| **Backend** | NestJS (TypeScript) | API REST Multi-tenant, Auth, lógica de negocio y Swagger |
| **Base de Datos** | PostgreSQL + PostGIS (Supabase) | Persistencia relacional, consultas geoespaciales y Storage de fotos |
| **Tiempo Real** | Redis + WebSockets (`Socket.io`) | Ubicaciones de móviles en tiempo real |
| **Panel Admin** | React + Vite + TypeScript | Panel SuperAdmin y módulo `ADMINISTRACIÓN -> Conductores` |
| **App Móvil** | Flutter | App para conductores y pasajeros |
| **Paquete Compartido** | `@taxiapp/shared` | Tipos, enums (9 departamentos de Bolivia) y DTOs compartidos |

## Estructura del Monorepo

```text
TaxiApp/
├── shared/        # @taxiapp/shared — Modelos, enums y constantes compartidas
├── backend/       # @taxiapp/backend — API NestJS Multi-tenant
├── admin-panel/   # @taxiapp/admin-panel — Panel SuperAdmin (React + Vite)
├── mobile/        # App Móvil (Flutter)
├── .nvmrc         # Versión fijada de Node.js (22 LTS)
└── package.json   # Configuración de npm workspaces
```

## Requisitos de Entorno

- **Node.js**: `v22.x LTS` (verificado `v22.12.0`, indicado en `.nvmrc`)
- **npm**: `>=10.x` (usamos **npm workspaces** nativo, sin gestores adicionales)
- **Git**: `>=2.40`
- **Flutter**: `3.x` (para desarrollo en `mobile/`)

## Arranque Rápido en Local

1. Instalar todas las dependencias del monorepo desde la raíz:
   ```bash
   npm install
   ```

2. Compilar el paquete compartido y los proyectos:
   ```bash
   npm run build
   ```

3. Configurar variables de entorno del backend:
   ```bash
   cp backend/.env.example backend/.env
   ```

4. Levantar servidores de desarrollo:
   ```bash
   # Terminal 1: Backend NestJS (puerto 3000)
   npm run dev:backend

   # Terminal 2: Panel Admin React + Vite (puerto 5173)
   npm run dev:admin
   ```

## Flujo de Trabajo en Equipo (3 Desarrolladores)

- **`main`**: Rama protegida estable (solo recibe merges desde `develop` para despliegues/entregas).
- **`develop`**: Rama de integración continua del equipo.
- **`feat/TAXI-XX-descripcion`**: Ramas de trabajo por tarea vinculadas al tablero de Notion (ej. `feat/TAXI-12-crud-conductores`).

### Reglas de Git para el equipo:
1. Antes de iniciar una tarea, actualizar `develop` (`git checkout develop && git pull origin develop`).
2. Crear rama desde `develop` (`git checkout -b feat/TAXI-XX-nombre`).
3. Subir la rama y abrir un **Pull Request hacia `develop`** solicitando revisión de al menos 1 compañero.
4. Nunca hacer push directo a `main` ni `develop`.
