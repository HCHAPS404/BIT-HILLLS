/**
 * Marcas de 12×12, trazo único. Mismo idioma visual que sol/luna de la barra.
 * currentColor: el padre pinta el token.
 */

import type { ReactNode } from 'react';

interface Props {
  size?: number;
  /** Posición si el icono vive dentro de otro <svg> (Safari no traga foreignObject). */
  x?: number;
  y?: number;
  ink?: string;
}

const caja = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Marco({ size = 12, x, y, ink, children }: Props & { children: ReactNode }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden
      overflow="visible"
      style={ink ? { color: ink } : undefined}
      {...caja}
    >
      {children}
    </svg>
  );
}

/** Lluvia (R). */
export function IconoLluvia(p: Props) {
  return (
    <Marco {...p}>
      <path d="M6 1.4C6 1.4 3.1 5.4 3.1 7.5a2.9 2.9 0 0 0 5.8 0C8.9 5.4 6 1.4 6 1.4z" />
    </Marco>
  );
}

/** Drenaje (D): reja y el agua que no baja. */
export function IconoDrenaje(p: Props) {
  return (
    <Marco {...p}>
      <path d="M2 3.2h8" />
      <path d="M4 3.2v2.2M6 3.2v2.2M8 3.2v2.2" />
      <path d="M6 6.2v3.4M4.2 8.4L6 10.2l1.8-1.8" />
    </Marco>
  );
}

/** Canal (O): dos orillas y el agua. */
export function IconoCanal(p: Props) {
  return (
    <Marco {...p}>
      <path d="M1.5 3.4h9" />
      <path d="M1.5 8.6h9" />
      <path d="M2.5 6c1.4 1.4 2.6-1.4 4 0s2.6-1.4 3.4 0" />
    </Marco>
  );
}

/** Zona (S): el barrio, un pin. */
export function IconoZona(p: Props) {
  return (
    <Marco {...p}>
      <path d="M6 1.6c-1.7 0-3 1.4-3 3.1 0 2.4 3 5.5 3 5.5s3-3.1 3-5.5c0-1.7-1.3-3.1-3-3.1z" />
      <circle cx="6" cy="4.6" r="1.05" />
    </Marco>
  );
}

export function IconoNoche(p: Props) {
  return (
    <Marco {...p}>
      <path d="M8.2 1.8A4.4 4.4 0 1 0 10.2 8 3.4 3.4 0 0 1 8.2 1.8z" />
    </Marco>
  );
}

export function IconoManana(p: Props) {
  return (
    <Marco {...p}>
      <path d="M1.5 8.6h9" />
      <path d="M6 8.6V5.2" />
      <circle cx="6" cy="4.2" r="1.7" />
      <path d="M2.8 5.2l1 .8M9.2 5.2l-1 .8" />
    </Marco>
  );
}

export function IconoMediodia(p: Props) {
  return (
    <Marco {...p}>
      <circle cx="6" cy="6" r="2.2" />
      <path d="M6 1v1.4M6 9.6V11M1 6h1.4M9.6 6H11M2.4 2.4l1 1M8.6 8.6l1 1M2.4 9.6l1-1M8.6 3.4l1-1" />
    </Marco>
  );
}

export function IconoTarde(p: Props) {
  return (
    <Marco {...p}>
      <path d="M1.5 8.2h9" />
      <path d="M3.4 8.2a2.6 2.6 0 0 1 5.2 0" />
      <path d="M6 3.2v1.4M2.6 5.2l.9.8M9.4 5.2l-.9.8" />
    </Marco>
  );
}

export const COLOR_COMP = {
  R: 'var(--alerta)',
  D: 'var(--marea)',
  O: 'var(--vigila)',
  S: 'var(--seco)',
} as const;
