import { useState } from 'react';
import { crearPsicologo } from '../services/psicologoService';

const FORMULARIO_VACIO = {
  nroMatricula: '',
  nombre: '',
  apellido: '',
  telefono: '',
  direccion: '',
  email: '',
  password: '',
  colegioId: ''
};

function FormularioPsicologo({ onCreado }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const actualizarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  };

  const registrarPsicologo = async (evento) => {
    evento.preventDefault();

    if (guardando) return;

    setError('');

    const colegioId = Number(formulario.colegioId);

    if (!Number.isInteger(colegioId) || colegioId <= 0) {
      setError('Seleccioná un colegio válido.');
      return;
    }

    const datos = {
      nroMatricula: formulario.nroMatricula.trim(),
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      telefono: formulario.telefono.trim(),
      direccion: formulario.direccion.trim(),
      email: formulario.email.trim().toLowerCase(),
      password: formulario.password,
      colegioId
    };

    setGuardando(true);

    try {
      await crearPsicologo(datos);

      // El registro fue exitoso
      onCreado();

    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form
      className="psicologos-formulario"
      onSubmit={registrarPsicologo}
    >
      <label>
        Número de matrícula *
        <input
          type="text"
          name="nroMatricula"
          value={formulario.nroMatricula}
          onChange={actualizarCampo}
          required
          maxLength={50}
        />
      </label>

      <label>
        Nombre *
        <input
          type="text"
          name="nombre"
          value={formulario.nombre}
          onChange={actualizarCampo}
          required
          maxLength={100}
          autoComplete="given-name"
        />
      </label>

      <label>
        Apellido
        <input
          type="text"
          name="apellido"
          value={formulario.apellido}
          onChange={actualizarCampo}
          autoComplete="family-name"
        />
      </label>

      <label>
        Teléfono
        <input
          type="tel"
          name="telefono"
          value={formulario.telefono}
          onChange={actualizarCampo}
          autoComplete="tel"
        />
      </label>

      <label className="psicologos-campo-completo">
        Dirección
        <input
          type="text"
          name="direccion"
          value={formulario.direccion}
          onChange={actualizarCampo}
          autoComplete="street-address"
        />
      </label>

      <label>
        Email *
        <input
          type="email"
          name="email"
          value={formulario.email}
          onChange={actualizarCampo}
          required
          autoComplete="email"
        />
      </label>

      <label>
        Contraseña inicial *
        <input
          type="password"
          name="password"
          value={formulario.password}
          onChange={actualizarCampo}
          required
          minLength={8}
          autoComplete="new-password"
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
          placeholder="ID de un colegio existente"
        />
      </label>

      {error && (
        <p role="alert" className="psicologos-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
      >
        {guardando
          ? 'Registrando...'
          : 'Registrar psicólogo'}
      </button>
    </form>
  );
}

export default FormularioPsicologo;