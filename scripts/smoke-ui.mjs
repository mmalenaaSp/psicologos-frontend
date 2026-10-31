import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, resolve, extname, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const browser = [
  process.env.PSYCOGEST_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].find(path => path && existsSync(path));
assert.ok(browser, 'Instalá Edge/Chrome o configurá PSYCOGEST_BROWSER.');
const artifacts = join(repo, '.test-artifacts');
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, 'ui-'));
const output = join(temporary, 'dist');
const accounts = new Map();
const sessions = new Map();
const requests = [];
const dashboardFixtures = new Map();
const dashboardFailures = new Set();
const publicSlots = new Map();
const publicPlace = { id: 51, nombre: 'Consultorio público ficticio', direccion: 'Calle pública ficticia 789' };
const publicCoverage = { id: 61, nombre: 'Cobertura pública ficticia' };
const publicDefaults = { fotoUrl: null, tituloProfesional: null, enfoqueProfesional: null, descripcionPublica: null, dirigidoA: null, idiomas: null, modalidadPublica: null, aceptaReintegro: false, lugaresIds: [] };
const exceptions = [];
let child;
let socket;
let server;
let nextUser = 1;
let sequence = 0;
let nextCommand = 0;
const pending = new Map();

function json(response, data, status = 200, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  response.end(status === 204 ? undefined : JSON.stringify(data));
}
function publicUser(account) {
  return { nombre: account.perfil?.nombre ?? null, apellido: account.perfil?.apellido ?? null, id: account.id, email: account.email, rol: account.rol, perfilCompleto: !!account.perfil,
    psicologoId: account.rol === 'PSICOLOGO' && account.perfil ? account.perfil.id : null,
    pacienteId: account.rol === 'PACIENTE' && account.perfil ? account.perfil.id : null };
}
function publicProfessional(account) {
  const profile = account.profesionalPublico || publicDefaults;
  const { lugaresIds, ...fields } = profile;
  return { id: account.perfil.id, nombre: account.perfil.nombre, apellido: account.perfil.apellido,
    nroMatricula: account.perfil.nroMatricula, ...fields, obrasSociales: [publicCoverage],
    lugares: lugaresIds.includes(publicPlace.id) ? [publicPlace] : [],
    turnos: (publicSlots.get(account.perfil.id) || []).filter(turno => turno.estado === 'DISPONIBLE') };
}
async function handle(request, response) {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path.startsWith('/api/')) {
    let text = '';
    for await (const part of request) text += part.toString();
    const data = text ? JSON.parse(text) : {};

    const session = /(?:^|;\s*)smoke-session=([^;]+)/.exec(request.headers.cookie || '')?.[1];
    const account = sessions.get(session);
    requests.push({ path, query: new URL(request.url, 'http://localhost').search, method: request.method, data, role: account?.rol, account: account?.email });
    if (path === '/api/auth/register') {
      if (accounts.has(data.email)) return json(response, { error: 'La cuenta ya existe.' }, 409);
      accounts.set(data.email, { id: nextUser++, ...data, perfil: null });
      return json(response, { mensaje: 'Cuenta creada.' }, 201);
    }
    if (path === '/api/auth/login') {
      const registered = accounts.get(data.email);
      if (!registered || registered.password !== data.password) return json(response, { error: 'Credenciales inválidas.' }, 401);
      const token = String(++sequence);
      sessions.set(token, registered);
      return json(response, { usuario: publicUser(registered) }, 200, { 'Set-Cookie': 'smoke-session=' + token + '; HttpOnly; SameSite=Lax; Path=/' });
    }
    if (path === '/api/auth/logout') {
      sessions.delete(session);
      return json(response, null, 204, { 'Set-Cookie': 'smoke-session=; HttpOnly; Max-Age=0; Path=/' });
    }
    const professionals = [...accounts.values()].filter(a => a.rol === 'PSICOLOGO' && a.perfil && a.profesionalPublico);
    if (path === '/api/profesionales/opciones') return json(response, { obrasSociales: professionals.length ? [publicCoverage] : [], tiposSesion: [] });
    if (path === '/api/profesionales') return json(response, professionals.map(publicProfessional).filter(p => p.turnos.length));
    const professionalPath = /^\/api\/profesionales\/(\d+)(\/disponibilidad)?$/.exec(path);
    if (professionalPath) {
      const professional = professionals.find(a => a.perfil.id === Number(professionalPath[1]));
      if (!professional) return json(response, { error: 'Profesional no encontrado.' }, 404);
      const profile = publicProfessional(professional);
      return json(response, professionalPath[2] ? profile.turnos : profile);
    }
    if (!account) return json(response, { error: 'Iniciá sesión.' }, 401);
    if (path === '/api/auth/me') return json(response, { usuario: publicUser(account) });
    if (path === '/api/mi-perfil/profesional') {
      if (account.rol !== 'PSICOLOGO' || !account.perfil) return json(response, { error: 'Sin permiso.' }, 403);
      if (request.method === 'PATCH') {
        account.profesionalPublico = { ...publicDefaults, ...account.profesionalPublico, ...data };
        if (!publicSlots.has(account.perfil.id)) {
          const fecha = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
          publicSlots.set(account.perfil.id, [{ id: 501, fecha, horaIni: '14:00', horaFin: '15:00', inicio: fecha + 'T17:00:00Z', estado: 'DISPONIBLE', modalidad: 'PRESENCIAL', tipoSesion: { id: 71, nombre: 'Sesión pública ficticia' }, lugar: publicPlace, psicologo: { nombre: account.perfil.nombre, apellido: account.perfil.apellido } }]);
        }
      }
      return json(response, { perfil: account.profesionalPublico || publicDefaults, lugaresDisponibles: [publicPlace] });
    }
    if (path === '/api/mi-perfil/opciones') return json(response, { colegios: account.colegio ? [account.colegio] : [], obrasSociales: [] });
    if (path === '/api/mi-perfil') {
      if (request.method === 'PUT') {
        if (data.colegio) account.colegio = { id: account.id, ...data.colegio };
        account.perfil = { id: account.id, ...data, ...(account.colegio ? { colegioId: account.colegio.id } : {}) };
      }
      return json(response, { usuario: publicUser(account), perfil: account.perfil });
    }
    const reservationPath = /^\/api\/turnos\/(\d+)\/reservar$/.exec(path);
    if (reservationPath && request.method === 'POST') {
      if (account.rol !== 'PACIENTE' || !account.perfil) return json(response, { error: 'Sin permiso.' }, 403);
      const slot = [...publicSlots.values()].flat().find(t => t.id === Number(reservationPath[1]));
      if (!slot || slot.estado !== 'DISPONIBLE') return json(response, { error: 'Ese horario ya no está disponible.' }, 409);
      slot.estado = 'RESERVADO';
      const previous = dashboardFixtures.get(account.email) || {};
      dashboardFixtures.set(account.email, { ...previous, turnos: [...(previous.turnos || []), { ...slot, paciente: { nombre: account.perfil.nombre, apellido: account.perfil.apellido } }] });
      return json(response, slot);
    }
    if (path === '/api/turnos') return json(response, dashboardFixtures.get(account.email)?.turnos || []);
    if (path === '/api/turnos/opciones') return json(response, { tiposSesion: [], lugares: [], obrasSociales: [], obrasSocialesIds: [] });
    if (path === '/api/liquidaciones') {
      if (dashboardFailures.has(account.email)) return json(response, { error: 'Fallo ficticio' }, 500);
      return json(response, dashboardFixtures.get(account.email)?.liquidaciones || []);
    }
    if (account.rol !== 'PSICOLOGO' || !account.perfil) return json(response, { error: 'Sin permiso.' }, 403);
    if (path === '/api/pacientes') return json(response, dashboardFixtures.get(account.email)?.pacientes || []);
    if (['/api/lugares', '/api/tipos-sesion'].includes(path)) return json(response, []);
    return json(response, { error: 'Ruta no simulada.' }, 404);
  }
  const relative = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
  const file = resolve(output, relative);
  if (file !== output && !file.startsWith(output + sep)) return json(response, {}, 404);
  try {
    const content = await readFile(file);
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end();
  }
}
function command(method, params = {}) {
  return new Promise((resolveCommand, reject) => {
    const id = ++nextCommand;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP agotó el tiempo: ' + method)); }, 10000);
    pending.set(id, { resolve: resolveCommand, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.result.description);
  return result.result.value;
}
async function until(check, description) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(50);
  }
  const body = socket?.readyState === 1 ? await evaluate('document.body.innerText') : '';
  throw new Error('No se encontró ' + description + '. Pantalla: ' + body);
}
const visible = text => until(() => evaluate('document.body.innerText.includes(' + JSON.stringify(text) + ')'), text);
async function click(text) {
  await until(() => evaluate("[...document.querySelectorAll('button')].some(b => b.textContent.trim() === " + JSON.stringify(text) + " && !b.disabled)"), 'botón ' + text);
  await evaluate("(() => { const buttons = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === " + JSON.stringify(text) + " && !b.disabled); const b = buttons.find(b => b.type === 'submit') || buttons[0]; if (!b) throw new Error('Botón no encontrado'); b.click(); })()");
}
async function fill(id, value) {
  await evaluate("(() => { const el = document.getElementById(" + JSON.stringify(id) + "); if (!el) throw new Error('Campo no encontrado'); const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, " + JSON.stringify(value) + "); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()");
}
async function credentials(email) {
  await fill('ps-correo', email);
  await fill('ps-password', 'Contraseña-ficticia-123!');
}
async function register(role, email) {
  await click('Iniciar sesión');
  await click('Registrate');
  await fill('rol-registro', role);
  await credentials(email);
  await click('Crear cuenta e ingresar');
  await visible('Completá tu perfil');
  assert.equal(await evaluate("!!document.querySelector('.pg-sidebar')"), false, 'Perfil incompleto no debe mostrar CRUD');
}

async function dashboardVisible() {
  await until(() => evaluate("document.querySelector('main h1, main h2')?.textContent === 'Inicio' && !!document.querySelector('.pg-dashboard') && document.querySelector('.pg-nav-active')?.textContent === 'Inicio'"), 'dashboard de Inicio');
  await until(() => evaluate("document.querySelector('.pg-dashboard-metricas')?.getAttribute('aria-busy') === 'false'"), 'resumen cargado');
}
async function volverPorLogo({ publico = false, parte = 'nombre', tecla, nombre, email } = {}) {
  const selector = publico ? '.ps-inicio-brand-home' : '.pg-brand-home';
  const childSelector = publico ? (parte === 'simbolo' ? '.ps-inicio-logo' : 'span:last-child') : (parte === 'simbolo' ? '.pg-brand-logo' : '.pg-brand-name');
  const info = await evaluate("(() => { const b = document.querySelector(" + JSON.stringify(selector) + "); return b && { tag: b.tagName, type: b.type, label: b.getAttribute('aria-label'), tabIndex: b.tabIndex, nested: b.querySelectorAll('button, a').length, cursor: getComputedStyle(b).cursor }; })()");
  assert.deepEqual(info, { tag: 'BUTTON', type: 'button', label: publico ? 'PsycoGest: ir a la página pública' : 'PsycoGest: ir a Inicio', tabIndex: 0, nested: 0, cursor: 'pointer' }, 'Logo completo accesible');
  const marker = 'logo-' + Date.now();
  await evaluate('window.__psycoGestLogoSmoke = ' + JSON.stringify(marker));
  const timeOrigin = await evaluate('performance.timeOrigin');
  const authBefore = requests.filter(req => /^\/api\/auth\/(me|login|logout)$/.test(req.path)).length;
  const requestIndex = requests.length;
  const point = await evaluate("(() => { const r = document.querySelector(" + JSON.stringify(selector + ' ' + childSelector) + ").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()");
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  const nameSelector = selector + (publico ? ' > span:last-child' : ' .pg-brand-name');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(' + JSON.stringify(nameSelector) + ')).textDecorationLine.includes("underline")'), true, 'Logo con estado hover');
  if (tecla) {
    await evaluate('document.querySelector(' + JSON.stringify(selector) + ').focus()');
    for (const modifiers of [0, 8]) {
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers });
    }
    assert.equal(await evaluate("(() => { const b = document.querySelector(" + JSON.stringify(selector) + "); const s = getComputedStyle(b); return document.activeElement === b && b.matches(':focus-visible') && s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0; })()"), true, 'Foco visible del logo');
    const key = tecla === 'Espacio' ? { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' } : { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' };
    await command('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
  } else {
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  }
  if (publico) await until(() => evaluate("!!document.querySelector('.ps-inicio-about') && !document.querySelector('.pg-sidebar')"), 'landing mediante logo (' + parte + ', ' + (tecla || 'clic') + ')');
  else { await dashboardVisible(); await visible('Hola, ' + nombre + '!'); }
  assert.equal(await evaluate('window.__psycoGestLogoSmoke'), marker, 'Logo sin recargar la aplicacion');
  assert.equal(await evaluate('performance.timeOrigin'), timeOrigin, 'Logo mantiene el documento');
  assert.equal(requests.filter(req => /^\/api\/auth\/(me|login|logout)$/.test(req.path)).length, authBefore, 'Logo no reinicia ni cierra sesion');
  if (email) assert.equal(requests.slice(requestIndex).some(req => req.account && req.account !== email), false, 'Logo conserva identidad autenticada');
}

