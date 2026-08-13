/**
 * Estado verde / sin VER: enseña el producto, no se ve vacío.
 */

import type { Idioma } from '../i18n';
import { T } from '../i18n';

interface Props {
  idioma: Idioma;
  simulado: boolean;
  onProbar: () => void;
}

export function EstadoInicial({ idioma, simulado, onProbar }: Props) {
  const t = T[idioma];
  return (
    <>
      <p className="prosa" style={{ margin: 0 }}>
        {simulado ? t.verdeEscenario : t.verdeVivo}
      </p>
      {!simulado && (
        <div className="ir-tabs ir-tabs-cta">
          <button type="button" onClick={onProbar} aria-label={t.probarAguacero}>
            <svg viewBox="0 0 12 12" aria-hidden>
              <path d="M6 1.4C6 1.4 3.1 5.4 3.1 7.5a2.9 2.9 0 0 0 5.8 0C8.9 5.4 6 1.4 6 1.4z" />
            </svg>
            <span className="ir-tab-short" aria-hidden="true">{t.probarAguaceroCorto}</span>
            <span className="ir-tab-full">&nbsp;{t.probarAguaceroLargo}</span>
          </button>
        </div>
      )}
    </>
  );
}
