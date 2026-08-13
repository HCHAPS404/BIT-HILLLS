/**
 * ★ Contador de Valor Expuesto en Riesgo.
 * Un número que se mueve solo en pantalla obliga a mirar. Cuenta hacia el
 * objetivo en ~900 ms con easing, en monoespaciada tabular para que los
 * dígitos no bailen.
 *
 * Debajo va SIEMPRE la letra pequeña honesta: valor esperado, supuestos
 * editables. Nunca se presenta como pérdida consumada.
 */

import { useEffect, useRef, useState } from 'react';
import { cop } from '../lib/api';

export function ContadorVER({ valor, horas, etiqueta = 'valor expuesto en riesgo' }: { valor: number; horas: number; etiqueta?: string }) {
  const [n, setN] = useState(0);
  const desde = useRef(0);

  useEffect(() => {
    const ini = desde.current;
    const delta = valor - ini;
    const t0 = performance.now();
    const DUR = 900;
    let raf = 0;

    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / DUR);
      const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
      setN(ini + delta * e);
      if (k < 1) raf = requestAnimationFrame(paso);
      else desde.current = valor;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  const activo = valor > 0;

  return (
    <div>
      <div className="rotulo">{etiqueta}</div>
      <div
        className="num"
        style={{
          fontSize: 30, fontWeight: 700, lineHeight: 1.15, marginTop: 5,
          color: activo ? 'var(--critico)' : 'var(--papel-fant)',
        }}
      >
        {cop(Math.round(n))}
      </div>
      <div className="rotulo" style={{ marginTop: 5, textTransform: 'none', letterSpacing: '0.04em' }}>
        {activo ? `${horas} h de interrupción · ` : 'sin interrupción prevista · '}
        <span style={{ color: 'var(--alerta)' }}>valor esperado, supuestos editables</span>
      </div>
    </div>
  );
}
