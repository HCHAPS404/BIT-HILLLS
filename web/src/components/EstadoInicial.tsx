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
      <div className="rotulo" style={{ color: 'var(--seco)', marginBottom: 'var(--esp-4)' }}>{t.hoyVerde}</div>
      <p className="prosa" style={{ margin: 0 }}>
        {simulado ? t.verdeEscenario : t.verdeVivo}
      </p>
      {!simulado && (
        <button
          type="button"
          onClick={onProbar}
          style={{ marginTop: 'var(--esp-5)', fontSize: 'var(--texto-xs)', padding: 'var(--esp-3) var(--esp-5)', letterSpacing: '0.04em' }}
        >
          {t.probarAguacero}
        </button>
      )}
    </div>
  );
}
