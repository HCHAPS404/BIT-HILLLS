/**
 * Capa de lectura: convierte el estado del modelo en frases.
 *
 * La acción de naranja/rojo es la de api/src/services/notify.ts
 * (plantillaWhatsApp / accionRecomendada). Si cambia allá, cambia aquí.
 */

import type { Banda, Componentes } from './api';
import type { Idioma } from '../i18n';

export interface Aviso {
  zona_nombre: string;
  banda: Banda;
  iri: number;
  desde: string;
  hasta: string;
  ver_cop: number;
  simulado: boolean;
}

export interface EstadoLectura {
  zona: string;
  iri: number;
  banda: Banda;
  ventana: { desde: string; hasta: string } | null;
  componentes: Componentes;
  simulado: boolean;
  idioma: Idioma;
}

/** Espejo de api/src/services/notify.ts — accionRecomendada */
const ACCION_ES: Record<Banda, string> = {
  rojo: 'Recomendado: subir inventario, avisar a huéspedes, no programar salidas.',
  naranja: 'Recomendado: revisar drenajes y tener el inventario listo para subir.',
  amarillo: 'Recomendado: no mover inventario todavía. Si el índice llega a 50, sí toca revisar drenajes.',
  verde: 'Recomendado: no hay que mover nada. Este es el estado habitual.',
};

const ACCION_EN: Record<Banda, string> = {
  rojo: 'Recommended: move inventory up, warn guests, do not schedule departures.',
  naranja: 'Recommended: check drains and have inventory ready to move up.',
  amarillo: 'Recommended: do not move inventory yet. If the index reaches 50, then check drains.',
  verde: 'Recommended: nothing to move. This is the usual state.',
};

export function accionRecomendada(banda: Banda, idioma: Idioma = 'es'): string {
  return (idioma === 'en' ? ACCION_EN : ACCION_ES)[banda];
}

/** Espejo de api/src/services/notify.ts — plantillaWhatsApp (siempre es-CO: es el mensaje que se manda). */
export function plantillaWhatsApp(a: Aviso): string {
  const emoji = a.banda === 'rojo' ? '🔴' : '🟠';
  const hd = a.desde.slice(11, 16), hh = a.hasta.slice(11, 16);
  return [
    a.simulado ? '⚠️ *SIMULACIÓN — no es una alerta real*' : null,
    `${emoji} *MAREA · alerta ${a.banda}* en ${a.zona_nombre}`,
    `Riesgo de inundación entre las *${hd}* y las *${hh}* de hoy.`,
    `Índice ${a.iri.toFixed(0)}/100 (sin calibrar, v0.1).`,
    '',
    ACCION_ES[a.banda],
    '',
    'Responde BAJA para dejar de recibir avisos de esta zona.',
  ].filter(Boolean).join('\n');
}

/** Espejo de api/src/services/notify.ts — guionVoz */
export function guionVoz(a: Aviso): string {
  const hd = Number(a.desde.slice(11, 13));
  const hh = Number(a.hasta.slice(11, 13));
  const h12 = (h: number) => (h === 0 ? '12 de la noche' : h < 12 ? `${h} de la mañana` : h === 12 ? '12 del día' : `${h - 12} de la tarde`);
  return [
    a.simulado ? 'Atención: esto es una simulación de prueba.' : '',
    `Buenas, le habla MAREA, sistema de alerta de inundación de Cartagena.`,
    `Hay alerta ${a.banda} en ${a.zona_nombre}`,
    `entre las ${h12(hd)} y las ${h12(hh)} de hoy.`,
    a.banda === 'rojo'
      ? 'Le recomendamos mover el inventario y avisar a sus huéspedes.'
      : 'Le recomendamos revisar los drenajes de su local.',
    'Puede ver el detalle en el enlace que le enviamos por WhatsApp. Gracias.',
  ].filter(Boolean).join(' ');
}

function horaDe(iso: string): { h: number; m: number } {
  return { h: Number(iso.slice(11, 13)), m: Number(iso.slice(14, 16)) };
}

function periodoEs(h: number): string {
  if (h === 0 || h >= 19) return 'de la noche';
  if (h === 12) return 'del día';
  if (h < 12) return 'de la mañana';
  return 'de la tarde';
}

function numeralEs(h: number, m: number): string {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const art = h12 === 1 ? 'la' : 'las';
  const num = m ? `${h12}:${String(m).padStart(2, '0')}` : String(h12);
  return `${art} ${num}`;
}

