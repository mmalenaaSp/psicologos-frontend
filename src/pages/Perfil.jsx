import EditarPerfilProfesional from '../components/EditarPerfilProfesional';
import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import './Inicio.css';
import './Perfil.css';

function formularioInicial(perfil) {
  return {
    nombre: perfil?.nombre ?? '',
    apellido: perfil?.apellido ?? '',
    telefono: perfil?.telefono ?? '',
    dni: perfil?.dni ?? '',
    fechaNacimiento: perfil?.fechaNacimiento?.slice(0, 10) ?? '',
    obraSocialId: String(perfil?.obraSocialId ?? ''),
    nroMatricula: perfil?.nroMatricula ?? '',
    direccion: perfil?.direccion ?? '',
    colegioId: String(perfil?.colegioId ?? ''),
    colegioNombre: '',
    colegioDistrito: '',
    colegioDireccion: '',
  };
}

export default function Perfil({ usuario, onGuardado, onLogout, onVolver, completar = false }) {
  const [formulario, setFormulario] = useState(formularioInicial(null));
  const [opciones, setOpciones] = useState({ colegios: [], obrasSociales: [] });
  const [cargando, setCargando] = useState(true);
  const [cargaFallida, setCargaFallida] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [revision, setRevision] = useState(0);
  const profesional = usuario.rol === 'PSICOLOGO';

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest('/mi-perfil', { signal: controller.signal }),
      apiRequest('/mi-perfil/opciones', { signal: controller.signal }),
    ]).then(([datos, catalogos]) => {
      if (controller.signal.aborted) return;
      const inicial = formularioInicial(datos.perfil);
      if (datos.usuario.rol === 'PSICOLOGO' && !inicial.colegioId && !catalogos.colegios.length) {
        inicial.colegioId = 'nuevo';
      }
      setFormulario(inicial);
      setOpciones(catalogos);
      setCargaFallida(false);
      setError('');
    }).catch(err => {
      if (!controller.signal.aborted) {
        setError(err.message);
        setCargaFallida(true);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [usuario.id, revision]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(anterior => ({ ...anterior, [name]: value }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError('');
    setMensaje('');
    const comunes = {
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      telefono: formulario.telefono.trim(),
    };
    const datos = profesional ? {
      ...comunes,
      nroMatricula: formulario.nroMatricula.trim(),
      direccion: formulario.direccion.trim(),
      ...(formulario.colegioId === 'nuevo' ? {
        colegio: {
          nombre: formulario.colegioNombre.trim(),
          distrito: formulario.colegioDistrito.trim(),
          direccion: formulario.colegioDireccion.trim(),
        },
      } : { colegioId: Number(formulario.colegioId) }),
    } : {
      ...comunes,
      dni: formulario.dni.trim(),
      fechaNacimiento: formulario.fechaNacimiento,
      obraSocialId: formulario.obraSocialId ? Number(formulario.obraSocialId) : null,
    };
    try {
      const respuesta = await apiRequest('/mi-perfil', {
        method: 'PUT',
        body: JSON.stringify(datos),
      });
      if (profesional && formulario.colegioId === 'nuevo') {
        setOpciones(anterior => ({
          ...anterior,
          colegios: [...anterior.colegios, {
            id: respuesta.perfil.colegioId,
            nombre: formulario.colegioNombre.trim(),
            distrito: formulario.colegioDistrito.trim(),
          }],
        }));
      }
      setFormulario(formularioInicial(respuesta.perfil));
      setMensaje('Tu perfil se guardó correctamente.');
      onGuardado(respuesta.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className={`ps-inicio ps-perfil ${completar ? 'ps-perfil-completar' : ''}`}>
      <div className="ps-inicio-card ps-perfil-card">
        <p className="ps-inicio-eyebrow">{profesional ? 'ESPACIO PROFESIONAL' : 'PORTAL PERSONAL'}</p>
        <h1>{completar ? 'Completá tu perfil' : profesional ? 'Mi perfil profesional' : 'Mi perfil'}</h1>
        <p className="ps-inicio-description">
          {completar ? 'Tu cuenta ya está creada. Completá estos datos para ingresar a tu espacio.' : 'Consultá y actualizá tus datos personales.'}
        </p>
        <p className="ps-perfil-cuenta">{usuario.email} · {profesional ? 'Psicólogo' : 'Paciente'}</p>
        {completar && <p className="ps-inicio-aviso">Tu perfil se crea de forma independiente. Sólo vas a acceder a tu información y a los registros que crees en tu espacio.</p>}
        {error && <p className="ps-inicio-aviso" role="alert">{error}</p>}
        {mensaje && <p className="ps-inicio-aviso" role="status">{mensaje}</p>}
        {cargando ? <p role="status">Cargando perfil...</p> : cargaFallida ? (
          <button type="button" className="ps-inicio-submit" onClick={() => { setCargando(true); setRevision(anterior => anterior + 1); }}>Volver a cargar</button>
        ) : (
          <form className="ps-inicio-form ps-perfil-form" onSubmit={guardar}>
            <label htmlFor="perfil-nombre">Nombre *</label>
            <input id="perfil-nombre" name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={cambiar} required maxLength={100} disabled={guardando} />
            <label htmlFor="perfil-apellido">Apellido *</label>
            <input id="perfil-apellido" name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={cambiar} required maxLength={100} disabled={guardando} />
            <label htmlFor="perfil-telefono">Teléfono *</label>
            <input id="perfil-telefono" name="telefono" type="tel" autoComplete="tel" value={formulario.telefono} onChange={cambiar} required maxLength={50} disabled={guardando} />
            {profesional ? <>
              <label htmlFor="perfil-matricula">Número de matrícula *</label>
              <input id="perfil-matricula" name="nroMatricula" value={formulario.nroMatricula} onChange={cambiar} required maxLength={100} disabled={guardando} />
              <label htmlFor="perfil-direccion">Dirección profesional *</label>
              <input id="perfil-direccion" name="direccion" autoComplete="street-address" value={formulario.direccion} onChange={cambiar} required maxLength={200} disabled={guardando} />
              <label htmlFor="perfil-colegio">Colegio de psicólogos *</label>
              <select id="perfil-colegio" name="colegioId" value={formulario.colegioId} onChange={cambiar} required disabled={guardando}>
                <option value="">Seleccioná un colegio</option>
                {opciones.colegios.map(colegio => <option key={colegio.id} value={colegio.id}>{colegio.nombre} · {colegio.distrito}</option>)}
                <option value="nuevo">Agregar mi colegio</option>
              </select>
              {formulario.colegioId === 'nuevo' && <fieldset className="ps-perfil-colegio" disabled={guardando}>
                <legend>Datos de mi colegio</legend>
                <label htmlFor="perfil-colegio-nombre">Nombre del colegio *</label>
                <input id="perfil-colegio-nombre" name="colegioNombre" value={formulario.colegioNombre} onChange={cambiar} required maxLength={150} />
                <label htmlFor="perfil-colegio-distrito">Distrito *</label>
                <input id="perfil-colegio-distrito" name="colegioDistrito" value={formulario.colegioDistrito} onChange={cambiar} required maxLength={100} />
                <label htmlFor="perfil-colegio-direccion">Dirección del colegio *</label>
                <input id="perfil-colegio-direccion" name="colegioDireccion" value={formulario.colegioDireccion} onChange={cambiar} required maxLength={200} />
              </fieldset>}
            </> : <>
              <label htmlFor="perfil-dni">DNI *</label>
              <input id="perfil-dni" name="dni" inputMode="numeric" value={formulario.dni} onChange={cambiar} required maxLength={30} disabled={guardando} />
              <label htmlFor="perfil-fecha">Fecha de nacimiento *</label>
              <input id="perfil-fecha" name="fechaNacimiento" type="date" autoComplete="bday" value={formulario.fechaNacimiento} onChange={cambiar} required disabled={guardando} />
              <label htmlFor="perfil-obra-social">Obra social</label>
              <select id="perfil-obra-social" name="obraSocialId" value={formulario.obraSocialId} onChange={cambiar} disabled={guardando}>
                <option value="">Sin obra social</option>
                {opciones.obrasSociales.map(obra => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
              </select>
            </>}
            <p className="ps-perfil-ayuda">Los campos con * son obligatorios.</p>
            <button className="ps-inicio-submit" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : completar ? 'Guardar e ingresar' : 'Guardar cambios'}</button>
            {onVolver && <button className="ps-perfil-secundario" type="button" disabled={guardando} onClick={onVolver}>Volver a mi portal</button>}
          </form>
        )}
        {profesional && !completar && <EditarPerfilProfesional key={usuario.id} usuario={usuario} />}
        {onLogout && <button type="button" className="ps-perfil-secundario" onClick={onLogout} disabled={guardando}>Cerrar sesión</button>}
      </div>
    </section>
  );
}
