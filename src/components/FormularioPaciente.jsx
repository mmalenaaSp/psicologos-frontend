import { useState, useEffect } from 'react';
import { crearPaciente } from '../services/pacienteService';

function FormularioPaciente({ onCreado }) {
  const valoresIniciales = {
    dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fechaNacimiento: '',
    obraSocialId: '' // <-- Agregado para enviar la OS seleccionada
  };

  const [formulario, setFormulario] = useState(valoresIniciales);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Cargar el listado de Obras Sociales al montar el componente
  useEffect(() => {
    const cargarObrasSociales = async () => {
      try {
        const respuesta = await fetch('http://localhost:3000/api/obras-sociales', {
          credentials: 'include'
        });
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setObrasSociales(datos);
        }
      } catch (err) {
        console.error('Error al obtener obras sociales:', err);
      }
    };

    cargarObrasSociales();
  }, []);

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
      // Si la obra social se deja vacía, se envía null para que no rompa la FK
      const datosAEnviar = {
        ...formulario,
        obraSocialId: formulario.obraSocialId ? Number(formulario.obraSocialId) : null
      };

      const nuevoPaciente = await crearPaciente(datosAEnviar);

      setMensaje('Paciente registrado correctamente');
      setFormulario(valoresIniciales);

      if (onCreado) onCreado(nuevoPaciente);
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
        Obra Social
        <select
          name="obraSocialId"
          value={formulario.obraSocialId}
          onChange={manejarCambio}
        >
          <option value="">Sin obra social</option>
          {obrasSociales.map((os) => (
            <option key={os.id} value={os.id}>
              {os.nombre}
            </option>
          ))}
        </select>
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