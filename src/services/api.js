export const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export async function apiFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, credentials: 'include' });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Revisá que el backend esté iniciado.', { cause: error });
  }
  if (response.status === 401 || response.status === 403) {
    // Auth errors are shown by the login form; protected requests recheck the session.
    if (!String(url).includes('/auth/')) window.dispatchEvent(new Event('psycogest:session-invalid'));
  }
  return response;
}

export async function apiRequest(path, options = {}) {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Error del servidor (${response.status}).`);
  return data;
}
