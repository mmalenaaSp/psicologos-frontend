
const API_URL = 'http://localhost:3000/api/psicologos';

// ==========================================
// FUNCIÓN AUXILIAR PARA SOLICITUDES HTTP
// ==========================================

async function solicitar(url, opciones = {}) {
  let response;

  try {
    response = await fetch(url, opciones);

  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'No se pudo conectar con el backend de PsycoGest.',
      { cause: error }
    );
  }

  const datos = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      datos?.error ||
      datos?.mensaje ||
      datos?.message ||
      `Error al comunicarse con el servidor (${response.status}).`
    );
  }

  return datos;
}


// ==========================================
// READ: OBTENER PSICÓLOGOS
// ==========================================

export async function obtenerPsicologos(signal) {
  const datos = await solicitar(API_URL, { signal });

  if (!Array.isArray(datos)) {
    throw new Error(
      'El backend devolvió un formato de listado inesperado.'
    );
  }

  return datos;
}


// ==========================================
// CREATE: REGISTRAR PSICÓLOGO
// ==========================================

export async function crearPsicologo(datosPsicologo) {
  return solicitar(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosPsicologo)
  });
}


// ==========================================
// UPDATE: ACTUALIZAR PSICÓLOGO
// ==========================================

export async function actualizarPsicologo(id, datosPsicologo) {
  return solicitar(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosPsicologo)
  });
}


// ==========================================
// DELETE: DAR DE BAJA PSICÓLOGO
// ==========================================

export async function darDeBajaPsicologo(id) {
  return solicitar(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
}
