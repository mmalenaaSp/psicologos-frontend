import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { obtenerMiPerfilProfesional } from '../services/perfilProfesionalService';
import { Campo, Confirmacion, Mensaje } from './Turnos';

export default function Liquidaciones() {
  const [items, setItems] = useState([]);
  const [obras, setObras] = useState([]);
  const [obraSocialId, setObra] = useState('');
  const [estado, setEstado] = useState('');
  const [sesiones, setSesiones] = useState([]);
  const [importes, setImportes] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  useEffect(() => {
    const c = new AbortController();

    Promise.all([
      apiRequest(`/liquidaciones?${new URLSearchParams({ ...(obraSocialId ? { obraSocialId } : {}), ...(estado ? { estado } : {}) })}`, { signal: c.signal }),
      obtenerMiPerfilProfesional({ signal: c.signal }),
      apiRequest('/turnos?estado=RESERVADO', { signal: c.signal })
    ])
      .then(([l, perfilDatos, t]) => {
        if (!c.signal.aborted) {
          setItems(l || []);

          // Filtrar las obras sociales del catálogo global dejando solo las marcadas por el psicólogo
          const idsSeleccionados = perfilDatos.perfil?.obrasSocialesIds || [];
          const disponibles = perfilDatos.obrasSocialesDisponibles || [];
          const asignadas = disponibles.filter(o => idsSeleccionados.includes(o.id));

          setObras(asignadas);
          setSesiones(t || []);
        }
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message);
      });

    return () => c.abort();
  }, [obraSocialId, estado]);

  async function ejecutar() {
    if (ocupado) return;
    setOcupado(true);
    setError('');
    setAviso('');

    try {
      if (confirmacion && confirmacion.id) {
        // Registrar pago
        await apiRequest(`/liquidaciones/${confirmacion.id}/pagar`, { method: 'PATCH', body: '{}' });
        setAviso('Liquidación marcada como pagada.');
      } else {
        // Emitir nueva liquidación
        const detalles = Object.entries(importes)
          .filter(([, v]) => v !== '' && !isNaN(Number(v)) && Number(v) > 0)
          .map(([turnoId, importe]) => ({
            turnoId: Number(turnoId),
            importe: Number(importe)
          }));

        if (detalles.length === 0) {
          throw new Error('Debes ingresar al menos un importe válido para emitir la liquidación.');
        }

        const bodyPayload = {
          obraSocialId: Number(obraSocialId),
          detalles
        };

        console.log('Enviando liquidacion:', bodyPayload);

        await apiRequest('/liquidaciones', {
          method: 'POST',
          body: JSON.stringify(bodyPayload)
        });

        setImportes({});
        setAviso('Liquidación guardada correctamente.');
      }

      setConfirmacion(null);

      // Refrescar datos
      const [lActualizadas, tActualizados] = await Promise.all([
        apiRequest(`/liquidaciones?${new URLSearchParams({ ...(obraSocialId ? { obraSocialId } : {}), ...(estado ? { estado } : {}) })}`),
        apiRequest('/turnos?estado=RESERVADO')
      ]);
      setItems(lActualizadas || []);
      setSesiones(tActualizados || []);

    } catch (e) {
      console.error('Error al ejecutar liquidación:', e);
      setError(e.message || 'Error en el servidor al procesar la liquidación.');
    } finally {
      setOcupado(false);
    }
  }

  const sesionesFiltradas = obraSocialId
    ? sesiones.filter(t => 
        String(t.paciente?.obraSocialId) === String(obraSocialId) || 
        String(t.paciente?.obraSocial?.id) === String(obraSocialId)
      )
    : sesiones;

  const tieneImporteValido = Object.values(importes).some(v => v !== '' && Number(v) > 0);

  return (
    <section className="turnos">
      <h1>Liquidaciones</h1>
      <p>Ingresá el importe acordado por cada sesión. El total suma esos importes y se conserva al emitir.</p>
      <Mensaje {...{ error, aviso }} />

      <div className="turnos-filtros">
        <Campo titulo="Obra social">
          <select value={obraSocialId} onChange={e => { setObra(e.target.value); setImportes({}); }}>
            <option value="">Todas mis obras sociales</option>
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.nombre} ({o.codigo})</option>
            ))}
          </select>
        </Campo>

        <Campo titulo="Estado">
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="PAGADA">PAGADA</option>
          </select>
        </Campo>
      </div>

      <form onSubmit={e => {
        e.preventDefault();
        if (!obraSocialId || !tieneImporteValido) return;
        setConfirmacion({ texto: '¿Emitir la liquidación con estos importes? Revisá la obra social y las sesiones seleccionadas.' });
      }}>
        <h2>Emitir liquidación</h2>
        <p>Completá únicamente los importes de las sesiones a incluir.</p>

        <fieldset disabled={ocupado || !obraSocialId}>
          {!obraSocialId ? (
            <p className="aviso-seleccion">Seleccioná una obra social arriba para ver las sesiones a liquidar.</p>
          ) : sesionesFiltradas.length === 0 ? (
            <p>No hay sesiones reservadas pendientes para esta obra social.</p>
          ) : (
            sesionesFiltradas.map(t => (
              <Campo key={t.id} titulo={`${t.fecha} ${t.horaIni} · ${t.paciente?.nombre || ''} ${t.paciente?.apellido || ''} · ${t.tipoSesion?.nombre}`}>
                <input
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  placeholder="Importe explícito"
                  value={importes[t.id] || ''}
                  onChange={e => setImportes({ ...importes, [t.id]: e.target.value })}
                />
              </Campo>
            ))
          )}

          <button type="submit" disabled={!obraSocialId || !tieneImporteValido || ocupado}>
            {ocupado ? 'Procesando...' : 'Emitir'}
          </button>
        </fieldset>
      </form>

      <div className="turnos-lista">
        {items.map(l => (
          <article key={l.id}>
            <h2>Liquidación #{l.id}</h2>
            <p>{l.obraSocial?.nombre || 'Sin OS'} · {l.estado}</p>
            <p>{new Date(l.fechaEmision).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} · $ {l.valorTotal}</p>
            <ul>
              {l.detalles?.map(d => (
                <li key={d.turnoId}>{d.fechaSesion?.slice(0, 10)} · {d.paciente} · {d.sesion} · $ {d.importe}</li>
              ))}
            </ul>
            {l.estado === 'PENDIENTE' && (
              <button disabled={ocupado} onClick={() => setConfirmacion({ id: l.id, texto: '¿Registrar esta liquidación como pagada?' })}>
                Registrar pago
              </button>
            )}
          </article>
        ))}
      </div>

      {!items.length && <p>No hay liquidaciones para estos filtros.</p>}

      {confirmacion && (
        <Confirmacion
          texto={confirmacion.texto}
          ocupado={ocupado}
          onConfirmar={ejecutar}
          onCerrar={() => setConfirmacion(null)}
        />
      )}
    </section>
  );
}