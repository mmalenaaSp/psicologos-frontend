import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../services/api';
import './Turnos.css';
export function Mensaje({ error, aviso, cargando }) { return <>{error && <p role="alert">{error}</p>}{aviso && <p role="status">{aviso}</p>}{cargando && <p role="status">Cargando…</p>}</>; }
export function Campo({ titulo, children }) { return <label className="turnos-campo">{titulo}{children}</label>; }
export function Confirmacion({ texto, ocupado, onConfirmar, onCerrar }) { return <div className="turnos-confirmacion" role="dialog" aria-modal="true" aria-label="Confirmar operación"><p>{texto}</p><button autoFocus disabled={ocupado} onClick={onConfirmar}>Confirmar</button> <button disabled={ocupado} onClick={onCerrar}>Volver</button></div>; }
const vacio = { fecha: '', horaIni: '', horaFin: '', tipoSesionId: '', modalidad: 'VIRTUAL', lugarId: '' };
function preparar(form) { return { ...form, tipoSesionId: Number(form.tipoSesionId), lugarId: form.modalidad === 'PRESENCIAL' ? Number(form.lugarId) : null }; }
export function DetalleTurno({ turno: t }) { return <><strong>{t.fecha.split('-').reverse().join('/')} · {t.horaIni}–{t.horaFin}</strong><p>{t.tipoSesion?.nombre} · {t.modalidad} · {t.estado}</p>{t.lugar && <p>{t.lugar.nombre} · {t.lugar.direccion}</p>}<p>{t.psicologo?.nombre} {t.psicologo?.apellido}</p>{t.paciente && <p>Paciente: {t.paciente.nombre} {t.paciente.apellido}</p>}</>; }
export default function Turnos({ profesional = false, publicar = false }) {
  const fechaRef = useRef(null);
  useEffect(() => { if (publicar) fechaRef.current?.focus(); }, [publicar]);
  const [turnos, setTurnos] = useState([]);
  const [opciones, setOpciones] = useState({ tiposSesion: [], lugares: [], obrasSociales: [] });
  const [obras, setObras] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState('');
  const [periodo, setPeriodo] = useState('proximos');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const cargar = useCallback(async signal => {

    try {
      const datos = await apiRequest(`/turnos?${new URLSearchParams({ ...(fecha ? { fecha } : {}), ...(estado ? { estado } : {}) })}`, { signal });
      if (!signal?.aborted) setTurnos(datos);
    } catch (e) { if (!signal?.aborted) setError(e.message); }
    finally { if (!signal?.aborted) setCargando(false); }
  }, [fecha, estado]);
  useEffect(() => { const c = new AbortController(); Promise.resolve().then(() => { if (!c.signal.aborted) return cargar(c.signal); }); return () => c.abort(); }, [cargar]);
  useEffect(() => {
    if (!profesional) return;
    const c = new AbortController();
    apiRequest('/turnos/opciones', { signal: c.signal }).then(o => { if (!c.signal.aborted) { setOpciones(o); setObras(o.obrasSocialesIds); } }).catch(e => { if (!c.signal.aborted) setError(e.message); });
    return () => c.abort();
  }, [profesional]);
  async function ejecutar(path, method, body, mensaje) {
    if (ocupado) return;
    setOcupado(true); setError(''); setAviso('');
    try {
      await apiRequest(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      setAviso(mensaje); setConfirmacion(null);
      if (method === 'PUT' || method === 'POST' && path === '/turnos') { setForm(vacio); setEditando(null); }
    } catch (e) { setError(e.message); }
    finally { await cargar(); setOcupado(false); }
  }
  const visibles = turnos.filter(t => profesional || (periodo === 'anteriores' ? new Date(t.inicio) <= new Date() : new Date(t.inicio) > new Date()));
  return <section className="turnos"><h1>Mis turnos</h1><p>Horarios de Argentina (UTC−3).</p><Mensaje {...{ error, aviso, cargando }} />
    {profesional && <>
      <details><summary>Obras sociales que atiendo</summary><p>Las coberturas seleccionadas se muestran en la búsqueda pública.</p>{opciones.obrasSociales.map(o => <label key={o.id}><input type="checkbox" checked={obras.includes(o.id)} onChange={e => setObras(e.target.checked ? [...obras, o.id] : obras.filter(id => id !== o.id))} />{o.nombre} </label>)}<button disabled={ocupado} onClick={() => ejecutar('/turnos/coberturas', 'PUT', { obrasSocialesIds: obras }, 'Coberturas guardadas.')}>Guardar coberturas</button></details>
      <form className="turnos-form" onSubmit={e => { e.preventDefault(); ejecutar(editando ? `/turnos/${editando}` : '/turnos', editando ? 'PUT' : 'POST', preparar(form), 'Horario guardado.'); }}>
        <h2>{editando ? 'Modificar horario' : 'Crear horario disponible'}</h2>
        <fieldset disabled={ocupado}><div className="turnos-filtros">
        {['fecha', 'horaIni', 'horaFin'].map((k, i) => <Campo key={k} titulo={['Fecha', 'Inicio', 'Fin'][i]}><input ref={i === 0 ? fechaRef : undefined} required type={i ? 'time' : 'date'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></Campo>)}
        <Campo titulo="Tipo de sesión"><select required value={form.tipoSesionId} onChange={e => setForm({ ...form, tipoSesionId: e.target.value })}><option value="">Seleccionar</option>{opciones.tiposSesion.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>
        <Campo titulo="Modalidad"><select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value, lugarId: '' })}><option>VIRTUAL</option><option>PRESENCIAL</option></select></Campo>
        {form.modalidad === 'PRESENCIAL' && <Campo titulo="Lugar"><select required value={form.lugarId} onChange={e => setForm({ ...form, lugarId: e.target.value })}><option value="">Seleccionar</option>{opciones.lugares.map(o => <option key={o.id} value={o.id}>{o.nombre} · {o.direccion}</option>)}</select></Campo>}
        </div><button>Guardar horario</button>{editando && <button type="button" onClick={() => { setEditando(null); setForm(vacio); }}>Descartar edición</button>}</fieldset>
        {!opciones.tiposSesion.length && <p>Creá un tipo de sesión desde el menú antes de publicar horarios.</p>}
      </form></>}
    <div className="turnos-filtros"><Campo titulo="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></Campo><Campo titulo="Estado"><select value={estado} onChange={e => setEstado(e.target.value)}><option value="">Todos</option>{['DISPONIBLE','RESERVADO','CANCELADO'].map(s => <option key={s}>{s}</option>)}</select></Campo>
    {!profesional && <Campo titulo="Período"><select value={periodo} onChange={e => setPeriodo(e.target.value)}><option value="proximos">Próximos</option><option value="anteriores">Anteriores</option></select></Campo>}<button onClick={() => cargar()} disabled={ocupado}>Actualizar</button></div>
    {!cargando && !visibles.length && <p>No hay turnos para estos filtros.</p>}
    <div className="turnos-lista">{visibles.map(t => <article key={t.id}><DetalleTurno turno={t} />{new Date(t.inicio) > new Date() && <div className="turnos-acciones">
      {profesional && t.estado === 'DISPONIBLE' && <><button disabled={ocupado} onClick={() => { setEditando(t.id); setForm({ fecha: t.fecha, horaIni: t.horaIni, horaFin: t.horaFin, tipoSesionId: t.tipoSesion.id, modalidad: t.modalidad, lugarId: t.lugar?.id || '' }); }}>Modificar</button><button disabled={ocupado} onClick={() => setConfirmacion({ texto: '¿Eliminar este horario libre?', path: `/turnos/${t.id}`, method: 'DELETE' })}>Eliminar</button></>}
      {t.estado === 'RESERVADO' && <button disabled={ocupado} onClick={() => setConfirmacion({ texto: profesional ? '¿Cancelar este turno? No volverá a ofrecerse.' : '¿Cancelar tu reserva y liberar el horario?', path: `/turnos/${t.id}/cancelar`, method: 'POST', body: {} })}>Cancelar turno</button>}
    </div>}</article>)}</div>
    {confirmacion && <Confirmacion texto={confirmacion.texto} ocupado={ocupado} onCerrar={() => setConfirmacion(null)} onConfirmar={() => ejecutar(confirmacion.path, confirmacion.method, confirmacion.body, 'Operación completada.')} />}
  </section>;
}
