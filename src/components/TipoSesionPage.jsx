import { useCallback, useEffect, useState } from 'react';
import {
  actualizarTipoSesion,
  crearTipoSesion,
  eliminarTipoSesion,
  listarTiposSesion
} from '../services/tipoSesionService';
import './TipoSesionPage.css';

const FORMULARIO_VACIO = { nombre: '', precioBase: '' };

function formatoPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(precio);
}

function TipoSesionPage() {
  const [tipos, setTipos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [idEdicion, setIdEdicion] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarTipos = useCallback(async (filtro = busqueda) => {
    setCargando(true);
    setError('');
    try {
      const datos = await listarTiposSesion(filtro);
      setTipos(datos);
      setSeleccionado(actual => datos.find(tipo => tipo.id === actual?.id) || null);
      return datos;
    } catch (cargaError) {
      setError(cargaError.message);
      return null;
    } finally {
      setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => cargarTipos(busqueda), 250);
    return () => window.clearTimeout(temporizador);
  }, [busqueda, cargarTipos]);

  function abrirNuevo() {
    setFormulario(FORMULARIO_VACIO);
    setIdEdicion(null);
    setError('');
    setMensaje('');
    setModalAbierto(true);
  }

  function abrirEdicion(tipo) {
    setFormulario({ nombre: tipo.nombre, precioBase: String(tipo.precioBase) });
    setIdEdicion(tipo.id);
    setError('');
    setMensaje('');
    setModalAbierto(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const datos = {
        nombre: formulario.nombre.trim(),
        precioBase: Number(formulario.precioBase)
      };
      const actualizado = idEdicion
        ? await actualizarTipoSesion(idEdicion, datos)
        : await crearTipoSesion(datos);
      setModalAbierto(false);
      setMensaje(idEdicion ? 'Tipo de sesión actualizado.' : 'Tipo de sesión creado.');
      setBusqueda('');
      const tiposActualizados = await cargarTipos('');
      setSeleccionado(tiposActualizados?.find(tipo => tipo.id === actualizado.id) || null);
    } catch (guardarError) {
      setError(guardarError.message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(tipo) {
    const confirmar = window.confirm(`¿Querés eliminar el tipo de sesión “${tipo.nombre}”?`);
    if (!confirmar) return;

    setError('');
    setMensaje('');
    try {
      await eliminarTipoSesion(tipo.id);
      setSeleccionado(null);
      setMensaje('Tipo de sesión eliminado.');
      await cargarTipos();
    } catch (borrarError) {
      setError(borrarError.message);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="PsycoGest, inicio">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>PsycoGest</span>
        </a>
        <span className="topbar-label">Administración</span>
      </header>

      <section className="page-content" aria-labelledby="page-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CATÁLOGOS</p>
            <h1 id="page-title">Tipos de sesión</h1>
            <p className="page-description">Administrá las modalidades y sus precios base.</p>
          </div>
          <button className="button button-primary" type="button" onClick={abrirNuevo}>
            <span aria-hidden="true">＋</span> Nuevo tipo de sesión
          </button>
        </div>

        {error && !modalAbierto && <div className="notice notice-error" role="alert">{error}</div>}
        {mensaje && <div className="notice notice-success" role="status">{mensaje}</div>}

        <div className="management-layout">
          <section className="panel list-panel" aria-labelledby="list-title">
            <div className="panel-heading">
              <div>
                <h2 id="list-title">Listado</h2>
                <p>{tipos.length} {tipos.length === 1 ? 'tipo encontrado' : 'tipos encontrados'}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => cargarTipos()} aria-label="Actualizar listado" title="Actualizar">
                ↻
              </button>
            </div>

            <label className="search-field">
              <span className="sr-only">Buscar por nombre</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={busqueda}
                onChange={evento => setBusqueda(evento.target.value)}
                placeholder="Buscar por nombre..."
              />
            </label>

            {cargando ? (
              <p className="empty-state">Cargando tipos de sesión…</p>
            ) : tipos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">◷</span>
                <strong>{busqueda ? 'No encontramos resultados' : 'Todavía no hay tipos'}</strong>
                <span>{busqueda ? 'Probá con otro nombre.' : 'Creá el primero para empezar.'}</span>
              </div>
            ) : (
              <ul className="type-list">
                {tipos.map(tipo => (
                  <li key={tipo.id}>
                    <button
                      className={`type-row ${seleccionado?.id === tipo.id ? 'is-selected' : ''}`}
                      type="button"
                      onClick={() => setSeleccionado(tipo)}
                      aria-pressed={seleccionado?.id === tipo.id}
                    >
                      <span className="type-avatar" aria-hidden="true">{tipo.nombre.charAt(0).toUpperCase()}</span>
                      <span className="type-row-copy">
                        <strong>{tipo.nombre}</strong>
                        <span>{formatoPrecio(tipo.precioBase)}</span>
                      </span>
                      <span className="row-chevron" aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel detail-panel" aria-labelledby="detail-title">
            {seleccionado ? (
              <>
                <div className="detail-topline">
                  <span className="detail-icon" aria-hidden="true">◷</span>
                </div>
                <p className="eyebrow">DETALLE DEL CATÁLOGO</p>
                <h2 id="detail-title">{seleccionado.nombre}</h2>
                <p className="detail-subtitle">Información del tipo de sesión seleccionado.</p>
                <dl className="detail-fields">
                  <div><dt>Nombre</dt><dd>{seleccionado.nombre}</dd></div>
                  <div><dt>Precio base</dt><dd className="price-value">{formatoPrecio(seleccionado.precioBase)}</dd></div>
                  <div><dt>Identificador</dt><dd>#{seleccionado.id}</dd></div>
                </dl>
                <div className="detail-actions">
                  <button className="button button-secondary" type="button" onClick={() => abrirEdicion(seleccionado)}>Editar</button>
                  <button className="button button-danger" type="button" onClick={() => borrar(seleccionado)}>Eliminar</button>
                </div>
              </>
            ) : (
              <div className="detail-empty">
                <span className="detail-empty-icon" aria-hidden="true">▤</span>
                <h2 id="detail-title">Elegí un tipo de sesión</h2>
                <p>Al seleccionar un elemento del listado, vas a ver acá sus detalles.</p>
              </div>
            )}
          </section>
        </div>
      </section>

      {modalAbierto && (
        <div className="modal-backdrop" role="presentation" onMouseDown={evento => {
          if (evento.target === evento.currentTarget) setModalAbierto(false);
        }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">CATÁLOGOS</p>
                <h2 id="form-title">{idEdicion ? 'Editar tipo de sesión' : 'Nuevo tipo de sesión'}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setModalAbierto(false)} aria-label="Cerrar formulario">×</button>
            </div>
            <form className="type-form" onSubmit={guardar}>
              <label>
                Nombre
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={formulario.nombre}
                  onChange={evento => setFormulario(actual => ({ ...actual, nombre: evento.target.value }))}
                  placeholder="Ej.: Sesión individual"
                />
              </label>
              <label>
                Precio base (ARS)
                <input
                  required
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  value={formulario.precioBase}
                  onChange={evento => setFormulario(actual => ({ ...actual, precioBase: evento.target.value }))}
                  placeholder="0,00"
                />
              </label>
              {error && <div className="notice notice-error" role="alert">{error}</div>}
              <div className="form-actions">
                <button className="button button-secondary" type="button" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="button button-primary" type="submit" disabled={guardando}>
                  {guardando ? 'Guardando…' : idEdicion ? 'Guardar cambios' : 'Crear tipo'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default TipoSesionPage;

