/**
 * MOTOR DE RIESGO — IRI (Índice de Riesgo de Inundación).
 *
 * Funciones puras. Sin fetch, sin I/O, sin D1. Mismo input → mismo output.
 *
 *   IRI = 100 · S_zona · R^0.7 · (0.55 + 0.20·D + 0.25·O)
 *
 * La lluvia (R) es multiplicativa y actúa como COMPUERTA: sin lluvia, IRI = 0.
 * Esa es la verdad física. El paréntesis va de 0.55 a 1.00, es decir:
 * marea alta + canal tapado CASI DUPLICAN el riesgo con la misma lluvia.
 * Ese es el hallazgo vendible del producto.
 *
 * ADVERTENCIA HONESTA: este índice NO está calibrado contra eventos
 * históricos. No existe serie etiquetada de inundaciones por zona/hora
 * disponible en 8 h. Es un índice de PLAUSIBILIDAD ORDENADA, no una
 * probabilidad. Se muestra como tal en la UI (badge SIN CALIBRAR).
 */

import type { Signal, Zona, Componentes, Banda, SignalTipo } from './types';
import { P, type Params } from './params';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function valor(senales: Signal[], tipo: SignalTipo, fallback = 0): number {
  const s = senales.find((x) => x.tipo === tipo);
  return s ? s.valor : fallback;
}

export function calcularIRI(
  zona: Zona,
  senales: Signal[],
  params: Params = P,
): { iri: number; componentes: Componentes } {
  // R — disparador: lluvia acumulada pronosticada en ventana de 3 h.
  const R = clamp(valor(senales, 'lluvia_3h') / params.lluvia_umbral_mm);

  // D — el mar le quita altura útil a la boca de descarga por gravedad.
  //     Cartagena es micro-mareal (33 cm): D es MODULADOR, no disparador.
  //     El oleaje (mar de leva) es lo que de verdad mueve este término.
  const nivel = valor(senales, 'nivel_mar');
  const olas = valor(senales, 'oleaje');
  const D = clamp((nivel + params.peso_oleaje * olas - params.mar_base_m) / params.mar_rango_m);

  // O — obstrucción del canal. Multiplicador local, viene de reportes ciudadanos.
  const O = clamp(valor(senales, 'obstruccion', zona.obstruccion_base));

  const modificador = params.base_mod + params.w_mar * D + params.w_obstr * O;
  const iri = 100 * zona.susceptibilidad * Math.pow(R, params.exp_lluvia) * modificador;

  return {
    iri: Math.round(clamp(iri, 0, 100) * 10) / 10,
    componentes: { R, D, O, S: zona.susceptibilidad, modificador },
  };
}

export function banda(iri: number, params: Params = P): Banda {
  if (iri >= params.umbrales.rojo) return 'rojo';
  if (iri >= params.umbrales.naranja) return 'naranja';
  if (iri >= params.umbrales.amarillo) return 'amarillo';
  return 'verde';
}

/**
 * Horas de interrupción = horas consecutivas con IRI ≥ umbral naranja,
 * dentro de la ventana pronosticada. Alimenta el motor económico.
 */
export function horasInterrupcion(serie: { iri: number }[], params: Params = P): number {
  return serie.filter((p) => p.iri >= params.umbrales.naranja).length;
}

/**
 * Convierte una serie horaria de señales en una serie horaria de IRI.
 * `senalesPorHora` viene ya agrupada por t_valido.
 */
export function evaluarSerie(
  zona: Zona,
  senalesPorHora: Map<string, Signal[]>,
  params: Params = P,
) {
  return [...senalesPorHora.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, senales]) => {
      const { iri, componentes } = calcularIRI(zona, senales, params);
      return { t, iri, banda: banda(iri, params), componentes };
    });
}
