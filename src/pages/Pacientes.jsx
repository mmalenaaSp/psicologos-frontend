import './Pacientes.css';

import { useEffect, useState } from 'react';

import {
  obtenerPacientes,
  darDeBajaPaciente
} from '../services/pacienteService';

import FormularioPaciente from '../components/FormularioPaciente';
import FormularioEditarPaciente from '../components/FormularioEditarPaciente';
import Modal from '../components/Modal';

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados de la interfaz
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [pacienteEnEdicion, setPacienteEnEdicion] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Estados para operaciones
  const [eliminandoId, setEliminandoId] = useState(null);
  const [errorBaja, setErrorBaja] = useState('');
  const [mensajeOperacion, setMensajeOperacion] = useState('');

  // READ: Obtener pacientes
  useEffect(() => {
    const controller = new AbortController();

    const cargarPacientes = async () => {
      try {
        const datos = await obtenerPacientes(controller.signal);
        setPacientes(datos);
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

    cargarPacientes();

    return () => controller.abort();
  }, []);

  // CREATE: Abrir formulario de alta
  const abrirAlta = () => {
    setPacienteEnEdicion(null);
    setMensajeOperacion('');
    setErrorBaja('');
    setMostrarAlta(true);
  };

  // CREATE: Agregar paciente al listado
  const agregarPaciente = (nuevoPaciente) => {
    setPacientes((anteriores) => [
      ...anteriores,
      nuevoPaciente
    ]);

    setMostrarAlta(false);
    setMensajeOperacion('Paciente registrado correctamente');
  };

  // UPDATE: Seleccionar paciente
  const seleccionarPaciente = (paciente) => {
    setMostrarAlta(false);
    setMensajeOperacion('');
    setErrorBaja('');
    setPacienteEnEdicion(paciente);
  };

  // UPDATE: Reflejar cambios en el listado
  const guardarPacienteActualizado = (pacienteActualizado) => {
    setPacientes((anteriores) =>
      anteriores.map((paciente) =>
        paciente.id === pacienteActualizado.id
          ? pacienteActualizado
          : paciente
      )
    );

    setPacienteEnEdicion(null);
    setMensajeOperacion('Paciente actualizado correctamente');
  };

  // DELETE: Dar de baja un paciente
  const confirmarBaja = async (paciente) => {
    if (eliminandoId !== null) return;

    const confirmado = window.confirm(
      `¿Querés dar de baja a ${paciente.nombre} ${paciente.apellido}?\n\n` +
      'El paciente dejará de aparecer en el listado.'
    );

    if (!confirmado) return;

    setEliminandoId(paciente.id);
    setErrorBaja('');
    setMensajeOperacion('');

    try {
      await darDeBajaPaciente(paciente.id);

      setPacientes((anteriores) =>
        anteriores.filter(
          (item) => item.id !== paciente.id
        )
      );

      setPacienteEnEdicion((anterior) =>
        anterior?.id === paciente.id ? null : anterior
      );

      setMensajeOperacion('Paciente dado de baja correctamente');

    } catch (err) {
      setErrorBaja(err.message);
    } finally {
      setEliminandoId(null);
    }
  };

  // BÚSQUEDA: Filtrar pacientes por nombre, apellido o DNI
  const termino = busqueda.trim().toLocaleLowerCase('es');

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const nombreCompleto =
      `${paciente.nombre} ${paciente.apellido}`;

    return [
      paciente.nombre,
      paciente.apellido,
      nombreCompleto,
      paciente.dni
    ].some((valor) =>
      String(valor ?? '')
        .toLocaleLowerCase('es')
        .includes(termino)
    );
  });

  return (
    <section className="pacientes-page">

      {/* ENCABEZADO */}
      <div className="pacientes-encabezado">
        <div>
          <h2>Gestión de Pacientes</h2>
          <p>Administrá y consultá tus pacientes registrados.</p>
        </div>

        <button
          type="button"
          className="pacientes-nuevo"
          onClick={abrirAlta}
        >
          + Nuevo paciente
        </button>
      </div>

      {/* MENSAJES */}
      {mensajeOperacion && (
        <p className="pacientes-mensaje" role="status">
          {mensajeOperacion}
        </p>
      )}

      {errorBaja && (
        <p className="pacientes-error" role="alert">
          {errorBaja}
        </p>
      )}

      {/* PANEL PRINCIPAL */}
      <div className="pacientes-panel">

        <div className="pacientes-toolbar">
          <label htmlFor="buscar-paciente">
            Buscar paciente
          </label>

          <input
            id="buscar-paciente"
            type="search"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando && <p>Cargando pacientes...</p>}

        {error && <p role="alert">{error}</p>}

        {!cargando && !error && pacientes.length === 0 && (
          <p className="pacientes-vacio">
            No hay pacientes activos registrados.
          </p>
        )}

        {!cargando &&
          !error &&
          pacientes.length > 0 &&
          pacientesFiltrados.length === 0 && (
            <p className="pacientes-vacio">
              No se encontraron pacientes con esa búsqueda.
            </p>
          )}

        {!cargando &&
          !error &&
          pacientesFiltrados.length > 0 && (
            <div className="pacientes-tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {pacientesFiltrados.map((paciente) => (
                    <tr key={paciente.id}>
                      <td>{paciente.nombre}</td>
                      <td>{paciente.apellido}</td>
                      <td>{paciente.dni}</td>
                      <td>{paciente.telefono}</td>

                      <td>
                        <button
                          type="button"
                          onClick={() => seleccionarPaciente(paciente)}
                          disabled={eliminandoId !== null}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => confirmarBaja(paciente)}
                          disabled={eliminandoId !== null}
                        >
                          {eliminandoId === paciente.id
                            ? 'Dando de baja...'
                            : 'Dar de baja'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* MODAL: REGISTRAR */}
      {mostrarAlta && (
        <Modal
          titulo="Registrar nuevo paciente"
          onCerrar={() => setMostrarAlta(false)}
        >
          <FormularioPaciente onCreado={agregarPaciente} />
        </Modal>
      )}

      {/* MODAL: EDITAR */}
      {pacienteEnEdicion && (
        <Modal
          titulo="Editar paciente"
          onCerrar={() => setPacienteEnEdicion(null)}
        >
          <FormularioEditarPaciente
            key={pacienteEnEdicion.id}
            paciente={pacienteEnEdicion}
            onGuardado={guardarPacienteActualizado}
            onCancelar={() => setPacienteEnEdicion(null)}
          />
        </Modal>
      )}

    </section>
  );
}

export default Pacientes;