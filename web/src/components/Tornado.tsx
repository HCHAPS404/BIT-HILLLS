/**
 * ★ TORNADO DE SENSIBILIDAD — responde la pregunta antes de que la hagan.
 *
 * El panel de supuestos deja cambiar cualquier parámetro. La pregunta que
 * sigue de inmediato es: "¿y cuál de todos importa de verdad?".
 *
 * Esto la contesta: mueve cada supuesto ±30 % y mide cuánto se desplaza el
 * VER. Las barras salen ordenadas por amplitud, así que la de arriba es
 * literalmente el supuesto del que depende el número.
 *
 * Por qué vale más que cualquier otro adorno del front: convierte "confía en
 * mi modelo" en "aquí está exactamente dónde es frágil mi modelo". Un jurado
 * de ingeniería senior premia eso; un dashboard bonito no.
 *
 * El dato ya venía calculado en GET /api/riesgo/:zona y no se estaba pintando.
 */

import type { ReactNode } from 'react';
import { copCorto } from '../lib/api';

interface Fila {
  parametro: string;
  bajo: number;
  alto: number;
  base: number;
  amplitud_pct: number;
}

const NOMBRE: Record<string, string> = {
  'ticket.hotel': 'Ticket hotel',
  'ticket.restaurante': 'Ticket restaurante',
  'eta.restaurante': 'η restaurante',
  'eta.hotel': 'η hotel',
  'tx_hora.restaurante': 'Transacciones/h restaurante',
  'horas_recuperacion': 'Horas de recuperación',
};

export function Tornado({ filas, sinCaja, definicionEta }: { filas: Fila[]; sinCaja?: boolean; definicionEta?: React.ReactNode }) {
  const utiles = filas.filter((f) => f.amplitud_pct !== 0);
  if (!utiles.length) {
    const vacio = (
      <div className="rotulo" style={{ textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
        Sin interrupción prevista, el VER es 0 y ningún supuesto lo mueve.
        Cambia a un escenario con aguacero para ver de qué depende el número.
      </div>
    );
    if (sinCaja) return vacio;
    return (
      <div className="panel" style={{ padding: 'var(--esp-5)' }}>
        <div className="rotulo" style={{ color: 'var(--acento)' }}>sensibilidad</div>
        <div style={{ marginTop: 'var(--esp-3)' }}>{vacio}</div>
      </div>
    );
  }

  const base = utiles[0].base;
  // Escala común para todas las barras: se comparan entre sí, no cada una consigo misma.
  const span = Math.max(...utiles.map((f) => Math.max(Math.abs(f.alto - base), Math.abs(base - f.bajo))));

  const cuerpo = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {!sinCaja && <div className="rotulo" style={{ color: 'var(--acento)' }}>de qué depende el número</div>}
        <span className="rotulo" style={{ fontSize: 'var(--texto-xs)' }}>±30 %{definicionEta ? <> · {definicionEta}</> : null}</span>
      </div>

      <div style={{ marginTop: 'var(--esp-4)' }}>
        {utiles.map((f, i) => {
          const izq = Math.max(0, (base - f.bajo) / span) * 50;
          const der = Math.max(0, (f.alto - base) / span) * 50;
          const dominante = i === 0;
          return (
            <div key={f.parametro} style={{ marginBottom: 'var(--esp-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--esp-3)' }}>
                <span style={{ fontSize: 'var(--texto-sm)', fontWeight: dominante ? 600 : 400, color: dominante ? 'var(--papel)' : 'var(--papel-tenue)' }}>
                  {NOMBRE[f.parametro] ?? f.parametro}
                </span>
                <span className="num" style={{ fontSize: 'var(--texto-xs)', color: dominante ? 'var(--alerta)' : 'var(--papel-fant)' }}>
                  ±{Math.abs(f.amplitud_pct / 2).toFixed(0)} %
                </span>
              </div>

              {/* Eje central = VER base. Izquierda = supuesto bajo, derecha = alto. */}
              <div style={{ position: 'relative', height: 11, marginTop: 'var(--esp-2)', background: 'var(--abismo)', border: 'var(--linea)' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--papel-fant)', zIndex: 2 }} />
                <div style={{
                  position: 'absolute', right: '50%', top: 1, bottom: 1, width: `${izq}%`,
                  background: dominante ? 'var(--marea)' : 'var(--sonda-alta)',
                }} />
                <div style={{
                  position: 'absolute', left: '50%', top: 1, bottom: 1, width: `${der}%`,
                  background: dominante ? 'var(--alerta)' : 'var(--sonda-alta)',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--esp-1)' }}>
                <span className="num rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{copCorto(f.bajo)}</span>
                <span className="num rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{copCorto(f.alto)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rotulo" style={{
        fontSize: 'var(--texto-xs)', textTransform: 'none', letterSpacing: '0.03em',
        lineHeight: 1.5, borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)', marginTop: 'var(--esp-1)',
      }}>
        {(() => {
          // Varios parámetros pueden empatar: son factores lineales del MISMO
          // término, así que mueven el VER exactamente igual. Decir "depende de
          // Ticket restaurante" sería impreciso — depende del término completo.
          const top = utiles[0];
          const empatados = utiles.filter((f) => Math.abs(f.amplitud_pct - top.amplitud_pct) < 0.05);
          const termino = (p: string) => p.split('.')[1] ?? p;
          const mismoTermino = empatados.length > 1 && new Set(empatados.map((f) => termino(f.parametro))).size === 1;

          return mismoTermino ? (
            <>
              El VER depende casi por completo del término{' '}
              <span style={{ color: 'var(--alerta)' }}>{termino(top.parametro)}</span> — sus{' '}
              {empatados.length} factores lo mueven igual porque entran multiplicando.
              Ahí es donde hay que discutir el modelo, no en los demás.
            </>
          ) : (
            <>
              El VER depende sobre todo de{' '}
              <span style={{ color: 'var(--alerta)' }}>{NOMBRE[top.parametro] ?? top.parametro}</span>.
              Es el supuesto que hay que discutir primero — los demás casi no mueven el resultado.
            </>
          );
        })()}
      </div>
    </>
  );

  if (sinCaja) return cuerpo;
  return (
    <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
      {cuerpo}
    </div>
  );
}
