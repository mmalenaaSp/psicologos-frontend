import { Lugar } from '../models/Lugar';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const RESOURCE_URL = `${API_BASE_URL}/lugares`;

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, {
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
  const url = new URL(RESOURCE_URL);
  if (filtro.trim()) url.searchParams.set('filtro', filtro.trim());
  const data = await request(url.toString());
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
