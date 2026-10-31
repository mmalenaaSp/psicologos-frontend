import { apiRequest } from '../services/api';

import { useState } from 'react';
import './Inicio.css';

export default function Inicio({ onLogin }) {
  const [seccion, setSeccion] = useState('acerca');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aviso, setAviso] = useState('');

  const [registro, setRegistro] = useState(false);
  const [rolRegistro, setRolRegistro] = useState('PSICOLOGO');
  const [enviando, setEnviando] = useState(false);
  async function iniciarSesion(evento) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setAviso('');
    let cuentaCreada = false;
    try {
      if (registro) {
        await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ email: correo, password, rol: rolRegistro }) });
        cuentaCreada = true;
        setRegistro(false);
        await onLogin(correo, password);
      } else {
        await onLogin(correo, password);
      }
      setPassword('');
    } catch (error) {
      setAviso((cuentaCreada ? 'Tu cuenta ya está creada. Iniciá sesión para continuar. ' : '') + (error.message || 'No se pudo conectar con el servidor.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="ps-inicio">
      <header className="ps-inicio-header">
        <button type="button" className="ps-inicio-brand ps-inicio-brand-home" aria-label="PsycoGest: ir a la página pública" onClick={() => setSeccion('acerca')}>
          <span className="ps-inicio-logo" aria-hidden="true">P.</span>
          <span>PsycoGest</span>
        </button>

        <nav aria-label="Navegación pública">
          <button
            type="button"
            className={seccion === 'login' ? 'activo' : ''}
            onClick={() => setSeccion('login')}
          >
            Iniciar sesión
          </button>

          <button
            type="button"
            className={seccion === 'acerca' ? 'activo' : ''}
            onClick={() => setSeccion('acerca')}
          >
            ¿Qué es PsycoGest?
          </button>
        </nav>
      </header>

      <main className="ps-inicio-main">
        {seccion === 'login' ? (
          <section className="ps-inicio-card">
            <p className="ps-inicio-eyebrow">
              BIENVENIDO A PSYCOGEST
            </p>

            <h1>Tu práctica, más organizada.</h1>

            <p className="ps-inicio-description">
              Accedé a tu espacio de gestión de manera
              sencilla y segura.
            </p>

            {registro && <><h2>Crear mi cuenta</h2><p>Elegí tu rol. Al ingresar vas a completar tu perfil para comenzar.</p></>}
            <form
              className="ps-inicio-form"
              onSubmit={iniciarSesion}
            >
              {registro && <><label htmlFor="rol-registro">Tipo de cuenta</label><select id="rol-registro" value={rolRegistro} disabled={enviando} onChange={e => setRolRegistro(e.target.value)}><option value="PSICOLOGO">Psicólogo</option><option value="PACIENTE">Paciente</option></select></>}
              <label htmlFor="ps-correo">
                Correo electrónico
              </label>

              <input
                id="ps-correo"
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu@email.com"
                disabled={enviando}
                required
              />

              <label htmlFor="ps-password">
                Contraseña
              </label>

              <div className="ps-password-field">
                <input
                  id="ps-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete={registro ? "new-password" : "current-password"}
                  minLength={registro ? 12 : undefined}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  disabled={enviando}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(!mostrarPassword)
                  }
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >
                  {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {registro && <p className="ps-perfil-ayuda">Usá una contraseña de al menos 12 caracteres.</p>}
              <button
                className="ps-inicio-submit"
                type="submit" disabled={enviando}
              >
                {enviando ? 'Procesando...' : registro ? 'Crear cuenta e ingresar' : 'Iniciar sesión'}
              </button>
            </form>

            {aviso && (
              <p className="ps-inicio-aviso" role="status">
                {aviso}
              </p>
            )}

            <p className="ps-inicio-register">
              ¿Todavía no tenés cuenta?
              <button
                type="button"
                disabled={enviando}
                onClick={() => { setRegistro(!registro); setPassword(''); setAviso(''); }}
              >
                {registro ? 'Volver al login' : 'Registrate'}
              </button>
            </p>
          </section>
        ) : (
          <section className="ps-inicio-about">
            <p className="ps-inicio-eyebrow">
              CONOCÉ NUESTRA PLATAFORMA
            </p>

            <h1>Tu práctica, más organizada.</h1>

            <p className="ps-inicio-description">
              PsycoGest es una plataforma de gestión
              pensada para facilitar la organización
              del trabajo de profesionales de la salud mental.
            </p>

            <p>
              Nuestro objetivo es reunir en un mismo
              sistema la información necesaria para
              administrar pacientes, profesionales,
              lugares de atención y tipos de sesión.
            </p>

            <div className="ps-inicio-benefits">
              <article>
                <h2>Gestión centralizada</h2>
                <p>
                  Organizá los registros y consultá
                  la información desde un mismo lugar.
                </p>
              </article>

              <article>
                <h2>Organización profesional</h2>
                <p>
                  Administrá pacientes, horarios, reservas, liquidaciones y las distintas
                  modalidades de atención.
                </p>
              </article>

              <article>
                <h2>Encontrá tu espacio de atención</h2>
                <p>
                  Buscá profesionales por cobertura, ubicación y modalidad.
                  Consultá horarios disponibles y reservá desde tu portal de paciente.
                </p>
              </article>
            </div>

            <button
              type="button"
              className="ps-inicio-submit"
              onClick={() => setSeccion('login')}
            >
              Ir a iniciar sesión
            </button>
          </section>
        )}
      </main>

      <footer className="ps-inicio-footer">
        PsycoGest · Tu práctica, más organizada.
      </footer>
    </div>
  );
}
