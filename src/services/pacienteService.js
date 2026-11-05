import { API_BASE_URL, apiFetch } from './api.js';
const API_URL = `${API_BASE_URL}/pacientes`;

export const obtenerPacientes = async (signal) => {
<<<<<<< HEAD
  const respuesta = await fetch(API_URL, { 
    signal,
    credentials: 'include' // <-- Envía las cookies de sesión al backend
  });
=======
  const respuesta = await apiFetch(API_URL, { signal });
>>>>>>> main

  if (!respuesta.ok) {
    throw new Error(
      `No se pudieron obtener los pacientes (${respuesta.status})`
    );
  }

  return respuesta.json();
};

export const crearPaciente = async (datosPaciente) => {
<<<<<<< HEAD
  const respuesta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // <-- Envía las cookies de sesión al backend
    body: JSON.stringify(datosPaciente)
  });
=======
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
>>>>>>> main

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
<<<<<<< HEAD
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // <-- Envía las cookies de sesión al backend
    body: JSON.stringify(datosPaciente)
  });
=======
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
>>>>>>> main

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
<<<<<<< HEAD
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include' // <-- Envía las cookies de sesión al backend
  });
=======
  const respuesta = await apiFetch(
    `${API_BASE_URL}/pacientes/${id}`,
    {
      method: 'DELETE'
    }
  );
>>>>>>> main

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'Error al dar de baja el paciente'
    );
  }

  return datos;
};