function entreEs(desde: string, hasta: string): string {
  const a = horaDe(desde);
  const b = horaDe(hasta);
  const pa = periodoEs(a.h);
  const pb = periodoEs(b.h);
  if (pa === pb) return `entre ${numeralEs(a.h, a.m)} y ${numeralEs(b.h, b.m)} ${pa}`;
  return `entre ${numeralEs(a.h, a.m)} ${pa} y ${numeralEs(b.h, b.m)} ${pb}`;
}

function entreEn(desde: string, hasta: string): string {
  const fmt = (iso: string) => {
    const { h, m } = horaDe(iso);
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
  };
  return `between ${fmt(desde)} and ${fmt(hasta)}`;
}

function momento(iso: string, idioma: Idioma): string {
  const h = horaDe(iso).h;
  if (idioma === 'en') {
    if (h >= 5 && h < 12) return ' this morning';
    if (h >= 12 && h < 19) return ' this afternoon';
    return ' tonight';
  }
  if (h >= 5 && h < 12) return ' esta mañana';
  if (h >= 12 && h < 19) return ' esta tarde';
  return ' esta noche';
}

export function fraseEstado(e: EstadoLectura): { titular: string; detalle: string } {
  const { zona, banda, ventana, componentes, simulado, idioma } = e;
  const cuando = ventana ? momento(ventana.desde, idioma) : '';
  const en = idioma === 'en';

  const titularBase = (() => {
    if (en) {
      if (banda === 'rojo') return `High risk in ${zona}${cuando}.`;
      if (banda === 'naranja') return `Alert in ${zona}${cuando}.`;
      if (banda === 'amarillo') return `Watch in ${zona}${cuando}.`;
      return `No alert in ${zona}.`;
    }
    if (banda === 'rojo') return `Riesgo alto en ${zona}${cuando}.`;
    if (banda === 'naranja') return `Alerta en ${zona}${cuando}.`;
    if (banda === 'amarillo') return `Vigilancia en ${zona}${cuando}.`;
    return `Sin alerta en ${zona}.`;
  })();

  const titular = simulado
    ? (en ? `In this scenario. ${titularBase}` : `En este escenario. ${titularBase}`)
    : titularBase;

  const detalle = (() => {
    if (banda === 'rojo' && ventana) {
      return en
        ? `Flooded streets likely ${entreEn(ventana.desde, ventana.hasta)}.`
        : `Probable calle inundada ${entreEs(ventana.desde, ventana.hasta)}.`;
    }
    if (banda === 'naranja' && ventana) {
      return en
        ? `Water may not drain ${entreEn(ventana.desde, ventana.hasta)}.`
        : `El agua puede no drenar ${entreEs(ventana.desde, ventana.hasta)}.`;
    }
    if (banda === 'amarillo') {
      if (ventana) {
        return en
          ? `Rain expected ${entreEn(ventana.desde, ventana.hasta)}; no need to move inventory yet.`
          : `Hay lluvia prevista ${entreEs(ventana.desde, ventana.hasta)}; todavía no toca mover inventario.`;
      }
      return en
        ? 'Rain is in the forecast, but the index is still below the action threshold.'
        : 'Hay lluvia en el pronóstico, pero el índice sigue bajo el umbral de acción.';
    }
    if (componentes.R < 0.08) {
      return en
        ? 'Not enough rain today to trigger flooding. Rain is the gate: without it the index stays at zero.'
        : 'Hoy no hay lluvia que dispare inundación. La lluvia es la compuerta: sin ella el índice se queda en cero.';
    }
    return en
      ? 'There is rain, but the system is still draining.'
      : 'Hay lluvia, pero el drenaje está evacuando.';
  })();

  return { titular, detalle };
}

export type ClaveComponente = 'R' | 'D' | 'O' | 'S';

