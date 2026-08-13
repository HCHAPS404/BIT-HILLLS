/**
 * MAREA — instrumento, no dashboard.
 * Escritorio: mapa a sangre completa, datos sobrepuestos como HUD con líneas de 1px.
 * Móvil: scroll vertical normal, mapa arriba y paneles debajo (ver tokens.css).
 */

import { useCallback, useEffect, useState } from 'react';
import { MapaRiesgo } from './components/MapaRiesgo';
import { RelojMarea } from './components/RelojMarea';
import { ContadorVER } from './components/ContadorVER';
import { PanelSupuestos } from './components/PanelSupuestos';
import { Tornado } from './components/Tornado';
import { Cartucho } from './components/Cartucho';
import { Sparkline } from './components/Sparkline';
import { GlifoBanda, nombreBanda } from './components/GlifoBanda';
import {
  getZonas, getRiesgo, getEscenarios, simular,
  COLOR_BANDA, copCorto, type GeoResp, type DetalleZona,
} from './lib/api';
import { T, type Idioma } from './i18n';

const Esqueleto = ({ n = 4, alto = 10 }: { n?: number; alto?: number }) => (
  <div>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="esqueleto esqueleto-linea"
        style={{ height: alto, width: `${100 - (i % 3) * 14}%`, animationDelay: `${i * 0.09}s` }} />
    ))}
  </div>
);

