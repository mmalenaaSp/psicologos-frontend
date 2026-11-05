import { useEffect, useState } from 'react';
import { cargarDashboard, resumirTurnos } from '../services/dashboardService';
import { Mensaje } from './Turnos';
import './Dashboard.css';

const fechaLarga = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeZone: 'America/Argentina/Buenos_Aires' });
const mesCorto = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' });

function Icono({ tipo }) {
  const trazos = {
    agenda: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2" /></>,
    pacientes: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5" /></>,
    liquidaciones: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6m-6 5h6m-6 5h3" /></>,
    publicar: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></>,
    buscar: <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{trazos[tipo]}</svg>;
}

export default function Dashboard({ usuario, onNavegar }) {
  const profesional = usuario.rol === 'PSICOLOGO';
  const [revision, setRevision] = useState(0);
  const [carga, setCarga] = useState({ pendiente: true, datos: null });
  useEffect(() => {
    const controller = new AbortController();
    cargarDashboard(usuario.rol, { signal: controller.signal }).then(datos => {
      if (!controller.signal.aborted) setCarga({ pendiente: false, datos });
    }).catch(error => {
      if (!controller.signal.aborted) setCarga({ pendiente: false, datos: { errores: [error.message] } });
    });
    return () => controller.abort();
  }, [usuario.id, usuario.rol, revision]);

  function actualizar() {
    setCarga({ pendiente: true, datos: null });
    setRevision(r => r + 1);
  }
  const datos = carga.datos;
  const resumen = resumirTurnos(datos?.turnos);
  const reservas = resumen?.reservas || [];
  const accesos = profesional ? [
    ['turnos', 'Mis turnos', 'Consultá y organizá tu agenda.', 'agenda'],
    ['pacientes', 'Pacientes', 'Accedé a tus fichas de pacientes.', 'pacientes'],
    ['liquidaciones', 'Liquidaciones', 'Revisá importes y pagos pendientes.', 'liquidaciones'],
    ['publicar-horario', 'Publicar horario', 'Ofrecé un nuevo espacio de atención.', 'publicar'],
  ] : [
    ['buscar', 'Buscar profesionales', 'Encontrá un profesional y reservá tu próximo turno.', 'buscar'],
    ['turnos', 'Mis turnos', 'Consultá tus reservas e historial de atención.', 'agenda'],
  ];
  const indicadores = profesional ? [
    ['Reservas próximas', resumen?.reservas.length, 'turnos'],
    ['Horarios libres futuros', resumen?.disponibles, 'turnos'],
    ['Pacientes registrados', datos?.pacientes?.length, 'pacientes'],
    ['Liquidaciones pendientes', datos?.liquidaciones?.length, 'liquidaciones'],
  ] : [['Próximos turnos', resumen?.reservas.length, 'turnos']];

  return <section className="pg-dashboard" aria-labelledby="dashboard-titulo">
    <div className="pg-dashboard-heading"><div><p className="pg-dashboard-eyebrow">{profesional ? 'TU ESPACIO PROFESIONAL' : 'TU ESPACIO PERSONAL'}</p><h1 id="dashboard-titulo">Inicio</h1></div><button type="button" className="pg-dashboard-secondary" disabled={carga.pendiente} onClick={actualizar}>Actualizar resumen</button></div>
    <div className="pg-dashboard-hero"><div><p>{fechaLarga.format(new Date())}</p><h2>{profesional ? 'Tu agenda, en un vistazo.' : 'Un espacio para tu bienestar.'}</h2><p>{profesional ? 'Organizá tus horarios y tené a mano lo que sigue en tu práctica.' : 'Consultá tus próximos encuentros y encontrá profesionales cuando lo necesites.'}</p></div><button type="button" onClick={() => onNavegar(profesional ? 'publicar-horario' : 'buscar')}>{profesional ? 'Publicar horario' : 'Buscar profesionales'} <span aria-hidden="true">↗</span></button></div>
    <Mensaje cargando={carga.pendiente} error={datos?.errores?.join(' ')} />
    <div className={`pg-dashboard-metricas ${!profesional ? 'pg-dashboard-metricas-paciente' : ''}`} aria-label="Resumen de tu cuenta" aria-busy={carga.pendiente}>
      {indicadores.map(([titulo, valor, destino]) => <button type="button" className="pg-dashboard-metrica" key={titulo} onClick={() => onNavegar(destino)}><span>{titulo}</span><strong>{carga.pendiente ? '…' : valor ?? '—'}</strong><span className="pg-dashboard-metrica-link">Ver detalle <span aria-hidden="true">↗</span></span></button>)}
    </div>
    <section aria-labelledby="dashboard-accesos"><h2 id="dashboard-accesos">Accesos rápidos</h2><div className="pg-dashboard-accesos">{accesos.map(([destino, titulo, descripcion, icono]) => <button type="button" className="pg-dashboard-acceso" key={destino} onClick={() => onNavegar(destino)}><span className="pg-dashboard-icono"><Icono tipo={icono} /></span><span><strong>{titulo}</strong><span>{descripcion}</span></span><span aria-hidden="true">↗</span></button>)}</div></section>
    <section className="pg-dashboard-agenda" aria-labelledby="dashboard-turnos"><div className="pg-dashboard-heading"><div><h2 id="dashboard-turnos">Próximos turnos</h2><p>Reservas confirmadas · Horarios de Argentina (UTC−3)</p></div><button type="button" className="pg-dashboard-secondary" onClick={() => onNavegar('turnos')}>Ver mis turnos</button></div>
      {carga.pendiente ? <p role="status">Consultando tu agenda…</p> : !resumen ? <div className="pg-dashboard-vacio"><h3>No pudimos consultar tu agenda</h3><p>Podés volver a intentar o entrar a Mis turnos.</p><button type="button" className="pg-dashboard-secondary" onClick={actualizar}>Reintentar</button></div> : reservas.length ? <ul className="pg-dashboard-lista">{reservas.slice(0, 5).map(t => {
        const persona = profesional ? t.paciente : t.psicologo;
        const fecha = new Date(`${t.fecha}T12:00:00-03:00`);
        return <li key={t.id}><button type="button" className="pg-dashboard-turno" onClick={() => onNavegar('turnos')} aria-label={`Consultar turno del ${t.fecha} a las ${t.horaIni}`}><span className="pg-dashboard-fecha"><strong>{t.fecha.slice(8,10)}</strong><span>{mesCorto.format(fecha)}</span></span><span className="pg-dashboard-turno-info"><strong>{persona ? `${persona.nombre} ${persona.apellido}` : t.tipoSesion?.nombre || 'Sesión reservada'}</strong><span>{t.horaIni}–{t.horaFin} · {t.tipoSesion?.nombre}</span><span>{t.modalidad === 'PRESENCIAL' ? `Presencial${t.lugar ? ` · ${t.lugar.nombre}` : ''}` : 'Virtual'}</span></span><span className="pg-dashboard-estado">Reservado</span><span className="pg-dashboard-flecha" aria-hidden="true">↗</span></button></li>;
      })}</ul> : <div className="pg-dashboard-vacio"><span className="pg-dashboard-icono"><Icono tipo="agenda" /></span><h3>Todavía no tenés próximos turnos</h3><p>{profesional ? 'Tus reservas confirmadas van a aparecer acá. Podés empezar publicando un horario disponible.' : 'Cuando reserves un encuentro, vas a encontrar acá la fecha y los datos del profesional.'}</p><button type="button" className="pg-dashboard-secondary" onClick={() => onNavegar(profesional ? 'publicar-horario' : 'buscar')}>{profesional ? 'Publicar mi primer horario' : 'Encontrar un profesional'}</button></div>}
    </section>
  </section>;
}