export function porQueComponente(k: ClaveComponente, v: number, idioma: Idioma, r = 1): { nombre: string; linea: string } {
  const en = idioma === 'en';
  if (k === 'R') {
    const nombre = en ? 'Rain' : 'Lluvia';
    if (v >= 0.75) {
      return { nombre, linea: en
        ? 'The downpour is at or near the 45 mm / 3 h threshold. Rain is the trigger.'
        : 'El aguacero está cerca o por encima del umbral de 45 mm en 3 h. La lluvia dispara el índice.' };
    }
    if (v >= 0.25) {
      return { nombre, linea: en
        ? 'There is rain, but it has not yet saturated the system.'
        : 'Hay lluvia, pero todavía no satura el sistema.' };
    }
    return { nombre, linea: en
      ? 'Little rain. Without it the index stays at zero: rain is the gate.'
      : 'Poca lluvia. Sin ella el índice se queda en cero: la lluvia es la compuerta.' };
  }
  if (k === 'D') {
    const nombre = en ? 'Drainage' : 'Drenaje';
    if (v >= 0.7) {
      const bloqueo = en
        ? 'The sea is high and water is not leaving by gravity.'
        : 'El mar está alto y el agua no está saliendo por gravedad.';
      if (r < 0.25) {
        return { nombre, linea: en
          ? `${bloqueo} Without rain that alone does not flood.`
          : `${bloqueo} Sin lluvia, eso no basta para inundar.` };
      }
      return { nombre, linea: bloqueo };
    }
    if (v >= 0.35) {
      return { nombre, linea: en
        ? 'The sea is cutting some of the useful discharge height.'
        : 'El mar le quita algo de altura útil a la descarga.' };
    }
    return { nombre, linea: en
      ? 'The sea is low: the system can still drain by gravity.'
      : 'El mar está bajo: el sistema puede evacuar por gravedad.' };
  }
  if (k === 'O') {
    const nombre = en ? 'Canal' : 'Canal';
    if (v >= 0.65) {
      return { nombre, linea: en
        ? 'The canal is blocked. The same rain leaves more water in the street.'
        : 'El canal está tapado. La misma lluvia deja más agua en la calle.' };
    }
    if (v >= 0.35) {
      return { nombre, linea: en
        ? 'There is debris in the canal; it worsens drainage.'
        : 'Hay basura o sedimento en el canal; empeora el drenaje.' };
    }
    return { nombre, linea: en
      ? 'The canal is clear.'
      : 'El canal está despejado.' };
  }
  const nombre = en ? 'Zone' : 'Zona';
  if (v >= 0.85) {
    return { nombre, linea: en
      ? 'This zone sits low and drains poorly even with a clear canal.'
      : 'Esta zona está baja y drena mal incluso con el canal limpio.' };
  }
  if (v >= 0.6) {
    return { nombre, linea: en
      ? 'The zone has some structural susceptibility.'
      : 'La zona tiene algo de susceptibilidad estructural.' };
  }
  return { nombre, linea: en
    ? 'This zone drains better than the rest of the corridor.'
    : 'Esta zona drena mejor que el resto del corredor.' };
}

export const DEFINICIONES: Record<Idioma, Record<string, { titulo: string; cuerpo: string }>> = {
  es: {
    IRI: {
      titulo: 'IRI — Índice de Riesgo de Inundación',
      cuerpo: 'Número de 0 a 100 que ordena qué zona está peor ahora. No es una probabilidad: el modelo no está calibrado contra inundaciones históricas. Sirve para comparar zonas y decidir, no para citar un porcentaje de chance.',
    },
    VER: {
      titulo: 'Plata en riesgo',
      cuerpo: 'Plata que los negocios de esta zona pueden dejar de cobrar si se inunda el tiempo previsto. Es una cuenta esperada con cifras editables, no una pérdida que ya pasó. El mapa abierto subcuenta locales: el número es un piso.',
    },
    eta: {
      titulo: 'Lo que no se recupera',
      cuerpo: 'Parte del ingreso que no se cobra después. Un almuerzo no se recupera mañana. La noche de hotel casi siempre ya está pagada: se pierde restaurante y cancelaciones, no la habitación.',
    },
    ventana: {
      titulo: 'Ventana crítica',
      cuerpo: 'Horas en que la lluvia y el mar alto coinciden. Ahí el agua no drena por gravedad y la calle se puede inundar. Es el tramo en el que hay que actuar.',
    },
  },
  en: {
    IRI: {
      titulo: 'IRI — Flood Risk Index',
      cuerpo: 'A 0–100 number that ranks which zone is worse right now. It is not a probability: the model is not calibrated against historical floods. Use it to compare zones and decide, not as a percent chance.',
    },
    VER: {
      titulo: 'Money at risk',
      cuerpo: 'Money businesses in this zone may fail to collect if it floods for the forecasted hours. An expected figure with editable assumptions, not a loss that already happened. The open map undercounts venues: the figure is a floor.',
    },
    eta: {
      titulo: 'What is not recovered',
      cuerpo: 'The share of revenue that is not collected later. A lunch is not recovered tomorrow. A hotel night is usually already paid: you lose F&B and cancellations, not the room.',
    },
    ventana: {
      titulo: 'Critical window',
      cuerpo: 'Hours when rain and a high sea coincide. Gravity drainage fails and the street can flood. That is the stretch when action is due.',
    },
  },
};