async function clickDashboardAccess(titulo) {
  await evaluate("(() => { const b = [...document.querySelectorAll('.pg-dashboard-acceso')].find(b => b.querySelector('strong')?.textContent === " + JSON.stringify(titulo) + "); if (!b) throw new Error('Acceso no encontrado'); b.click(); })()");
}
function fixtureTurnos(rol) {
  const fecha = new Date(Date.now() + 3 * 86400000).toISOString().slice(0,10);
  const persona = rol === 'PACIENTE' ? 'Profesional de mi reserva' : 'Paciente de mi reserva';
  const slot = { id: 100, fecha, horaIni: '10:00', horaFin: '11:00', inicio: fecha + 'T13:00:00Z', estado: 'RESERVADO', modalidad: 'VIRTUAL', tipoSesion: { id: 1, nombre: 'Sesión ficticia' }, psicologo: { nombre: persona, apellido: 'Ficticio' }, paciente: rol === 'PSICOLOGO' ? { nombre: persona, apellido: 'Ficticio' } : undefined };
  return [
    { ...slot, id: 104, horaIni: '12:00', horaFin: '13:00', inicio: fecha + 'T15:00:00Z' }, slot,
    { ...slot, id: 101, fecha: '2000-01-01', inicio: '2000-01-01T13:00:00Z', tipoSesion: { nombre: 'PASADO EXCLUIDO' } },
    { ...slot, id: 102, estado: 'CANCELADO', tipoSesion: { nombre: 'CANCELADO EXCLUIDO' } },
    { ...slot, id: 103, estado: 'DISPONIBLE', tipoSesion: { nombre: 'LIBRE EXCLUIDO' } },
  ];
}
async function comprobarAgendaDashboard() {
  assert.equal(await evaluate("document.querySelectorAll('.pg-dashboard-lista li').length"), 2);
  assert.equal(await evaluate("document.querySelector('.pg-dashboard-turno-info > span')?.textContent.startsWith('10:00')"), true, 'Orden cronológico');
  assert.equal(await evaluate("/PASADO EXCLUIDO|CANCELADO EXCLUIDO|LIBRE EXCLUIDO/.test(document.querySelector('.pg-dashboard').innerText)"), false);
}
async function comprobarResponsiveDashboard() {
  await command('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Dashboard sin desbordamiento móvil');
  await command('Emulation.clearDeviceMetricsOverride');
}

