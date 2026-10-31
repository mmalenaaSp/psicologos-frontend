import { useEffect, useState } from 'react';
import { obtenerMiPerfilProfesional, guardarMiPerfilProfesional } from '../services/perfilProfesionalService';
import AvatarProfesional from './AvatarProfesional';
import PerfilProfesionalPublico from '../pages/PerfilProfesionalPublico';
import { Mensaje } from '../pages/Turnos';
import '../pages/PerfilProfesional.css';

const vacio = { fotoUrl: '', tituloProfesional: '', enfoqueProfesional: '', descripcionPublica: '', dirigidoA: '', idiomas: '', modalidadPublica: '', aceptaReintegro: false, lugaresIds: [] };
const campos = [
  ['fotoUrl', 'URL de la foto', 2048, 'url'],
  ['tituloProfesional', 'Título profesional', 191],
  ['enfoqueProfesional', 'Enfoque profesional', 191],
  ['descripcionPublica', 'Descripción profesional', 5000, 'textarea'],
  ['dirigidoA', 'Dirigido a', 500, 'textarea'],
  ['idiomas', 'Idiomas', 191],
];
function formularioDesde(perfil) { return Object.fromEntries(Object.entries(vacio).map(([k, v]) => [k, perfil?.[k] ?? v])); }
export default function EditarPerfilProfesional({ usuario }) {
  const [form, setForm] = useState(vacio);
  const [lugares, setLugares] = useState([]);
  const [cargaFallida, setCargaFallida] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [revision, setRevision] = useState(0);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    obtenerMiPerfilProfesional({ signal: c.signal }).then(datos => {
      if (!c.signal.aborted) { setForm(formularioDesde(datos.perfil)); setLugares(datos.lugaresDisponibles || []); setCargaFallida(false); setError(''); }
    }).catch(e => { if (!c.signal.aborted) { setError(e.message); setCargaFallida(true); } }).finally(() => { if (!c.signal.aborted) setCargando(false); });
    return () => c.abort();
  }, [usuario.id, revision]);
  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true); setError(''); setAviso('');
    const datos = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v]));
    try {
      const respuesta = await guardarMiPerfilProfesional(datos);
      setForm(formularioDesde(respuesta.perfil));
      setAviso('Tu presentación pública se guardó correctamente.');
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }
  if (vistaPrevia) return <PerfilProfesionalPublico key={usuario.psicologoId} profesionalId={usuario.psicologoId} onVolver={() => setVistaPrevia(false)} />;
  return <section className="perfil-editor" aria-labelledby="presentacion-publica-titulo"><div className="perfil-editor-titulo"><AvatarProfesional fotoUrl={form.fotoUrl} nombre={usuario.nombre} apellido={usuario.apellido} /><div><h2 id="presentacion-publica-titulo">Tu presentación pública</h2><p>Estos datos se muestran a quienes buscan atención. Todos los campos son opcionales.</p></div></div>
    <Mensaje {...{ error, aviso, cargando }} />
    {!cargando && !cargaFallida && <form className="perfil-editor-form" onSubmit={guardar}><fieldset disabled={guardando}>
      {campos.map(([campo, titulo, maxLength, tipo]) => <div className="perfil-editor-campo" key={campo}><label htmlFor={`publico-${campo}`}>{titulo}</label>{tipo === 'textarea' ? <textarea id={`publico-${campo}`} maxLength={maxLength} rows={campo === 'descripcionPublica' ? 6 : 2} value={form[campo]} onChange={e => setForm({ ...form, [campo]: e.target.value })} /> : <input id={`publico-${campo}`} type={tipo || 'text'} maxLength={maxLength} value={form[campo]} onChange={e => setForm({ ...form, [campo]: e.target.value })} />}{campo === 'fotoUrl' && <p>Usá una URL HTTPS de una imagen pública. Si no carga, mostramos tus iniciales.</p>}</div>)}
      <div className="perfil-editor-campo"><label htmlFor="publico-modalidadPublica">Modalidad pública</label><select id="publico-modalidadPublica" value={form.modalidadPublica} onChange={e => setForm({ ...form, modalidadPublica: e.target.value })}><option value="">Sin especificar</option><option value="PRESENCIAL">Presencial</option><option value="VIRTUAL">Virtual</option><option value="AMBAS">Presencial y virtual</option></select><p>La disponibilidad concreta depende de los horarios que publiques.</p></div>
      <label className="perfil-editor-check" htmlFor="publico-aceptaReintegro"><input id="publico-aceptaReintegro" type="checkbox" checked={form.aceptaReintegro} onChange={e => setForm({ ...form, aceptaReintegro: e.target.checked })} />Acepto reintegro</label>
      <fieldset className="perfil-editor-lugares"><legend>Lugares que mostrás públicamente</legend>{lugares.length ? lugares.map(l => <label key={l.id} className="perfil-editor-check"><input id={`publico-lugar-${l.id}`} type="checkbox" checked={form.lugaresIds.includes(l.id)} onChange={e => setForm({ ...form, lugaresIds: e.target.checked ? [...form.lugaresIds, l.id] : form.lugaresIds.filter(id => id !== l.id) })} /><span>{l.nombre} · {l.direccion}</span></label>) : <p>Creá un consultorio desde Lugares para poder publicarlo acá.</p>}<p>Las obras sociales se configuran desde Mis turnos → Obras sociales que atiendo.</p></fieldset>
      <div className="perfil-editor-acciones"><button className="perfil-boton-principal" type="submit">{guardando ? 'Guardando presentación…' : 'Guardar presentación pública'}</button><button type="button" className="perfil-boton-secundario" onClick={() => setVistaPrevia(true)}>Ver perfil público</button></div>
    </fieldset></form>}
    {!cargando && error && <button type="button" className="perfil-boton-secundario" onClick={() => { setCargando(true); setRevision(r => r + 1); }}>Volver a cargar presentación</button>}
  </section>;
}
