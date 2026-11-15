# Catálogo y Contratos de APIs — AppTaxi (TaxiApp)

Documento maestro de endpoints REST y eventos WebSocket del backend en **NestJS (`/api/v1`)**, equivalente a la estructura de Controllers + DTOs + Swagger en ASP.NET Core Web API.

---

## Convenciones Globales

- **Base URL (local):** `http://localhost:3000/api/v1`
- **Swagger UI interactivo (equivalente a Swashbuckle):** `http://localhost:3000/docs`
- **Esquema OpenAPI JSON:** `http://localhost:3000/docs-json`
- **Headers estándar:**
  - `Authorization: Bearer <jwt_token>` (requerido en todas las rutas protegidas)
  - `x-tenant-id: <tenant_uuid>` (requerido para operaciones dentro de un radiotaxi/empresa; el `SUPERADMIN` lo envía según el tenant elegido en el Topbar, mientras que `TENANT_ADMIN` y `DRIVER` quedan fijados a su `tenant_id` del JWT)

---

## 1. Salud y Catálogos Globales

### `GET /api/v1/health`
- **Acceso:** Público
- **Descripción:** Verifica disponibilidad del backend y muestra el tenant leído en el header.
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "service": "taxiapp-backend",
    "multiTenant": true,
    "currentTenant": null,
    "timestamp": "2026-11-15T21:00:00.000Z"
  }
  ```

### `GET /api/v1/catalogs/bolivia-departments`
- **Acceso:** Público
- **Descripción:** Devuelve los **9 departamentos de Bolivia** para el selector `Expedido` del DNI/CI.
- **Response `200 OK`:**
  ```json
  [
    { "code": "LP", "name": "La Paz" },
    { "code": "CB", "name": "Cochabamba" },
    { "code": "SC", "name": "Santa Cruz" },
    { "code": "OR", "name": "Oruro" },
    { "code": "PT", "name": "Potosí" },
    { "code": "TJ", "name": "Tarija" },
    { "code": "CH", "name": "Chuquisaca" },
    { "code": "BE", "name": "Beni" },
    { "code": "PD", "name": "Pando" }
  ]
  ```

---

## 2. Autenticación Multi-tenant (`Auth`)

### `POST /api/v1/auth/login`
- **Acceso:** Público (`SUPERADMIN`, `TENANT_ADMIN`, `DRIVER`, `PASSENGER`)
- **Request Body:**
  ```json
  {
    "email": "superadmin1@taxiapp.bo",
    "password": "TuPasswordSeguro123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u-uuid",
      "fullName": "Germany Saldaña",
      "email": "superadmin1@taxiapp.bo",
      "role": "SUPERADMIN",
      "tenantId": null
    }
  }
  ```

### `POST /api/v1/auth/register-passenger`
- **Acceso:** Público (App Móvil Flutter — Pasajeros)
- **Request Body:**
  ```json
  {
    "fullName": "Ana Pérez",
    "email": "ana@correo.com",
    "phone": "70012345",
    "password": "MiPassword123"
  }
  ```
- **Response `201 Created`:** Retorna `{ accessToken, user }` con `role: "PASSENGER"`.

### `GET /api/v1/auth/me`
- **Acceso:** Autenticado (`Bearer JWT`)
- **Response `200 OK`:** Perfil del usuario autenticado y tenants disponibles (si es `SUPERADMIN`).

---

## 3. Gestión de Empresas y Admins (`Tenants` — Solo `SUPERADMIN`)

### `GET /api/v1/tenants`
- **Roles:** `SUPERADMIN`
- **Descripción:** Lista todas las empresas/radiotaxis registradas.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "t-uuid-1",
      "name": "Radio Taxi Central (La Paz)",
      "slug": "radiotaxi-central-lp",
      "isActive": true,
      "createdAt": "2026-11-15T20:00:00Z"
    }
  ]
  ```

### `POST /api/v1/tenants`
- **Roles:** `SUPERADMIN`
- **Request Body:** `{ "name": "Línea Express Oriente", "slug": "express-oriente-sc", "isActive": true }`
- **Response `201 Created`:** Objeto Tenant creado.

### `PATCH /api/v1/tenants/:id`
- **Roles:** `SUPERADMIN`
- **Request Body:** `{ "name"?: string, "isActive"?: boolean }`

### `POST /api/v1/tenants/:id/admins`
- **Roles:** `SUPERADMIN`
- **Descripción:** Crea la cuenta `TENANT_ADMIN` para administrar una empresa específica.
- **Request Body:**
  ```json
  {
    "fullName": "Carlos Admin",
    "email": "admin@central.bo",
    "phone": "71500001",
    "password": "PasswordInicial123"
  }
  ```
- **Response `201 Created`:** Usuario `TENANT_ADMIN` creado con `tenantId = :id`.

### `GET /api/v1/tenants/:id/admins`
- **Roles:** `SUPERADMIN`
- **Descripción:** Lista los administradores asignados al tenant `:id`.

---

## 4. Conductores y Subida de Imágenes (`Drivers` & `Uploads`)

### `POST /api/v1/uploads/media`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN`
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `file` (imagen `.jpg/.png/.webp`), `folder` (`drivers-profile` | `drivers-id` | `vehicles`)
- **Response `201 Created`:** `{ "url": "https://.../storage/v1/object/public/taxiapp-media/..." }`

### `GET /api/v1/drivers`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Query Params:** `?search=&expedido=&isActive=`
- **Response `200 OK`:** Lista paginada de conductores del tenant.

### `GET /api/v1/drivers/:id`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

