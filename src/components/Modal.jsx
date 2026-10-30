import { useEffect, useId, useRef } from 'react';
import './Modal.css';

function Modal({ titulo, onCerrar, children }) {
  const dialogRef = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const dialogo = dialogRef.current;

    if (dialogo && !dialogo.open) {
      dialogo.showModal();
    }

    return () => {
      if (dialogo?.open) {
        dialogo.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="pg-modal"
      aria-labelledby={tituloId}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <div className="pg-modal__header">
        <h2 id={tituloId}>{titulo}</h2>

        <button
          type="button"
          className="pg-modal__cerrar"
          onClick={onCerrar}
          aria-label="Cerrar ventana"
        >
          ×
        </button>
      </div>

      <div className="pg-modal__contenido">
        {children}
      </div>
    </dialog>
  );
}

export default Modal;