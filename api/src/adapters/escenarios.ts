/**
 * ADAPTADOR — ESCENARIOS SEMILLA (modo simulación).
 *
 * POR QUÉ EXISTE: un SAT no se puede demostrar con la realidad si hoy no
 * llueve. Sin esto, la demo depende de la casualidad meteorológica.
 * Con esto demostramos el MECANISMO, que es lo que de verdad se juzga.
 *
 * REGLA INNEGOCIABLE: todo lo que salga de aquí viaja marcado como
 * `simulado: true` y la UI lo pinta con banda diagonal. Nunca se disfraza
 * de dato real. Si el jurado descubre una simulación presentada como medición,
 * perdimos — y con razón.
 *
 * LOS DOS PRIMEROS ESCENARIOS SON EL PITCH ENTERO:
 * misma lluvia, mismo canal, la marea es lo único que cambia.
 */

import type { Signal, Zona } from '../core/types';

export interface Escenario {
  id: string;
  nombre: string;
  descripcion: string;
  /** mm/3h en el pico */
  lluvia_pico: number;
  /** nivel medio del mar (m) alrededor del cual oscila */
  mar_medio: number;
  /** desfase de la marea en horas — mueve la pleamar respecto al aguacero */
  mar_fase_h: number;
  oleaje: number;
  obstruccion: number;
}

export const ESCENARIOS: Escenario[] = [
  {
    id: 'aguacero_marea_alta',
    nombre: 'Aguacero con pleamar',
    descripcion: 'Aguacero fuerte de tarde coincidiendo con marea alta. El drenaje por gravedad no evacúa.',
    lluvia_pico: 42, mar_medio: 0.30, mar_fase_h: 0, oleaje: 0.9, obstruccion: 0.70,
  },
  {
    id: 'aguacero_marea_baja',
    nombre: 'Aguacero con bajamar',
    descripcion: 'EL MISMO aguacero, el MISMO canal, pero con marea baja. El sistema evacúa.',
    lluvia_pico: 42, mar_medio: 0.12, mar_fase_h: 6, oleaje: 0.4, obstruccion: 0.70,
  },
  {
    id: 'mar_de_leva_feb2026',
    nombre: 'Mar de leva (tipo feb-2026)',
    descripcion: 'Poca lluvia, pero frentes fríos generan oleaje extremo. El mecanismo costero puro.',
    lluvia_pico: 12, mar_medio: 0.34, mar_fase_h: 0, oleaje: 2.4, obstruccion: 0.50,
  },
  {
    id: 'seco',
    nombre: 'Día seco',
    descripcion: 'Control. Sin lluvia el IRI es 0 aunque la marea esté alta: R es compuerta multiplicativa.',
    lluvia_pico: 0, mar_medio: 0.34, mar_fase_h: 0, oleaje: 1.2, obstruccion: 0.70,
  },
];

export const getEscenario = (id: string) => ESCENARIOS.find((e) => e.id === id);

/**
 * Genera 24 h de señales sintéticas.
 * Lluvia: campana convectiva centrada a las 15:00 (patrón de tarde caribeña).
 * Marea: semidiurna, período ~12,4 h, amplitud micro-mareal de ±0,17 m.
 */
export function generarEscenario(
  esc: Escenario,
  zonas: Zona[],
  desde?: string,
): Signal[] {
  // Colombia es UTC−5 fijo, sin horario de verano. Desplazamos el instante y
  // luego leemos los campos UTC: así obtenemos hora de pared de Bogotá.
  // Las etiquetas `t` quedan en hora local ingenua, EXACTAMENTE con el mismo
  // formato que devuelve Open-Meteo con timezone=America/Bogota. Si el
  // escenario emitiera UTC y el adaptador en vivo local, el Reloj de Marea
  // mostraría el aguacero de las 3 p.m. a las 8 p.m.
  const t0 = desde ? new Date(desde + ':00Z') : new Date(Date.now() - 5 * 3_600_000);
  t0.setUTCMinutes(0, 0, 0);

  const out: Signal[] = [];

  for (let h = 0; h < 24; h++) {
    const d = new Date(t0.getTime() + h * 3_600_000);
    const t = d.toISOString().slice(0, 16);
    const hora = d.getUTCHours();

    // Campana convectiva alrededor de las 15:00, σ ≈ 2 h
    const lluvia = esc.lluvia_pico * Math.exp(-Math.pow(hora - 15, 2) / 8);
    // Marea semidiurna: 2 pleamares por día
    const marea = esc.mar_medio + 0.17 * Math.sin((2 * Math.PI * (hora - esc.mar_fase_h)) / 12.4);

    for (const z of zonas) {
      const base = { zona_id: z.id, t_valido: t, confianza: 1, fuente: `escenario:${esc.id}` };
      out.push({ ...base, tipo: 'lluvia_3h', valor: Math.round(lluvia * 10) / 10, unidad: 'mm/3h' });
      out.push({ ...base, tipo: 'nivel_mar', valor: Math.round(marea * 1000) / 1000, unidad: 'm' });
      out.push({ ...base, tipo: 'oleaje', valor: esc.oleaje, unidad: 'm' });
      out.push({ ...base, tipo: 'obstruccion', valor: esc.obstruccion, unidad: '0-1' });
    }
  }
  return out;
}
