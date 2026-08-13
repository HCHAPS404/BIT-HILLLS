/**
 * GLIFO DE BANDA — la severidad, sin depender del color.
 *
 * Auditoría WCAG "Color Only": la banda no puede comunicarse solo con color.
 * En el mapa ya se cumplía —la DENSIDAD de la trama es la severidad— pero en
 * la lista de zonas la banda iba únicamente en el color del número.
 *
 * La solución no es un icono cualquiera: el glifo REPRODUCE la trama que esa
 * misma zona tiene pintada en el mapa. Lunares, faja, fajas, aspa. Así la
 * lista y el mapa hablan el mismo idioma y el glifo te dice qué marca buscar
 * en el territorio.
 *
 * Deja de ser una casilla de accesibilidad y pasa a ser una mejora de lectura.
 */

import type { Banda } from '../lib/api';

const TRAZOS: Record<Banda, { d: string; puntos?: [number, number][] }> = {
  verde:    { d: '', puntos: [[3.5, 4], [8.5, 8]] },
  amarillo: { d: 'M2,11 L8,1' },
  naranja:  { d: 'M1,11 L7,1 M6,11 L12,1' },
  rojo:     { d: 'M2,11 L10,1 M2,1 L10,11' },
};

const NOMBRE: Record<Banda, string> = {
  verde: 'sin alerta', amarillo: 'vigilancia', naranja: 'alerta', rojo: 'crítico',
};

export function GlifoBanda({ banda, color }: { banda: Banda; color: string }) {
  const t = TRAZOS[banda];
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" role="img"
      aria-label={`Banda ${NOMBRE[banda]}`} style={{ flexShrink: 0, overflow: 'visible' }}>
      {t.puntos
        ? t.puntos.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.7" fill={color} />)
        : <path d={t.d} stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />}
    </svg>
  );
}

export const nombreBanda = (b: Banda) => NOMBRE[b];
