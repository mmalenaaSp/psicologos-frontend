import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { API_BASE_URL, apiFetch, apiRequest } from '../src/services/api.js';
import { obtenerPacientes, crearPaciente, actualizarPaciente, darDeBajaPaciente } from '../src/services/pacienteService.js';
import { obtenerPsicologos, crearPsicologo, actualizarPsicologo, darDeBajaPsicologo } from '../src/services/psicologoService.js';
import { listarLugares, crearLugar, actualizarLugar, eliminarLugar } from '../src/services/lugarService.js';
import { listarTiposSesion, obtenerTipoSesion, crearTipoSesion, actualizarTipoSesion, eliminarTipoSesion } from '../src/services/tipoSesionService.js';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
afterEach(() => { globalThis.fetch = originalFetch; globalThis.window = originalWindow; });
function responder(data, status = 200) {
  globalThis.fetch = async () => new Response(status === 204 ? null : JSON.stringify(data), { status });
}
test('todas las operaciones CRUD usan la API configurada y envian cookies', async () => {
  const casos = [
    [obtenerPacientes, [], '/pacientes', 'GET', []],
    [crearPaciente, [{ nombre: 'Prueba' }], '/pacientes', 'POST', { id: 1 }],
    [actualizarPaciente, [1, { nombre: 'Cambio' }], '/pacientes/1', 'PUT', { id: 1 }],
    [darDeBajaPaciente, [1], '/pacientes/1', 'DELETE', {}],
    [obtenerPsicologos, [], '/psicologos', 'GET', []],
    [crearPsicologo, [{ nombre: 'Prueba' }], '/psicologos', 'POST', { id: 1 }],
    [actualizarPsicologo, [1, { nombre: 'Cambio' }], '/psicologos/1', 'PUT', { id: 1 }],
    [darDeBajaPsicologo, [1], '/psicologos/1', 'DELETE', {}],
    [listarLugares, [], '/lugares', 'GET', []],
    [crearLugar, [{ nombre: 'Prueba' }], '/lugares', 'POST', { id: 1 }],
    [actualizarLugar, [1, { nombre: 'Cambio' }], '/lugares/1', 'PUT', { id: 1 }],
    [eliminarLugar, [1], '/lugares/1', 'DELETE', {}],
    [listarTiposSesion, [], '/tipos-sesion', 'GET', []],
    [obtenerTipoSesion, [1], '/tipos-sesion/1', 'GET', { id: 1 }],
    [crearTipoSesion, [{ nombre: 'Prueba' }], '/tipos-sesion', 'POST', { id: 1 }],
    [actualizarTipoSesion, [1, { nombre: 'Cambio' }], '/tipos-sesion/1', 'PUT', { id: 1 }],
    [eliminarTipoSesion, [1], '/tipos-sesion/1', 'DELETE', {}],
  ];
  for (const [funcion, args, path, method, data] of casos) {
    let solicitud;
    globalThis.fetch = async (url, options) => {
      solicitud = { url, options };
      return new Response(JSON.stringify(data));
    };
    await funcion(...args);
    assert.equal(solicitud.url, `${API_BASE_URL}${path}`);
    assert.equal(solicitud.options.credentials, 'include');
    assert.equal(solicitud.options.method || 'GET', method);
    if (['POST', 'PUT'].includes(method)) {
      assert.equal(solicitud.options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(solicitud.options.body), args.at(-1));
    }
  }
});
test('401/403 protegidos solicitan verificar sesion; login rechazado queda en formulario', async () => {
  globalThis.window = new EventTarget();
  let invalidaciones = 0;
  window.addEventListener('psycogest:session-invalid', () => invalidaciones++);
  responder({ error: 'Sin acceso' }, 401);
  await apiFetch(`${API_BASE_URL}/pacientes`);
  assert.equal(invalidaciones, 1);
  await assert.rejects(apiRequest('/auth/login', { method: 'POST' }), /Sin acceso/);
  assert.equal(invalidaciones, 1);
  responder({ error: 'Sin permiso' }, 403);
  await apiFetch(`${API_BASE_URL}/lugares`);
  assert.equal(invalidaciones, 2);
});
test('mensajes del backend y respuestas 204 se conservan', async () => {
  responder({ error: 'Cuenta pendiente' }, 403);
  await assert.rejects(apiRequest('/auth/me'), /Cuenta pendiente/);
  responder(null, 204);
  assert.equal(await apiRequest('/auth/logout', { method: 'POST' }), null);
});
test('errores de red tienen mensaje comprensible y cancelaciones se preservan', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(apiRequest('/auth/me'), /No se pudo conectar/);
  const cancelacion = new DOMException('Cancelado', 'AbortError');
  globalThis.fetch = async () => { throw cancelacion; };
  await assert.rejects(apiFetch(`${API_BASE_URL}/pacientes`), error => error === cancelacion);
});
test('filtros de catalogos codifican caracteres y preservan los modelos', async () => {
  let urlSolicitada;
  globalThis.fetch = async url => {
    urlSolicitada = url;
    return new Response(JSON.stringify([{ id: 2, nombre: 'Test', precioBase: '123.45', direccion: 'Test' }]));
  };
  const lugares = await listarLugares(' Sala & A ');
  assert.equal(new URL(urlSolicitada).searchParams.get('filtro'), 'Sala & A');
  assert.equal(lugares[0].direccion, 'Test');
  const tipos = await listarTiposSesion(' Individual & A ');
  assert.equal(new URL(urlSolicitada).searchParams.get('nombre'), 'Individual & A');
  assert.equal(tipos[0].precioBase, 123.45);
});
