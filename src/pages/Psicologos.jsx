
import './Psicologos.css';

import { useEffect, useState } from 'react';

import { obtenerPsicologos } from '../services/psicologoService';

import Modal from '../components/Modal';
import FormularioPsicologo from '../components/FormularioPsicologo';

function Psicologos() {

  // ==========================================
  // 1. ESTADOS
  // ==========================================

  const [psicologos, setPsicologos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados de la interfaz
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mensajeAlta, setMensajeAlta] = useState('');


  // ==========================================
  // 2. READ: CARGAR PSICÓLOGOS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const cargarPsicologos = async () => {
      try {
        const datos = await obtenerPsicologos(controller.signal);

        setPsicologos(datos);
        setError('');

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }

      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarPsicologos();

    return () => controller.abort();
  }, []);


  // ==========================================
  // 3. CREATE: REGISTRAR PSICÓLOGO
  // ==========================================

  // Abrir el formulario de registro
  const abrirAlta = () => {
    setMensajeAlta('');
    setMostrarAlta(true);
  };

  // Cerrar el formulario cuando termina el registro
  const finalizarAlta = async () => {
    setMostrarAlta(false);
    setBusqueda('');
    setMensajeAlta('Psicólogo registrado correctamente.');
    setError('');
    setCargando(true);

    // Actualizar el listado desde el backend
    try {
      const datos = await obtenerPsicologos();

      setPsicologos(datos);

    } catch (err) {
      setError(
        'El registro se realizó, pero no se pudo actualizar el listado: ' +
        err.message
      );

    } finally {
      setCargando(false);
    }
  };


  // ==========================================
  // 4. BÚSQUEDA DE PSICÓLOGOS
  // ==========================================

  const termino = busqueda.trim().toLocaleLowerCase('es');

  const psicologosFiltrados = psicologos.filter((psicologo) => {
    const nombreCompleto =
      `${psicologo.nombre ?? ''} ${psicologo.apellido ?? ''}`;

    return [
      psicologo.nombre,
      psicologo.apellido,
      nombreCompleto,
      psicologo.nroMatricula,
      psicologo.email
    ].some((valor) =>
      String(valor ?? '')
        .toLocaleLowerCase('es')
        .includes(termino)
    );
  });


  // ==========================================
  // 5. INTERFAZ
  // ==========================================

  return (
    <section className="psicologos-page">

      {/* ======================================
          ENCABEZADO
          ====================================== */}

      <div className="psicologos-encabezado">

        <div>
          <h2>Gestión de Psicólogos</h2>

          <p>
            Consultá los profesionales registrados en PsycoGest.
          </p>
        </div>

        <div className="psicologos-acciones">

          <span className="psicologos-contador">
            {psicologos.length} profesionales
          </span>

          <button
            type="button"
            className="psicologos-nuevo"
            onClick={abrirAlta}
          >
            + Nuevo psicólogo
          </button>

        </div>
      </div>


      {/* ======================================
          MENSAJES
          ====================================== */}

      {mensajeAlta && (
        <p className="psicologos-exito" role="status">
          {mensajeAlta}
        </p>
      )}


      {/* ======================================
          PANEL PRINCIPAL
          ====================================== */}

      <div className="psicologos-panel">

        {/* BUSCADOR */}

        <div className="psicologos-toolbar">

          <label htmlFor="buscar-psicologo">
            Buscar profesional
          </label>

          <input
            id="buscar-psicologo"
            type="search"
            placeholder="Nombre, apellido, matrícula o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

        </div>


        {/* ESTADO DE CARGA */}

        {cargando && (
          <p>Cargando psicólogos...</p>
        )}


        {/* ERRORES */}

        {error && (
          <p className="psicologos-error" role="alert">
            {error}
          </p>
        )}


        {/* SIN PSICÓLOGOS REGISTRADOS */}

        {!cargando && !error && psicologos.length === 0 && (
          <div className="psicologos-vacio">

            <h3>
              Todavía no hay profesionales registrados
            </h3>

            <p>
              Los psicólogos que se registren aparecerán acá.
            </p>

          </div>
        )}


        {/* SIN RESULTADOS DE BÚSQUEDA */}

        {!cargando &&
          !error &&
          psicologos.length > 0 &&
          psicologosFiltrados.length === 0 && (

            <div className="psicologos-vacio">

              <h3>No encontramos resultados</h3>

              <p>
                Probá con otro nombre o número de matrícula.
              </p>

            </div>
          )}


        {/* ==================================
            TABLA DE PSICÓLOGOS
            ================================== */}

        {!cargando &&
          !error &&
          psicologosFiltrados.length > 0 && (

            <div className="psicologos-tabla-contenedor">

              <table>

                <thead>
                  <tr>
                    <th>Profesional</th>
                    <th>Matrícula</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>

                  {psicologosFiltrados.map((psicologo) => (

                    <tr key={psicologo.id}>

                      <td>
                        <div className="psicologos-profesional">

                          <span className="psicologos-avatar">
                            {psicologo.nombre?.charAt(0).toUpperCase() || 'P'}
                          </span>

                          <span>
                            {psicologo.nombre} {psicologo.apellido}
                          </span>

                        </div>
                      </td>

                      <td>
                        {psicologo.nroMatricula}
                      </td>

                      <td>
                        {psicologo.email}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="psicologos-ver"
                          onClick={() => setSeleccionado(psicologo)}
                        >
                          Ver detalles
                        </button>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

      </div>


      {/* ======================================
          MODAL: VER DETALLES
          ====================================== */}

      {seleccionado && (

        <Modal
          titulo="Ficha del profesional"
          onCerrar={() => setSeleccionado(null)}
        >

          <div className="psicologos-ficha">

            <div>
              <span>Nombre completo</span>
              <strong>
                {seleccionado.nombre} {seleccionado.apellido}
              </strong>
            </div>

            <div>
              <span>Número de matrícula</span>
              <strong>
                {seleccionado.nroMatricula}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {seleccionado.email}
              </strong>
            </div>

            <div>
              <span>Teléfono</span>
              <strong>
                {seleccionado.telefono || 'No informado'}
              </strong>
            </div>

            <div>
              <span>Dirección</span>
              <strong>
                {seleccionado.direccion || 'No informada'}
              </strong>
            </div>

            <div>
              <span>ID del Colegio de Psicólogos</span>
              <strong>
                {seleccionado.colegioId ?? 'No informado'}
              </strong>
            </div>

          </div>

        </Modal>
      )}


      {/* ======================================
          MODAL: REGISTRAR PSICÓLOGO
          ====================================== */}

      {mostrarAlta && (

        <Modal
          titulo="Registrar nuevo psicólogo"
          onCerrar={() => setMostrarAlta(false)}
        >

          <FormularioPsicologo
            onCreado={finalizarAlta}
          />

        </Modal>
      )}

    </section>
  );
}

export default Psicologos;
