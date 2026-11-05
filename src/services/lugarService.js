import { API_BASE_URL, apiFetch } from './api.js';
import { Lugar } from '../models/Lugar.js';

const RESOURCE_URL = `${API_BASE_URL}/lugares`;

async function request(url, options) {
  let response;
  try {
    response = await apiFetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
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

export async function listarLugares(filtro = '') {
  const query = new URLSearchParams();
  if (filtro.trim()) query.set('filtro', filtro.trim());
  const data = await request(`${RESOURCE_URL}${query.size ? `?${query}` : ''}`);
  return data.map(Lugar.fromApi);
}

export async function crearLugar(datos) {
  return Lugar.fromApi(await request(RESOURCE_URL, {
    method: 'POST',
    body: JSON.stringify(datos)
  }));
}

export async function actualizarLugar(id, datos) {
  return Lugar.fromApi(await request(`${RESOURCE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  }));
}

export async function eliminarLugar(id) {
  return request(`${RESOURCE_URL}/${id}`, { method: 'DELETE' });
}
