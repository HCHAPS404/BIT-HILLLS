/**
 * TODOS LOS SUPUESTOS DEL MODELO, EN UN SOLO ARCHIVO.
 *
 * Esto no es "config": es un argumento de diseño. El jurado puede ver y
 * cambiar cada número desde la UI (GET /api/params → POST /api/simular).
 * Nunca discutas una cifra con un jurado: dale el control deslizante.
 */

export const P = {
  // ─────────── RIESGO ───────────
  /** mm en 3 h. ~45 mm/3h es encharcamiento urbano severo. */
  lluvia_umbral_mm: 45,
  /** El daño urbano crece rápido al inicio del aguacero y luego satura. */
  exp_lluvia: 0.7,
  /** Nivel medio local del mar (m). */
  mar_base_m: 0.20,
  /** Rango micro-mareal (33 cm medidos hoy) + margen de sobreelevación. */
  mar_rango_m: 0.45,
  /** Cuánto pesa el oleaje frente al nivel del mar dentro de D. */
  peso_oleaje: 0.6,

  /** modificador = base + w_mar·D + w_obstr·O  →  rango 0.55 … 1.00 */
  base_mod: 0.55,
  w_mar: 0.20,
  w_obstr: 0.25,

  /** Bandas de alerta sobre IRI 0–100. */
  umbrales: { amarillo: 25, naranja: 50, rojo: 75 },

  // ─────────── ECONOMÍA (COP) ───────────
  /** Ticket promedio por transacción. SUPUESTO DE EQUIPO, editable. */
  ticket: { hotel: 480_000, restaurante: 75_000, tour: 190_000, retail: 110_000 },
  /** Transacciones por hora operativa. SUPUESTO DE EQUIPO, editable. */
  tx_hora: { hotel: 1.4, restaurante: 11, tour: 2.5, retail: 6 },
  /**
   * η = fracción de ingreso PERDIDO, no diferido.
   * La habitación de hotel ya está pagada: se pierde F&B y cancelaciones, no la noche.
   * El almuerzo que no ocurrió no se recupera mañana.
   * Este parámetro es el que demuestra que entendimos el negocio, no solo la lluvia.
   */
  eta: { hotel: 0.15, restaurante: 0.85, tour: 0.95, retail: 0.60 },

  temporada: { alta: 1.0, media: 0.7, baja: 0.45 },
  /** El agua se va antes que los clientes vuelvan. */
  horas_recuperacion: 2,

  version_modelo: 'IRI-v0.1-sin-calibrar',
} as const;

export type Params = typeof P;
/** Params mutable, para overrides que llegan del panel de supuestos. */
export type ParamsOverride = {
  -readonly [K in keyof Params]?: Params[K] extends object
    ? { -readonly [J in keyof Params[K]]?: Params[K][J] }
    : Params[K];
};

/** Fusiona overrides del jurado sobre los defaults. Un nivel de profundidad. */
export function mergeParams(over?: ParamsOverride): Params {
  if (!over) return P;
  const out: any = { ...P };
  for (const [k, v] of Object.entries(over)) {
    out[k] = v !== null && typeof v === 'object' && !Array.isArray(v)
      ? { ...(P as any)[k], ...v }
      : v;
  }
  return out as Params;
}

/** Metadatos para que la UI pinte el panel sin hardcodear nada. */
export const PARAMS_META = [
  { key: 'lluvia_umbral_mm', grupo: 'riesgo', label: 'Umbral de lluvia', unidad: 'mm/3h', min: 15, max: 90, step: 1, fuente: 'Estimación de equipo · encharcamiento urbano severo' },
  { key: 'mar_base_m', grupo: 'riesgo', label: 'Nivel medio del mar', unidad: 'm', min: 0, max: 0.5, step: 0.01, fuente: 'Open-Meteo Marine · Cartagena' },
  { key: 'mar_rango_m', grupo: 'riesgo', label: 'Rango de marea + sobreelev.', unidad: 'm', min: 0.2, max: 1.5, step: 0.05, fuente: 'Medido 13-ago-2026: 0,06 → 0,39 m' },
  { key: 'w_mar', grupo: 'riesgo', label: 'Peso del mar en el modificador', unidad: '', min: 0, max: 0.45, step: 0.01, fuente: 'Ponderación de equipo · ver §12 del doc' },
  { key: 'w_obstr', grupo: 'riesgo', label: 'Peso de obstrucción de canal', unidad: '', min: 0, max: 0.45, step: 0.01, fuente: 'Ponderación de equipo' },
  { key: 'ticket.hotel', grupo: 'economia', label: 'Ticket hotel', unidad: 'COP', min: 100_000, max: 1_500_000, step: 10_000, fuente: 'SUPUESTO DE EQUIPO — no hay dato público' },
  { key: 'ticket.restaurante', grupo: 'economia', label: 'Ticket restaurante', unidad: 'COP', min: 20_000, max: 300_000, step: 5_000, fuente: 'SUPUESTO DE EQUIPO' },
  { key: 'ticket.tour', grupo: 'economia', label: 'Ticket tour', unidad: 'COP', min: 50_000, max: 600_000, step: 10_000, fuente: 'SUPUESTO DE EQUIPO' },
  { key: 'ticket.retail', grupo: 'economia', label: 'Ticket retail', unidad: 'COP', min: 20_000, max: 400_000, step: 5_000, fuente: 'SUPUESTO DE EQUIPO' },
  { key: 'eta.hotel', grupo: 'economia', label: 'η hotel (perdido, no diferido)', unidad: '', min: 0, max: 1, step: 0.05, fuente: 'La noche ya está pagada; se pierde F&B' },
  { key: 'eta.restaurante', grupo: 'economia', label: 'η restaurante', unidad: '', min: 0, max: 1, step: 0.05, fuente: 'El almuerzo no se recupera mañana' },
  { key: 'eta.tour', grupo: 'economia', label: 'η tour', unidad: '', min: 0, max: 1, step: 0.05, fuente: 'Salida cancelada = ingreso perdido' },
  { key: 'eta.retail', grupo: 'economia', label: 'η retail', unidad: '', min: 0, max: 1, step: 0.05, fuente: 'Parte de la compra se difiere' },
  { key: 'horas_recuperacion', grupo: 'economia', label: 'Horas de recuperación', unidad: 'h', min: 0, max: 8, step: 0.5, fuente: 'El agua se va antes que los clientes vuelvan' },
] as const;
