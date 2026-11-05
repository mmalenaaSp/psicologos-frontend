import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../services/api';
import { modalidadProfesional } from '../services/perfilProfesionalService';
import AvatarProfesional from '../components/AvatarProfesional';
import PerfilProfesionalPublico from './PerfilProfesionalPublico';
import { Campo, Confirmacion, DetalleTurno, Mensaje } from './Turnos';
import './PerfilProfesional.css';

export default function BuscarProfesionales() {
  const [filtros, setFiltros] = useState({ nombre: '', obraSocialId: '', tipoSesionId: '', ubicacion: '', modalidad: '' });
  const [opciones, setOpciones] = useState({ obrasSociales: [], tiposSesion: [] });
  const [resultados, setResultados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const consulta = useRef(null);
  useEffect(() => {
    const c = new AbortController();
    consulta.current = c;
    Promise.all([apiRequest('/profesionales/opciones', { signal: c.signal }), apiRequest('/profesionales', { signal: c.signal })]).then(([o, p]) => {
      if (!c.signal.aborted) { setOpciones(o); setResultados(p); }
    }).catch(e => { if (!c.signal.aborted) setError(e.message); }).finally(() => { if (!c.signal.aborted) setCargando(false); });
    return () => consulta.current?.abort();
  }, []);
  function nuevaConsulta() {
    consulta.current?.abort();
    const c = new AbortController();
    consulta.current = c;
    setCargando(true); setError(''); setAviso('');
    return c;
  }
  async function buscar(e) {
    e.preventDefault();
    const c = nuevaConsulta(); setSeleccionado(null);
    try { const datos = await apiRequest(`/profesionales?${new URLSearchParams(Object.entries(filtros).filter(([,v]) => v))}`, { signal: c.signal }); if (!c.signal.aborted) setResultados(datos); }
    catch (e) { if (!c.signal.aborted) setError(e.message); } finally { if (!c.signal.aborted) setCargando(false); }
  }
  async function consultar(p) {
    const c = nuevaConsulta(); setSeleccionado(p); setHorarios([]); setPerfilId(null);
    try { const datos = await apiRequest(`/profesionales/${p.id}/disponibilidad`, { signal: c.signal }); if (!c.signal.aborted) setHorarios(datos); }
    catch (e) { if (!c.signal.aborted) setError(e.message); } finally { if (!c.signal.aborted) setCargando(false); }
  }
  async function confirmar() {
    if (ocupado) return;
    setOcupado(true); setError(''); setAviso('');
    const c = consulta.current;
    try { await apiRequest(`/turnos/${reserva.id}/reservar`, { method: 'POST', body: '{}' }); if (!c?.signal.aborted) setAviso('Reserva confirmada. Consultala en Mis turnos.'); }
    catch (e) { if (!c?.signal.aborted) setError(e.message); }
    finally {
      if (!c?.signal.aborted) {
        setReserva(null);
        try { const datos = await apiRequest(`/profesionales/${seleccionado.id}/disponibilidad`, { signal: c?.signal }); if (!c?.signal.aborted) setHorarios(datos); }
        catch (e) { if (!c?.signal.aborted) setError(e.message); }
        if (!c?.signal.aborted) setOcupado(false);
      }
    }
  }
  if (perfilId) return <PerfilProfesionalPublico key={perfilId} profesionalId={perfilId} onVolver={() => setPerfilId(null)} onVerDisponibilidad={consultar} />;
  return <section className="turnos"><h1>Buscar profesionales</h1><p>Conocé a los profesionales y consultá sus horarios disponibles. Todos los horarios corresponden a Argentina.</p>
    <form onSubmit={buscar}><fieldset disabled={cargando || ocupado}><div className="turnos-filtros">
      {['nombre', 'ubicacion'].map(k => <Campo key={k} titulo={k === 'nombre' ? 'Nombre y apellido' : 'Ubicación o lugar'}><input value={filtros[k]} onChange={e => setFiltros({ ...filtros, [k]: e.target.value })} /></Campo>)}
      {[['obraSocialId','Obra social',opciones.obrasSociales],['tipoSesionId','Tipo de sesión',opciones.tiposSesion]].map(([k,t,items]) => <Campo key={k} titulo={t}><select value={filtros[k]} onChange={e => setFiltros({ ...filtros, [k]: e.target.value })}><option value="">Todas</option>{items.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>)}
      <Campo titulo="Modalidad"><select value={filtros.modalidad} onChange={e => setFiltros({ ...filtros, modalidad: e.target.value })}><option value="">Todas</option><option>PRESENCIAL</option><option>VIRTUAL</option></select></Campo><button>Buscar</button>
    </div></fieldset></form><Mensaje {...{ error, aviso, cargando }} />
    {!seleccionado ? <div className="profesionales-tarjetas">{resultados.map(p => <article className="profesional-tarjeta" key={p.id}>
      <div className="profesional-tarjeta-cabecera"><AvatarProfesional {...p} /><div><h2>{p.nombre} {p.apellido}</h2>{p.tituloProfesional && <p className="profesional-titulo">{p.tituloProfesional}</p>}</div></div>
      <p className="profesional-matricula">Matrícula: {p.nroMatricula}</p>
      <p>{p.modalidadPublica ? modalidadProfesional(p.modalidadPublica) : [...new Set(p.turnos.map(t => modalidadProfesional(t.modalidad)))].join(' · ') || 'Modalidad a consultar'}</p>
      <p>Obras sociales: {p.obrasSociales.map(o => o.nombre).join(', ') || 'Consultar atención particular'}</p>
      {p.turnos[0] && <p>Próximo horario: {p.turnos[0].fecha.split('-').reverse().join('/')} · {p.turnos[0].horaIni}</p>}
      <div className="turnos-acciones"><button type="button" className="perfil-boton-secundario" disabled={cargando} onClick={() => { setError(''); setPerfilId(p.id); }}>Ver perfil</button><button type="button" disabled={cargando} onClick={() => consultar(p)}>Ver disponibilidad</button></div>
    </article>)}{!cargando && !error && !resultados.length && <p>No hay profesionales con disponibilidad para estos filtros.</p>}</div> : <>
      <div className="profesional-tarjeta-cabecera"><AvatarProfesional {...seleccionado} /><div><h2>{seleccionado.nombre} {seleccionado.apellido}</h2>{seleccionado.tituloProfesional && <p>{seleccionado.tituloProfesional}</p>}</div></div>
      <div className="turnos-acciones"><button type="button" disabled={ocupado} onClick={() => { setSeleccionado(null); setError(''); setAviso(''); }}>Volver a resultados</button><button type="button" disabled={ocupado || cargando} onClick={() => setPerfilId(seleccionado.id)}>Ver perfil</button></div>
      <div className="turnos-lista">{horarios.map(t => <article key={t.id}><DetalleTurno turno={t} /><button type="button" disabled={ocupado} onClick={() => setReserva(t)}>Reservar</button></article>)}</div>{!cargando && !error && !horarios.length && <p>No quedan horarios disponibles.</p>}
    </>}
    {reserva && <Confirmacion texto={`¿Confirmar reserva para el ${reserva.fecha} a las ${reserva.horaIni}?`} ocupado={ocupado} onConfirmar={confirmar} onCerrar={() => setReserva(null)} />}
  </section>;
}
