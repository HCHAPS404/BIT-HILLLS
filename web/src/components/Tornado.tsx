/**
 * TORNADO DE SENSIBILIDAD — responde la pregunta antes de que la hagan.
 *
 * Mueve cada supuesto ±30 % y mide cuánto se desplaza la plata en riesgo.
 * La barra de arriba es el supuesto que más la mueve.
 */

import { copCorto } from '../lib/api';
import type { Idioma } from '../i18n';
import { T } from '../i18n';
import { DEFINICIONES } from '../lib/lectura';
import { nombreGrupoRubro, nombreParam } from '../lib/nombresParams';
import { Definicion } from './Definicion';

interface Fila {
  parametro: string;
  bajo: number;
  alto: number;
  base: number;
  amplitud_pct: number;
}

export function Tornado({
  filas, sinCaja, idioma,
}: {
  filas: Fila[];
  sinCaja?: boolean;
  idioma: Idioma;
}) {
  const t = T[idioma];
  const utiles = filas.filter((f) => f.amplitud_pct !== 0);
  if (!utiles.length) {
    const vacio = (
      <p className="prosa-nota" style={{ margin: 0 }}>{t.sensibVacio}</p>
    );
    if (sinCaja) return vacio;
    return (
      <div className="panel" style={{ padding: 'var(--esp-5)' }}>
        <div className="rotulo" style={{ color: 'var(--acento)' }}>{t.sensibilidad}</div>
        <div style={{ marginTop: 'var(--esp-3)' }}>{vacio}</div>
      </div>
    );
  }

  const base = utiles[0].base;
  const span = Math.max(...utiles.map((f) => Math.max(Math.abs(f.alto - base), Math.abs(base - f.bajo))));

  const top = utiles[0];
  const empatados = utiles.filter((f) => Math.abs(f.amplitud_pct - top.amplitud_pct) < 0.05);
  const termino = (p: string) => p.split('.')[1] ?? p;
  const mismoTermino = empatados.length > 1 && new Set(empatados.map((f) => termino(f.parametro))).size === 1;
  const grupo = nombreGrupoRubro(termino(top.parametro), idioma);
  const cierre = mismoTermino
    ? t.sensibCierraGrupo.replace('{grupo}', grupo)
    : t.sensibCierraUno.replace('{nombre}', nombreParam(top.parametro, idioma));

  const cuerpo = (
    <>
      {!sinCaja && (
        <div className="rotulo" style={{ color: 'var(--acento)' }}>{t.sensibilidad}</div>
      )}
      <p className="prosa-nota" style={{ margin: sinCaja ? 0 : 'var(--esp-3) 0 0' }}>
        {t.sensibIntro}
      </p>

      <div style={{ marginTop: 'var(--esp-5)' }}>
        {utiles.map((f, i) => {
          const izq = Math.max(0, (base - f.bajo) / span) * 50;
          const der = Math.max(0, (f.alto - base) / span) * 50;
          const dominante = i === 0;
          const nombre = nombreParam(f.parametro, idioma);
          const eta = DEFINICIONES[idioma].eta;
          const etiqueta = f.parametro.startsWith('eta.')
            ? <Definicion termino={nombre} titulo={eta.titulo}>{eta.cuerpo}</Definicion>
            : nombre;
          return (
            <div key={f.parametro} style={{ marginBottom: 'var(--esp-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--esp-3)' }}>
                <span style={{ fontSize: 'var(--texto-sm)', fontWeight: dominante ? 600 : 400, color: dominante ? 'var(--papel)' : 'var(--papel-tenue)' }}>
                  {etiqueta}
                </span>
                <span className="num" style={{ fontSize: 'var(--texto-xs)', color: dominante ? 'var(--alerta)' : 'var(--papel-fant)' }}>
                  ±{Math.abs(f.amplitud_pct / 2).toFixed(0)} %
                </span>
              </div>

              <div style={{ position: 'relative', height: 11, marginTop: 'var(--esp-2)', background: 'var(--abismo)', border: 'var(--linea)' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--papel-fant)', zIndex: 2 }} />
                <div style={{
                  position: 'absolute', right: '50%', top: 1, bottom: 1, width: `${izq}%`,
                  background: dominante ? 'var(--marea)' : 'var(--sonda-alta)',
                }} />
                <div style={{
                  position: 'absolute', left: '50%', top: 1, bottom: 1, width: `${der}%`,
                  background: dominante ? 'var(--alerta)' : 'var(--sonda-alta)',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--esp-1)' }}>
                <span className="num rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{copCorto(f.bajo)}</span>
                <span className="num rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{copCorto(f.alto)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="prosa-nota" style={{
        borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)', margin: 'var(--esp-1) 0 0',
      }}>
        {cierre}
      </p>
    </>
  );

  if (sinCaja) return cuerpo;
  return (
    <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
      {cuerpo}
    </div>
  );
}
