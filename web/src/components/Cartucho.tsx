/**
 * CARTUCHO — el bloque de título de una carta náutica.
 *
 * Declara limitaciones donde un navegante las buscaría. El cierre ya no
 * dice "datum · sondas": dice qué va a encontrar quien lo abra.
 */

import { useState } from 'react';
import type { Idioma } from '../i18n';
import { T } from '../i18n';

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
  idioma: Idioma;
}

const Fila = ({ k, v, acento }: { k: string; v: string; acento?: string }) => (
  <div style={{ display: 'flex', gap: 'var(--esp-4)', lineHeight: 1.5 }}>
    <span className="rotulo" style={{ fontSize: 'var(--texto-xs)', width: 84, flexShrink: 0 }}>{k}</span>
    <span className="num" style={{ fontSize: 'var(--texto-xs)', color: acento ?? 'var(--papel-tenue)', overflowWrap: 'anywhere' }}>{v}</span>
  </div>
);

export function Cartucho({
  fuente, escenarioNombre, generado, version, zonas, establecimientos,
  etiquetaCerrado, abierto: controlada, onCambio, idioma,
}: Props) {
  const t = T[idioma];
  const [interna, setInterna] = useState(false);
  const abierto = controlada ?? interna;
  const setAbierto = (v: boolean) => {
    if (controlada === undefined) setInterna(v);
    onCambio?.(v);
  };

  const fecha = new Date(generado);
  const sello = new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha) + ' COT';

  if (!abierto) {
    return (
      <button type="button" className="cartucho-cerrado" onClick={() => setAbierto(true)}>
        <span className="rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{etiquetaCerrado ?? t.cartuchoCerrado}</span>
      </button>
    );
  }

  return (
    <div className="cartucho marco">
      <button type="button" onClick={() => setAbierto(false)} className="cartucho-x" aria-label={t.cartuchoOcultar}>×</button>

      <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', letterSpacing: '0.08em' }}>{t.cartuchoPais}</div>
      <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', letterSpacing: '0.08em', marginBottom: 'var(--esp-4)' }}>
        {t.cartuchoLugar}
      </div>

      <div style={{ borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)' }}>
        <div style={{ fontSize: 'var(--texto-md)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {t.cartuchoTitulo1}<br />{t.cartuchoTitulo2}
        </div>
        <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-2)' }}>{t.cartuchoEscala}</div>
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 'var(--esp-4)', paddingTop: 'var(--esp-4)' }}>
        <Fila k={t.cartuchoProy} v={t.cartuchoProyV} />
        <Fila k={t.cartuchoDatum} v={t.cartuchoDatumV} />
        <Fila k={t.cartuchoSondas} v={t.cartuchoSondasV} />
        <Fila k={t.cartuchoModelo} v={version.toUpperCase()} acento="var(--alerta)" />
        <Fila
          k={t.cartuchoOrigen}
          v={fuente === 'vivo' ? t.cartuchoVivo : `${t.cartuchoSim} · ${(escenarioNombre ?? '').toUpperCase()}`}
          acento={fuente === 'vivo' ? 'var(--acento)' : 'var(--vigila)'}
        />
        <Fila k={t.cartuchoFecha} v={sello} />
      </div>

      <div style={{ borderTop: 'var(--linea)', marginTop: 'var(--esp-4)', paddingTop: 'var(--esp-4)' }}>
        <Fila k={t.cartuchoZonas} v={String(zonas)} />
        <Fila k={t.cartuchoEstab} v={`${establecimientos.toLocaleString(idioma === 'en' ? 'en-US' : 'es-CO')} ${t.cartuchoEstabV}`} />
        <Fila k={t.cartuchoFuentes} v={t.cartuchoFuentesV} />
      </div>

      <div className="rotulo" style={{
        fontSize: 'var(--texto-xs)', textTransform: 'none', letterSpacing: '0.03em',
        lineHeight: 1.5, marginTop: 'var(--esp-4)', borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)',
        color: 'var(--alerta)',
      }}>
        {t.cartuchoAviso}
      </div>
    </div>
  );
}
