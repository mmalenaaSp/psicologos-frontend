import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cargarDashboard, resumirTurnos } from '../src/services/dashboardService.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('el resumen excluye reservas pasadas, cancelaciones y horas inválidas; ordena las próximas', () => {
  const ahora = new Date('2026-11-01T02:00:00Z');
  const datos = [
    { id: 1, estado: 'RESERVADO', inicio: '2026-11-02T10:00:00-03:00' },
    { id: 2, estado: 'RESERVADO', inicio: '2026-10-31T23:30:00-03:00' },
    { id: 3, estado: 'RESERVADO', inicio: '2026-10-31T22:00:00-03:00' },
    { id: 4, estado: 'CANCELADO', inicio: '2026-11-03T10:00:00-03:00' },
    { id: 5, estado: 'DISPONIBLE', inicio: '2026-11-03T11:00:00-03:00' },
    { id: 6, estado: 'RESERVADO', inicio: 'inválido' },
    { id: 7, estado: 'RESERVADO', inicio: ahora.toISOString() },
  ];
  const resumen = resumirTurnos(datos, ahora);
  assert.deepEqual(resumen.reservas.map(t => t.id), [2, 1]);
  assert.equal(resumen.disponibles, 1);
  assert.equal(resumirTurnos(null), null);
  assert.equal(resumirTurnos([]).reservas.length, 0);
  assert.equal(datos[0].id, 1, 'No modificar el orden de datos de origen');
});
test('el paciente sólo consulta turnos con sesión, sin pedir catálogos privados ni enviar identidades', async () => {
  const solicitudes = [];
  globalThis.fetch = async (url, options) => { solicitudes.push({ url, options }); return new Response('[]'); };
  const datos = await cargarDashboard('PACIENTE');
  assert.equal(solicitudes.length, 1);
  assert.equal(new URL(solicitudes[0].url).pathname, '/api/turnos');
  assert.equal(new URL(solicitudes[0].url).search, '');
  assert.equal(solicitudes[0].options.credentials, 'include');
  assert.equal(datos.pacientes, null);
  assert.equal(datos.liquidaciones, null);
  assert.deepEqual(datos.turnos, []);
  await assert.rejects(cargarDashboard('ADMIN'), /Rol sin acceso/);
});
test('el profesional obtiene indicadores reales y conserva fallas parciales sin convertirlas en cero', async () => {
  const solicitudes = [];
  globalThis.fetch = async (url, options) => {
    solicitudes.push(url);
    assert.equal(options.credentials, 'include');
    if (url.includes('/liquidaciones')) return new Response('{"error":"Fallo de prueba"}', { status: 500 });
    return new Response(JSON.stringify(url.endsWith('/pacientes') ? [{ id: 11 }, { id: 12 }] : []));
  };
  const datos = await cargarDashboard('PSICOLOGO');
  assert.equal(datos.pacientes.length, 2);
  assert.deepEqual(datos.turnos, []);
  assert.equal(datos.liquidaciones, null);
  assert.deepEqual(datos.errores, ['No pudimos cargar las liquidaciones pendientes. Volvé a intentar.']);
  assert.ok(solicitudes.some(url => new URL(url).searchParams.get('estado') === 'PENDIENTE'));
  assert.ok(solicitudes.every(url => !/pacienteId|psicologoId/.test(url)));
});
test('una carga cancelada no devuelve un resumen que pueda restaurar datos de otra sesión', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => { assert.equal(options.signal, controller.signal); controller.abort(); return new Response('[]'); };
  await assert.rejects(cargarDashboard('PACIENTE', { signal: controller.signal }), { name: 'AbortError' });
});
