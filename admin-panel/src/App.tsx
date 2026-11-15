import { useState } from 'react';
import { AffiliateType, BOLIVIA_DEPARTMENTS, type Tenant } from '@taxiapp/shared';

type ConductoresViewId =
  | 'lista-moviles'
  | 'nuevo-movil'
  | 'nuevo-conductor'
  | 'lista-conductores'
  | 'kardex-conductores'
  | 'nuevo-vehiculo'
  | 'lista-vehiculos'
  | 'kardex-vehiculos'
  | 'socios-inquilinos'
  | 'kardex-lineas-titulares'
  | 'ficha-tecnica-linea';

interface SubmoduleDefinition {
  id: ConductoresViewId;
  label: string;
  description: string;
  fields: string[];
  rules: string[];
}

const SAMPLE_TENANTS: Tenant[] = [
  {
    id: 'tenant-radiotaxi-1',
    name: 'Radio Taxi Central (La Paz)',
    slug: 'radiotaxi-central-lp',
    isActive: true,
    createdAt: '2026-11-15T00:00:00Z',
  },
  {
    id: 'tenant-radiotaxi-2',
    name: 'Sindicato 1ro de Mayo (Cochabamba)',
    slug: 'sindicato-1mayo-cb',
    isActive: true,
    createdAt: '2026-11-15T00:00:00Z',
  },
  {
    id: 'tenant-radiotaxi-3',
    name: 'Línea Express Oriente (Santa Cruz)',
    slug: 'express-oriente-sc',
    isActive: true,
    createdAt: '2026-11-15T00:00:00Z',
  },
];

const CONDUCTORES_SUBMODULES: SubmoduleDefinition[] = [
  {
    id: 'lista-moviles',
    label: 'Lista de móviles',
    description: 'Listado operativo de unidades móviles afiliadas al tenant activo.',
    fields: ['Nro. Móvil', 'Usuario de Móvil (Conductor)', 'Placa / Vehículo', 'Grupo', 'Tipos de Móvil', 'Propietario / Tipo de Afiliado'],
    rules: ['Filtrado estricto por tenant_id.', 'Visualización de estado operativo y acceso rápido a edición.'],
  },
  {
    id: 'nuevo-movil',
    label: 'Nuevo móvil',
    description: 'Registro de unidad operativa vinculando conductor, vehículo, grupo, tipos de móvil y propietario.',
    fields: [
      'Nro. Móvil (disponibles filtrados)',
      'Usuario de Móvil (conductor)',
      'Grupo (dinámico por tenant)',
      'Tipo de Móvil (selección múltiple)',
      'Vehículo (autocompleta Foto, Marca, Modelo, Placa, Año y Color)',
      'Switch: ¿El conductor es el propietario?',
      'Socio (Nombre(s), Apellido(s), Fecha de Ingreso dd/mm/aaaa, Celular)',
      'Tipo de Afiliado',
    ],
    rules: [
      'Nro. Móvil se habilita/lista tras elegir Propietario y Tipo de Afiliado (y Usuario del móvil si el conductor es el propietario).',
      'Al seleccionar Vehículo, los campos Marca, Modelo, Placa, Año Vehículo y Color se llenan automáticamente en solo lectura.',
    ],
  },
  {
    id: 'nuevo-conductor',
    label: 'Nuevo conductor',
    description: 'Formulario de registro y actualización de conductores habilitados.',
    fields: ['Nombre', 'Foto de Perfil', 'Fecha de Nacimiento', 'DNI', 'Foto Identificación', 'Expedido (9 deptos de Bolivia)', 'Teléfono', 'Dirección'],
    rules: ['Las fotos se suben a Supabase Storage.', 'El campo Expedido usa el catálogo oficial de los 9 departamentos de Bolivia.'],
  },
  {
    id: 'lista-conductores',
    label: 'Lista de conductores',
    description: 'Directorio de conductores registrados en el tenant activo con búsqueda por DNI, nombre o teléfono.',
    fields: ['Foto de Perfil', 'Nombre', 'DNI + Expedido', 'Teléfono', 'Dirección', 'Estado'],
    rules: ['Permite abrir actualización del conductor o navegar a su Kardex.'],
  },
  {
    id: 'kardex-conductores',
    label: 'Kardex',
    description: 'Hoja de vida e historial administrativo/operativo de cada conductor.',
    fields: ['Conductor', 'Fecha de evento', 'Tipo de registro', 'Detalle / Observación', 'Usuario responsable'],
    rules: ['Historial inmutable auditado por tenant_id.'],
  },
  {
    id: 'nuevo-vehiculo',
    label: 'Nuevo vehículo',
    description: 'Registro de vehículos físicos con catálogo en cascada Marca -> Modelo vía API.',
    fields: ['Placa', 'Foto del Vehículo', 'Marca (API)', 'Modelo (dependiente de Marca)', 'Año', 'Color'],
    rules: ['Al seleccionar Marca se consulta la API para cargar únicamente los Modelos de esa Marca.'],
  },
  {
    id: 'lista-vehiculos',
    label: 'Lista de vehículos',
    description: 'Inventario de vehículos registrados en la empresa/sindicato.',
    fields: ['Foto', 'Placa', 'Marca', 'Modelo', 'Año', 'Color', 'Móvil asignado'],
    rules: ['Validación de placa única dentro del tenant.'],
  },
  {
    id: 'kardex-vehiculos',
    label: 'Kardex de vehículos',
    description: 'Historial de asignaciones, mantenimientos y novedades por vehículo.',
    fields: ['Vehículo (Placa)', 'Fecha', 'Evento', 'Descripción', 'Responsable'],
    rules: ['Muestra cambios de móvil/conductor asociados al vehículo.'],
  },
  {
    id: 'socios-inquilinos',
    label: 'Socios e inquilinos',
    description: 'Administración de socios titulares, inquilinos y tipos de afiliación.',
    fields: ['Nombre(s) y Apellido(s)', 'Fecha de Ingreso (dd/mm/aaaa)', 'Celular', 'Tipo de Afiliado'],
    rules: ['Tipos soportados: ' + Object.values(AffiliateType).join(', ') + '.'],
  },
  {
    id: 'kardex-lineas-titulares',
    label: 'Kardex Líneas Titulares',
    description: 'Control histórico de titularidad, transferencias y movimientos de líneas.',
    fields: ['Nro. Línea / Móvil', 'Titular anterior / actual', 'Fecha de movimiento', 'Motivo / Respaldo'],
    rules: ['Trazabilidad completa de titularidad por tenant.'],
  },
  {
    id: 'ficha-tecnica-linea',
    label: 'Ficha Técnica Línea',
    description: 'Vista consolidada técnica y documental de la línea/móvil titular.',
    fields: ['Datos del Socio Titular', 'Datos del Móvil y Grupo', 'Datos del Vehículo', 'Conductor asignado', 'Resumen Kardex'],
    rules: ['Consolida la ficha imprimible/exportable de la línea.'],
  },
];

