# Sistema de Diseño UI — AppTaxi (`TaxiApp` Admin Panel)

Documento oficial de diseño e interfaz de usuario para `@taxiapp/admin-panel` (React 19 + Vite 6 + TypeScript), basado en la referencia visual `image.png`.

**Estética:** *"Taxi Gold & Carbon Obsidian" (Clean Operations Dashboard)* — alto contraste entre un **Sidebar oscuro carbón**, un **lienzo cálido alabastro** y **tarjetas blancas puras** con acentos en **Amarillo Taxi** vibrante y controles en **Verde Bosque Carbón**.

---

## 1. Paleta de Colores y Tokens CSS (`Design Tokens`)

```css
:root {
  /* Lienzo y Superficies */
  --bg-canvas: #F6F6F3;         /* Gris Alabastro Cálido - fondo principal */
  --bg-surface: #FFFFFF;        /* Blanco Puro - Cards, Topbar, Tablas */
  --bg-surface-muted: #F9F9F7;  /* Cabeceras de tabla y campos solo lectura */
  --bg-input-search: #F4F4F1;   /* Buscador global del Topbar */

  /* Sidebar Oscuro */
  --bg-sidebar: #111311;        /* Carbón Obsidiana */
  --bg-sidebar-card: #1C1F1C;   /* Tarjeta de estado operativa y hover inactivo */
  --bg-sidebar-badge: #262926;  /* Badges contadores en Sidebar */
  --border-sidebar: #2A2E2A;    /* Bordes internos del Sidebar */

  /* Marca y Acentos */
  --brand-yellow: #F5C518;      /* Amarillo Taxi - CTA primario e ítem activo */
  --brand-yellow-hover: #E5B610;
  --accent-forest: #1E2E22;     /* Verde Bosque Carbón - Tab/Filtro activo */

  /* Bordes */
  --border-subtle: #EAEAE6;     /* Borde estándar de Cards y Topbar */
  --border-input: #E2E4E0;      /* Borde estándar de inputs/selects */
  --border-dashed: #D6D6D0;     /* Paneles de autocompletado / dropzones */
  --border-row: #F1F1EE;        /* Separador horizontal de filas en tablas */

  /* Tipografía */
  --text-primary: #111311;
  --text-secondary: #6B7280;
  --text-tertiary: #71717A;
  --text-sidebar-muted: #9CA3AF;
  --text-sidebar-group: #6B726B;

  /* Estados Semánticos */
  --status-success-bg: #DCFCE7; /* Alternativa #E8F5E9 */
  --status-success-text: #15803D;
  --status-success-dot: #16A34A;

  --status-warning-bg: #FEF3C7;
  --status-warning-text: #A16207;
  --status-warning-dot: #D97706;
  --status-warning-border: #FDE68A;

  --status-danger-bg: #FEE2E2;
  --status-danger-text: #B91C1C;
  --status-danger-dot: #DC2626;
}
```

---

## 2. Tipografía e Iconografía

- **Fuente Principal:** `Inter` (o `Plus Jakarta Sans`), con soporte numérico `font-variant-numeric: tabular-nums` obligatorio para KPIs, DNIs, placas, fechas, teléfonos y números de móvil.
- **Iconografía:** `lucide-react` con trazo fino uniforme (`strokeWidth={1.75}`).
- **Escala Tipográfica:**
  - **Título de Página (`h1`):** `26px`, `font-weight: 700`, `#111311`, `letter-spacing: -0.02em`.
  - **Subtítulo de Página:** `14px`, `font-weight: 400`, `#6B7280`.
  - **Título de Card (`h2`/`h3`):** `16px`, `font-weight: 600`, `#111311`.
  - **Valor KPI Grande:** `30px`, `font-weight: 700`, `#111311`, `tabular-nums`.
  - **Cabecera de Tabla (`th`):** Fondo `#F9F9F7`, texto `12px`, `font-weight: 500`, `#6B7280`.
  - **Celdas de Tabla (`td`):** Altura de fila `54px`, borde inferior `1px solid #F1F1EE`; texto primario (`ID`, `Placa`, `Nombre`, `Importe`) en `13.5px`, `font-weight: 600`, `#111311`; texto secundario en `13.5px`, `#4B5563`.

---

## 3. Arquitectura del Shell (`SuperAdminLayout.tsx`)

