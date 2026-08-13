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
import { GlifoBanda } from './components/GlifoBanda';
import { LecturaZona, ComponentesZona } from './components/LecturaZona';
import { EstadoInicial } from './components/EstadoInicial';
import { SeccionColapsable } from './components/SeccionColapsable';
import { Definicion } from './components/Definicion';
import { ModoPresentacion } from './components/ModoPresentacion';
import {
  getZonas, getRiesgo, getEscenarios, simular,
  COLOR_BANDA, copCorto, type GeoResp, type DetalleZona,
} from './lib/api';
import { DEFINICIONES } from './lib/lectura';
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
  const [modoPitch, setModoPitch] = useState(false);
  const t = T[idioma];
  const def = DEFINICIONES[idioma];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'p' && e.key !== 'P') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      setModoPitch((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
  const todoVerde = !!geo && geo.features.length > 0 && geo.features.every((f) => f.properties.banda === 'verde');

  return (
    <div className="layout">
      {/* ─── BARRA SUPERIOR ─── */}
      {/* En el flujo, no absolute: si se parte en dos filas el HUD
          no tiene que adivinar un top en píxeles. */}
      <header className="barra-sup">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--esp-4)' }}>
          <h1 style={{ fontSize: 'var(--texto-xl)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>MAREA</h1>
          <span className="rotulo" style={{ maxWidth: 210, lineHeight: 1.3 }}>{t.subtitulo}</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--esp-3)', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <span className="badge badge-sin-calibrar">{t.sinCalibrar}</span>
          {meta && (
            <span className={`badge ${meta.simulado ? 'badge-simulado' : 'badge-vivo'}`}>
              {meta.simulado ? t.simuladoLargo : t.vivo}
            </span>
          )}
          {meta?.degradado && <span className="badge badge-simulado latido">{t.degradado}</span>}
          {recalc && <span className="badge badge-vivo latido">{t.recalculando}</span>}

          <select value={escenario} aria-label={t.enVivo} onChange={(e) => setEscenario(e.target.value)}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)', letterSpacing: '0.04em' }}>
            <option value="">{t.enVivo}</option>
            {escenarios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>

          <select value={temporada} aria-label={t.tempAlta} onChange={(e) => setTemporada(e.target.value as any)}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)', letterSpacing: '0.04em' }}>
            <option value="alta">{t.tempAlta}</option>
            <option value="media">{t.tempMedia}</option>
            <option value="baja">{t.tempBaja}</option>
          </select>

          <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)', letterSpacing: '0.08em' }}>
            {idioma === 'es' ? 'EN' : 'ES'}
          </button>

          {/* Modo día / noche — un puente de barco hace exactamente esto. */}
          <button onClick={() => setTema(tema === 'noche' ? 'dia' : 'noche')}
            aria-label={tema === 'noche' ? t.modoDia : t.modoNoche}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)', letterSpacing: '0.08em' }}>
            {tema === 'noche' ? '\u25D1 ' + t.dia : '\u25D0 ' + t.noche}
          </button>

          <button
            onClick={() => setModoPitch(true)}
            aria-label={t.modoPitch}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)', letterSpacing: '0.08em', color: 'var(--acento)' }}>
            {t.pitch}
          </button>
        </div>
      </header>

      {meta?.simulado && (
        <div className="aviso-escenario" role="status">
          {t.avisoEscenario}
        </div>
      )}

      <div className="escena">
      <div className="capa-mapa">
        <MapaRiesgo datos={geo} seleccion={sel} onSeleccion={setSel} tema={tema} />
        {meta?.simulado && (
          <div className="sello-escenario" role="status">{t.selloEscenario}</div>
        )}
      </div>

      {meta?.avisos?.length ? (
        <div className="aviso-api simulado">
          <span className="rotulo" style={{ color: 'var(--alerta)', textTransform: 'none', letterSpacing: '0.04em' }}>
            {meta.avisos.join(' · ')}
          </span>
        </div>
      ) : null}

      {error && (
        <div className="aviso-api" style={{ borderColor: 'var(--critico)' }}>
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
          etiquetaCerrado={t.cartuchoCerrado}
        />
      )}

      {/* ─── HUD IZQUIERDA · ranking de zonas ─── */}
      <aside className="hud hud-izq">
        {todoVerde && (
          <EstadoInicial
            idioma={idioma}
            simulado={!!meta?.simulado}
            onProbar={() => setEscenario('aguacero_marea_alta')}
          />
        )}

        <div className="panel milimetrado" style={{ padding: 'var(--esp-6)' }}>
          <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-4)' }}>{t.zonas}</div>

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
                  paddingBlock: 'var(--esp-5)', marginBottom: 'var(--esp-4)',
                  background: activo ? 'var(--abismo)' : 'transparent',
                  borderColor: activo ? COLOR_BANDA[p.banda] : 'var(--sonda)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--esp-3)' }}>
                  <span style={{ fontSize: 'var(--texto-md)', fontWeight: 600, fontFamily: 'var(--display)', color: 'var(--papel)' }}>
                    {p.nombre}
                    {p.es_turistica && <span style={{ color: 'var(--acento)', fontSize: 'var(--texto-xs)' }}> ◆</span>}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--esp-2)' }}>
                    <GlifoBanda banda={p.banda} color={COLOR_BANDA[p.banda]} />
                    <span className="num" style={{ fontSize: 'var(--texto-lg)', fontWeight: 700, color: COLOR_BANDA[p.banda] }}>
                      {p.iri.toFixed(0)}
                    </span>
                    <span className="rotulo" style={{ fontSize: 'var(--texto-xs)' }}>/100</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--esp-3)', gap: 'var(--esp-4)' }}>
                  <span className="rotulo" style={{ color: COLOR_BANDA[p.banda], textTransform: 'none', letterSpacing: '0.04em' }}>
                    {t.bandaDe[p.banda]}
                  </span>
                  <Sparkline valores={p.serie_iri ?? []} color={COLOR_BANDA[p.banda]} />
                  <span className="num rotulo" style={{ fontSize: 'var(--texto-xs)', color: p.ver_cop > 0 ? 'var(--alerta)' : 'var(--papel-fant)' }}>
                    {copCorto(p.ver_cop)}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="rotulo" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-3)', textTransform: 'none', lineHeight: 1.5 }}>
            ◆ {t.turistica} · {t.osmNota}
          </div>
        </div>
      </aside>

      {/* ─── HUD DERECHA · detalle de zona ─── */}
      <aside className="hud hud-der">
        {cargandoDetalle && !detalle && (
          <div className="panel" style={{ padding: 'var(--esp-6)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-4)' }}>{t.cargando}</div>
            <div className="esqueleto" style={{ height: 200, marginBottom: 'var(--esp-4)' }} />
            <Esqueleto n={4} />
          </div>
        )}

        {!cargandoDetalle && !detalle && (
          <div className="panel" style={{ padding: 'var(--esp-6)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)' }}>{t.sinDetalle}</div>
            <div className="rotulo" style={{ marginTop: 'var(--esp-3)', textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
              {t.sinDetalleAyuda}
            </div>
          </div>
        )}

        {detalle && (
          <>
            <div className={`panel ${detalle.simulado ? 'simulado' : ''}`} style={{ padding: 'var(--esp-6)' }}>
              <LecturaZona detalle={detalle} idioma={idioma} />

              <div style={{ marginTop: 'var(--esp-6)', borderTop: 'var(--linea)', paddingTop: 'var(--esp-5)' }}>
                <ContadorVER
                  valor={detalle.ver_cop}
                  horas={detalle.horas_interrupcion + 2}
                  etiqueta={t.ver}
                  rotulo={
                    <Definicion termino={t.ver} titulo={def.VER.titulo}>{def.VER.cuerpo}</Definicion>
                  }
                  nota={detalle.ver_cop > 0 ? t.verNotaActivo : t.verNotaCero}
                />
                {detalle.ver_cop > 0 && (
                <div style={{ marginTop: 'var(--esp-5)' }}>
                  {detalle.desglose.filter((d) => d.establecimientos > 0).map((d) => (
                    <div key={d.categoria} style={{ marginBottom: 'var(--esp-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--texto-xs)' }}>
                        <span className="rotulo" style={{ fontSize: 'var(--texto-xs)' }}>{d.categoria} · {d.establecimientos}</span>
                        <span className="num" style={{ fontSize: 'var(--texto-xs)', color: 'var(--papel-tenue)' }}>{copCorto(d.cop_total)}</span>
                      </div>
                      <div style={{ height: 3, background: 'var(--sonda)', marginTop: 'var(--esp-1)' }}>
                        <div style={{ height: '100%', width: `${d.pct}%`, background: 'var(--alerta)' }} />
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Doble bisel: el reloj es el elemento héroe y va montado como
                  una placa dentro de su bandeja, no plano sobre el panel. */}
              <div className="bisel" style={{ marginTop: 'var(--esp-5)' }}>
                <div className="nucleo">
                  <RelojMarea
                    serie={detalle.serie}
                    ventanaCritica={detalle.ventana_critica}
                    pico={detalle.pico}
                    simulado={detalle.simulado}
                    rotuloVentana={
                      <span className="rotulo" style={{ color: 'var(--critico)' }}>
                        <Definicion termino={idioma === 'en' ? 'critical window' : 'ventana crítica'} titulo={def.ventana.titulo}>
                          {def.ventana.cuerpo}
                        </Definicion>
                        &nbsp;
                      </span>
                    }
                  />
                </div>
              </div>

              <ComponentesZona detalle={detalle} idioma={idioma} />
            </div>

            <SeccionColapsable id="sensibilidad" titulo={t.sensibilidad} resumen={t.sensibilidadResumen}>
              <Tornado
                filas={detalle.sensibilidad}
                sinCaja
                definicionEta={
                  <Definicion termino="η" titulo={def.eta.titulo}>{def.eta.cuerpo}</Definicion>
                }
              />
            </SeccionColapsable>

            <SeccionColapsable id="supuestos" titulo={t.supuestos} resumen={t.supuestosResumen}>
              <PanelSupuestos onCambio={setOverrides} verTotal={verTotal} recalculando={recalc} sinCaja />
            </SeccionColapsable>
          </>
        )}
      </aside>
      </div>

      {modoPitch && (
        <ModoPresentacion
          onClose={() => setModoPitch(false)}
          onProbarEscenario={(id) => setEscenario(id)}
        />
      )}
    </div>
  );
}
