
import Pacientes from './pages/Pacientes';
import './styles/layout.css';

function App() {
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

        <nav className="pg-navigation" aria-label="Navegación principal">
          <span className="pg-nav-label">GESTIÓN</span>

          <span className="pg-nav-item pg-nav-active" aria-current="page">
            Pacientes
          </span>

          <span className="pg-nav-item pg-nav-disabled">
            Psicólogos · Próximamente
          </span>

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
          <Pacientes />
        </main>
      </div>
    </div>
  );
}

export default App;
