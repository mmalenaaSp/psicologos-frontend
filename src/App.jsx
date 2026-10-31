import Dashboard from './pages/Dashboard';
import ObrasSociales from './pages/ObrasSociales';
import Liquidaciones from './pages/Liquidaciones';
import Turnos from './pages/Turnos';
import { useEffect, useRef, useState } from 'react';
import { apiRequest } from './services/api';
import Pacientes from './pages/Pacientes';
import TipoSesionPage from './components/TipoSesionPage';
import LugarPage from './components/LugarPage';
import Inicio from './pages/Inicio';
import Perfil from './pages/Perfil';
import PortalPaciente from './pages/PortalPaciente';
import UserHeader from './components/UserHeader';
import './App.css';
import './styles/layout.css';

function PanelGestion({ usuario, onLogout, onPerfilGuardado }) {
  const [pantallaActual, setPantallaActual] = useState('inicio');
  const [publicarHorario, setPublicarHorario] = useState(false);
  function navegar(destino) {
    setPublicarHorario(destino === 'publicar-horario');
    setPantallaActual(destino === 'publicar-horario' ? 'turnos' : destino);
  }
  const secciones = [
    ['inicio', 'Inicio'],
    ['pacientes', 'Pacientes'],
    ['turnos', 'Mis turnos'],
    ['liquidaciones', 'Liquidaciones'],
    ['obras-sociales', 'Obras sociales'],
    ['perfil', 'Mi perfil profesional'],
    ['tipos-sesion', 'Tipos de sesión'],
    ['lugares', 'Lugares'],
  ];
  return (
    <div className="pg-shell">
      <aside className="pg-sidebar">
        <button type="button" className="pg-brand pg-brand-home" aria-label="PsycoGest: ir a Inicio" onClick={() => navegar('inicio')}>
          <span className="pg-brand-logo" aria-hidden="true">P.</span>
          <span><span className="pg-brand-name">PsycoGest</span><span className="pg-brand-tagline">Tu práctica, más organizada.</span></span>
        </button>
        <nav className="pg-navigation" aria-label="Navegación principal">
          <span className="pg-nav-label">GESTIÓN</span>
          {secciones.map(([id, titulo]) => (
            <button
              key={id}
              type="button"
              className={`pg-nav-item ${pantallaActual === id ? 'pg-nav-active' : ''}`}
              aria-current={pantallaActual === id ? 'page' : undefined}
              onClick={() => navegar(id)}
            >{titulo}</button>
          ))}


        </nav>
      </aside>
      <div className="pg-workspace">
        <UserHeader usuario={usuario} onLogout={onLogout} onEditar={() => setPantallaActual('perfil')} />
        <main className="pg-content">
          {pantallaActual === 'inicio' && <Dashboard key={usuario.id} usuario={usuario} onNavegar={navegar} />}
          {pantallaActual === 'pacientes' && <Pacientes />}
          {pantallaActual === 'turnos' && <Turnos profesional publicar={publicarHorario} />}
          {pantallaActual === 'liquidaciones' && <Liquidaciones />}
          {pantallaActual === 'obras-sociales' && <ObrasSociales />}
          {pantallaActual === 'perfil' && <Perfil usuario={usuario} onGuardado={onPerfilGuardado} />}
          {pantallaActual === 'tipos-sesion' && <TipoSesionPage />}
          {pantallaActual === 'lugares' && <LugarPage />}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const revisionSesion = useRef(0);
  const operacionAuth = useRef(false);

  useEffect(() => {
    let vigente = true;
    const verificar = async () => {
      if (operacionAuth.current) return;
      const revision = ++revisionSesion.current;
      try {
        const datos = await apiRequest('/auth/me');
        if (vigente && revision === revisionSesion.current) setUsuario(datos.usuario);
      } catch {
        if (vigente && revision === revisionSesion.current) setUsuario(null);
      } finally {
        if (vigente && revision === revisionSesion.current) setCargando(false);
      }
    };
    verificar();
    window.addEventListener('psycogest:session-invalid', verificar);
    return () => {
      vigente = false;
      revisionSesion.current += 1;
      window.removeEventListener('psycogest:session-invalid', verificar);
    };
  }, []);

  async function login(email, password) {
    const revision = ++revisionSesion.current;
    operacionAuth.current = true;
    try {
      const datos = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (revision !== revisionSesion.current) return;
      setError('');
      setUsuario(datos.usuario);
    } finally {
      if (revision === revisionSesion.current) operacionAuth.current = false;
    }
  }

  async function logout() {
    const revision = ++revisionSesion.current;
    operacionAuth.current = true;
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      if (revision !== revisionSesion.current) return;
      setUsuario(null);
      setError('');
    } catch {
      if (revision === revisionSesion.current) setError('No se pudo cerrar la sesión. Volvé a intentar.');
    } finally {
      if (revision === revisionSesion.current) operacionAuth.current = false;
    }
  }

  function perfilGuardado(actualizado) {
    // Una consulta de sesión anterior no debe restaurar el estado de perfil incompleto.
    revisionSesion.current += 1;
    setUsuario(actualizado);
  }

  if (cargando) return <p role="status">Verificando sesión...</p>;
  if (!usuario) return <Inicio onLogin={login} />;
  if (!['PSICOLOGO', 'PACIENTE'].includes(usuario.rol)) {
    return <section><p>Cuenta sin acceso autorizado.</p><button type="button" onClick={logout}>Cerrar sesión</button></section>;
  }
  return <>
    {error && <p role="alert">{error}</p>}
    {usuario.perfilCompleto !== true
      ? <Perfil usuario={usuario} completar onGuardado={perfilGuardado} onLogout={logout} />
      : usuario.rol === 'PSICOLOGO'
        ? <PanelGestion usuario={usuario} onLogout={logout} onPerfilGuardado={perfilGuardado} />
        : <PortalPaciente usuario={usuario} onLogout={logout} onPerfilGuardado={perfilGuardado} />}
  </>;
}

export default App;
