import Pacientes from './pages/Pacientes';
import './App.css'

function App() {
  return (
    <div className="app">
      <h1>Sistema de Psicólogos</h1>

      <p>
        Gestión de turnos para pacientes y profesionales
      </p>

      <div>
        <button>Ingresar</button>
        <button>Registrarse</button>
      </div>
      <Pacientes />
    </div>
    
  )
}

export default App