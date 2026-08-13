/**
 * ★ Contador de Valor Expuesto en Riesgo.
 * Un número que se mueve solo en pantalla obliga a mirar. Cuenta hacia el
 * objetivo en ~900 ms con easing, en monoespaciada tabular para que los
 * dígitos no bailen.
 *
 * Debajo va SIEMPRE la letra pequeña honesta: valor esperado, supuestos
 * editables. Nunca se presenta como pérdida consumada.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cop } from '../lib/api';

export function ContadorVER({
  valor, horas, etiqueta = 'valor expuesto en riesgo', nota, rotulo,
}: {
  valor: number; horas: number; etiqueta?: string; nota?: string; rotulo?: React.ReactNode;
}) {
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
      <div className="rotulo">{rotulo ?? etiqueta}</div>
      <div
        className="num"
        style={{
          fontSize: 'var(--texto-2xl)', fontWeight: 700, lineHeight: 1.15, marginTop: 'var(--esp-2)',
          color: activo ? 'var(--critico)' : 'var(--papel-fant)',
        }}
      >
        {cop(Math.round(n))}
      </div>
      <div className="rotulo" style={{ marginTop: 'var(--esp-2)', textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
        {nota ?? (activo
          ? `${horas} h previstas (incluye recuperación). Valor esperado, supuestos editables.`
          : 'Sin interrupción prevista. Valor esperado, supuestos editables.')}
      </div>
    </div>
  );
}
