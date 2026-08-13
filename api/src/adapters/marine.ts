/**
 * ADAPTADOR — Open-Meteo Marine (nivel del mar + oleaje).
 * Gratis, sin API key. Verificado el 13-ago-2026: el nivel del mar en
 * Cartagena osciló entre 0,06 m y 0,39 m — rango micro-mareal de 33 cm.
 *
 * POR QUÉ IMPORTA: el corredor Bocagrande–Centro drena POR GRAVEDAD hacia
 * la bahía. Cuando el mar sube, la boca de descarga pierde altura útil y el
 * sistema se represa. Con 33 cm de rango la marea sola no inunda nada — por
 * eso pesa 0.20 y no 0.50, y por eso el oleaje entra con factor 0.6.
 * El evento que de verdad importa es el mar de leva, no la pleamar del martes.
 */

import type { Signal, Zona } from '../core/types';

const URL = 'https://marine-api.open-meteo.com/v1/marine';

/**
 * El modelo marino no resuelve puntos tierra adentro: para zonas interiores
 * se consulta el punto costero más cercano. El mar que represa el drenaje de
 * Manga es el mismo mar de la bahía.
 */
const PUNTO_COSTERO: Record<string, [number, number]> = {
  bocagrande: [10.390, -75.565],
  centro: [10.428, -75.556],
  getsemani: [10.415, -75.548],
  manga: [10.405, -75.540],
  pie_popa: [10.418, -75.540],
  el_socorro: [10.390, -75.500],
};

export async function leerMar(zonas: Zona[], dias = 3): Promise<Signal[]> {
  const pts = zonas.map((z) => PUNTO_COSTERO[z.id] ?? [z.lat, z.lon]);

  const q = new URLSearchParams({
    latitude: pts.map((p) => p[0]).join(','),
    longitude: pts.map((p) => p[1]).join(','),
    hourly: 'sea_level_height_msl,wave_height',
    forecast_days: String(dias),
    timezone: 'America/Bogota',
  });

  const r = await fetch(`${URL}?${q}`, { signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`open-meteo marine ${r.status}`);

  const raw = (await r.json()) as any;
  const bloques: any[] = Array.isArray(raw) ? raw : [raw];

  const out: Signal[] = [];
  bloques.forEach((b, zi) => {
    const zona = zonas[zi];
    if (!zona || !b?.hourly?.time) return;
    b.hourly.time.forEach((t: string, i: number) => {
      const conf = Math.max(0.5, 1 - i / 144);
      const nivel = b.hourly.sea_level_height_msl?.[i];
      const ola = b.hourly.wave_height?.[i];
      if (nivel != null) out.push({ zona_id: zona.id, tipo: 'nivel_mar', valor: nivel, unidad: 'm', t_valido: t, confianza: conf, fuente: 'open-meteo-marine' });
      if (ola != null) out.push({ zona_id: zona.id, tipo: 'oleaje', valor: ola, unidad: 'm', t_valido: t, confianza: conf, fuente: 'open-meteo-marine' });
    });
  });
  return out;
}
