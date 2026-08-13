/**
 * ADAPTADOR — REPORTES CIUDADANOS → señal de obstrucción.
 *
 * Cierra el ciclo del producto: el ciudadano que reporta un canal tapado
 * mejora la predicción que protege al negocio que paga la suscripción.
 * Antes de esto, `POST /api/reportes` escribía en D1 pero el motor de
 * riesgo nunca lo leía de vuelta — el reporte no cambiaba nada.
 *
 * `confianza` y `pendiente_revision` en la tabla `reportes` existen para
 * cuando `feat/vision-canal` conecte el clasificador de fotos (Workers AI):
 * ese flujo llena esos campos con la certeza del modelo. Un reporte
 * manual (severidad puesta directo por el cliente) entra con confianza 1.
 */

import type { Signal } from '../core/types';

export interface ReporteFila {
  severidad: number;
  t: string;
  confianza?: number;
  pendiente_revision?: number;
}

const VIDA_MEDIA_MS = 10 * 24 * 3600 * 1000;

/**
 * Reportes de una zona → señal de obstrucción 0–1.
 * Decaimiento exponencial con vida media de 10 días: un canal reportado hace
 * un mes ya no dice nada del estado de hoy, pero uno de ayer sí. Los reportes
 * pendientes de revisión (severidad incierta del clasificador) pesan la mitad.
 * Sin reportes recientes, cae al estado base declarado de la zona.
 */
export function obstruccionDesdeReportes(
  reportes: ReporteFila[],
  zona_id: string,
  t_valido: string,
  base: number,
): Signal {
  const ahora = Date.now();
  let num = 0;
  let den = 0;

  for (const r of reportes) {
    const edad = ahora - new Date(r.t).getTime();
    if (edad < 0) continue;
    const pesoConfianza = r.pendiente_revision ? 0.5 : (r.confianza ?? 1);
    const peso = Math.pow(0.5, edad / VIDA_MEDIA_MS) * pesoConfianza;
    num += (r.severidad / 3) * peso;
    den += peso;
  }

  const valor = den > 0 ? num / den : base;

  return {
    zona_id,
    tipo: 'obstruccion',
    valor: Math.round(valor * 1000) / 1000,
    unidad: '0-1',
    t_valido,
    confianza: den > 0 ? Math.min(1, 0.5 + den / 6) : 0.4,
    fuente: den > 0 ? 'reportes-ciudadanos' : 'estado-base-zona',
  };
}

/** Reportes de los últimos `dias` para una zona, más recientes primero. */
export async function leerReportesRecientes(
  db: D1Database,
  zona_id: string,
  dias = 15,
): Promise<ReporteFila[]> {
  const r = await db
    .prepare(
      `SELECT severidad, t, confianza, pendiente_revision FROM reportes
        WHERE zona_id = ? AND t > datetime('now', ?)
        ORDER BY t DESC LIMIT 50`,
    )
    .bind(zona_id, `-${dias} days`)
    .all<ReporteFila>();
  return r.results ?? [];
}
