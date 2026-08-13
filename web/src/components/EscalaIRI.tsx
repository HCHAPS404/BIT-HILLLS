/**
 * Escala 0–100 con las cuatro bandas. El número suelto no significa nada
 * sin ver dónde cae y qué franja es acción.
 */

import type { Banda } from '../lib/api';
import { COLOR_BANDA } from '../lib/api';
import type { Idioma } from '../i18n';

const TRAMOS: { hasta: number; banda: Banda; es: string; en: string }[] = [
  { hasta: 25, banda: 'verde', es: 'nada', en: 'none' },
  { hasta: 50, banda: 'amarillo', es: 'vigila', en: 'watch' },
  { hasta: 75, banda: 'naranja', es: 'alerta', en: 'alert' },
  { hasta: 100, banda: 'rojo', es: 'crítico', en: 'critical' },
];

export function EscalaIRI({ iri, banda, idioma }: { iri: number; banda: Banda; idioma: Idioma }) {
  const x = Math.max(0, Math.min(100, iri));
  const en = idioma === 'en';
  const actual = TRAMOS.find((t) => t.banda === banda) ?? TRAMOS[0];

  return (
    <div
      className="escala-iri"
      role="img"
      aria-label={en
        ? `IRI ${Math.round(x)} out of 100, ${actual.en} band`
        : `IRI ${Math.round(x)} de 100, banda ${actual.es}`}
    >
      <div className="escala-iri-pista">
        {TRAMOS.map((t) => (
          <div
            key={t.banda}
            className="escala-iri-tramo"
            style={{ background: COLOR_BANDA[t.banda] }}
          />
        ))}
        <div className="escala-iri-marca" style={{ left: `${x}%` }} aria-hidden>
          <span className="escala-iri-punta" />
        </div>
      </div>
      <div className="escala-iri-leyenda">
        {TRAMOS.map((t) => (
          <span
            key={t.banda}
            style={{ color: t.banda === banda ? COLOR_BANDA[t.banda] : 'var(--papel-fant)', fontWeight: t.banda === banda ? 700 : 500 }}
          >
            {en ? t.en : t.es}
          </span>
        ))}
      </div>
      <div className="escala-iri-ticks num" aria-hidden>
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
    </div>
  );
}