export default function App() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(SAMPLE_TENANTS[0].id);
  const [activeView, setActiveView] = useState<ConductoresViewId>('nuevo-movil');
  const [driverIsOwner, setDriverIsOwner] = useState<boolean>(false);

  const activeTenant =
    SAMPLE_TENANTS.find((tenant) => tenant.id === selectedTenantId) ?? SAMPLE_TENANTS[0];
  const currentSubmodule =
    CONDUCTORES_SUBMODULES.find((item) => item.id === activeView) ?? CONDUCTORES_SUBMODULES[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">TX</div>
          <div>
            <div className="brand-title">TaxiApp Admin</div>
            <div className="brand-sub">Panel SuperAdmin Multi-tenant</div>
          </div>
        </div>

        <nav aria-label="Menú principal">
          <div className="nav-section-title">ADMINISTRACIÓN</div>
          <div className="nav-group-title">Conductores</div>
          <ul className="nav-list">
            {CONDUCTORES_SUBMODULES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-btn ${item.id === activeView ? 'active' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <strong>ADMINISTRACIÓN / Conductores</strong>
          </div>
          <div className="tenant-picker">
            <label htmlFor="tenant-select">Tenant Activo:</label>
            <select
              id="tenant-select"
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
            >
              {SAMPLE_TENANTS.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <main className="content">
          <section className="card">
            <span className="meta-pill">Tenant ID: {activeTenant.id}</span>
            <h1>{currentSubmodule.label}</h1>
            <p className="subtitle">{currentSubmodule.description}</p>

            <div className="grid-2">
              <div>
                <h2 className="section-heading">Campos definidos</h2>
                <ul className="field-list">
                  {currentSubmodule.fields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="section-heading">Reglas de negocio</h2>
                <ul className="rule-list">
                  {currentSubmodule.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {activeView === 'nuevo-conductor' && (
            <section className="card">
              <h2 className="section-heading">
                Catálogo Expedido — 9 Departamentos de Bolivia (@taxiapp/shared)
              </h2>
              <div className="dept-grid">
                {BOLIVIA_DEPARTMENTS.map((dept) => (
                  <span key={dept.code} className="dept-chip">
                    {dept.code} — {dept.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {activeView === 'nuevo-movil' && (
            <section className="card">
              <h2 className="section-heading">Vista previa de regla de Propietario</h2>
              <label className="switch-row">
                <input
                  type="checkbox"
                  checked={driverIsOwner}
                  onChange={(event) => setDriverIsOwner(event.target.checked)}
                />
                <span>El conductor es el propietario</span>
              </label>
              <p className="subtitle">
                {driverIsOwner
                  ? 'Modo activo: Los datos del propietario se toman del Usuario de Móvil (conductor) y el Nro. Móvil se lista según Usuario + Tipo de Afiliado.'
                  : 'Modo activo: Seleccione un Socio (Nombre(s), Apellido(s), Fecha de Ingreso dd/mm/aaaa, Celular) y Tipo de Afiliado para listar los Nros. de Móvil disponibles.'}
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
