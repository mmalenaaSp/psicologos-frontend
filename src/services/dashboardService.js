import { apiRequest } from './api.js';

export async function cargarDashboard(rol, { signal } = {}) {
  const recursos = [['turnos', '/turnos', 'los turnos']];
  if (rol === 'PSICOLOGO') recursos.push(
    ['pacientes', '/pacientes', 'los pacientes'],
    ['liquidaciones', '/liquidaciones?estado=PENDIENTE', 'las liquidaciones pendientes'],
  );
  else if (rol !== 'PACIENTE') throw new Error('Rol sin acceso al inicio.');

  const resultados = await Promise.allSettled(recursos.map(async ([, ruta]) => {
    const datos = await apiRequest(ruta, { signal });
    if (!Array.isArray(datos)) throw new Error('Respuesta inválida.');
    return datos;
  }));
  if (signal?.aborted) throw new DOMException('Carga cancelada.', 'AbortError');
  const datos = { turnos: null, pacientes: null, liquidaciones: null, errores: [] };
  resultados.forEach((resultado, i) => {
    const [clave, , descripcion] = recursos[i];
    if (resultado.status === 'fulfilled') datos[clave] = resultado.value;
    else datos.errores.push(`No pudimos cargar ${descripcion}. Volvé a intentar.`);
  });
  return datos;
}

export function resumirTurnos(turnos, ahora = new Date()) {
  if (!Array.isArray(turnos)) return null;
  const futuros = turnos.filter(t => new Date(t.inicio).getTime() > ahora.getTime());
  return {
    reservas: futuros.filter(t => t.estado === 'RESERVADO').sort((a, b) => new Date(a.inicio) - new Date(b.inicio)),
    disponibles: futuros.filter(t => t.estado === 'DISPONIBLE').length,
  };
}
