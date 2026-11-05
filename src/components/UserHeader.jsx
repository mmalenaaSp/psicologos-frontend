import { useEffect, useId, useRef, useState } from 'react';
import './UserHeader.css';

function Icono({ tipo }) {
  const trazos = {
    correo: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    perfil: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2Z" /></>,
    salir: <><path d="M9 3H4v18h5M14 8l5 4-5 4M8 12h11" /></>,
    flecha: <path d="m6 9 6 6 6-6" />,
  };
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{trazos[tipo]}</svg>;
}

export default function UserHeader({ usuario, onEditar, onLogout }) {
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const contenedor = useRef(null);
  const boton = useRef(null);
  const panel = useRef(null);
  const id = useId();
  const nombre = usuario.nombre?.trim() || '';
  const iniciales = [nombre, usuario.apellido?.trim()].filter(Boolean).map(parte => Array.from(parte)[0]).join('').toLocaleUpperCase() || '?';

  useEffect(() => {
    if (!abierto) return;
    function fuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false);
    }
    function escape(evento) {
      if (evento.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    }
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  function teclado(evento) {
    const items = [...panel.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const indice = items.indexOf(document.activeElement);
    let siguiente;
    if (evento.key === 'ArrowDown') siguiente = (indice + 1) % items.length;
    if (evento.key === 'ArrowUp') siguiente = (indice - 1 + items.length) % items.length;
    if (evento.key === 'Home') siguiente = 0;
    if (evento.key === 'End') siguiente = items.length - 1;
    if (siguiente !== undefined) { evento.preventDefault(); items[siguiente]?.focus(); }
  }

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    try { await onLogout(); } finally { setSaliendo(false); }
  }

  return <header className="pg-topbar pg-user-header">
    <p className="pg-greeting">{nombre ? `Hola, ${nombre}!` : 'Hola!'}</p>
    <div className="pg-user" ref={contenedor} onBlur={evento => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) setAbierto(false);
    }}>
      <button className="pg-profile-trigger" ref={boton} type="button" aria-label={`Menú de usuario${nombre ? ` de ${nombre}` : ''}`} aria-haspopup="menu" aria-expanded={abierto} aria-controls={abierto ? id : undefined}
        onClick={() => setAbierto(valor => !valor)} onKeyDown={evento => {
          if (['ArrowDown', 'ArrowUp'].includes(evento.key)) {
            evento.preventDefault(); setAbierto(true);
            requestAnimationFrame(() => {
              const items = panel.current?.querySelectorAll('[role="menuitem"]');
              items?.[evento.key === 'ArrowUp' ? items.length - 1 : 0]?.focus();
            });
          }
        }}>
        <span className="pg-avatar" aria-hidden="true">{iniciales}</span>
        <span className="pg-profile-name">{nombre || 'Mi cuenta'}</span>
        <Icono tipo="flecha" />
      </button>
      {abierto && <div className="pg-user-dropdown">
        <div className="pg-account-email"><Icono tipo="correo" /><span>{usuario.email}</span></div>
        <div id={id} ref={panel} role="menu" aria-label="Opciones de usuario" onKeyDown={teclado}>
          <button type="button" role="menuitem" onClick={() => { setAbierto(false); boton.current?.focus(); onEditar(); }}><Icono tipo="perfil" />Modificar mis datos</button>
          <button type="button" role="menuitem" className="pg-user-logout" disabled={saliendo} onClick={salir}><Icono tipo="salir" />{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
        </div>
      </div>}
    </div>
  </header>;
}
