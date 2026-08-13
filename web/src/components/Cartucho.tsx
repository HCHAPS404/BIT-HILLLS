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
}

const Fila = ({ k, v, acento }: { k: string; v: string; acento?: string }) => (
  <div style={{ display: 'flex', gap: 8, lineHeight: 1.55 }}>
    <span className="rotulo" style={{ fontSize: 8, width: 66, flexShrink: 0 }}>{k}</span>
    <span className="num" style={{ fontSize: 9, color: acento ?? 'var(--papel-tenue)' }}>{v}</span>
  </div>
);

export function Cartucho({ fuente, escenarioNombre, generado, version, zonas, establecimientos }: Props) {
  const [abierto, setAbierto] = useState(true);

  const t = new Date(generado);
  const bogota = new Date(t.getTime() - 5 * 3600_000);
  const sello = `${String(bogota.getUTCDate()).padStart(2, '0')} AGO ${bogota.getUTCFullYear()} · ${String(bogota.getUTCHours()).padStart(2, '0')}:${String(bogota.getUTCMinutes()).padStart(2, '0')} COT`;

  if (!abierto) {
    return (
      <button className="cartucho-cerrado" onClick={() => setAbierto(true)}>
        <span className="rotulo" style={{ fontSize: 8.5 }}>▣ carta</span>
      </button>
    );
  }

  return (
    <div className="cartucho marco">
      <button onClick={() => setAbierto(false)} className="cartucho-x" aria-label="Ocultar cartucho">×</button>

      <div className="rotulo" style={{ fontSize: 7.5, letterSpacing: '0.2em' }}>república de colombia</div>
      <div className="rotulo" style={{ fontSize: 7.5, letterSpacing: '0.2em', marginBottom: 7 }}>
        cartagena de indias · bolívar
      </div>

      <div style={{ borderTop: 'var(--linea)', paddingTop: 7 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          CARTA DE RIESGO<br />DE INUNDACIÓN
        </div>
        <div className="rotulo" style={{ fontSize: 8, marginTop: 3 }}>corredor turístico · escala 1:60 000</div>
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 8, paddingTop: 7 }}>
        <Fila k="proyección" v="Web Mercator" />
        <Fila k="datum" v="WGS-84" />
        <Fila k="sondas" v="metros sobre NMM" />
        <Fila k="modelo" v={version.toUpperCase()} acento="var(--alerta)" />
        <Fila k="origen" v={fuente === 'vivo' ? 'PRONÓSTICO EN VIVO' : `SIMULACIÓN · ${(escenarioNombre ?? '').toUpperCase()}`}
          acento={fuente === 'vivo' ? 'var(--acento)' : 'var(--vigila)'} />
        <Fila k="corregida" v={sello} />
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 8, paddingTop: 7 }}>
        <Fila k="zonas" v={String(zonas)} />
        <Fila k="estab." v={`${establecimientos.toLocaleString('es-CO')} (OSM · piso)`} />
        <Fila k="fuentes" v="Open-Meteo · OSM" />
      </div>

      <div className="rotulo" style={{
        fontSize: 7.5, textTransform: 'none', letterSpacing: '0.03em',
        lineHeight: 1.5, marginTop: 8, borderTop: 'var(--linea)', paddingTop: 7,
        color: 'var(--alerta)',
      }}>
        AVISO — Índice sin calibrar contra eventos históricos. Ordena riesgo
        relativo; no expresa probabilidad. No sustituye a la autoridad de gestión
        del riesgo.
      </div>
    </div>
  );
}
