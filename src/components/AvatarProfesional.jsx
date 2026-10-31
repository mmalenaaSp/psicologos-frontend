import { useState } from 'react';
import { fotoPublicaSegura, inicialesProfesional } from '../services/perfilProfesionalService';
import '../pages/PerfilProfesional.css';
export default function AvatarProfesional({ fotoUrl, nombre, apellido, grande = false }) {
  const [fallida, setFallida] = useState(null);
  const foto = fotoPublicaSegura(fotoUrl);
  const className = `profesional-avatar${grande ? ' profesional-avatar-grande' : ''}`;
  return foto && fallida !== foto
    ? <img className={className} src={foto} alt={`Foto de ${nombre || ''} ${apellido || ''}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFallida(foto)} />
    : <span className={className} role="img" aria-label={`Iniciales de ${nombre || ''} ${apellido || ''}`}>{inicialesProfesional(nombre, apellido)}</span>;
}
