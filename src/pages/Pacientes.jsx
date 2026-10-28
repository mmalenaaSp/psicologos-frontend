import { useEffect, useState } from 'react';
import {
  obtenerPacientes,
  darDeBajaPaciente
} from '../services/pacienteService';

import FormularioPaciente from '../components/FormularioPaciente';
import FormularioEditarPaciente from '../components/FormularioEditarPaciente';

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [pacienteEnEdicion, setPacienteEnEdicion] = useState(null);

  // Estados para la baja de pacientes
  const [eliminandoId, setEliminandoId] = useState(null);
  const [errorBaja, setErrorBaja] = useState('');
  const [mensajeBaja, setMensajeBaja] = useState('');

  // READ: Obtener pacientes al cargar la pantalla
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

  // CREATE: Agregar el paciente al listado
  const agregarPaciente = (nuevoPaciente) => {
    setPacientes((anteriores) => [
      ...anteriores,
      nuevoPaciente
    ]);
  };

  // Seleccionar paciente para editar
  const seleccionarPaciente = (paciente) => {
    setPacienteEnEdicion(paciente);
  };

  // UPDATE: Actualizar los datos del paciente en el listado
  const guardarPacienteActualizado = (pacienteActualizado) => {
    setPacientes((anteriores) =>
      anteriores.map((paciente) =>
        paciente.id === pacienteActualizado.id
          ? pacienteActualizado
          : paciente
      )
    );

    setPacienteEnEdicion(null);
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setPacienteEnEdicion(null);
  };

  // DELETE: Dar de baja un paciente
  const confirmarBaja = async (paciente) => {
    if (eliminandoId !== null) return;

    // 1. Solicitar confirmación
    const confirmado = window.confirm(
      `¿Querés dar de baja a ${paciente.nombre} ${paciente.apellido}?\n\n` +
      'El paciente dejará de aparecer en el listado.'
    );

    // Si el usuario cancela, no hacemos nada
    if (!confirmado) return;

    setEliminandoId(paciente.id);
    setErrorBaja('');
    setMensajeBaja('');

    try {
      // 2. Enviar DELETE al backend
      await darDeBajaPaciente(paciente.id);

      // 3. Quitar el paciente del listado
      setPacientes((anteriores) =>
        anteriores.filter(
          (item) => item.id !== paciente.id
        )
      );

      // 4. Cerrar edición si estaba seleccionado
      setPacienteEnEdicion((anterior) =>
        anterior?.id === paciente.id ? null : anterior
      );

      // 5. Mostrar confirmación
      setMensajeBaja(
        'Paciente dado de baja correctamente'
      );

    } catch (err) {
      setErrorBaja(err.message);

    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <section>
      <h2>Gestión de Pacientes</h2>

      {/* CREATE */}
      <FormularioPaciente onCreado={agregarPaciente} />

      {/* UPDATE */}
      {pacienteEnEdicion && (
        <FormularioEditarPaciente
          key={pacienteEnEdicion.id}
          paciente={pacienteEnEdicion}
          onGuardado={guardarPacienteActualizado}
          onCancelar={cancelarEdicion}
        />
      )}

      {/* Mensajes de la baja */}
      {mensajeBaja && (
        <p role="status">{mensajeBaja}</p>
      )}

      {errorBaja && (
        <p role="alert">{errorBaja}</p>
      )}

      {/* Estados del listado */}
      {cargando && <p>Cargando pacientes...</p>}

      {error && <p role="alert">{error}</p>}

      {!cargando && !error && pacientes.length === 0 && (
        <p>No hay pacientes activos registrados.</p>
      )}

      {/* READ */}
      {!cargando && !error && pacientes.length > 0 && (
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
            {pacientes.map((paciente) => (
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
      )}
    </section>
  );
}

export default Pacientes;