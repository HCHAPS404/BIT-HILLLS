/**
 * ★ ES/EN. Es un producto para zona turística: que el jurado lo cambie a
 * inglés y todo siga coherente comunica producto real, no demo.
 * ~20 min de trabajo y todos los demás equipos lo van a omitir.
 */

export type Idioma = 'es' | 'en';

export const T = {
  es: {
    subtitulo: 'Alerta temprana de inundación · corredor turístico de Cartagena',
    sinCalibrar: 'sin calibrar · v0.1',
    simulado: 'simulación',
    vivo: 'datos en vivo',
    degradado: 'fuente degradada',
    enVivo: 'En vivo (pronóstico real)',
    tempAlta: 'Temporada alta',
    tempMedia: 'Temporada media',
    tempBaja: 'Temporada baja',
    zonas: 'zonas por riesgo',
    turistica: 'zona turística',
    osmNota: 'conteo de establecimientos: OpenStreetMap (subcuenta)',
    ver: 'valor expuesto en riesgo',
    cR: 'lluvia',
    cD: 'drenaje',
    cO: 'canal',
    cS: 'zona',
  },
  en: {
    subtitulo: 'Flood early warning · Cartagena tourist corridor',
    sinCalibrar: 'uncalibrated · v0.1',
    simulado: 'simulation',
    vivo: 'live data',
    degradado: 'degraded source',
    enVivo: 'Live (real forecast)',
    tempAlta: 'High season',
    tempMedia: 'Mid season',
    tempBaja: 'Low season',
    zonas: 'zones by risk',
    turistica: 'tourist zone',
    osmNota: 'venue counts: OpenStreetMap (undercounts)',
    ver: 'value at risk',
    cR: 'rain',
    cD: 'drainage',
    cO: 'canal',
    cS: 'zone',
  },
} as const;
