import { useState, useEffect } from 'react';
import { crearPaciente } from '../services/pacienteService';
import { obtenerMiPerfilProfesional } from '../services/perfilProfesionalService';

function FormularioPaciente({ onCreado }) {
  const valoresIniciales = {
    dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fechaNacimiento: '',
    obraSocialId: ''
  };

  const [formulario, setFormulario] = useState(valoresIniciales);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [cargandoObras, setCargandoObras] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    // Obtenemos el perfil privado del psicólogo logueado para cargar sus obras sociales asignadas
    obtenerMiPerfilProfesional({ signal: controller.signal })
      .then((datos) => {
        if (!controller.signal.aborted) {
          const idsSeleccionados = datos.perfil?.obrasSocialesIds || [];
          const disponibles = datos.obrasSocialesDisponibles || [];

          // Filtramos el catálogo global según lo que el profesional atiende
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

      if (onCreado) {
        onCreado(nuevoPaciente);
      }
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
        {guardando ? 'Guardando...' : 'Registrar paciente'}
      </button>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export default FormularioPaciente;