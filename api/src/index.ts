/**
 * MAREA — API
 * Sistema de Alerta Temprana de inundación para el corredor turístico de Cartagena.
 * CTW Hackathon Cartagena · misión "Cartagena Construye con IA" · 13-ago-2026
 *
 * D1 ES OPCIONAL A PROPÓSITO: la API calcula en vivo y funciona desde el
 * minuto uno sin crear base de datos. Si `env.DB` existe, además persiste.
 * En un hackathon, cada dependencia que bloquea el arranque cuesta media hora.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './core/types';
import { P, PARAMS_META, type ParamsOverride } from './core/params';
import { ZONAS, getZona, TOTAL_ESTABLECIMIENTOS } from './core/zonas';
import { ESCENARIOS } from './adapters/escenarios';
import { evaluar, aGeoJSON } from './services/evaluate';
import { sensibilidad, copPorHora } from './core/economics';
import { clasificarCanal } from './adapters/vision';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

app.get('/', (c) =>
  c.json({
    servicio: 'MAREA · SAT de inundación · corredor turístico de Cartagena',
    mecanismo: 'IRI = 100 · S · R^0.7 · (0.55 + 0.20·D + 0.25·O) — la lluvia dispara, el mar y el canal amplifican hasta 1,8×',
    calibrado: false,
    advertencia: 'Índice de plausibilidad ordenada, NO una probabilidad. Sin calibrar contra eventos históricos.',
    zonas: ZONAS.length,
    establecimientos_osm: TOTAL_ESTABLECIMIENTOS,
    endpoints: [
      'GET  /api/salud',
      'GET  /api/zonas[?escenario=&temporada=]   → GeoJSON para el mapa',
      'GET  /api/riesgo/:zona[?h=72&escenario=]  → serie horaria',
      'GET  /api/params                          → supuestos + metadatos',
      'GET  /api/escenarios',
      'POST /api/simular                         → recalcula con overrides, SIN escribir',
      'POST /api/reportes                        → reporte ciudadano de canal (foto_base64 → clasificador de visión, o severidad manual)',
    ],
  }),
);

/** Estado de cada fuente externa. Lo primero que se mira si algo falla en el pitch. */
app.get('/api/salud', async (c) => {
  const probar = async (nombre: string, url: string) => {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      return { nombre, ok: r.ok, status: r.status, ms: Date.now() - t0 };
    } catch (e: any) {
      return { nombre, ok: false, error: String(e?.message ?? e), ms: Date.now() - t0 };
    }
  };
  const fuentes = await Promise.all([
    probar('open-meteo-forecast', 'https://api.open-meteo.com/v1/forecast?latitude=10.4&longitude=-75.55&hourly=precipitation&forecast_days=1'),
    probar('open-meteo-marine', 'https://marine-api.open-meteo.com/v1/marine?latitude=10.39&longitude=-75.55&hourly=sea_level_height_msl&forecast_days=1'),
  ]);
  return c.json({ ok: fuentes.every((f) => f.ok), d1: !!c.env.DB, fuentes, t: new Date().toISOString() });
});

/** GeoJSON con IRI y VER en properties. Una llamada pinta el mapa. */
app.get('/api/zonas', async (c) => {
  const escenario = c.req.query('escenario') || undefined;
  const temporada = (c.req.query('temporada') as any) || (c.env.TEMPORADA as any) || 'alta';
  try {
    const r = await evaluar({ escenario, temporada, horas: 72, db: c.env.DB });
    return c.json(aGeoJSON(r));
  } catch (e: any) {
    return c.json({ error: String(e?.message ?? e) }, 500);
  }
});

/** Serie horaria de una zona: alimenta el Reloj de Marea y el gráfico de 72 h. */
app.get('/api/riesgo/:zona', async (c) => {
  const id = c.req.param('zona');
  const zona = getZona(id);
  if (!zona) return c.json({ error: `zona desconocida: ${id}`, validas: ZONAS.map((z) => z.id) }, 404);

  const escenario = c.req.query('escenario') || undefined;
  const temporada = (c.req.query('temporada') as any) || 'alta';
  const horas = Number(c.req.query('h') ?? 72);

  const r = await evaluar({ escenario, temporada, horas, db: c.env.DB });
  const z = r.zonas.find((x) => x.zona.id === id)!;

  return c.json({
    zona: { id: zona.id, nombre: zona.nombre, nota: zona.nota, es_turistica: zona.es_turistica, susceptibilidad: zona.susceptibilidad, establecimientos: zona.establecimientos },
    fuente: r.fuente, simulado: r.simulado, degradado: r.degradado, avisos: r.avisos,
    calibrado: false, version_modelo: r.version_modelo,
    serie: z.serie, actual: z.actual, pico: z.pico,
    ventana_critica: z.ventana_critica,
    horas_interrupcion: z.horas_interrupcion,
    ver_cop: z.ver_cop, desglose: z.desglose,
    cop_por_hora: Math.round(copPorHora(zona)),
    sensibilidad: sensibilidad(zona, z.pico.iri, z.horas_interrupcion, temporada),
  });
});

/** Todos los supuestos con nombre, valor, unidad y FUENTE. Alimenta el panel. */
app.get('/api/params', (c) =>
  c.json({
    valores: P,
    meta: PARAMS_META,
    nota: 'Cambia cualquier supuesto y llama a POST /api/simular. El modelo es tuyo.',
  }),
);

