import { useState } from 'react';
import Pacientes from './pages/Pacientes';
import TipoSesionPage from './components/TipoSesionPage';
import LugarPage from './components/LugarPage';
import './App.css';
import './styles/theme.css';
import './styles/layout.css';

const pantallas = [
  { id: 'pacientes', etiqueta: 'Pacientes' },
  { id: 'tipos-sesion', etiqueta: 'Tipos de sesión' },
  { id: 'lugares', etiqueta: 'Lugares' }
];

function App() {
  const [pantallaActiva, setPantallaActiva] = useState('pacientes');

  return (
    <>
      <nav className="app-navigation" aria-label="Secciones de gestión">
        <span className="app-navigation-brand">PsycoGest</span>
        <div className="app-navigation-links">
          {pantallas.map(({ id, etiqueta }) => (
            <button
              key={id}
              type="button"
              className={`app-navigation-link ${pantallaActiva === id ? 'is-active' : ''}`}
              aria-current={pantallaActiva === id ? 'page' : undefined}
              onClick={() => setPantallaActiva(id)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </nav>
      {pantallaActiva === 'pacientes' && <Pacientes />}
      {pantallaActiva === 'tipos-sesion' && <TipoSesionPage />}
      {pantallaActiva === 'lugares' && <LugarPage />}
    </>
  );
}

export default App;
