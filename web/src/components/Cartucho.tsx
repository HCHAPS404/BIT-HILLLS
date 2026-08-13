/**
 * ★ CARTUCHO — el bloque de título de una carta náutica.
 *
 * Toda carta náutica real lleva un cartucho: nombre de la carta, proyección,
 * datum, unidad de las sondas y fecha de última corrección. Es la convención
 * más reconocible de la cartografía náutica y ningún dashboard la tiene.
 *
 * Y hay una convergencia que no es casual: el cartucho es EXACTAMENTE el lugar
 * donde una carta real declara sus limitaciones. Poner ahí "IRI v0.1 · SIN
 * CALIBRAR" no es esconder la advertencia en letra chica — es ponerla donde
 * un navegante la buscaría. La honestidad y la estética apuntan al mismo sitio.
 */

import { useState } from 'react';

interface Props {
  fuente: 'vivo' | 'escenario';
  escenarioNombre?: string;
  generado: string;
  version: string;
  zonas: number;
  establecimientos: number;
  etiquetaCerrado?: string;
  abierto?: boolean;
  onCambio?: (abierto: boolean) => void;
}

const Fila = ({ k, v, acento }: { k: string; v: string; acento?: string }) => (
  <div style={{ display: 'flex', gap: 'var(--esp-4)', lineHeight: 1.5 }}>
    <span className="rotulo" style={{ fontSize: 'var(--texto-xs)', width: 72, flexShrink: 0 }}>{k}</span>
    <span className="num" style={{ fontSize: 'var(--texto-xs)', color: acento ?? 'var(--papel-tenue)', overflowWrap: 'anywhere' }}>{v}</span>
  </div>
);

export function Cartucho({
  fuente, escenarioNombre, generado, version, zonas, establecimientos,
  etiquetaCerrado = 'proyección · datum · sondas',
  abierto: controlada, onCambio,
}: Props) {
  const [interna, setInterna] = useState(false);
  const abierto = controlada ?? interna;
  const setAbierto = (v: boolean) => {
    if (controlada === undefined) setInterna(v);
    onCambio?.(v);
  };

  const t = new Date(generado);
  const bogota = new Date(t.getTime() - 5 * 3600_000);
  const sello = `${String(bogota.getUTCDate()).padStart(2, '0')} AGO ${bogota.getUTCFullYear()} · ${String(bogota.getUTCHours()).padStart(2, '0')}:${String(bogota.getUTCMinutes()).padStart(2, '0')} COT`;

  if (!abierto) {
    return (
      <button className="cartucho-cerrado" onClick={() => setAbierto(true)}>
        <span className="rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{etiquetaCerrado}</span>
      </button>
    );
  }

  return (
    <div className="cartucho marco">
      <button onClick={() => setAbierto(false)} className="cartucho-x" aria-label="Ocultar cartucho">×</button>

      <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', letterSpacing: '0.08em' }}>república de colombia</div>
      <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', letterSpacing: '0.08em', marginBottom: 'var(--esp-4)' }}>
        cartagena de indias · bolívar
      </div>

      <div style={{ borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)' }}>
        <div style={{ fontSize: 'var(--texto-md)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          CARTA DE RIESGO<br />DE INUNDACIÓN
        </div>
        <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-2)' }}>corredor turístico · escala 1:60 000</div>
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 'var(--esp-4)', paddingTop: 'var(--esp-4)' }}>
        <Fila k="proyección" v="Web Mercator" />
        <Fila k="datum" v="WGS-84" />
        <Fila k="sondas" v="metros sobre NMM" />
        <Fila k="modelo" v={version.toUpperCase()} acento="var(--alerta)" />
        <Fila k="origen" v={fuente === 'vivo' ? 'PRONÓSTICO EN VIVO' : `SIMULACIÓN · ${(escenarioNombre ?? '').toUpperCase()}`}
          acento={fuente === 'vivo' ? 'var(--acento)' : 'var(--vigila)'} />
        <Fila k="corregida" v={sello} />
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 'var(--esp-4)', paddingTop: 'var(--esp-4)' }}>
        <Fila k="zonas" v={String(zonas)} />
        <Fila k="estab." v={`${establecimientos.toLocaleString('es-CO')} (OSM · piso)`} />
        <Fila k="fuentes" v="Open-Meteo · OSM" />
      </div>

      <div className="rotulo" style={{
        fontSize: 'var(--texto-xs)', textTransform: 'none', letterSpacing: '0.03em',
        lineHeight: 1.5, marginTop: 'var(--esp-4)', borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)',
        color: 'var(--alerta)',
      }}>
        AVISO — Índice sin calibrar contra eventos históricos. Ordena riesgo
        relativo; no expresa probabilidad. No sustituye a la autoridad de gestión
        del riesgo.
      </div>
    </div>
  );
}
