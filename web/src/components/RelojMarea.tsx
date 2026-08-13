/**
 * ★ RELOJ DE MAREA — el componente firma de MAREA.
 *
 * No es un gráfico genérico: grafica LOS DOS TÉRMINOS DE LA PROPIA FÓRMULA.
 *   · RADIO  = D, el bloqueo del drenaje por el mar (0–1)
 *   · COLOR  = R, la lluvia normalizada (0–1)
 *   · SECTOR = la ventana donde ambos coinciden → riesgo real
 *
 * Un solo objeto muestra el mecanismo completo del producto. Ningún otro
 * equipo va a tener un componente de datos dibujado a mano.
 *
 * 24 h en 360°, medianoche arriba, sentido horario.
 */

import { useMemo } from 'react';
import type { Punto } from '../lib/api';

const CX = 150, CY = 150;
const R_INT = 52, R_EXT = 118;

/** hora decimal (0–24) → punto cartesiano. Medianoche arriba. */
function pt(hora: number, r: number): [number, number] {
  const a = (hora / 24) * 2 * Math.PI - Math.PI / 2;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

/** D (0–1) → radio. Mar alto = anillo ancho = drenaje ahogado. */
const radio = (d: number) => R_INT + Math.max(0, Math.min(1, d)) * (R_EXT - R_INT);

/** R (0–1) → color. Escala de carta de marea, no de Bootstrap. */
function tinte(r: number): string {
  if (r >= 0.75) return 'var(--critico)';
  if (r >= 0.50) return 'var(--alerta)';
  if (r >= 0.25) return 'var(--vigila)';
  if (r >= 0.08) return 'var(--marea)';
  return 'var(--sonda-alta)';
}

function arco(h0: number, h1: number, rIn: number, rOut: number) {
  const [x1, y1] = pt(h0, rOut), [x2, y2] = pt(h1, rOut);
  const [x3, y3] = pt(h1, rIn), [x4, y4] = pt(h0, rIn);
  const largo = h1 - h0 > 12 ? 1 : 0;
  return `M${x1},${y1} A${rOut},${rOut} 0 ${largo} 1 ${x2},${y2} L${x3},${y3} A${rIn},${rIn} 0 ${largo} 0 ${x4},${y4} Z`;
}

interface Props {
  serie: Punto[];
  ventanaCritica: { desde: string; hasta: string } | null;
  pico: Punto;
  simulado?: boolean;
}

export function RelojMarea({ serie, ventanaCritica, pico, simulado }: Props) {
  const horas = useMemo(
    () => serie.slice(0, 24).map((p) => ({ ...p, h: Number(p.t.slice(11, 13)) })),
    [serie],
  );

  const ahora = new Date();
  const horaAhora = (ahora.getUTCHours() - 5 + 24) % 24 + ahora.getUTCMinutes() / 60;

  const hDesde = ventanaCritica ? Number(ventanaCritica.desde.slice(11, 13)) : null;
  const hHasta = ventanaCritica ? Number(ventanaCritica.hasta.slice(11, 13)) : null;

  // Contorno de marea: polígono cerrado por los radios de D
  const contorno = horas.length
    ? horas.map((p, i) => { const [x, y] = pt(p.h, radio(p.componentes.D)); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + ' Z'
    : '';

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 300 300" width="100%" style={{ display: 'block', maxWidth: 340, margin: '0 auto' }}>
        <defs>
          <radialGradient id="fondoDial">
            <stop offset="0%" stopColor="var(--profundo)" />
            <stop offset="100%" stopColor="var(--abismo)" />
          </radialGradient>
          {simulado && (
            <pattern id="rayado" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="none" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--vigila)" strokeWidth="2" opacity="0.16" />
            </pattern>
          )}
        </defs>

        <circle cx={CX} cy={CY} r={R_EXT + 16} fill="url(#fondoDial)" stroke="var(--sonda)" />
        {simulado && <circle cx={CX} cy={CY} r={R_EXT + 16} fill="url(#rayado)" />}

        {/* Anillos de sondaje */}
        {[R_INT, (R_INT + R_EXT) / 2, R_EXT].map((r) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="var(--sonda)" strokeWidth="1" />
        ))}

        {/* Ventana crítica: sector donde lluvia y mar coinciden */}
        {hDesde !== null && hHasta !== null && hHasta > hDesde && (
          <path d={arco(hDesde, hHasta, R_INT - 6, R_EXT + 10)} fill="var(--critico)" opacity="0.14" stroke="var(--critico)" strokeOpacity="0.5" strokeWidth="1" />
        )}

        {/* Radios de lluvia: longitud y color = R */}
        {horas.map((p) => {
          const rr = Math.max(0, Math.min(1, p.componentes.R));
          const [x1, y1] = pt(p.h, R_INT - 8);
          const [x2, y2] = pt(p.h, R_INT - 8 - rr * 34);
          return <line key={`r${p.h}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tinte(rr)} strokeWidth="5" strokeLinecap="butt" opacity={rr > 0.02 ? 0.95 : 0.25} />;
        })}

        {/* Contorno de marea */}
        {contorno && <path d={contorno} fill="var(--marea)" fillOpacity="0.13" stroke="var(--acento)" strokeWidth="1.5" strokeLinejoin="round" />}

        {/* Marcas horarias */}
        {Array.from({ length: 24 }, (_, h) => {
          const mayor = h % 6 === 0;
          const [x1, y1] = pt(h, R_EXT + 4);
          const [x2, y2] = pt(h, R_EXT + (mayor ? 13 : 8));
          return <line key={`t${h}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={mayor ? 'var(--papel-tenue)' : 'var(--sonda)'} strokeWidth="1" />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = pt(h, R_EXT + 26);
          return (
            <text key={`l${h}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fill="var(--papel-fant)" fontFamily="'JetBrains Mono', monospace" fontSize="10" letterSpacing="1">
              {String(h).padStart(2, '0')}
            </text>
          );
        })}

        {/* Aguja de la hora actual */}
        {(() => {
          const [x, y] = pt(horaAhora, R_EXT + 10);
          return <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--papel)" strokeWidth="1" opacity="0.55" strokeDasharray="2 3" />;
        })()}

        {/* Núcleo: el IRI pico */}
        <circle cx={CX} cy={CY} r={R_INT - 14} fill="var(--abismo)" stroke="var(--sonda)" />
        <text x={CX} y={CY - 8} textAnchor="middle" fill="var(--papel)"
          fontFamily="'JetBrains Mono', monospace" fontSize="30" fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {pico.iri.toFixed(0)}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--papel-fant)"
          fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="1.6">IRI PICO</text>
        <text x={CX} y={CY + 26} textAnchor="middle" fill={tinte(pico.componentes.R)}
          fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="1.4">
          {pico.banda.toUpperCase()}
        </text>
      </svg>

      {ventanaCritica && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <span className="rotulo" style={{ color: 'var(--critico)' }}>ventana crítica&nbsp;</span>
          <span className="num" style={{ color: 'var(--critico)', fontSize: 13, fontWeight: 700 }}>
            {ventanaCritica.desde.slice(11, 16)} – {ventanaCritica.hasta.slice(11, 16)}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        <Leyenda color="var(--acento)" texto="radio = bloqueo de drenaje (D)" />
        <Leyenda color="var(--alerta)" texto="color = lluvia (R)" />
      </div>
    </div>
  );
}

const Leyenda = ({ color, texto }: { color: string; texto: string }) => (
  <span className="rotulo" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span style={{ width: 8, height: 8, background: color, display: 'inline-block' }} />
    {texto}
  </span>
);
