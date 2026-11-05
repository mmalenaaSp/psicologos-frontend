import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { Campo, Confirmacion, Mensaje } from './Turnos';
export default function ObrasSociales() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ codigo: '', nombre: '' });
  const [id, setId] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [eliminar, setEliminar] = useState(null);
  useEffect(() => { const c = new AbortController(); apiRequest('/obras-sociales', { signal: c.signal }).then(rows => { if (!c.signal.aborted) setItems(rows); }).catch(e => { if (!c.signal.aborted) setError(e.message); }); return () => c.abort(); }, []);
  async function guardar(borrar = false) {
    if (ocupado) return;
    setOcupado(true); setError(''); setAviso('');
    try {
      await apiRequest(`/obras-sociales${borrar ? `/${eliminar}` : id ? `/${id}` : ''}`, { method: borrar ? 'DELETE' : id ? 'PUT' : 'POST', ...(!borrar ? { body: JSON.stringify(form) } : {}) });
      setItems(await apiRequest('/obras-sociales')); setForm({ codigo: '', nombre: '' }); setId(null); setEliminar(null); setAviso('Catálogo actualizado.');
    } catch (e) { setError(e.message); } finally { setOcupado(false); }
  }
  return <section className="turnos"><h1>Obras sociales</h1><p>Administrá tu catálogo y elegí las coberturas que atendés desde Mis turnos. Los catálogos compartidos sólo permiten consulta.</p><Mensaje {...{ error, aviso }} /><form onSubmit={e => { e.preventDefault(); guardar(); }}><fieldset disabled={ocupado}><div className="turnos-filtros">{['codigo','nombre'].map(k => <Campo key={k} titulo={k === 'codigo' ? 'Código' : 'Nombre'}><input required maxLength={191} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></Campo>)}<button>{id ? 'Guardar cambios' : 'Crear obra social'}</button>{id && <button type="button" onClick={() => { setId(null); setForm({ codigo: '', nombre: '' }); }}>Descartar</button>}</div></fieldset></form><div className="turnos-lista">{items.map(o => <article key={o.id}><h2>{o.nombre}</h2><p>{o.codigo}</p><div className="turnos-acciones"><button disabled={ocupado} onClick={() => { setId(o.id); setForm({ codigo: o.codigo, nombre: o.nombre }); }}>Modificar</button><button disabled={ocupado} onClick={() => setEliminar(o.id)}>Eliminar</button></div></article>)}</div>{eliminar && <Confirmacion texto="¿Eliminar esta obra social? Sólo se permite si es propia y no tiene registros asociados." ocupado={ocupado} onCerrar={() => setEliminar(null)} onConfirmar={() => guardar(true)} />}</section>;
}
