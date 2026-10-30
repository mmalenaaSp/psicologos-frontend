import { useCallback, useEffect, useState } from 'react';
import {
  actualizarLugar,
  crearLugar,
  eliminarLugar,
  listarLugares
} from '../services/lugarService';
import './LugarPage.css';

const FORMULARIO_VACIO = { nombre: '', direccion: '' };

function LugarPage() {
  const [lugares, setLugares] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [idEdicion, setIdEdicion] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarLugares = useCallback(async (texto = filtro) => {
    setCargando(true);
    setError('');
    try {
      const datos = await listarLugares(texto);
      setLugares(datos);
      setSeleccionado(actual => datos.find(lugar => lugar.id === actual?.id) || null);
      return datos;
    } catch (cargaError) {
      setError(cargaError.message);
      return null;
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => cargarLugares(filtro), 250);
    return () => window.clearTimeout(temporizador);
  }, [filtro, cargarLugares]);

  function abrirNuevo() {
    setFormulario(FORMULARIO_VACIO);
    setIdEdicion(null);
    setError('');
    setMensaje('');
    setModalAbierto(true);
  }

  function abrirEdicion(lugar) {
    setFormulario({ nombre: lugar.nombre, direccion: lugar.direccion });
    setIdEdicion(lugar.id);
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
        direccion: formulario.direccion.trim()
      };
      const guardado = idEdicion
        ? await actualizarLugar(idEdicion, datos)
        : await crearLugar(datos);
      setModalAbierto(false);
      setMensaje(idEdicion ? 'Lugar actualizado.' : 'Lugar creado.');
      setFiltro('');
      const lugaresActualizados = await cargarLugares('');
      setSeleccionado(lugaresActualizados?.find(lugar => lugar.id === guardado.id) || null);
    } catch (guardarError) {
      setError(guardarError.message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(lugar) {
    if (!window.confirm(`¿Querés eliminar el lugar “${lugar.nombre}”?`)) return;
    setError('');
    setMensaje('');
    try {
      await eliminarLugar(lugar.id);
      setSeleccionado(null);
      setMensaje('Lugar eliminado.');
      await cargarLugares();
    } catch (borrarError) {
      setError(borrarError.message);
    }
  }

  return (
    <div className="lugar-page">

      <section className="lugar-content" aria-labelledby="lugar-title">
        <div className="lugar-heading">
          <div>
            <p className="lugar-eyebrow">CATÁLOGOS</p>
            <h1 id="lugar-title">Lugares de atención</h1>
            <p className="lugar-description">Administrá los espacios donde se realizan las sesiones.</p>
          </div>
          <button className="lugar-button lugar-button-primary" type="button" onClick={abrirNuevo}>
            <span aria-hidden="true">＋</span> Nuevo lugar
          </button>
        </div>

        {error && !modalAbierto && <div className="lugar-notice lugar-notice-error" role="alert">{error}</div>}
        {mensaje && <div className="lugar-notice lugar-notice-success" role="status">{mensaje}</div>}

        <div className="lugar-layout">
          <section className="lugar-panel lugar-list-panel" aria-labelledby="lugar-list-title">
            <div className="lugar-panel-heading">
              <div>
                <h2 id="lugar-list-title">Listado</h2>
                <p>{lugares.length} {lugares.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}</p>
              </div>
              <button className="lugar-icon-button" type="button" onClick={() => cargarLugares()} aria-label="Actualizar listado" title="Actualizar">↻</button>
            </div>
            <label className="lugar-search">
              <span className="lugar-sr-only">Buscar por nombre o dirección</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={filtro}
                onChange={evento => setFiltro(evento.target.value)}
                placeholder="Buscar por nombre o dirección..."
              />
            </label>

            {cargando ? (
              <p className="lugar-empty">Cargando lugares…</p>
            ) : lugares.length === 0 ? (
              <div className="lugar-empty">
                <span className="lugar-empty-icon" aria-hidden="true">⌖</span>
                <strong>{filtro ? 'No encontramos resultados' : 'Todavía no hay lugares'}</strong>
                <span>{filtro ? 'Probá con otro nombre o dirección.' : 'Creá el primero para empezar.'}</span>
              </div>
            ) : (
              <ul className="lugar-list">
                {lugares.map(lugar => (
                  <li key={lugar.id}>
                    <button
                      className={`lugar-row ${seleccionado?.id === lugar.id ? 'is-selected' : ''}`}
                      type="button"
                      onClick={() => setSeleccionado(lugar)}
                      aria-pressed={seleccionado?.id === lugar.id}
                    >
                      <span className="lugar-avatar" aria-hidden="true">{lugar.nombre.charAt(0).toUpperCase()}</span>
                      <span className="lugar-row-copy">
                        <strong>{lugar.nombre}</strong>
                        <span>{lugar.direccion}</span>
                      </span>
                      <span className="lugar-chevron" aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="lugar-panel lugar-detail-panel" aria-labelledby="lugar-detail-title">
            {seleccionado ? (
              <>
                <span className="lugar-detail-icon" aria-hidden="true">⌖</span>
                <p className="lugar-eyebrow">DETALLE DEL CATÁLOGO</p>
                <h2 id="lugar-detail-title">{seleccionado.nombre}</h2>
                <p className="lugar-detail-subtitle">Información del lugar seleccionado.</p>
                <dl className="lugar-fields">
                  <div><dt>Nombre</dt><dd>{seleccionado.nombre}</dd></div>
                  <div><dt>Dirección</dt><dd>{seleccionado.direccion}</dd></div>
                  <div><dt>Identificador</dt><dd>#{seleccionado.id}</dd></div>
                </dl>
                <div className="lugar-actions">
                  <button className="lugar-button lugar-button-secondary" type="button" onClick={() => abrirEdicion(seleccionado)}>Editar</button>
                  <button className="lugar-button lugar-button-danger" type="button" onClick={() => borrar(seleccionado)}>Eliminar</button>
                </div>
              </>
            ) : (
              <div className="lugar-detail-empty">
                <span className="lugar-detail-empty-icon" aria-hidden="true">▤</span>
                <h2 id="lugar-detail-title">Elegí un lugar</h2>
                <p>Al seleccionar un elemento del listado, vas a ver acá sus detalles.</p>
              </div>
            )}
          </section>
        </div>
      </section>

      {modalAbierto && (
        <div className="lugar-modal-backdrop" role="presentation" onMouseDown={evento => {
          if (evento.target === evento.currentTarget) setModalAbierto(false);
        }}>
          <section className="lugar-modal-card" role="dialog" aria-modal="true" aria-labelledby="lugar-form-title">
            <div className="lugar-modal-heading">
              <div>
                <p className="lugar-eyebrow">CATÁLOGOS</p>
                <h2 id="lugar-form-title">{idEdicion ? 'Editar lugar' : 'Nuevo lugar'}</h2>
              </div>
              <button className="lugar-icon-button" type="button" onClick={() => setModalAbierto(false)} aria-label="Cerrar formulario">×</button>
            </div>
            <form className="lugar-form" onSubmit={guardar}>
              <label>
                Nombre
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={formulario.nombre}
                  onChange={evento => setFormulario(actual => ({ ...actual, nombre: evento.target.value }))}
                  placeholder="Ej.: Consultorio Centro"
                />
              </label>
              <label>
                Dirección
                <input
                  required
                  maxLength={200}
                  value={formulario.direccion}
                  onChange={evento => setFormulario(actual => ({ ...actual, direccion: evento.target.value }))}
                  placeholder="Ej.: San Martín 1234"
                />
              </label>
              {error && <div className="lugar-notice lugar-notice-error" role="alert">{error}</div>}
              <div className="lugar-form-actions">
                <button className="lugar-button lugar-button-secondary" type="button" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="lugar-button lugar-button-primary" type="submit" disabled={guardando}>
                  {guardando ? 'Guardando…' : idEdicion ? 'Guardar cambios' : 'Crear lugar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default LugarPage;
