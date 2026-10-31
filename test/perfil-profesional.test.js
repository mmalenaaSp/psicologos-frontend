import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fotoPublicaSegura, inicialesProfesional, modalidadProfesional, obtenerMiPerfilProfesional, guardarMiPerfilProfesional, obtenerPerfilProfesionalPublico } from '../src/services/perfilProfesionalService.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
test('fotos públicas sólo aceptan HTTPS sin credenciales; las URLs inválidas usan avatar', () => {
  for (const url of [null, '', 'no-url', 'http://example.test/foto.png', 'javascript:alert(1)', 'data:image/svg+xml,x', 'https://user:password@example.test/foto.png', 'https://example.test/' + 'x'.repeat(2048)]) assert.equal(fotoPublicaSegura(url), null);
  assert.equal(fotoPublicaSegura('https://example.test/foto.png'), 'https://example.test/foto.png');
});
test('iniciales y modalidades reflejan el perfil sin inventar un título o verificación', () => {
  assert.equal(inicialesProfesional(' Ana ', ' Pérez '), 'AP');
  assert.equal(inicialesProfesional('Érica', ''), 'É');
  assert.equal(inicialesProfesional(null, null), 'P');
  assert.equal(modalidadProfesional('AMBAS'), 'Presencial y virtual');
  assert.equal(modalidadProfesional('VIRTUAL'), 'Virtual');
  assert.equal(modalidadProfesional(null), 'Modalidad a consultar');
});
test('edición privada usa la sesión y PATCH; detalle público usa el endpoint de sólo lectura', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => { requests.push({ url, options }); return new Response(JSON.stringify({ perfil: { tituloProfesional: 'Licenciada' } })); };
  const controller = new AbortController();
  await obtenerMiPerfilProfesional({ signal: controller.signal });
  await guardarMiPerfilProfesional({ tituloProfesional: 'Licenciada', aceptaReintegro: true });
  await obtenerPerfilProfesionalPublico(13, { signal: controller.signal });
  assert.ok(requests[0].url.endsWith('/mi-perfil/profesional'));
  assert.equal(requests[0].options.signal, controller.signal);
  assert.equal(requests[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(requests[1].options.body), { tituloProfesional: 'Licenciada', aceptaReintegro: true });
  assert.ok(requests[2].url.endsWith('/profesionales/13'));
  assert.ok(requests.every(r => r.options.credentials === 'include'));
  assert.ok(requests.every(r => !/pacienteId|psicologoId/.test(r.url)));
});
