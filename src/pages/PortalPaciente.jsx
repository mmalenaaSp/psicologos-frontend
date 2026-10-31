import { useState } from 'react';
import Perfil from './Perfil';
import UserHeader from '../components/UserHeader';
import Turnos from './Turnos';
import BuscarProfesionales from './BuscarProfesionales';
import Dashboard from './Dashboard';

export default function PortalPaciente({ usuario, onLogout, onPerfilGuardado }) {
  const [pantalla, setPantalla] = useState('inicio');
  const secciones = [['inicio', 'Inicio'], ['buscar', 'Buscar profesionales'], ['turnos', 'Mis turnos'], ['perfil', 'Mi perfil']];
  return <div className="pg-shell">
    <aside className="pg-sidebar">
      <button type="button" className="pg-brand pg-brand-home" aria-label="PsycoGest: ir a Inicio" onClick={() => setPantalla('inicio')}><span className="pg-brand-logo" aria-hidden="true">P.</span><span><span className="pg-brand-name">PsycoGest</span><span className="pg-brand-tagline">Tu espacio de atención.</span></span></button>
      <nav className="pg-navigation" aria-label="Portal del paciente">{secciones.map(([id, titulo]) => <button key={id} className={`pg-nav-item ${pantalla === id ? 'pg-nav-active' : ''}`} aria-current={pantalla === id ? 'page' : undefined} onClick={() => setPantalla(id)}>{titulo}</button>)}</nav>
    </aside>
    <div className="pg-workspace">
      <UserHeader usuario={usuario} onLogout={onLogout} onEditar={() => setPantalla('perfil')} />
      <main className="pg-content">
        {pantalla === 'inicio' && <Dashboard key={usuario.id} usuario={usuario} onNavegar={setPantalla} />}
        {pantalla === 'buscar' && <BuscarProfesionales />}
        {pantalla === 'turnos' && <Turnos />}
        {pantalla === 'perfil' && <Perfil usuario={usuario} onGuardado={onPerfilGuardado} />}
      </main>
    </div>
  </div>;
}
