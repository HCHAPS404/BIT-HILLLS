/**
 * ADAPTADOR — Open-Meteo Forecast (precipitación).
 * Gratis, sin API key, sin tarjeta. Verificado respondiendo el 13-ago-2026.
 *
 * Una sola llamada para las 6 zonas: Open-Meteo acepta coordenadas separadas
 * por coma y devuelve un array. 1 request en vez de 6.
 *
 * Produce Signal[]. El core no sabe que Open-Meteo existe.
 */

import type { Signal, Zona } from '../core/types';

const URL = 'https://api.open-meteo.com/v1/forecast';

/** Suma móvil hacia adelante de 3 h: cuánta lluvia cae en las próximas 3 horas. */
function acumular3h(mm: number[]): number[] {
  return mm.map((_, i) => (mm[i] ?? 0) + (mm[i + 1] ?? 0) + (mm[i + 2] ?? 0));
}

export async function leerLluvia(zonas: Zona[], dias = 3): Promise<Signal[]> {
  const q = new URLSearchParams({
    latitude: zonas.map((z) => z.lat).join(','),
    longitude: zonas.map((z) => z.lon).join(','),
    hourly: 'precipitation,precipitation_probability',
    forecast_days: String(dias),
    timezone: 'America/Bogota',
  });

  const r = await fetch(`${URL}?${q}`, { signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`open-meteo forecast ${r.status}`);

  const raw = (await r.json()) as any;
  const bloques: any[] = Array.isArray(raw) ? raw : [raw];

  const out: Signal[] = [];
  bloques.forEach((b, zi) => {
    const zona = zonas[zi];
    if (!zona || !b?.hourly?.time) return;
    const p3 = acumular3h(b.hourly.precipitation ?? []);
    b.hourly.time.forEach((t: string, i: number) => {
      out.push({
        zona_id: zona.id,
        tipo: 'lluvia_3h',
        valor: Math.round((p3[i] ?? 0) * 100) / 100,
        unidad: 'mm/3h',
        t_valido: t,
        // Un pronóstico a 72 h vale menos que uno a 3 h. Decae hasta 0.5.
        confianza: Math.max(0.5, 1 - i / 144),
        fuente: 'open-meteo-forecast',
      });
    });
  });
  return out;
}
