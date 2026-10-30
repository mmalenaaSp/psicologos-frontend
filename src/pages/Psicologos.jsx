
import './Psicologos.css';

import { useEffect, useState } from 'react';

import {
  obtenerPsicologos,
  darDeBajaPsicologo
} from '../services/psicologoService';

import Modal from '../components/Modal';
import FormularioPsicologo from '../components/FormularioPsicologo';
import FormularioEditarPsicologo from '../components/FormularioEditarPsicologo';

function Psicologos() {

  // ==========================================
  // ESTADOS
  // ==========================================

  const [psicologos, setPsicologos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [psicologoEnEdicion, setPsicologoEnEdicion] = useState(null);

  const [mensaje, setMensaje] = useState('');
  const [eliminandoId, setEliminandoId] = useState(null);


  // ==========================================
  // READ: CARGAR LISTADO
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const cargar = async () => {
      try {
        const datos = await obtenerPsicologos(controller.signal);

        setPsicologos(datos);
        setError('');

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }

      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargar();

    return () => controller.abort();
  }, []);


  // ==========================================
  // RECARGAR DESDE EL BACKEND
  // ==========================================

  const recargarPsicologos = async () => {
    setCargando(true);

    try {
      const datos = await obtenerPsicologos();

      setPsicologos(datos);
      setError('');

    } catch (err) {
      setError(
        'No se pudo actualizar el listado: ' + err.message
      );

    } finally {
      setCargando(false);
    }
  };


  // ==========================================
  // CREATE: REGISTRAR
  // ==========================================

  const finalizarAlta = () => {
    setMostrarAlta(false);
    setBusqueda('');
    setMensaje('Psicólogo registrado correctamente.');

    recargarPsicologos();
  };


  // ==========================================
  // UPDATE: EDITAR
  // ==========================================

  const seleccionarParaEditar = (psicologo) => {
    setSeleccionado(null);
    setMensaje('');
    setError('');
    setPsicologoEnEdicion(psicologo);
  };

  const finalizarEdicion = () => {
    setPsicologoEnEdicion(null);
    setBusqueda('');
    setMensaje('Psicólogo actualizado correctamente.');

    recargarPsicologos();
  };


  // ==========================================
  // DELETE: DAR DE BAJA
  // ==========================================

  const confirmarBaja = async (psicologo) => {
    if (eliminandoId !== null) return;

    const confirmado = window.confirm(
      `¿Querés dar de baja a ${psicologo.nombre} ${psicologo.apellido ?? ''}?\n\n` +
      'El profesional dejará de aparecer en el listado.'
    );

    if (!confirmado) return;

    setEliminandoId(psicologo.id);
    setMensaje('');
    setError('');

    try {
      await darDeBajaPsicologo(psicologo.id);

      setPsicologos((anteriores) =>
        anteriores.filter(
          (item) => item.id !== psicologo.id
        )
      );

      setSeleccionado(null);
      setPsicologoEnEdicion(null);

      setMensaje('Psicólogo dado de baja correctamente.');

    } catch (err) {
      setError(err.message);

    } finally {
      setEliminandoId(null);
    }
  };


  // ==========================================
  // BUSCADOR
  // ==========================================

  const termino = busqueda.trim().toLocaleLowerCase('es');

  const psicologosFiltrados = psicologos.filter((psicologo) => {
    const nombreCompleto =
      `${psicologo.nombre ?? ''} ${psicologo.apellido ?? ''}`;

    return [
      psicologo.nombre,
      psicologo.apellido,
      nombreCompleto,
      psicologo.nroMatricula,
      psicologo.email
    ].some((valor) =>
      String(valor ?? '')
        .toLocaleLowerCase('es')
        .includes(termino)
    );
  });


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <section className="psicologos-page">

      {/* ENCABEZADO */}

      <div className="psicologos-encabezado">

        <div>
          <h2>Gestión de Psicólogos</h2>
          <p>
            Administrá los profesionales registrados.
          </p>
        </div>

        <div className="psicologos-acciones">

          <span className="psicologos-contador">
            {psicologos.length} profesionales
          </span>

          <button
            type="button"
            className="psicologos-nuevo"
            onClick={() => {
              setMensaje('');
              setError('');
              setMostrarAlta(true);
            }}
          >
            + Nuevo psicólogo
          </button>

        </div>
      </div>


      {/* MENSAJES */}

      {mensaje && (
        <p className="psicologos-exito" role="status">
          {mensaje}
        </p>
      )}


      {/* PANEL DE LISTADO */}

      <div className="psicologos-panel">

        <div className="psicologos-toolbar">
          <label htmlFor="buscar-psicologo">
            Buscar profesional
          </label>

          <input
            id="buscar-psicologo"
            type="search"
            value={busqueda}
            placeholder="Nombre, apellido, matrícula o email..."
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando && (
          <p>Cargando psicólogos...</p>
        )}

        {error && (
          <p className="psicologos-error" role="alert">
            {error}
          </p>
        )}

        {!cargando && !error && psicologos.length === 0 && (
          <div className="psicologos-vacio">
            <h3>Todavía no hay profesionales registrados</h3>
            <p>Los nuevos profesionales aparecerán acá.</p>
          </div>
        )}

        {!cargando &&
          !error &&
          psicologos.length > 0 &&
          psicologosFiltrados.length === 0 && (
            <div className="psicologos-vacio">
              <h3>No encontramos resultados</h3>
              <p>Probá con otra búsqueda.</p>
            </div>
          )}


        {/* TABLA */}

        {!cargando &&
          !error &&
          psicologosFiltrados.length > 0 && (

            <div className="psicologos-tabla-contenedor">
              <table>

                <thead>
                  <tr>
                    <th>Profesional</th>
                    <th>Matrícula</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {psicologosFiltrados.map((psicologo) => (
                    <tr key={psicologo.id}>

                      <td>
                        <div className="psicologos-profesional">

                          <span className="psicologos-avatar">
                            {psicologo.nombre?.charAt(0).toUpperCase() || 'P'}
                          </span>

                          <span>
                            {psicologo.nombre} {psicologo.apellido}
                          </span>
                        </div>
                      </td>

                      <td>{psicologo.nroMatricula}</td>
                      <td>{psicologo.email}</td>

                      <td>
                        <div className="psicologos-acciones-tabla">

                          <button
                            type="button"
                            className="psicologos-ver"
                            onClick={() => setSeleccionado(psicologo)}
                          >
                            Ver detalles
                          </button>

                          <button
                            type="button"
                            className="psicologos-ver"
                            onClick={() => seleccionarParaEditar(psicologo)}
                            disabled={eliminandoId !== null}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="psicologos-baja"
                            onClick={() => confirmarBaja(psicologo)}
                            disabled={eliminandoId !== null}
                          >
                            {eliminandoId === psicologo.id
                              ? 'Dando de baja...'
                              : 'Dar de baja'}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

      </div>


      {/* MODAL: DETALLES */}

      {seleccionado && (
        <Modal
          titulo="Ficha del profesional"
          onCerrar={() => setSeleccionado(null)}
        >
          <div className="psicologos-ficha">

            <div>
              <span>Nombre completo</span>
              <strong>
                {seleccionado.nombre} {seleccionado.apellido}
              </strong>
            </div>

            <div>
              <span>Número de matrícula</span>
              <strong>{seleccionado.nroMatricula}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{seleccionado.email}</strong>
            </div>

            <div>
              <span>Teléfono</span>
              <strong>
                {seleccionado.telefono || 'No informado'}
              </strong>
            </div>

            <div>
              <span>Dirección</span>
              <strong>
                {seleccionado.direccion || 'No informada'}
              </strong>
            </div>

            <div>
              <span>ID del Colegio de Psicólogos</span>
              <strong>
                {seleccionado.colegioId ?? 'No informado'}
              </strong>
            </div>

          </div>
        </Modal>
      )}


      {/* MODAL: REGISTRAR */}

      {mostrarAlta && (
        <Modal
          titulo="Registrar nuevo psicólogo"
          onCerrar={() => setMostrarAlta(false)}
        >
          <FormularioPsicologo
            onCreado={finalizarAlta}
          />
        </Modal>
      )}


      {/* MODAL: EDITAR */}

      {psicologoEnEdicion && (
        <Modal
          titulo="Editar psicólogo"
          onCerrar={() => setPsicologoEnEdicion(null)}
        >
          <FormularioEditarPsicologo
            key={psicologoEnEdicion.id}
            psicologo={psicologoEnEdicion}
            onGuardado={finalizarEdicion}
            onCancelar={() => setPsicologoEnEdicion(null)}
          />
        </Modal>
      )}

    </section>
  );
}

export default Psicologos;
