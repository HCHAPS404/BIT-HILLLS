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
    recalculando: 'recalculando',
    cargando: 'leyendo sondas…',
    sinZonas: 'No hay zonas evaluadas. Revisa que la API esté corriendo en :8787.',
    sinDetalle: 'sin lectura de esta zona',
    sinDetalleAyuda: 'La API no devolvió la serie horaria. Elige otra zona o revisa /api/salud.',
    dia: 'DÍA', noche: 'NOCHE',
    modoDia: 'Cambiar a modo día (carta impresa)',
    modoNoche: 'Cambiar a modo noche (instrumento de puente)',
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
    recalculando: 'recalculating',
    cargando: 'reading soundings…',
    sinZonas: 'No zones evaluated. Check the API is running on :8787.',
    sinDetalle: 'no reading for this zone',
    sinDetalleAyuda: 'The API returned no hourly series. Pick another zone or check /api/salud.',
    dia: 'DAY', noche: 'NIGHT',
    modoDia: 'Switch to day mode (printed chart)',
    modoNoche: 'Switch to night mode (bridge instrument)',
  },
} as const;
