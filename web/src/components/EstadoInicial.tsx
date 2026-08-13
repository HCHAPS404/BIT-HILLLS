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
    <div className="panel" style={{ padding: 'var(--esp-6)' }}>
      <div className="rotulo" style={{ color: 'var(--seco)', marginBottom: 'var(--esp-3)' }}>{t.hoyVerde}</div>
      <p style={{ fontSize: 'var(--texto-sm)', lineHeight: 1.5, margin: 0, color: 'var(--papel)' }}>
        {simulado ? t.verdeEscenario : t.verdeVivo}
      </p>
      {!simulado && (
        <button
          type="button"
          onClick={onProbar}
          style={{ marginTop: 'var(--esp-4)', fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)', letterSpacing: '0.04em' }}
        >
          {t.probarAguacero}
        </button>
      )}
    </div>
  );
}
