import { useState } from 'react';
import { crearPaciente } from '../services/pacienteService';

function FormularioPaciente({ onCreado }) {
  const valoresIniciales = {
    dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fechaNacimiento: ''
  };

  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    setError('');
    setMensaje('');
    setGuardando(true);

    try {
      const nuevoPaciente = await crearPaciente(formulario);

      setMensaje('Paciente registrado correctamente');
      setFormulario(valoresIniciales);

      onCreado(nuevoPaciente);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={manejarEnvio}>
      <h3>Registrar nuevo paciente</h3>

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
        {guardando ? 'Guardando...' : 'Registrar paciente'}
      </button>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export default FormularioPaciente;