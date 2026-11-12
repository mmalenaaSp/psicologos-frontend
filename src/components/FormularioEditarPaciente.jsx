import { useState, useEffect } from 'react';
import { actualizarPaciente } from '../services/pacienteService';
import { obtenerMiPerfilProfesional } from '../services/perfilProfesionalService';

function FormularioEditarPaciente({
  paciente,
  onGuardado,
  onCancelar
}) {
  // 1. Cargar los datos actuales del paciente
  const [formulario, setFormulario] = useState({
    dni: paciente?.dni || '',
    nombre: paciente?.nombre || '',
    apellido: paciente?.apellido || '',
    telefono: paciente?.telefono || '',
    fechaNacimiento: paciente?.fechaNacimiento ? paciente.fechaNacimiento.slice(0, 10) : '',
    obraSocialId: paciente?.obraSocialId ? String(paciente.obraSocialId) : ''
  });

  const [obrasSociales, setObrasSociales] = useState([]);
  const [cargandoObras, setCargandoObras] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // 2. Cargar las Obras Sociales que atiende el psicólogo logueado
  useEffect(() => {
    const controller = new AbortController();

    obtenerMiPerfilProfesional({ signal: controller.signal })
      .then((datos) => {
        if (!controller.signal.aborted) {
          const idsSeleccionados = datos.perfil?.obrasSocialesIds || [];
          const disponibles = datos.obrasSocialesDisponibles || [];

          // Filtramos el catálogo dejando solo las obras que atiende este profesional
          const asignadas = disponibles.filter((os) => idsSeleccionados.includes(os.id));
          setObrasSociales(asignadas);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error('Error al cargar obras sociales del perfil:', err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoObras(false);
      });

    return () => controller.abort();
  }, []);

  // 3. Actualizar los valores mientras escribimos
  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  };

  // 4. Enviar los cambios al backend
  const manejarEnvio = async (e) => {
    e.preventDefault();

    setError('');
    setGuardando(true);

    try {
      const pacienteActualizado = await actualizarPaciente(
        paciente.id,
        formulario
      );

      onGuardado(pacienteActualizado);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={manejarEnvio}>
      <h3>Editar paciente</h3>

      <label>
        DNI
        <input
          type="text"
          name="dni"
          value={formulario.dni}
          onChange={manejarCambio}
          required
        />
      </label>

      <label>
        Nombre
        <input
          type="text"
          name="nombre"
          value={formulario.nombre}
          onChange={manejarCambio}
          required
        />
      </label>

      <label>
        Apellido
        <input
          type="text"
          name="apellido"
          value={formulario.apellido}
          onChange={manejarCambio}
          required
        />
      </label>

      <label>
        Teléfono
        <input
          type="tel"
          name="telefono"
          value={formulario.telefono}
          onChange={manejarCambio}
          required
        />
      </label>

      <label>
        Fecha de nacimiento
        <input
          type="date"
          name="fechaNacimiento"
          value={formulario.fechaNacimiento}
          onChange={manejarCambio}
          required
        />
      </label>

      <label>
        Obra Social
        <select
          name="obraSocialId"
          value={formulario.obraSocialId}
          onChange={manejarCambio}
          disabled={cargandoObras}
        >
          <option value="">Sin obra social (Particular)</option>
          {obrasSociales.map((os) => (
            <option key={os.id} value={os.id}>
              {os.nombre} ({os.codigo})
            </option>
          ))}
        </select>
        {obrasSociales.length === 0 && !cargandoObras && (
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
            No tenés obras sociales seleccionadas en tu perfil profesional.
          </p>
        )}
      </label>

      <button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>

      <button
        type="button"
        onClick={onCancelar}
        disabled={guardando}
      >
        Cancelar
      </button>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export default FormularioEditarPaciente;