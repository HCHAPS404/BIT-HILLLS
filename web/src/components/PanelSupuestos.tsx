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
import type { Idioma } from '../i18n';
import { T } from '../i18n';
import { fuenteParam, nombreParam } from '../lib/nombresParams';
import { Pildoras } from './Pildoras';

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
  sinCaja?: boolean;
  idioma: Idioma;
}

export function PanelSupuestos({ onCambio, verTotal, recalculando, sinCaja, idioma }: Props) {
  const t = T[idioma];
  const [meta, setMeta] = useState<Meta[]>([]);
  const [valores, setValores] = useState<any>(null);
  const [overrides, setOverrides] = useState<any>({});
  const [grupo, setGrupo] = useState<'economia' | 'riesgo'>('economia');

  useEffect(() => {
    getParams().then((p) => { setMeta(p.meta as Meta[]); setValores(p.valores); }).catch(() => {});
  }, []);

  if (!valores) return <div className="rotulo" style={{ padding: 'var(--esp-5)' }}>{t.supuestosCargando}</div>;

  const set = (key: string, v: number) => {
    const nuevos = escribir(overrides, key, v);
    setOverrides(nuevos);
    onCambio(nuevos);
  };

  const reset = () => { setOverrides({}); onCambio({}); };

  const efectivo = (key: string) => leer(overrides, key) ?? leer(valores, key);

  const cuerpo = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--esp-2)' }}>
        {!sinCaja && <div className="rotulo" style={{ color: 'var(--acento)' }}>{t.supuestos}</div>}
        <button type="button" onClick={reset} style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-1) var(--esp-3)', letterSpacing: '0.04em', marginLeft: 'auto', textTransform: 'none' }}>{t.supuestosReset}</button>
      </div>

      <p className="prosa-nota" style={{ margin: '0 0 var(--esp-4)' }}>
        {t.supuestosIntro}
      </p>

      <div style={{ marginBottom: 'var(--esp-5)' }}>
        <Pildoras
          ariaLabel={t.supuestos}
          valor={grupo}
          onCambio={(id) => setGrupo(id as 'economia' | 'riesgo')}
          opciones={[
            { id: 'economia', corto: t.supuestosEcoCorto, largo: t.supuestosEcoLargo },
            { id: 'riesgo', corto: t.supuestosRiesgoCorto, largo: t.supuestosRiesgoLargo },
          ]}
        />
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 'var(--esp-2)' }}>
        {meta.filter((m) => m.grupo === grupo).map((m) => {
          const v = Number(efectivo(m.key));
          const tocado = leer(overrides, m.key) !== undefined;
          return (
            <div key={m.key} style={{ marginBottom: 'var(--esp-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--esp-4)' }}>
                <span style={{ fontSize: 'var(--texto-sm)', color: tocado ? 'var(--acento)' : 'var(--papel)' }}>{nombreParam(m.key, idioma, m.label)}</span>
                <span className="num" style={{ fontSize: 'var(--texto-sm)', color: tocado ? 'var(--acento)' : 'var(--papel-tenue)', whiteSpace: 'nowrap' }}>
                  {m.unidad === 'COP' ? copCorto(v) : v.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                  {m.unidad && m.unidad !== 'COP' ? ` ${m.unidad}` : ''}
                </span>
              </div>
              <input type="range" min={m.min} max={m.max} step={m.step} value={v}
                onChange={(e) => set(m.key, Number(e.target.value))}
                style={{ width: '100%', marginTop: 'var(--esp-2)' }} />
              <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', letterSpacing: '0.03em', textTransform: 'none', lineHeight: 1.5 }}>
                {fuenteParam(m.key, idioma, m.fuente)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 'var(--esp-4)', paddingTop: 'var(--esp-4)' }}>
        <div className="rotulo" style={{ textTransform: 'none', letterSpacing: '0.04em' }}>{t.supuestosVerTotal}</div>
        <div className="num" style={{ fontSize: 'var(--texto-xl)', fontWeight: 700, color: recalculando ? 'var(--papel-fant)' : 'var(--critico)' }}>
          {copCorto(verTotal)} COP
        </div>
      </div>
    </>
  );

  if (sinCaja) return cuerpo;
  return (
    <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
      {cuerpo}
    </div>
  );
}
