import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { Campo, Confirmacion, Mensaje } from './Turnos';
export default function Liquidaciones() {
  const [items, setItems] = useState([]);
  const [obras, setObras] = useState([]);
  const [obraSocialId, setObra] = useState('');
  const [estado, setEstado] = useState('');
  const [sesiones, setSesiones] = useState([]);
  const [importes, setImportes] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([apiRequest(`/liquidaciones?${new URLSearchParams({ ...(obraSocialId ? { obraSocialId } : {}), ...(estado ? { estado } : {}) })}`, { signal: c.signal }), apiRequest('/turnos/opciones', { signal: c.signal }), apiRequest('/turnos?estado=RESERVADO', { signal: c.signal })]).then(([l,o,t]) => { if (!c.signal.aborted) { setItems(l); setObras(o.obrasSociales.filter(v => o.obrasSocialesIds.includes(v.id))); setSesiones(t); } }).catch(e => { if (!c.signal.aborted) setError(e.message); });
    return () => c.abort();
  }, [obraSocialId, estado]);
  async function ejecutar() {
    if (ocupado) return;
    setOcupado(true); setError(''); setAviso('');
    try {
      if (confirmacion.id) await apiRequest(`/liquidaciones/${confirmacion.id}/pagar`, { method: 'PATCH', body: '{}' });
      else await apiRequest('/liquidaciones', { method: 'POST', body: JSON.stringify({ obraSocialId: Number(obraSocialId), detalles: Object.entries(importes).filter(([,v]) => v).map(([turnoId, importe]) => ({ turnoId: Number(turnoId), importe })) }) });
      setImportes({}); setConfirmacion(null); setAviso('Liquidación guardada.');
      setItems(await apiRequest(`/liquidaciones?${new URLSearchParams({ ...(obraSocialId ? { obraSocialId } : {}), ...(estado ? { estado } : {}) })}`));
    } catch (e) { setError(e.message); } finally { setOcupado(false); }
  }
  return <section className="turnos"><h1>Liquidaciones</h1><p>Ingresá el importe acordado por cada sesión. El total suma esos importes y se conserva al emitir. La selección de una reserva no acredita asistencia.</p><Mensaje {...{ error, aviso }} /><div className="turnos-filtros"><Campo titulo="Obra social"><select value={obraSocialId} onChange={e => setObra(e.target.value)}><option value="">Todas</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo><Campo titulo="Estado"><select value={estado} onChange={e => setEstado(e.target.value)}><option value="">Todos</option><option>PENDIENTE</option><option>PAGADA</option></select></Campo></div>
    <form onSubmit={e => { e.preventDefault(); setConfirmacion({ texto: '¿Emitir la liquidación con estos importes? Revisá la obra social y las sesiones seleccionadas.' }); }}><h2>Emitir liquidación</h2><p>Completá únicamente los importes de las sesiones a incluir. El servidor comprueba que el paciente corresponda a la obra social elegida y que no se liquide dos veces.</p><fieldset disabled={ocupado}>{sesiones.map(t => <Campo key={t.id} titulo={`${t.fecha} ${t.horaIni} · ${t.paciente?.nombre || ''} ${t.paciente?.apellido || ''} · ${t.tipoSesion?.nombre}`}><input type="number" min="0.01" max="99999999.99" step="0.01" placeholder="Importe explícito" value={importes[t.id] || ''} onChange={e => setImportes({ ...importes, [t.id]: e.target.value })} /></Campo>)}<button disabled={!obraSocialId || !Object.values(importes).some(Boolean)}>Emitir</button></fieldset></form>
    <div className="turnos-lista">{items.map(l => <article key={l.id}><h2>Liquidación #{l.id}</h2><p>{l.obraSocial.nombre} · {l.estado}</p><p>{new Date(l.fechaEmision).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} · $ {l.valorTotal}</p><ul>{l.detalles.map(d => <li key={d.turnoId}>{d.fechaSesion.slice(0,10)} · {d.paciente} · {d.sesion} · $ {d.importe}</li>)}</ul>{l.estado === 'PENDIENTE' && <button disabled={ocupado} onClick={() => setConfirmacion({ id: l.id, texto: '¿Registrar esta liquidación como pagada?' })}>Registrar pago</button>}</article>)}</div>{!items.length && <p>No hay liquidaciones para estos filtros.</p>}{confirmacion && <Confirmacion texto={confirmacion.texto} ocupado={ocupado} onConfirmar={ejecutar} onCerrar={() => setConfirmacion(null)} />}
  </section>;
}
