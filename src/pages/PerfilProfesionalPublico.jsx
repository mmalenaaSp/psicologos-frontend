import { useEffect, useState } from 'react';
import { obtenerPerfilProfesionalPublico, modalidadProfesional } from '../services/perfilProfesionalService';
import AvatarProfesional from '../components/AvatarProfesional';
import { Mensaje } from './Turnos';
import './PerfilProfesional.css';

export default function PerfilProfesionalPublico({ profesionalId, onVolver, onVerDisponibilidad }) {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    obtenerPerfilProfesionalPublico(profesionalId, { signal: controller.signal }).then(datos => {
      if (!controller.signal.aborted) { setPerfil(datos); setError(''); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [profesionalId, revision]);
  function reintentar() { setCargando(true); setError(''); setRevision(r => r + 1); }
  return <section className="perfil-publico" aria-label="Perfil público profesional">
    <button type="button" className="perfil-boton-secundario" onClick={onVolver}>Volver</button>
    <Mensaje error={error} cargando={cargando} />
    {error && <button type="button" className="perfil-boton-secundario" onClick={reintentar}>Volver a intentar</button>}
    {!cargando && !error && perfil && <>
      <header className="perfil-publico-cabecera">
        <AvatarProfesional {...perfil} grande />
        <div className="perfil-publico-identidad"><p className="perfil-publico-etiqueta">CONOCÉ A TU PROFESIONAL</p><h1>{perfil.nombre} {perfil.apellido}</h1>{perfil.tituloProfesional && <p className="perfil-publico-titulo">{perfil.tituloProfesional}</p>}<p>Matrícula {perfil.nroMatricula}</p><p>{modalidadProfesional(perfil.modalidadPublica)}</p></div>
        {onVerDisponibilidad && <button type="button" className="perfil-boton-principal" onClick={() => onVerDisponibilidad(perfil)}>Ver disponibilidad</button>}
      </header>
      <div className="perfil-publico-contenido"><div>
        <section className="perfil-publico-panel"><h2>Presentación profesional</h2>{perfil.enfoqueProfesional && <p className="perfil-publico-enfoque">{perfil.enfoqueProfesional}</p>}<p className="perfil-texto-largo">{perfil.descripcionPublica || 'Este profesional todavía no agregó una presentación.'}</p></section>
        <section className="perfil-publico-panel"><h2>Acerca de la atención</h2><dl className="perfil-publico-datos"><div><dt>Dirigido a</dt><dd>{perfil.dirigidoA || 'Consultar al profesional'}</dd></div><div><dt>Idiomas</dt><dd>{perfil.idiomas || 'Sin especificar'}</dd></div><div><dt>Modalidad</dt><dd>{modalidadProfesional(perfil.modalidadPublica)}</dd></div><div><dt>Reintegro</dt><dd>{perfil.aceptaReintegro ? 'El profesional indica que acepta reintegro. Consultá las condiciones de tu cobertura.' : 'No se informó aceptación de reintegro.'}</dd></div></dl></section>
      </div><aside>
        <section className="perfil-publico-panel"><h2>Obras sociales y coberturas</h2>{perfil.obrasSociales?.length ? <ul>{perfil.obrasSociales.map(o => <li key={o.id}>{o.nombre}</li>)}</ul> : <p>Sin coberturas informadas. Consultá por atención particular.</p>}</section>
        <section className="perfil-publico-panel"><h2>Lugares de atención</h2>{perfil.lugares?.length ? <ul className="perfil-lugares">{perfil.lugares.map(l => <li key={l.id}><strong>{l.nombre}</strong><span>{l.direccion}</span></li>)}</ul> : <p>No hay consultorios publicados.</p>}</section>
      </aside></div>
      {onVerDisponibilidad && <div className="perfil-publico-reservar"><div><h2>Encontrá un horario para vos</h2><p>Consultá la agenda disponible antes de confirmar tu reserva.</p></div><button type="button" className="perfil-boton-principal" onClick={() => onVerDisponibilidad(perfil)}>Ver disponibilidad</button></div>}
    </>}
  </section>;
}
