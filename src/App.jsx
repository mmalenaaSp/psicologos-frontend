import { useState } from 'react';
import Pacientes from './pages/Pacientes';
import Psicologos from './pages/Psicologos';
import TipoSesionPage from './components/TipoSesionPage';
import LugarPage from './components/LugarPage';
import './App.css';
import './styles/layout.css';

function App() {
  // Controla qué pantalla está seleccionada
  const [pantallaActual, setPantallaActual] = useState('pacientes');

  return (
    <div className="pg-shell">

      {/* Menú lateral */}
      <aside className="pg-sidebar">

        <div className="pg-brand">
          <div className="pg-brand-logo">P.</div>

          <div>
            <h1>PsycoGest</h1>
            <p>Tu práctica, más organizada.</p>
          </div>
        </div>

        <nav
          className="pg-navigation"
          aria-label="Navegación principal"
        >
          <span className="pg-nav-label">GESTIÓN</span>

          {/* PACIENTES */}
          <button
            type="button"
            className={`pg-nav-item ${
              pantallaActual === 'pacientes' ? 'pg-nav-active' : ''
            }`}
            aria-current={
              pantallaActual === 'pacientes' ? 'page' : undefined
            }
            onClick={() => setPantallaActual('pacientes')}
          >
            Pacientes
          </button>

          {/* PSICÓLOGOS */}
          <button
            type="button"
            className={`pg-nav-item ${
              pantallaActual === 'psicologos' ? 'pg-nav-active' : ''
            }`}
            aria-current={
              pantallaActual === 'psicologos' ? 'page' : undefined
            }
            onClick={() => setPantallaActual('psicologos')}
          >
            Psicólogos
          </button>

          <button
              type="button"
              className={`pg-nav-item ${
                pantallaActual === 'tipos-sesion' ? 'pg-nav-active' : ''
              }`}
              aria-current={pantallaActual === 'tipos-sesion' ? 'page' : undefined}
              onClick={() => setPantallaActual('tipos-sesion')}
            >
              Tipos de sesión
            </button>

            <button
              type="button"
              className={`pg-nav-item ${
                pantallaActual === 'lugares' ? 'pg-nav-active' : ''
              }`}
              aria-current={pantallaActual === 'lugares' ? 'page' : undefined}
              onClick={() => setPantallaActual('lugares')}
            >
              Lugares
            </button>

          {/* PRÓXIMAS FUNCIONALIDADES */}
          <span className="pg-nav-item pg-nav-disabled">
            Turnos · Próximamente
          </span>

          <span className="pg-nav-item pg-nav-disabled">
            Liquidaciones · Próximamente
          </span>
        </nav>

        <div className="pg-sidebar-footer">
          PsycoGest · En desarrollo
        </div>
      </aside>

      {/* Área principal */}
      <div className="pg-workspace">

        <header className="pg-topbar">
          <span>Panel de administración</span>

          <span className="pg-environment">
            Entorno de desarrollo
          </span>
        </header>

        <main className="pg-content">

          {pantallaActual === 'pacientes' && (
            <Pacientes />
          )}

          {pantallaActual === 'psicologos' && (
            <Psicologos />
          )}

          {pantallaActual === 'tipos-sesion' && (
            <TipoSesionPage />
          )}

          {pantallaActual === 'lugares' && (
            <LugarPage />
          )}

        </main>
      </div>

    </div>
  );
}

export default App;