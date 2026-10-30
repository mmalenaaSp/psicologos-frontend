import { useState } from 'react';
import { actualizarPsicologo } from '../services/psicologoService';

function FormularioEditarPsicologo({
  psicologo,
  onGuardado,
  onCancelar
}) {
  const [formulario, setFormulario] = useState({
    nroMatricula: psicologo.nroMatricula ?? '',
    nombre: psicologo.nombre ?? '',
    apellido: psicologo.apellido ?? '',
    telefono: psicologo.telefono ?? '',
    direccion: psicologo.direccion ?? '',
    email: psicologo.email ?? '',
    colegioId: String(psicologo.colegioId ?? '')
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const actualizarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  };

  const guardarCambios = async (evento) => {
    evento.preventDefault();

    if (guardando) return;

    setError('');

    const colegioId = Number(formulario.colegioId);

    if (!Number.isInteger(colegioId) || colegioId <= 0) {
      setError('Ingresá un ID de colegio válido.');
      return;
    }

    const datos = {
      nroMatricula: formulario.nroMatricula.trim(),
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      telefono: formulario.telefono.trim(),
      direccion: formulario.direccion.trim(),
      email: formulario.email.trim().toLowerCase(),
      colegioId
    };

    setGuardando(true);

    try {
      await actualizarPsicologo(psicologo.id, datos);
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form
      className="psicologos-formulario"
      onSubmit={guardarCambios}
    >
      <label>
        Número de matrícula *
        <input
          name="nroMatricula"
          value={formulario.nroMatricula}
          onChange={actualizarCampo}
          required
        />
      </label>

      <label>
        Nombre *
        <input
          name="nombre"
          value={formulario.nombre}
          onChange={actualizarCampo}
          required
        />
      </label>

      <label>
        Apellido
        <input
          name="apellido"
          value={formulario.apellido}
          onChange={actualizarCampo}
        />
      </label>

      <label>
        Teléfono
        <input
          type="tel"
          name="telefono"
          value={formulario.telefono}
          onChange={actualizarCampo}
        />
      </label>

      <label className="psicologos-campo-completo">
        Dirección
        <input
          name="direccion"
          value={formulario.direccion}
          onChange={actualizarCampo}
        />
      </label>

      <label className="psicologos-campo-completo">
        Email *
        <input
          type="email"
          name="email"
          value={formulario.email}
          onChange={actualizarCampo}
          required
        />
      </label>

      <label className="psicologos-campo-completo">
        ID del Colegio de Psicólogos *
        <input
          type="number"
          name="colegioId"
          min="1"
          step="1"
          value={formulario.colegioId}
          onChange={actualizarCampo}
          required
        />
      </label>

      {error && (
        <p role="alert" className="psicologos-error">
          {error}
        </p>
      )}

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
    </form>
  );
}

export default FormularioEditarPsicologo;