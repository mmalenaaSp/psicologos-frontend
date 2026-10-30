const API_URL = 'http://localhost:3000/api/psicologos';

// READ: Obtener todos los psicólogos activos
export async function obtenerPsicologos(signal) {
  let response;

  try {
    response = await fetch(API_URL, { signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'No se pudo conectar con el backend de PsycoGest.'
    );
  }

  const datos = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      datos?.error ||
      datos?.mensaje ||
      'No se pudieron obtener los psicólogos.'
    );
  }

  if (!Array.isArray(datos)) {
    throw new Error(
      'El backend devolvió un formato de listado inesperado.'
    );
  }

  return datos;
}

// CREATE: Registrar un nuevo psicólogo
export async function crearPsicologo(datosPsicologo) {
  let response;

  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosPsicologo)
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el backend de PsycoGest.'
    );
  }

  const datos = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      datos?.error ||
      datos?.mensaje ||
      'No se pudo registrar el psicólogo.'
    );
  }

  return datos;
}