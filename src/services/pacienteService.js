const API_URL = 'http://localhost:3000/api/pacientes';

export const obtenerPacientes = async (signal) => {
  const respuesta = await fetch(API_URL, { 
    signal,
    credentials: 'include'
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudieron obtener los pacientes (${respuesta.status})`);
  }

  return respuesta.json();
};

export const crearPaciente = async (datosPaciente) => {
  const payload = {
    ...datosPaciente,
    obraSocialId: datosPaciente.obraSocialId ? Number(datosPaciente.obraSocialId) : null
  };

  const respuesta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al crear el paciente');
  }

  return datos;
};

export const actualizarPaciente = async (id, datosPaciente) => {
  const payload = {
    ...datosPaciente,
    obraSocialId: datosPaciente.obraSocialId ? Number(datosPaciente.obraSocialId) : null
  };

  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al actualizar el paciente');
  }

  return datos;
};

export const darDeBajaPaciente = async (id) => {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al dar de baja el paciente');
  }

  return datos;
};