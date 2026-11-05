import { API_BASE_URL, apiFetch } from './api.js';
import { TipoSesion } from '../models/TipoSesion.js';

const RESOURCE_URL = `${API_BASE_URL}/tipos-sesion`;

async function request(url, options) {
  let response;
  try {
    response = await apiFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisá que el backend esté iniciado.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Ocurrió un error al comunicarse con el servidor.');
  }
  return data;
}

export async function listarTiposSesion(nombre = '') {
  const query = new URLSearchParams();
  if (nombre.trim()) query.set('nombre', nombre.trim());
  const data = await request(`${RESOURCE_URL}${query.size ? `?${query}` : ''}`);
  return data.map(TipoSesion.fromApi);
}

export async function obtenerTipoSesion(id) {
  const data = await request(`${RESOURCE_URL}/${id}`);
  return TipoSesion.fromApi(data);
}

export async function crearTipoSesion(datos) {
  const data = await request(RESOURCE_URL, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
  return TipoSesion.fromApi(data);
}

export async function actualizarTipoSesion(id, datos) {
  const data = await request(`${RESOURCE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
  return TipoSesion.fromApi(data);
}

export async function eliminarTipoSesion(id) {
  return request(`${RESOURCE_URL}/${id}`, { method: 'DELETE' });
}