### A. Sidebar Izquierdo (`width: 256px`, fondo `#111311`)
- **Branding Superior:** Cuadrado redondeado `32x32px` (`border-radius: 8px`) en `#F5C518` con ícono de taxi en `#111311` + texto `"AppTaxi"` en `#FFFFFF` (`20px`, `font-weight: 700`).
- **Títulos de Grupo (`ADMINISTRACIÓN`, `GESTIÓN`, `PLATAFORMA`):** `11px`, `uppercase`, `letter-spacing: 0.08em`, `font-weight: 600`, color `#6B726B`.
- **Ítem Activo:** Fondo `#F5C518`, texto e ícono en `#111311` (`font-weight: 600`), `border-radius: 10px`, `height: 44px`, `padding: 0 14px`.
- **Ítem Inactivo:** Texto e ícono `#9CA3AF` / `#A0A5A0`, hover fondo `#1C1F1C` con texto `#FFFFFF`.
- **Badge Contador:** Fondo `#262926`, texto `#D4D8D4`, `12px`, `border-radius: 9999px`, `padding: 2px 8px`.
- **Tarjeta Inferior Fija:** Fondo `#1C1F1C`, borde `1px solid #2A2E2A`, `border-radius: 12px`, `padding: 14px`:
  - Título `"Tu ciudad, en marcha."` (`#FFFFFF`, `13px`, `font-weight: 700`)
  - Indicador verde `• Servicio operativo` (`#16A34A`)
  - Enlace `"Ver estado del sistema ↗"` en `#F5C518`
  - Footer de versión (`"AppTaxi Admin · v2.4"`)

### B. Topbar Superior (`height: 68px`, fondo `#FFFFFF`, borde inferior `1px solid #EAEAE6`, `padding: 0 32px`)
- **Izquierda — Selector Multi-tenant:** Label superior `"Espacio de trabajo"` (`11px`, `#71717A`) + nombre del Tenant activo (`14px`, `font-weight: 600`, `#111311`) con chevron `▾` (habilitado para `SUPERADMIN`, fijo para `TENANT_ADMIN`).
- **Centro — Buscador Global:** Fondo `#F4F4F1`, sin borde rígido, `border-radius: 10px`, `height: 40px`, `width: 380px`, ícono lupa `#71717A`, placeholder `#71717A` (`13.5px`).
- **Derecha — Perfil de Usuario:** Ícono campana `#111311` + nombre/área (`"Administración"`, `14px`, `font-weight: 600`, `#111311`) y subtítulo de rol (`"Superadministrador"` / `"Administrador"`, `12px`, `#71717A`).

### C. Canvas Principal y Footer
- **Main Canvas:** Fondo `#F6F6F3`, `padding: 28px 32px`.
- **Footer:** Texto discreto de copyright y zona horaria en `#6B7280`.

---

## 4. Componentes Estándar

### Tarjetas (`Cards`)
- Fondo `#FFFFFF`, borde `1px solid #EAEAE6`, `border-radius: 14px`, sombra `0 1px 2px rgba(17, 19, 17, 0.03)`.
- Padding interno: `20px 24px` (KPIs) y `24px` (Formularios y Tablas).

### Botones y Filtros
- **Botón Primario (CTA):** Fondo `#F5C518`, hover `#E5B610`, texto `#111311` (`14px`, `font-weight: 600`), `border-radius: 10px`, `height: 40px`, `padding: 0 18px`.
- **Filtro / Tab Activo (Píldora):** Fondo `#1E2E22` (Verde Bosque Carbón), texto `#FFFFFF` (`13px`, `font-weight: 500`), `border-radius: 8px`, `padding: 6px 14px`.
- **Filtro / Tab Inactivo:** Fondo `#FFFFFF`, borde `1px solid #E5E7EB`, texto `#4B5563` (`13px`, `font-weight: 500`), hover `#F9F9F7`, `border-radius: 8px`.

### Formularios e Inputs
- **Inputs / Selects Activos:** `height: 42px`, fondo `#FFFFFF`, borde `1px solid #E2E4E0`, `border-radius: 10px`, texto `#111311` (`14px`), placeholder `#9CA3AF`, focus `border-color: #111311` + `ring: 2px rgba(245, 197, 24, 0.35)`.
- **Inputs Autocompletados (Solo Lectura):** Fondo `#F9F9F7`, borde `1px dashed #D6D6D0`, texto `#374151` (`font-weight: 500`).
- **Selects Deshabilitados por Dependencia:** Fondo `#F4F4F1`, borde `#E5E7EB`, texto `#9CA3AF`.

### Badges Semánticos y Paginación
- **Badges con punto (`•`):** `border-radius: 9999px`, `padding: 4px 10px`, `font-size: 12px`, `font-weight: 600`:
  - **Activo / Completado / En vivo / Inquilino:** Fondo `#DCFCE7`, texto `#15803D`, punto `#16A34A`.
  - **En curso / Pendiente / Socio Titular:** Fondo `#FEF3C7`, texto `#A16207`, punto `#D97706`.
  - **Cancelado / Suspendido / Error:** Fondo `#FEE2E2`, texto `#B91C1C`, punto `#DC2626`.
  - **Asalariado / Neutro:** Fondo `#F3F4F6`, texto `#374151`, punto `#6B7280`.
- **Paginación Activa:** Botón cuadrado `32x32px`, `border-radius: 8px`, fondo `#F5C518`, texto `#111311` (`font-weight: 700`).