app.get('/api/escenarios', (c) =>
  c.json({
    escenarios: ESCENARIOS,
    nota: 'Los dos primeros son el pitch: misma lluvia, mismo canal, solo cambia la marea.',
  }),
);

/**
 * Recalcula con supuestos del jurado. PURO: no escribe en D1, no muta estado.
 * Mismo input → mismo output. Ese detalle vale una pregunta entera del jurado.
 */
app.post('/api/simular', async (c) => {
  type Cuerpo = { overrides?: ParamsOverride; escenario?: string; temporada?: any };
  const body = await c.req.json<Cuerpo>().catch((): Cuerpo => ({}));
  try {
    const r = await evaluar({ overrides: body.overrides, escenario: body.escenario, temporada: body.temporada ?? 'alta', horas: 72, db: c.env.DB });
    return c.json({ geojson: aGeoJSON(r), resumen: r.zonas.map((z) => ({ id: z.zona.id, nombre: z.zona.nombre, iri: z.pico.iri, banda: z.pico.banda, ver_cop: z.ver_cop })), ver_total_cop: r.zonas.reduce((a, z) => a + z.ver_cop, 0) });
  } catch (e: any) {
    return c.json({ error: String(e?.message ?? e) }, 400);
  }
});

/**
 * Reporte ciudadano de canal obstruido. Cierra el ciclo del producto:
 * el ciudadano que reporta mejora la predicción que protege al negocio que paga.
 * Ya alimenta el motor (ver adapters/reportes.ts) — el siguiente request a
 * /api/zonas o /api/riesgo/:zona para esta zona refleja el reporte.
 *
 * Con `foto_base64` + binding AI, la severidad la pone el clasificador de
 * visión (adapters/vision.ts). Sin foto, o sin AI disponible, `severidad`
 * la pone el cliente directamente — el modo manual nunca se rompe.
 */
app.post('/api/reportes', async (c) => {
  const b = await c.req
    .json<{ zona_id: string; lat?: number; lon?: number; foto_url?: string; foto_base64?: string; severidad?: number; telefono?: string }>()
    .catch(() => null);
  if (!b?.zona_id || !getZona(b.zona_id)) return c.json({ error: 'zona_id inválido', validas: ZONAS.map((z) => z.id) }, 400);

  let sev: number;
  let confianza = 1.0;
  let pendienteRevision = 0;
  let descripcionIa: string | null = null;

  if (b.foto_base64 && c.env.AI) {
    try {
      const lectura = await clasificarCanal(c.env.AI, base64ToArrayBuffer(b.foto_base64));
      sev = lectura.severidad;
      confianza = lectura.confianza;
      pendienteRevision = lectura.pendiente_revision ? 1 : 0;
      descripcionIa = lectura.descripcion;
    } catch (e: any) {
      // El clasificador falló: no inventamos severidad, va a revisión humana.
      sev = Math.max(0, Math.min(3, Number(b.severidad ?? 2)));
      confianza = 0;
      pendienteRevision = 1;
      descripcionIa = `clasificador falló: ${String(e?.message ?? e).slice(0, 150)}`;
    }
  } else {
    sev = Math.max(0, Math.min(3, Number(b.severidad ?? 2)));
  }

  if (c.env.DB) {
    await c.env.DB.prepare(
      'INSERT INTO reportes (zona_id, lat, lon, foto_url, severidad, confianza, pendiente_revision, descripcion_ia, telefono) VALUES (?,?,?,?,?,?,?,?,?)',
    ).bind(b.zona_id, b.lat ?? null, b.lon ?? null, b.foto_url ?? null, sev, confianza, pendienteRevision, descripcionIa, b.telefono ?? null).run();
  }
  return c.json({
    ok: true, zona_id: b.zona_id, severidad: sev, confianza,
    pendiente_revision: !!pendienteRevision, obstruccion_estimada: sev / 3, persistido: !!c.env.DB,
  });
});

export default {
  fetch: app.fetch,

  /** Cron cada 15 min. waitUntil: nunca dejes la promesa flotando en un Worker. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const r = await evaluar({ temporada: (env.TEMPORADA as any) ?? 'alta', db: env.DB });
        const criticas = r.zonas.filter((z) => z.pico.banda === 'naranja' || z.pico.banda === 'rojo');
        console.log(JSON.stringify({ evento: 'evaluacion', fuente: r.fuente, degradado: r.degradado, criticas: criticas.map((z) => ({ id: z.zona.id, iri: z.pico.iri, banda: z.pico.banda, ver_cop: z.ver_cop })) }));

        if (env.DB) {
          const stmt = env.DB.prepare('INSERT OR REPLACE INTO evaluaciones (zona_id, t, iri, banda, componentes, ver_cop) VALUES (?,?,?,?,?,?)');
          await env.DB.batch(r.zonas.map((z) => stmt.bind(z.zona.id, z.pico.t, z.pico.iri, z.pico.banda, JSON.stringify(z.pico.componentes), z.ver_cop)));
        }
        // TODO(equipo): notificar por Fontumi cuando banda ∈ {naranja, rojo}.
      })(),
    );
  },
};
