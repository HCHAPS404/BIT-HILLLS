/**
 * MOTOR ECONÓMICO — VER (Valor Expuesto en Riesgo).
 *
 *   VER = P(evento) · (H_interrup + H_recup) · F_temporada
 *         · Σ_cat [ N_cat · ticket_cat · tx_hora_cat · η_cat ]
 *
 * POR QUÉ ESTO NO ES UN NÚMERO INVENTADO:
 * `N_cat` es un CONTEO REAL de OpenStreetMap vía Overpass (570 elementos
 * verificados en el bbox Bocagrande–Centro el 13-ago-2026). Los demás
 * términos son supuestos DECLARADOS y editables en vivo desde la UI.
 *
 * No entregamos una cifra. Entregamos un modelo auditable.
 * Si el jurado no cree un supuesto, lo cambia él y el mapa se re-tarifa.
 */

import type { Zona, Categoria } from './types';
import { P, type Params } from './params';

export interface DesgloseVER {
  categoria: Categoria;
  establecimientos: number;
  cop_por_hora: number;
  cop_total: number;
  pct: number;
}

/**
 * Ingreso en riesgo por hora, con la zona a plena operación.
 * `factor_precio` corrige el nivel de precios local: sin él, aplicar el ticket
 * de Bocagrande a una tienda de El Socorro infla el VER un orden de magnitud.
 */
export function copPorHora(zona: Zona, params: Params = P): number {
  return (Object.entries(zona.establecimientos) as [Categoria, number][]).reduce(
    (acc, [cat, n]) =>
      acc + n * (params.ticket[cat] ?? 0) * (params.tx_hora[cat] ?? 0) * (params.eta[cat] ?? 0),
    0,
  ) * zona.factor_precio;
}

export function calcularVER(
  zona: Zona,
  iri: number,
  horasInterrupcion: number,
  temporada: keyof Params['temporada'] = 'alta',
  params: Params = P,
): { ver_cop: number; horas: number; desglose: DesgloseVER[] } {
  const horas = horasInterrupcion > 0 ? horasInterrupcion + params.horas_recuperacion : 0;
  const factor = (iri / 100) * horas * params.temporada[temporada];

  const desglose = (Object.entries(zona.establecimientos) as [Categoria, number][])
    .map(([cat, n]) => {
      const porHora =
        n * (params.ticket[cat] ?? 0) * (params.tx_hora[cat] ?? 0) * (params.eta[cat] ?? 0) * zona.factor_precio;
      return {
        categoria: cat,
        establecimientos: n,
        cop_por_hora: Math.round(porHora),
        cop_total: Math.round(porHora * factor),
        pct: 0,
      };
    })
    .sort((a, b) => b.cop_total - a.cop_total);

  const total = desglose.reduce((a, d) => a + d.cop_total, 0);
  for (const d of desglose) d.pct = total > 0 ? Math.round((d.cop_total / total) * 1000) / 10 : 0;

  return { ver_cop: Math.round(total), horas, desglose };
}

/**
 * Análisis de sensibilidad para el gráfico de tornado del panel de supuestos.
 * Mueve cada parámetro ±30 % y mide cuánto cambia el VER.
 * Responde en vivo la pregunta "¿qué supuesto importa de verdad?".
 */
export function sensibilidad(
  zona: Zona,
  iri: number,
  horas: number,
  temporada: keyof Params['temporada'],
  params: Params = P,
) {
  const base = calcularVER(zona, iri, horas, temporada, params).ver_cop;
  const claves: [string, (p: any, f: number) => any][] = [
    ['ticket.hotel', (p, f) => ({ ...p, ticket: { ...p.ticket, hotel: p.ticket.hotel * f } })],
    ['ticket.restaurante', (p, f) => ({ ...p, ticket: { ...p.ticket, restaurante: p.ticket.restaurante * f } })],
    ['eta.restaurante', (p, f) => ({ ...p, eta: { ...p.eta, restaurante: p.eta.restaurante * f } })],
    ['eta.hotel', (p, f) => ({ ...p, eta: { ...p.eta, hotel: p.eta.hotel * f } })],
    ['tx_hora.restaurante', (p, f) => ({ ...p, tx_hora: { ...p.tx_hora, restaurante: p.tx_hora.restaurante * f } })],
    ['horas_recuperacion', (p, f) => ({ ...p, horas_recuperacion: p.horas_recuperacion * f })],
  ];

  return claves
    .map(([key, mut]) => {
      const bajo = calcularVER(zona, iri, horas, temporada, mut(params, 0.7)).ver_cop;
      const alto = calcularVER(zona, iri, horas, temporada, mut(params, 1.3)).ver_cop;
      return {
        parametro: key,
        bajo,
        alto,
        base,
        amplitud_pct: base > 0 ? Math.round(((alto - bajo) / base) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => Math.abs(b.amplitud_pct) - Math.abs(a.amplitud_pct));
}

export const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