export default function App() {
  const [geo, setGeo] = useState<GeoResp | null>(null);
  const [sel, setSel] = useState<string | null>('bocagrande');
  const [detalle, setDetalle] = useState<DetalleZona | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(true);
  const [escenarios, setEscenarios] = useState<any[]>([]);
  const [escenario, setEscenario] = useState<string>('');
  const [temporada, setTemporada] = useState<'alta' | 'media' | 'baja'>('alta');
  const [overrides, setOverrides] = useState<any>({});
  const [recalc, setRecalc] = useState(false);
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [error, setError] = useState<string | null>(null);
  // Modo día/noche. Arranca en noche: es un instrumento, y se recuerda.
  const [tema, setTema] = useState<'noche' | 'dia'>(
    () => (localStorage.getItem('marea:tema') as 'noche' | 'dia') ?? 'noche',
  );
  const t = T[idioma];

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem('marea:tema', tema);
  }, [tema]);

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
    setCargandoDetalle(true);
    getRiesgo(sel, escenario || undefined, temporada)
      .then(setDetalle)
      .catch(() => setDetalle(null))
      .finally(() => setCargandoDetalle(false));
  }, [sel, escenario, temporada]);

  const meta = geo?.metadata;
  const verTotal = geo?.features.reduce((a, f) => a + f.properties.ver_cop, 0) ?? 0;

  return (
    <div className="layout">
      <div className="capa-mapa">
        <MapaRiesgo datos={geo} seleccion={sel} onSeleccion={setSel} tema={tema} />
      </div>

      {/* ─── BARRA SUPERIOR ─── */}
      {/* Posicionamiento en tokens.css, NO inline: el inline le ganaría a la
          media query de móvil y la barra volvería a tapar el mapa. */}
      <header className="barra-sup">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>MAREA</h1>
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
          {recalc && <span className="badge badge-vivo latido">{t.recalculando}</span>}

          <select value={escenario} aria-label={t.enVivo} onChange={(e) => setEscenario(e.target.value)}
            style={{ fontSize: 10, padding: '4px 7px', letterSpacing: '0.06em' }}>
            <option value="">{t.enVivo}</option>
            {escenarios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>

          <select value={temporada} aria-label={t.tempAlta} onChange={(e) => setTemporada(e.target.value as any)}
            style={{ fontSize: 10, padding: '4px 7px', letterSpacing: '0.06em' }}>
            <option value="alta">{t.tempAlta}</option>
            <option value="media">{t.tempMedia}</option>
            <option value="baja">{t.tempBaja}</option>
          </select>

          <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
            style={{ fontSize: 10, padding: '4px 8px', letterSpacing: '0.1em' }}>
            {idioma === 'es' ? 'EN' : 'ES'}
          </button>

          {/* Modo día / noche — un puente de barco hace exactamente esto. */}
          <button onClick={() => setTema(tema === 'noche' ? 'dia' : 'noche')}
            title={tema === 'noche' ? t.modoDia : t.modoNoche}
            style={{ fontSize: 10, padding: '4px 8px', letterSpacing: '0.1em' }}>
            {tema === 'noche' ? '\u25D1 ' + t.dia : '\u25D0 ' + t.noche}
          </button>
        </div>
      </header>

      {meta?.avisos?.length ? (
        <div className="simulado" style={{
          position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', zIndex: 13,
          border: '1px solid var(--alerta)', background: 'var(--profundo)', padding: '5px 11px',
          maxWidth: 'min(560px, 92vw)',
        }}>
          <span className="rotulo" style={{ color: 'var(--alerta)', textTransform: 'none', letterSpacing: '0.04em' }}>
            {meta.avisos.join(' · ')}
          </span>
        </div>
      ) : null}

      {error && (
        <div style={{ position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', zIndex: 13,
          border: '1px solid var(--critico)', background: 'var(--profundo)', padding: '5px 11px' }}>
          <span className="rotulo" style={{ color: 'var(--critico)', textTransform: 'none' }}>API: {error}</span>
        </div>
      )}

      {meta && (
        <Cartucho
          fuente={meta.fuente}
          escenarioNombre={escenarios.find((e) => e.id === escenario)?.nombre}
          generado={meta.generado}
          version={meta.version_modelo}
          zonas={geo?.features.length ?? 0}
          establecimientos={geo?.features.reduce((a, f) => a + f.properties.establecimientos, 0) ?? 0}
        />
      )}

      {/* ─── HUD IZQUIERDA · ranking de zonas ─── */}
      <aside className="hud hud-izq">
        <div className="panel milimetrado" style={{ padding: 10 }}>
          <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 8 }}>{t.zonas}</div>

          {!geo && !error && <Esqueleto n={6} alto={30} />}

          {geo?.features.length === 0 && (
            <div className="rotulo" style={{ textTransform: 'none', lineHeight: 1.5 }}>{t.sinZonas}</div>
          )}

          {geo?.features.map((f) => {
            const p = f.properties;
            const activo = p.id === sel;
            return (
              <button key={p.id} onClick={() => setSel(p.id)} className="fila-zona"
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  paddingBlock: 8, marginBottom: 6,
                  background: activo ? 'var(--abismo)' : 'transparent',
                  borderColor: activo ? COLOR_BANDA[p.banda] : 'var(--sonda)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--display)', color: 'var(--papel)' }}>
                    {p.nombre}
                    {p.es_turistica && <span style={{ color: 'var(--acento)', fontSize: 9 }}> ◆</span>}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <GlifoBanda banda={p.banda} color={COLOR_BANDA[p.banda]} />
                    <span className="num" style={{ fontSize: 15, fontWeight: 700, color: COLOR_BANDA[p.banda] }}>
                      {p.iri.toFixed(0)}
                    </span>
                    <span className="sr-only">{nombreBanda(p.banda)}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 3, gap: 8 }}>
                  <Sparkline valores={p.serie_iri ?? []} color={COLOR_BANDA[p.banda]} />
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
      <aside className="hud hud-der">
        {cargandoDetalle && !detalle && (
          <div className="panel" style={{ padding: 11 }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 9 }}>{t.cargando}</div>
            <div className="esqueleto" style={{ height: 200, marginBottom: 9 }} />
            <Esqueleto n={4} />
          </div>
        )}

        {!cargandoDetalle && !detalle && (
          <div className="panel" style={{ padding: 14 }}>
            <div className="rotulo" style={{ color: 'var(--alerta)' }}>{t.sinDetalle}</div>
            <div className="rotulo" style={{ marginTop: 6, textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
              {t.sinDetalleAyuda}
            </div>
          </div>
        )}

        {detalle && (
          <>
            <div className={`panel ${detalle.simulado ? 'simulado' : ''}`} style={{ padding: 11 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>{detalle.zona.nombre}</h2>
              <div className="rotulo" style={{ textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.4, marginTop: 3 }}>
                {detalle.zona.nota}
              </div>
              {/* Doble bisel: el reloj es el elemento héroe y va montado como
                  una placa dentro de su bandeja, no plano sobre el panel. */}
              <div className="bisel" style={{ marginTop: 11 }}>
                <div className="nucleo">
                  <RelojMarea serie={detalle.serie} ventanaCritica={detalle.ventana_critica} pico={detalle.pico} simulado={detalle.simulado} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 12, borderTop: 'var(--linea)', paddingTop: 9 }}>
                {([['R', detalle.pico.componentes.R, t.cR], ['D', detalle.pico.componentes.D, t.cD],
                   ['O', detalle.pico.componentes.O, t.cO], ['S', detalle.pico.componentes.S, t.cS]] as const).map(([k, v, lbl]) => (
                  <div key={k}>
                    <div className="rotulo" style={{ fontSize: 8 }}>{k} · {lbl}</div>
                    <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--acento)' }}>{v.toFixed(2)}</div>
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

            <Tornado filas={detalle.sensibilidad} />

            <PanelSupuestos onCambio={setOverrides} verTotal={verTotal} recalculando={recalc} />
          </>
        )}
      </aside>
    </div>
  );
}