### `POST /api/v1/drivers`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Request Body:**
  ```json
  {
    "nombre": "Juan Mamani Quispe",
    "fechaNacimiento": "1988-05-14",
    "dni": "6789012",
    "expedido": "LP",
    "telefono": "71234567",
    "direccion": "Av. Montes #450, Zona Central",
    "fotoPerfilUrl": "https://.../perfil.jpg",
    "fotoIdentificacionUrl": "https://.../ci.jpg"
  }
  ```
- **Response `201 Created`:** Conductor creado dentro del `tenant_id`.

### `PATCH /api/v1/drivers/:id`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Descripción:** Actualiza los datos o fotos del conductor.

---

## 5. Vehículos y Catálogo en Cascada Marca -> Modelo (`Vehicles`)

### `GET /api/v1/vehicle-brands`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN`
- **Response `200 OK`:** `[{ "id": "b-1", "name": "Toyota" }, { "id": "b-2", "name": "Suzuki" }, ...]`

### `GET /api/v1/vehicle-brands/:brandId/models`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN`
- **Descripción:** Retorna únicamente los modelos pertenecientes a `:brandId` para llenar el select dependiente.
- **Response `200 OK`:** `[{ "id": "m-1", "brandId": "b-1", "name": "Corolla" }, { "id": "m-2", "brandId": "b-1", "name": "Probox" }]`

### `GET /api/v1/vehicles`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Query Params:** `?search=&brandId=`

### `GET /api/v1/vehicles/:id`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

### `POST /api/v1/vehicles`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Request Body:**
  ```json
  {
    "placa": "4521-KLP",
    "fotoVehiculoUrl": "https://.../auto.jpg",
    "brandId": "b-1",
    "modelId": "m-2",
    "anio": 2021,
    "color": "Blanco"
  }
  ```

### `PATCH /api/v1/vehicles/:id`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

---

## 6. Socios e Inquilinos (`Partners`)

### `GET /api/v1/partners`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Query Params:** `?tipoAfiliado=SOCIO_TITULAR|INQUILINO|ASALARIADO&search=`

### `POST /api/v1/partners`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Request Body:**
  ```json
  {
    "nombres": "Roberto",
    "apellidos": "Flores Condori",
    "fechaIngreso": "2026-01-15",
    "celular": "76543210",
    "tipoAfiliado": "SOCIO_TITULAR"
  }
  ```

### `PATCH /api/v1/partners/:id`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

---

## 7. Grupos Dinámicos y Tipos de Móvil (`Mobile Groups & Types`)

### `GET /api/v1/mobile-groups` / `POST /api/v1/mobile-groups`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Body (`POST`):** `{ "name": "Grupo Alfa - Centro", "isActive": true }`

### `GET /api/v1/mobile-types` / `POST /api/v1/mobile-types`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Body (`POST`):** `{ "name": "Radio Taxi Ejecutivo", "description": "Vehículo con aire acondicionado" }`

---

## 8. Unidades Móviles (`Mobiles`)

### `GET /api/v1/mobiles/available-numbers`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Descripción:** Calcula los números de móvil disponibles según la regla de negocio de `chat.md`.
- **Query Params:**
  - `conductorEsPropietario=true|false`
  - `tipoAfiliado=SOCIO_TITULAR|INQUILINO|ASALARIADO`
  - `partnerId=<uuid>` *(requerido si `conductorEsPropietario=false`)*
  - `driverId=<uuid>` *(requerido si `conductorEsPropietario=true`)*
- **Response `200 OK`:** `["001", "004", "012", "025"]`

### `GET /api/v1/mobiles`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

### `POST /api/v1/mobiles`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Request Body:**
  ```json
  {
    "nroMovil": "012",
    "driverId": "driver-uuid",
    "vehicleId": "vehicle-uuid",
    "groupId": "group-uuid",
    "mobileTypeIds": ["type-uuid-1", "type-uuid-2"],
    "conductorEsPropietario": false,
    "partnerId": "partner-uuid",
    "tipoAfiliado": "SOCIO_TITULAR"
  }
  ```

### `PATCH /api/v1/mobiles/:id`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

---

## 9. Kardex y Ficha Técnica Línea (`Kardex`)

### `GET /api/v1/kardex/drivers/:driverId` / `POST /api/v1/kardex/drivers/:driverId`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Body (`POST`):** `{ "title": "Renovación de licencia", "description": "Categoría B vigente hasta 2029", "eventDate": "2026-11-15" }`

### `GET /api/v1/kardex/vehicles/:vehicleId` / `POST /api/v1/kardex/vehicles/:vehicleId`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

### `GET /api/v1/kardex/lines/:mobileId` / `POST /api/v1/kardex/lines/:mobileId`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)

### `GET /api/v1/mobiles/:id/technical-sheet`
- **Roles:** `SUPERADMIN`, `TENANT_ADMIN` (Header `x-tenant-id`)
- **Descripción:** Consolida la **Ficha Técnica Línea** (Socio titular, Móvil, Grupo, Vehículo, Conductor y últimos movimientos del Kardex).

---

## 10. WebSockets en Tiempo Real (`Socket.io + Redis`)

- **Namespace:** `/realtime` (autenticado vía JWT handshake + `x-tenant-id`)
- **Eventos:**
  - `driver:location:update` (Cliente Conductor -> Servidor): `{ "lat": -16.500, "lng": -68.150, "heading": 90, "speed": 35 }`
  - `tenant:mobiles:locations` (Servidor -> Panel Admin): transmite posiciones actualizadas por `tenant_id` usando Redis Adapter.
  - `passenger:nearby-drivers` (Cliente Pasajero -> Servidor): consulta conductores disponibles en radio cercano combinando Redis + PostGIS.
