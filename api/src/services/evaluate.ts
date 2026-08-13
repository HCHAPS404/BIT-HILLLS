/**
 * ORQUESTADOR: señales → IRI → VER.
 *
 * Regla de resiliencia para el día del evento: si una fuente externa cae,
 * el sistema NO muestra pantalla en blanco. Cae a escenario semilla y lo
 * declara en la respuesta (`degradado: true`, `avisos: [...]`).
 * Una demo que dice "usando datos semilla, la fuente en vivo no responde"
 * es infinitamente mejor que una que se muere en el pitch.
 */

import type { Signal, Zona, Evaluacion } from '../core/types';
import { P, mergeParams, type ParamsOverride, type Params } from '../core/params';
import { calcularIRI, banda, horasInterrupcion } from '../core/risk';
import { calcularVER } from '../core/economics';
import { ZONAS } from '../core/zonas';
import { leerLluvia } from '../adapters/openmeteo';
import { leerMar } from '../adapters/marine';
import { generarEscenario, getEscenario, ESCENARIOS } from '../adapters/escenarios';

export interface PuntoSerie {
  t: string;
  iri: number;
  banda: ReturnType<typeof banda>;
  componentes: ReturnType<typeof calcularIRI>['componentes'];
}

export interface ResultadoZona {
  zona: Zona;
  serie: PuntoSerie[];
  actual: PuntoSerie;
  pico: PuntoSerie;
  horas_interrupcion: number;
  ver_cop: number;
  desglose: ReturnType<typeof calcularVER>['desglose'];
  ventana_critica: { desde: string; hasta: string } | null;
}

export interface Resultado {
  generado: string;
  fuente: 'vivo' | 'escenario';
  escenario_id?: string;
  simulado: boolean;
  degradado: boolean;
  avisos: string[];
  temporada: string;
  version_modelo: string;
  calibrado: false;
  zonas: ResultadoZona[];
}

/** Agrupa señales por hora para una zona. */
function porHora(senales: Signal[], zonaId: string): Map<string, Signal[]> {
  const m = new Map<string, Signal[]>();
  for (const s of senales) {
    if (s.zona_id !== zonaId) continue;
    const arr = m.get(s.t_valido);
    arr ? arr.push(s) : m.set(s.t_valido, [s]);
  }
  return m;
}

/** Ventana continua más larga con IRI ≥ umbral naranja. Alimenta el Reloj de Marea. */
function ventanaCritica(serie: PuntoSerie[], params: Params) {
  let mejor: { desde: string; hasta: string; n: number } | null = null;
  let ini: string | null = null;
  let n = 0;
  for (const p of serie) {
    if (p.iri >= params.umbrales.naranja) {
      if (!ini) { ini = p.t; n = 0; }
      n++;
    } else if (ini) {
      if (!mejor || n > mejor.n) mejor = { desde: ini, hasta: p.t, n };
      ini = null;
    }
  }
  if (ini && (!mejor || n > mejor.n)) mejor = { desde: ini, hasta: serie[serie.length - 1].t, n };
  return mejor ? { desde: mejor.desde, hasta: mejor.hasta } : null;
}

export interface OpcionesEval {
  escenario?: string;
  overrides?: ParamsOverride;
  temporada?: keyof typeof P.temporada;
  horas?: number;
}

