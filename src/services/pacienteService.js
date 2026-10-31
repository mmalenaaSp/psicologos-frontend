import { API_BASE_URL, apiFetch } from './api.js';
const API_URL = `${API_BASE_URL}/pacientes`;

export const obtenerPacientes = async (signal) => {
  const respuesta = await apiFetch(API_URL, { signal });

  if (!respuesta.ok) {
    throw new Error(
      `No se pudieron obtener los pacientes (${respuesta.status})`
    );
  }

  return respuesta.json();
};

export const crearPaciente = async (datosPaciente) => {
  const respuesta = await apiFetch(
    `${API_BASE_URL}/pacientes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosPaciente)
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'Error al crear el paciente'
    );
  }

  return datos;
};

// UPDATE: Actualizar un paciente existente
export const actualizarPaciente = async (id, datosPaciente) => {
  const respuesta = await apiFetch(
    `${API_BASE_URL}/pacientes/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosPaciente)
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'Error al actualizar el paciente'
    );
  }

  return datos;
};

// DELETE: Dar de baja lógicamente a un paciente
export const darDeBajaPaciente = async (id) => {
  const respuesta = await apiFetch(
    `${API_BASE_URL}/pacientes/${id}`,
    {
      method: 'DELETE'
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'Error al dar de baja el paciente'
    );
  }

  return datos;
};