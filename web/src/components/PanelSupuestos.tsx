/**
 * ★ PANEL DE SUPUESTOS — el componente que convence al jurado.
 *
 * Cada supuesto del modelo es un control deslizante con su FUENTE a la vista.
 * Al moverlo, POST /api/simular recalcula y el mapa se re-tarifa.
 *
 * Por qué existe: no hay dato público de facturación por punto turístico.
 * Si inventamos una cifra y preguntan la fuente, se acabó. Entonces no
 * entregamos una cifra: entregamos el modelo, con los supuestos a la vista.
 * Nunca discutas un número con un jurado — dale el control deslizante.
 */

import { useEffect, useState } from 'react';
import { getParams, copCorto } from '../lib/api';

interface Meta {
  key: string; grupo: string; label: string; unidad: string;
  min: number; max: number; step: number; fuente: string;
}

const leer = (o: any, ruta: string) => ruta.split('.').reduce((a, k) => a?.[k], o);
const escribir = (o: any, ruta: string, v: number) => {
  const ks = ruta.split('.');
  const out = JSON.parse(JSON.stringify(o));
  let cur = out;
  for (let i = 0; i < ks.length - 1; i++) cur = cur[ks[i]] ??= {};
  cur[ks[ks.length - 1]] = v;
  return out;
};

interface Props {
  onCambio: (overrides: any) => void;
  verTotal: number;
  recalculando: boolean;
}

export function PanelSupuestos({ onCambio, verTotal, recalculando }: Props) {
  const [meta, setMeta] = useState<Meta[]>([]);
  const [valores, setValores] = useState<any>(null);
  const [overrides, setOverrides] = useState<any>({});
  const [grupo, setGrupo] = useState<'economia' | 'riesgo'>('economia');

  useEffect(() => {
    getParams().then((p) => { setMeta(p.meta as Meta[]); setValores(p.valores); }).catch(() => {});
  }, []);

  if (!valores) return <div className="rotulo" style={{ padding: 12 }}>cargando supuestos…</div>;

  const set = (key: string, v: number) => {
    const nuevos = escribir(overrides, key, v);
    setOverrides(nuevos);
    onCambio(nuevos);
  };

  const reset = () => { setOverrides({}); onCambio({}); };

  const efectivo = (key: string) => leer(overrides, key) ?? leer(valores, key);

  return (
    <div className="panel milimetrado" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div className="rotulo" style={{ color: 'var(--acento)' }}>supuestos del modelo</div>
        <button onClick={reset} style={{ fontSize: 9, padding: '2px 6px', letterSpacing: '0.1em' }}>RESET</button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--papel-tenue)', lineHeight: 1.5, marginBottom: 10 }}>
        Cambia cualquier supuesto. El modelo es tuyo.
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['economia', 'riesgo'] as const).map((g) => (
          <button key={g} onClick={() => setGrupo(g)}
            style={{
              fontSize: 9, padding: '4px 9px', letterSpacing: '0.12em', textTransform: 'uppercase',
              borderColor: grupo === g ? 'var(--acento)' : 'var(--sonda)',
              color: grupo === g ? 'var(--acento)' : 'var(--papel-fant)',
            }}>
            {g}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
        {meta.filter((m) => m.grupo === grupo).map((m) => {
          const v = Number(efectivo(m.key));
          const tocado = leer(overrides, m.key) !== undefined;
          return (
            <div key={m.key} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 11, color: tocado ? 'var(--acento)' : 'var(--papel)' }}>{m.label}</span>
                <span className="num" style={{ fontSize: 11, color: tocado ? 'var(--acento)' : 'var(--papel-tenue)', whiteSpace: 'nowrap' }}>
                  {m.unidad === 'COP' ? copCorto(v) : v.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                  {m.unidad && m.unidad !== 'COP' ? ` ${m.unidad}` : ''}
                </span>
              </div>
              <input type="range" min={m.min} max={m.max} step={m.step} value={v}
                onChange={(e) => set(m.key, Number(e.target.value))}
                style={{ width: '100%', marginTop: 3 }} />
              <div className="rotulo" style={{ fontSize: 8.5, letterSpacing: '0.05em', textTransform: 'none', lineHeight: 1.35 }}>
                {m.fuente}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 8, paddingTop: 9 }}>
        <div className="rotulo">ver total del corredor</div>
        <div className="num" style={{ fontSize: 19, fontWeight: 700, color: recalculando ? 'var(--papel-fant)' : 'var(--critico)' }}>
          {copCorto(verTotal)} COP
        </div>
      </div>
    </div>
  );
}