export async function evaluar(opts: OpcionesEval = {}): Promise<Resultado> {
  const params = mergeParams(opts.overrides);
  const temporada = opts.temporada ?? 'alta';
  const avisos: string[] = [];
  const zonas = ZONAS;

  let senales: Signal[] = [];
  let fuente: 'vivo' | 'escenario' = 'vivo';
  let escenario_id: string | undefined;
  let degradado = false;

  if (opts.escenario) {
    const esc = getEscenario(opts.escenario);
    if (!esc) throw new Error(`escenario desconocido: ${opts.escenario}. Válidos: ${ESCENARIOS.map((e) => e.id).join(', ')}`);
    senales = generarEscenario(esc, zonas);
    fuente = 'escenario';
    escenario_id = esc.id;
  } else {
    // Las dos fuentes en paralelo. Si una cae, seguimos con la otra.
    const [lluvia, mar] = await Promise.allSettled([leerLluvia(zonas), leerMar(zonas)]);

    if (lluvia.status === 'fulfilled') senales.push(...lluvia.value);
    else { avisos.push(`Lluvia en vivo no disponible: ${lluvia.reason}`); degradado = true; }

    if (mar.status === 'fulfilled') senales.push(...mar.value);
    else { avisos.push(`Mar en vivo no disponible: ${mar.reason}`); degradado = true; }

    // Sin la lluvia no hay disparador: caemos a escenario y lo declaramos.
    if (lluvia.status === 'rejected') {
      const esc = ESCENARIOS[0];
      senales = generarEscenario(esc, zonas);
      fuente = 'escenario';
      escenario_id = esc.id;
      avisos.push('FALLBACK: mostrando escenario semilla, no datos en vivo.');
    }

    // Obstrucción: por ahora el estado base de la zona. Los reportes
    // ciudadanos (POST /api/reportes) sobreescriben esta señal.
    for (const z of zonas) {
      const horas = [...new Set(senales.filter((s) => s.zona_id === z.id).map((s) => s.t_valido))];
      for (const t of horas) {
        senales.push({
          zona_id: z.id, tipo: 'obstruccion', valor: z.obstruccion_base,
          unidad: '0-1', t_valido: t, confianza: 0.6, fuente: 'estado-base-zona',
        });
      }
    }
  }

  const limite = opts.horas ?? 72;

  const resultados: ResultadoZona[] = zonas.map((zona) => {
    const serie = [...porHora(senales, zona.id).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, limite)
      .map(([t, ss]) => {
        const { iri, componentes } = calcularIRI(zona, ss, params);
        return { t, iri, banda: banda(iri, params), componentes };
      });

    const actual = serie[0] ?? { t: '', iri: 0, banda: 'verde' as const, componentes: { R: 0, D: 0, O: 0, S: zona.susceptibilidad, modificador: params.base_mod } };
    const pico = serie.reduce((a, b) => (b.iri > a.iri ? b : a), actual);
    const horas = horasInterrupcion(serie, params);
    const { ver_cop, desglose } = calcularVER(zona, pico.iri, horas, temporada, params);

    return { zona, serie, actual, pico, horas_interrupcion: horas, ver_cop, desglose, ventana_critica: ventanaCritica(serie, params) };
  });

  return {
    generado: new Date().toISOString(),
    fuente,
    escenario_id,
    simulado: fuente === 'escenario',
    degradado,
    avisos,
    temporada,
    version_modelo: params.version_modelo,
    calibrado: false,
    zonas: resultados.sort((a, b) => b.pico.iri - a.pico.iri),
  };
}

/** GeoJSON listo para MapLibre: una sola llamada pinta el mapa entero. */
export function aGeoJSON(r: Resultado) {
  return {
    type: 'FeatureCollection' as const,
    metadata: {
      generado: r.generado, fuente: r.fuente, simulado: r.simulado,
      degradado: r.degradado, avisos: r.avisos, calibrado: false,
      version_modelo: r.version_modelo,
    },
    features: r.zonas.map((z) => ({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [z.zona.polygon] },
      properties: {
        id: z.zona.id,
        nombre: z.zona.nombre,
        es_turistica: z.zona.es_turistica,
        nota: z.zona.nota,
        iri: z.pico.iri,
        iri_actual: z.actual.iri,
        banda: z.pico.banda,
        componentes: z.pico.componentes,
        ver_cop: z.ver_cop,
        horas_interrupcion: z.horas_interrupcion,
        ventana_critica: z.ventana_critica,
        poblacion_expuesta: z.zona.poblacion_expuesta,
        establecimientos: Object.values(z.zona.establecimientos).reduce((a, b) => a + b, 0),
        centro: [z.zona.lon, z.zona.lat],
        /**
         * 24 h de IRI redondeado, para el sparkline de la lista de zonas.
         * Enteros a propósito: el ranking necesita TENDENCIA, no precisión —
         * y así el GeoJSON no engorda (6 zonas × 24 enteros).
         */
        serie_iri: z.serie.slice(0, 24).map((p) => Math.round(p.iri)),
      },
    })),
  };
}
