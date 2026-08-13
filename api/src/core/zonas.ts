/**
 * ZONAS DEL PILOTO.
 *
 * `establecimientos` son CONTEOS REALES de OpenStreetMap (Overpass API),
 * extraídos el 13-ago-2026 sobre el bbox 10.370/-75.590 → 10.445/-75.450.
 * 2.559 elementos recuperados, 1.533 caen dentro de estas seis zonas.
 *
 * LIMITACIÓN QUE HAY QUE DECIR EN VOZ ALTA: OSM SUBCUENTA. Getsemaní tiene
 * en la realidad muchos más hostales de los 3 que OSM registra. Por lo tanto
 * el VER que calculamos es un PISO, no un censo — conservador por construcción.
 * Es mucho mejor defender un número bajo y verificable que uno alto e inventado.
 *
 * `susceptibilidad`, `obstruccion_base` y `poblacion_expuesta` son SUPUESTOS
 * DE EQUIPO declarados, no dato público. Están aquí para ser discutidos.
 *
 * Zonas críticas recurrentes según Cartagena Cómo Vamos: Pie de la Popa,
 * El Socorro, San Pedro, Manga, Bocagrande, María Auxiliadora, Pablo Sexto, La María.
 */

import type { Zona } from './types';

/** Rectángulo a partir de bbox. Aproximación declarada, no polígono catastral. */
const box = (latMin: number, latMax: number, lonMin: number, lonMax: number): [number, number][] => [
  [lonMin, latMin], [lonMax, latMin], [lonMax, latMax], [lonMin, latMax], [lonMin, latMin],
];

export const ZONAS: Zona[] = [
  {
    id: 'bocagrande',
    nombre: 'Bocagrande',
    lat: 10.4013, lon: -75.5625,
    susceptibilidad: 0.95,
    es_turistica: true,
    obstruccion_base: 0.45,
    /** Corredor premium. Referencia del modelo. */
    factor_precio: 1.00,
    establecimientos: { hotel: 37, restaurante: 50, tour: 3, retail: 44 },
    poblacion_expuesta: 15_000,
    polygon: box(10.390, 10.4125, -75.5760, -75.5490),
    nota: 'Cota baja, drenaje por gravedad a la bahía. Zona crítica recurrente (CCV).',
  },
  {
    id: 'centro',
    nombre: 'Centro Histórico',
    lat: 10.4252, lon: -75.5497,
    susceptibilidad: 0.85,
    es_turistica: true,
    obstruccion_base: 0.40,
    /** Corredor premium. */
    factor_precio: 1.00,
    establecimientos: { hotel: 150, restaurante: 339, tour: 78, retail: 158 },
    poblacion_expuesta: 10_000,
    polygon: box(10.4175, 10.4330, -75.5570, -75.5425),
    nota: 'Máximo valor expuesto de la ciudad. Drenaje colonial. Patrimonio UNESCO.',
  },
  {
    id: 'getsemani',
    nombre: 'Getsemaní',
    lat: 10.4145, lon: -75.5427,
    susceptibilidad: 0.80,
    es_turistica: true,
    obstruccion_base: 0.50,
    /** Turístico pero de gama media-baja (hostales, no resorts). */
    factor_precio: 0.75,
    establecimientos: { hotel: 3, restaurante: 23, tour: 4, retail: 19 },
    poblacion_expuesta: 7_000,
    polygon: box(10.4105, 10.4185, -75.5480, -75.5375),
    nota: 'ZONA EN POTENCIA — el piloto. OSM subcuenta fuerte aquí: el VER real es mayor.',
  },
  {
    id: 'manga',
    nombre: 'Manga',
    lat: 10.4070, lon: -75.5312,
    susceptibilidad: 0.90,
    es_turistica: false,
    obstruccion_base: 0.50,
    /** Residencial con comercio de gama media. */
    factor_precio: 0.60,
    establecimientos: { hotel: 12, restaurante: 17, tour: 1, retail: 32 },
    poblacion_expuesta: 20_000,
    polygon: box(10.3990, 10.4150, -75.5410, -75.5215),
    nota: 'Zona crítica recurrente (CCV). Isla, rodeada de caños.',
  },
  {
    id: 'pie_popa',
    nombre: 'Pie de la Popa',
    lat: 10.4230, lon: -75.5325,
    susceptibilidad: 1.00,
    es_turistica: false,
    obstruccion_base: 0.70,
    /** Comercio de barrio con algo de gama media. */
    factor_precio: 0.50,
    establecimientos: { hotel: 10, restaurante: 19, tour: 3, retail: 30 },
    poblacion_expuesta: 25_000,
    polygon: box(10.4150, 10.4310, -75.5410, -75.5240),
    nota: 'Zona crítica recurrente (CCV). Escorrentía del cerro de La Popa.',
  },
  {
    id: 'el_socorro',
    nombre: 'El Socorro',
    lat: 10.3865, lon: -75.4745,
    susceptibilidad: 1.00,
    es_turistica: false,
    obstruccion_base: 0.75,
    /** Comercio de barrio. Ticket muy por debajo del corredor turístico. */
    factor_precio: 0.35,
    establecimientos: { hotel: 7, restaurante: 87, tour: 0, retail: 407 },
    poblacion_expuesta: 30_000,
    polygon: box(10.3760, 10.3970, -75.4890, -75.4600),
    nota: 'Zona crítica recurrente (CCV). Comercio de barrio, sin seguro. El argumento del subsidio cruzado.',
  },
];

export const getZona = (id: string) => ZONAS.find((z) => z.id === id);

/** Total de establecimientos contados en OSM dentro de las 6 zonas: 1.533. */
export const TOTAL_ESTABLECIMIENTOS = ZONAS.reduce(
  (a, z) => a + Object.values(z.establecimientos).reduce((x, y) => x + y, 0),
  0,
);