async function testMenu(nombre) {
  await visible('Hola, ' + nombre + '!');
  assert.equal(await evaluate("!!document.querySelector('.pg-user-dropdown')"), false);
  await evaluate("document.querySelector('.pg-profile-trigger').click()");
  assert.equal(await evaluate("document.querySelector('.pg-profile-trigger').getAttribute('aria-expanded')"), 'true');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  assert.equal(await evaluate("!!document.querySelector('.pg-user-dropdown')"), false);
  await evaluate("document.querySelector('.pg-profile-trigger').click()");
  await evaluate("document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))");
  assert.equal(await evaluate("!!document.querySelector('.pg-user-dropdown')"), false);
  await evaluate("document.querySelector('.pg-profile-trigger').focus()");
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown' });
  await until(() => evaluate("document.activeElement?.textContent === 'Modificar mis datos'"), 'foco del menu');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown' });
  assert.equal(await evaluate("document.activeElement?.classList.contains('pg-user-logout')"), true);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  await evaluate("document.querySelector('.pg-profile-trigger').click()");
  assert.equal(await evaluate("(() => { const r = document.querySelector('.pg-user-dropdown').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()"), true);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Emulation.clearDeviceMetricsOverride');
}
async function logout() {
  if (await evaluate("!!document.querySelector('.pg-profile-trigger')")) await evaluate("document.querySelector('.pg-profile-trigger').click()");
  await click('Cerrar sesión');
  await visible('Iniciar sesión');
  assert.equal(await evaluate("!!document.querySelector('.pg-sidebar')"), false);
}
try {
  const build = spawnSync(process.execPath, [join(repo, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', output], {
    cwd: repo, env: { ...process.env, VITE_API_URL: '/api' }, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  server = createServer((req, res) => { handle(req, res).catch(error => json(res, { error: error.message }, 500)); });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const profile = join(temporary, 'browser-profile');
  child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-extensions', '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let debugPort;
  await until(async () => {
    assert.equal(child.exitCode, null, 'El navegador terminó antes de conectarse.');
    try { debugPort = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; return !!debugPort; } catch { return false; }
  }, 'puerto del navegador');
  const pages = await (await fetch('http://127.0.0.1:' + debugPort + '/json/list')).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  socket.addEventListener('message', event => {
    const message = JSON.parse(typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString());
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    clearTimeout(task.timer);
    if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
  });
  await new Promise((resolveOpen, reject) => { socket.addEventListener('open', resolveOpen, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  await command('Runtime.enable');
  await command('Network.enable');
  await command('Network.setBlockedURLs', { urls: ['https://foto-inexistente.example.test/*'] });
  await command('Page.navigate', { url: origin });
  await visible('Iniciar sesión');

  assert.equal(await evaluate('document.title'), 'PsycoGest');
  assert.equal(await evaluate("document.documentElement.lang"), 'es');
  assert.equal(await evaluate("(async () => { const url = document.querySelector('link[rel=icon]').href; const response = await fetch(url); if (!response.ok || !response.headers.get('Content-Type').includes('image/svg+xml')) return false; const svg = await response.text(); const img = new Image(); img.src = url; await img.decode(); return img.naturalWidth === 64 && svg.includes('PsycoGest') && !svg.includes('#863bff'); })()"), true, 'Favicon de producción');
  for (const [registro, parte, tecla] of [[false, 'simbolo'], [true, 'nombre'], [false, 'nombre', 'Enter'], [true, 'nombre', 'Espacio']]) {
    await click('Iniciar sesión');
    if (await evaluate("!!document.getElementById('rol-registro')")) await click('Volver al login');
    if (registro) await click('Registrate');
    await volverPorLogo({ publico: true, parte, tecla });
  }
  await click('Iniciar sesión');
  if (await evaluate("!!document.getElementById('rol-registro')")) await click('Volver al login');
  await volverPorLogo({ publico: true });
  await register('PACIENTE', 'paciente.smoke@example.test');
  assert.equal(requests.filter(req => req.path === '/api/pacientes').length, 0);
  await logout();
  await click('Iniciar sesión');
  await credentials('paciente.smoke@example.test');
  await click('Iniciar sesión');
  await visible('Completá tu perfil');
  for (const [id, value] of [
    ['perfil-nombre', 'Paciente'], ['perfil-apellido', 'Ficticio'], ['perfil-telefono', '1100000001'],
    ['perfil-dni', '99000001'], ['perfil-fecha', '1995-05-20'],
  ]) await fill(id, value);
  await click('Guardar e ingresar');
  await dashboardVisible();
  await visible('Todavía no tenés próximos turnos');
  await comprobarResponsiveDashboard();
  await clickDashboardAccess('Buscar profesionales');
  await until(() => evaluate("document.querySelector('main h1, main h2')?.textContent === 'Buscar profesionales'"), 'destino de buscar');
  dashboardFixtures.set('paciente.smoke@example.test', { turnos: fixtureTurnos('PACIENTE') });
  await volverPorLogo({ parte: 'simbolo', nombre: 'Paciente', email: 'paciente.smoke@example.test' });
  await comprobarAgendaDashboard();
  await clickDashboardAccess('Mis turnos');
  await until(() => evaluate("document.querySelector('main h1, main h2')?.textContent === 'Mis turnos'"), 'destino de turnos paciente');
  await volverPorLogo({ parte: 'nombre', nombre: 'Paciente', email: 'paciente.smoke@example.test' });
  await click('Mi perfil');
  await until(() => evaluate("document.getElementById('perfil-dni')?.value === '99000001'"), 'DNI propio');
  await testMenu('Paciente');
  await evaluate("document.querySelector('.pg-profile-trigger').click()");
  await click('Modificar mis datos');
  await visible('Mi perfil');
  await until(() => evaluate("document.getElementById('perfil-telefono')?.value === '1100000001'"), 'perfil cargado');
  await fill('perfil-telefono', '1100000002');
  await click('Guardar cambios');
  await visible('Buscar profesionales');
  await until(() => evaluate("document.getElementById('perfil-telefono')?.value === '1100000002'"), 'teléfono actualizado');
  const meBefore = requests.filter(req => req.path === '/api/auth/me').length;
  await command('Page.reload');
  await until(() => requests.filter(req => req.path === '/api/auth/me').length > meBefore, 'sesión restaurada');
  await dashboardVisible();
  assert.equal(requests.filter(req => req.path === '/api/pacientes').length, 0, 'Paciente no debe pedir listados profesionales');
  await logout();

  await register('PSICOLOGO', 'profesional.smoke@example.test');
  for (const [id, value] of [
    ['perfil-nombre', 'Profesional'], ['perfil-apellido', 'Ficticio'], ['perfil-telefono', '1100000003'],
    ['perfil-matricula', 'SMOKE-99001'], ['perfil-direccion', 'Consultorio ficticio 123'],
    ['perfil-colegio-nombre', 'Colegio ficticio'], ['perfil-colegio-distrito', 'Distrito ficticio'],
    ['perfil-colegio-direccion', 'Dirección ficticia 456'],
  ]) {
    await until(() => evaluate('!!document.getElementById(' + JSON.stringify(id) + ')'), id);
    await fill(id, value);
  }
  await click('Guardar e ingresar');
  await visible('Mi perfil profesional');
  await dashboardVisible();
  assert.equal(await evaluate("document.querySelector('.pg-dashboard').innerText.includes('Profesional de mi reserva')"), false, 'No arrastrar datos del paciente anterior');
  dashboardFixtures.set('profesional.smoke@example.test', { turnos: fixtureTurnos('PSICOLOGO'), pacientes: [{ id: 1 }, { id: 2 }, { id: 3 }], liquidaciones: [{ id: 1, estado: 'PENDIENTE', valorTotal: '100.00', fechaEmision: new Date().toISOString(), obraSocial: { id: 1, nombre: 'Cobertura ficticia' }, detalles: [] }] });
  await click('Actualizar resumen');
  await dashboardVisible();
  await comprobarAgendaDashboard();
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.pg-dashboard-metrica strong')].map(n => n.textContent)"), ['2', '1', '3', '1']);
  await comprobarResponsiveDashboard();
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }).then(r => writeFile(join(artifacts, 'dashboard-profesional.png'), Buffer.from(r.data, 'base64')));
  for (const [titulo, destino] of [['Mis turnos', 'Mis turnos'], ['Pacientes', 'Gestión de Pacientes'], ['Liquidaciones', 'Liquidaciones'], ['Publicar horario', 'Mis turnos']]) {
    await clickDashboardAccess(titulo);
    await until(() => evaluate("document.querySelector('main h1, main h2')?.textContent === " + JSON.stringify(destino)), 'destino ' + titulo);
    if (titulo === 'Publicar horario') assert.equal(await evaluate("document.activeElement?.type"), 'date', 'Publicar horario enfoca fecha');
    await volverPorLogo({ parte: titulo === 'Mis turnos' ? 'simbolo' : 'nombre', tecla: titulo === 'Liquidaciones' ? 'Enter' : titulo === 'Publicar horario' ? 'Espacio' : undefined, nombre: 'Profesional', email: 'profesional.smoke@example.test' });
  }
  dashboardFailures.add('profesional.smoke@example.test');
  await click('Actualizar resumen'); await dashboardVisible();
  await visible('No pudimos cargar las liquidaciones pendientes');
  assert.equal(await evaluate("document.querySelectorAll('.pg-dashboard-metrica strong')[3].textContent"), '—', 'Fallo no se muestra como cero');
  dashboardFailures.clear();
  await click('Actualizar resumen'); await dashboardVisible();
  assert.equal(await evaluate("document.querySelectorAll('.pg-dashboard-metrica strong')[3].textContent"), '1');
  assert.equal(await evaluate("!!document.querySelector('.pg-sidebar')"), true);
  await testMenu('Profesional');
  await evaluate("document.querySelector('.pg-profile-trigger').click()");
  await click('Modificar mis datos');
  await until(() => evaluate("document.getElementById('perfil-matricula')?.value === 'SMOKE-99001'"), 'perfil profesional propio');
  await until(() => evaluate("!!document.getElementById('publico-tituloProfesional')"), 'editor de presentación pública');
  assert.equal(await evaluate("document.querySelector('span.profesional-avatar')?.textContent"), 'PF', 'Avatar con iniciales cuando no hay foto');
  const publicFields = {
    fotoUrl: 'https://foto-inexistente.example.test/perfil.png',
    tituloProfesional: 'Licenciada en Psicología ficticia',
    enfoqueProfesional: 'Enfoque integrador de prueba',
    descripcionPublica: 'Presentación profesional ficticia para verificar la edición y la consulta pública.\nAtención con escucha y respeto.',
    dirigidoA: 'Personas adultas y adolescentes ficticios',
    idiomas: 'Español e inglés',
    modalidadPublica: 'AMBAS',
  };
  for (const [field, value] of Object.entries(publicFields)) await fill('publico-' + field, value);
  await evaluate("document.getElementById('publico-aceptaReintegro').click(); document.getElementById('publico-lugar-51').click();");
  await until(() => evaluate("!!document.querySelector('span.profesional-avatar') && !document.querySelector('img.profesional-avatar')"), 'avatar de respaldo ante foto fallida');
  await click('Guardar presentación pública');
  await visible('Tu presentación pública se guardó correctamente.');
  const savedPublic = requests.findLast(req => req.path === '/api/mi-perfil/profesional' && req.method === 'PATCH');
  assert.deepEqual(savedPublic.data, { ...publicFields, aceptaReintegro: true, lugaresIds: [51] }, 'Se guardan únicamente los campos de la presentación y sus lugares elegidos');
  const professional = accounts.get('profesional.smoke@example.test');
  const publicResponse = await fetch(origin + '/api/profesionales/' + professional.perfil.id);
  assert.equal(publicResponse.status, 200, 'Detalle público accesible sin sesión');
  const publicResult = await publicResponse.json();
  assert.equal(publicResult.descripcionPublica, publicFields.descripcionPublica);
  for (const privateField of ['email', 'password', 'telefono', 'pacientes', 'usuario', 'usuarioId']) assert.equal(privateField in publicResult, false, 'El mock de detalle conserva la proyección pública: ' + privateField);
  await click('Tipos de sesión');
  await until(() => requests.some(req => req.path === '/api/tipos-sesion'), 'CRUD tipos de sesión');
  await click('Mi perfil profesional');
  await until(() => evaluate("document.getElementById('publico-tituloProfesional')?.value === " + JSON.stringify(publicFields.tituloProfesional)), 'presentación guardada al remontar');
  for (const [field, value] of Object.entries(publicFields)) assert.equal(await evaluate('document.getElementById(' + JSON.stringify('publico-' + field) + ').value'), value, 'Persiste ' + field);
  assert.equal(await evaluate("document.getElementById('publico-aceptaReintegro').checked && document.getElementById('publico-lugar-51').checked"), true, 'Persisten reintegro y lugar público');
  await volverPorLogo({ tecla: 'Enter', nombre: 'Profesional', email: 'profesional.smoke@example.test' });
  await click('Mis turnos');
  await visible('Crear horario disponible');
  await click('Liquidaciones');
  await visible('Emitir liquidación');
  await click('Lugares');
  await until(() => requests.some(req => req.path === '/api/lugares'), 'CRUD lugares');
  await logout();
  await click('Iniciar sesión');
  await credentials('paciente.smoke@example.test');
  await click('Iniciar sesión');
  await dashboardVisible();
  assert.equal(await evaluate("document.querySelector('.pg-dashboard').innerText.includes('Paciente de mi reserva')"), false, 'No arrastrar datos del profesional anterior');
  await visible('Hola, Paciente!');
  await click('Buscar profesionales');
  await visible(publicFields.tituloProfesional);
  await until(() => evaluate("document.querySelectorAll('.profesional-tarjeta').length === 1 && document.querySelector('.profesional-tarjeta span.profesional-avatar')?.textContent === 'PF' && !document.querySelector('.profesional-tarjeta img.profesional-avatar')"), 'tarjeta pública y avatar de respaldo');
  await click('Ver perfil');
  await until(() => evaluate("document.querySelector('.perfil-publico h1')?.textContent === 'Profesional Ficticio'"), 'detalle del profesional seleccionado');
  for (const value of [publicFields.tituloProfesional, publicFields.enfoqueProfesional, publicFields.descripcionPublica.split('\n')[0], publicFields.dirigidoA, publicFields.idiomas, publicCoverage.nombre, publicPlace.nombre, publicPlace.direccion]) await visible(value);
  await visible('El profesional indica que acepta reintegro.');
  await volverPorLogo({ tecla: 'Espacio', nombre: 'Paciente', email: 'paciente.smoke@example.test' });
  await click('Buscar profesionales');
  await visible(publicFields.tituloProfesional);
  await click('Ver perfil');
  await until(() => evaluate("document.querySelector('.perfil-publico h1')?.textContent === 'Profesional Ficticio'"), 'detalle al volver desde Inicio');
  assert.equal(await evaluate("document.querySelector('.perfil-publico').innerText.includes('profesional.smoke@example.test')"), false, 'Detalle sin correo privado');
  await command('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Perfil público sin desbordamiento móvil');
  await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }).then(r => writeFile(join(artifacts, 'perfil-profesional-publico.png'), Buffer.from(r.data, 'base64')));
  await command('Emulation.clearDeviceMetricsOverride');
  await click('Ver disponibilidad');
  await visible('Sesión pública ficticia');
  await click('Reservar');
  await click('Confirmar');
  await visible('Reserva confirmada. Consultala en Mis turnos.');
  await visible('No quedan horarios disponibles.');
  assert.equal(requests.filter(req => req.path === '/api/turnos/501/reservar' && req.method === 'POST' && req.account === 'paciente.smoke@example.test').length, 1, 'La reserva usa la sesión del paciente y el turno seleccionado');
  await click('Mis turnos');
  await visible('Sesión pública ficticia');
  await visible('Próximos');
  assert.equal(await evaluate("!!document.querySelector('.pg-sidebar')"), true);
  await logout();
  assert.equal(requests.some(r => r.role === 'PACIENTE' && ['/api/pacientes','/api/liquidaciones'].includes(r.path)), false, 'Paciente no consulta datos profesionales');
  assert.equal(requests.some(r => /pacienteId|psicologoId/.test(r.query)), false, 'Dashboard usa identidad de sesión');
  assert.deepEqual(exceptions, [], 'No debe haber errores de ejecución de React');
  console.log('UI OK: logo publico/privado por simbolo, nombre, Enter y Espacio, hover/foco visible, sin recarga ni cambio de sesion; autenticación, dashboards por rol, datos filtrados, accesos, foco en publicación, error parcial, aislamiento entre cuentas, móvil, título y favicon de producción; edición de presentación profesional, persistencia, avatar sin foto o con error, detalle público móvil, coberturas, lugares, disponibilidad y reserva (API ficticia).');
} finally {
  if (socket?.readyState === 1) {
    await command('Browser.close').catch(() => {});
    socket.close();
  }
  if (child && child.exitCode === null) {
    await Promise.race([new Promise(resolveExit => child.once('exit', resolveExit)), delay(3000)]);
    if (child.exitCode === null) child.kill();
  }
  for (const task of pending.values()) clearTimeout(task.timer);
  if (server) { server.closeAllConnections(); await new Promise(resolveClose => server.close(resolveClose)); }
  assert.ok(temporary.startsWith(artifacts + sep), 'La limpieza debe limitarse a artefactos temporales.');
  await rm(temporary, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
