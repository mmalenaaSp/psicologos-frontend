import { apiRequest } from './api.js';
export const obtenerMiPerfilProfesional = options => apiRequest('/mi-perfil/profesional', options);
export const guardarMiPerfilProfesional = datos => apiRequest('/mi-perfil/profesional', { method: 'PATCH', body: JSON.stringify(datos) });
export const obtenerPerfilProfesionalPublico = (id, options) => apiRequest(`/profesionales/${encodeURIComponent(id)}`, options);

export function fotoPublicaSegura(valor) {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > 2048) return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function inicialesProfesional(nombre, apellido) {
  return [nombre, apellido].map(v => typeof v === 'string' ? Array.from(v.trim())[0] || '' : '').join('').toLocaleUpperCase('es-AR') || 'P';
}
export function modalidadProfesional(valor) {
  return ({ VIRTUAL: 'Virtual', PRESENCIAL: 'Presencial', AMBAS: 'Presencial y virtual' })[valor] || 'Modalidad a consultar';
}
