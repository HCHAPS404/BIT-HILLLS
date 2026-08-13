/**
 * MAREA — instrumento, no dashboard.
 * Mapa a sangre completa; los datos van sobrepuestos como HUD con líneas de 1px.
 */

import { useCallback, useEffect, useState } from 'react';
import { MapaRiesgo } from './components/MapaRiesgo';
import { RelojMarea } from './components/RelojMarea';
import { ContadorVER } from './components/ContadorVER';
import { PanelSupuestos } from './components/PanelSupuestos';
import {
  getZonas, getRiesgo, getEscenarios, simular,
  COLOR_BANDA, copCorto, type GeoResp, type DetalleZona,
} from './lib/api';
import { T, type Idioma } from './i18n';

export default function App() {
  const [geo, setGeo] = useState<GeoResp | null>(null);
  const [sel, setSel] = useState<string | null>('bocagrande');
  const [detalle, setDetalle] = useState<DetalleZona | null>(null);
  const [escenarios, setEscenarios] = useState<any[]>([]);
  const [escenario, setEscenario] = useState<string>('');
  const [temporada, setTemporada] = useState<'alta' | 'media' | 'baja'>('alta');
  const [overrides, setOverrides] = useState<any>({});
  const [recalc, setRecalc] = useState(false);
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [error, setError] = useState<string | null>(null);
  const t = T[idioma];

  useEffect(() => { getEscenarios().then((r) => setEscenarios(r.escenarios)).catch(() => {}); }, []);

  const cargar = useCallback(async () => {
    setRecalc(true); setError(null);
    try {
      const tieneOv = Object.keys(overrides).length > 0;
      const g = tieneOv
        ? (await simular({ overrides, escenario: escenario || undefined, temporada })).geojson
        : await getZonas(escenario || undefined, temporada);
      setGeo(g);
    } catch (e: any) { setError(String(e?.message ?? e)); }
    finally { setRecalc(false); }
  }, [escenario, temporada, overrides]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!sel) return;
    getRiesgo(sel, escenario || undefined, temporada).then(setDetalle).catch(() => setDetalle(null));
  }, [sel, escenario, temporada]);

  const meta = geo?.metadata;
  const verTotal = geo?.features.reduce((a, f) => a + f.properties.ver_cop, 0) ?? 0;

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <MapaRiesgo datos={geo} seleccion={sel} onSeleccion={setSel} />

      {/* ─── BARRA SUPERIOR ─── */}
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: '10px 14px', background: 'linear-gradient(180deg, rgba(10,20,32,.96), rgba(10,20,32,.72) 70%, transparent)',
        borderBottom: 'var(--linea)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em' }}>MAREA</span>
          <span className="rotulo" style={{ maxWidth: 210, lineHeight: 1.3 }}>{t.subtitulo}</span>
        </div>

        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <span className="badge badge-sin-calibrar">{t.sinCalibrar}</span>
          {meta && (
            <span className={`badge ${meta.simulado ? 'badge-simulado' : 'badge-vivo'}`}>
              {meta.simulado ? t.simulado : t.vivo}
            </span>
          )}
          {meta?.degradado && <span className="badge badge-simulado latido">{t.degradado}</span>}

          <select value={escenario} onChange={(e) => setEscenario(e.target.value)}
            style={{ fontSize: 10, padding: '4px 7px', letterSpacing: '0.06em' }}>
            <option value="">{t.enVivo}</option>
            {escenarios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>

          <select value={temporada} onChange={(e) => setTemporada(e.target.value as any)}
            style={{ fontSize: 10, padding: '4px 7px', letterSpacing: '0.06em' }}>
            <option value="alta">{t.tempAlta}</option>
            <option value="media">{t.tempMedia}</option>
            <option value="baja">{t.tempBaja}</option>
          </select>

          <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
            style={{ fontSize: 10, padding: '4px 8px', letterSpacing: '0.1em' }}>
            {idioma === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      {meta?.avisos?.length ? (
        <div className="simulado" style={{
          position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', zIndex: 11,
          border: '1px solid var(--alerta)', background: 'var(--profundo)', padding: '5px 11px',
          maxWidth: 'min(560px, 92vw)',
        }}>
          <span className="rotulo" style={{ color: 'var(--alerta)', textTransform: 'none', letterSpacing: '0.04em' }}>
            {meta.avisos.join(' · ')}
          </span>
        </div>
      ) : null}

      {error && (
        <div style={{ position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', zIndex: 11,
          border: '1px solid var(--critico)', background: 'var(--profundo)', padding: '5px 11px' }}>
          <span className="rotulo" style={{ color: 'var(--critico)', textTransform: 'none' }}>API: {error}</span>
        </div>
      )}

      {/* ─── HUD IZQUIERDA · ranking de zonas ─── */}
      <aside style={{ position: 'absolute', left: 12, top: 66, bottom: 12, width: 272, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div className="panel milimetrado" style={{ padding: 10, overflowY: 'auto' }}>
          <div className="rotulo" style={{ color: 'var(--cian)', marginBottom: 8 }}>{t.zonas}</div>
          {geo?.features.map((f) => {
            const p = f.properties;
            const activo = p.id === sel;
            return (
              <button key={p.id} onClick={() => setSel(p.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', marginBottom: 5,
                  background: activo ? 'var(--abismo)' : 'transparent',
                  borderColor: activo ? COLOR_BANDA[p.banda] : 'var(--sonda)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--display)', color: 'var(--papel)' }}>
                    {p.nombre}
                    {p.es_turistica && <span style={{ color: 'var(--cian)', fontSize: 9 }}> ◆</span>}
                  </span>
                  <span className="num" style={{ fontSize: 15, fontWeight: 700, color: COLOR_BANDA[p.banda] }}>
                    {p.iri.toFixed(0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span className="rotulo" style={{ fontSize: 8.5 }}>{p.establecimientos} est.</span>
                  <span className="num rotulo" style={{ fontSize: 9, color: p.ver_cop > 0 ? 'var(--alerta)' : 'var(--papel-fant)' }}>
                    {copCorto(p.ver_cop)}
                  </span>
                </div>
              </button>
            );
          })}
          <div className="rotulo" style={{ fontSize: 8.5, marginTop: 6, textTransform: 'none', lineHeight: 1.4 }}>
            ◆ {t.turistica} · {t.osmNota}
          </div>
        </div>
      </aside>

      {/* ─── HUD DERECHA · detalle de zona ─── */}
      <aside style={{ position: 'absolute', right: 12, top: 66, bottom: 12, width: 316, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 9, overflowY: 'auto' }}>
        {detalle && (
          <>
            <div className={`panel ${detalle.simulado ? 'simulado' : ''}`} style={{ padding: 11 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{detalle.zona.nombre}</div>
              <div className="rotulo" style={{ textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.4, marginTop: 3 }}>
                {detalle.zona.nota}
              </div>
              <div style={{ marginTop: 11 }}>
                <RelojMarea serie={detalle.serie} ventanaCritica={detalle.ventana_critica} pico={detalle.pico} simulado={detalle.simulado} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 12, borderTop: 'var(--linea)', paddingTop: 9 }}>
                {([['R', detalle.pico.componentes.R, t.cR], ['D', detalle.pico.componentes.D, t.cD],
                   ['O', detalle.pico.componentes.O, t.cO], ['S', detalle.pico.componentes.S, t.cS]] as const).map(([k, v, lbl]) => (
                  <div key={k}>
                    <div className="rotulo" style={{ fontSize: 8 }}>{k} · {lbl}</div>
                    <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cian)' }}>{v.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: 11 }}>
              <ContadorVER valor={detalle.ver_cop} horas={detalle.horas_interrupcion + 2} etiqueta={t.ver} />
              <div style={{ marginTop: 11, borderTop: 'var(--linea)', paddingTop: 8 }}>
                {detalle.desglose.filter((d) => d.establecimientos > 0).map((d) => (
                  <div key={d.categoria} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span className="rotulo" style={{ fontSize: 9.5 }}>{d.categoria} · {d.establecimientos}</span>
                      <span className="num" style={{ fontSize: 10, color: 'var(--papel-tenue)' }}>{copCorto(d.cop_total)}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--sonda)', marginTop: 2 }}>
                      <div style={{ height: '100%', width: `${d.pct}%`, background: 'var(--alerta)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PanelSupuestos onCambio={setOverrides} verTotal={verTotal} recalculando={recalc} />
          </>
        )}
      </aside>
    </div>
  );
}
