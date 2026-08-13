/**
 * Grupo de pestañas tipo .ir-tabs de la Plataforma: píldora corta en
 * reposo, se expande al activo o al hover. Sin <select> nativo.
 */

import type { ReactNode } from 'react';

export interface OpcionPildora {
  id: string;
  corto: string;
  largo: string;
}

interface Props {
  valor: string;
  onCambio: (id: string) => void;
  opciones: OpcionPildora[];
  ariaLabel: string;
  icono?: (id: string) => ReactNode;
  /** Sin expansión: el corto o el icono bastan (ES/EN, día/noche). */
  compacto?: boolean;
}

export function Pildoras({ valor, onCambio, opciones, ariaLabel, icono, compacto }: Props) {
  return (
    <div className={`ir-tabs${compacto ? ' ir-tabs-compacto' : ''}`} role="tablist" aria-label={ariaLabel}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={activo}
            aria-label={o.largo}
            className={activo ? 'active' : undefined}
            onClick={() => onCambio(o.id)}
          >
            {icono?.(o.id)}
            {o.corto ? <span className="ir-tab-short" aria-hidden="true">{o.corto}</span> : null}
            {!compacto && o.largo ? <span className="ir-tab-full">&nbsp;{o.largo}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
