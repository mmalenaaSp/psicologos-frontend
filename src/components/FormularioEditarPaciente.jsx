import { useState } from 'react';
import { actualizarPaciente } from '../services/pacienteService';

function FormularioEditarPaciente({
  paciente,
  onGuardado,
  onCancelar
}) {
  // 1. Cargar los datos actuales del paciente
  const [formulario, setFormulario] = useState({
    dni: paciente.dni,
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    telefono: paciente.telefono,
    fechaNacimiento: paciente.fechaNacimiento.slice(0, 10)
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // 2. Actualizar los valores mientras escribimos
  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  };

  // 3. Enviar los cambios al backend
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