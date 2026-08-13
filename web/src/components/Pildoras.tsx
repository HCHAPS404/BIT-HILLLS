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
}

export function Pildoras({ valor, onCambio, opciones, ariaLabel, icono }: Props) {
  return (
    <div className="ir-tabs" role="tablist" aria-label={ariaLabel}>
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
            <span className="ir-tab-short" aria-hidden="true">{o.corto}</span>
            <span className="ir-tab-full">&nbsp;{o.largo}</span>
          </button>
        );
      })}
    </div>
  );
}
