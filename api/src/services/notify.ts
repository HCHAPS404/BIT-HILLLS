/**
 * NOTIFICACIÓN — texto de WhatsApp y voz.
 *
 * En esta rama vive la plantilla, no el transporte (Fontumi está en feat/fontumi).
 * La UI reutiliza las mismas frases: el aviso en pantalla y el de WhatsApp
 * tienen que decir lo mismo. Si cambias una acción, cámbiala aquí y en
 * web/src/lib/lectura.ts — son el mismo texto a propósito.
 */

import type { Banda } from '../core/types';

export interface Aviso {
  zona_nombre: string;
  banda: Banda;
  iri: number;
  desde: string;
  hasta: string;
  ver_cop: number;
  simulado: boolean;
}

/** La línea que decide. Es lo que un dueño de local necesita leer. */
export function accionRecomendada(banda: Banda): string {
  if (banda === 'rojo') return 'Recomendado: subir inventario, avisar a huéspedes, no programar salidas.';
  if (banda === 'naranja') return 'Recomendado: revisar drenajes y tener el inventario listo para subir.';
  if (banda === 'amarillo') return 'Recomendado: no mover inventario todavía. Si el índice llega a 50, sí toca revisar drenajes.';
  return 'Recomendado: no hay que mover nada. Este es el estado habitual.';
}

/** Texto de WhatsApp. Corto: se lee en la pantalla de bloqueo. */
export function plantillaWhatsApp(a: Aviso): string {
  const emoji = a.banda === 'rojo' ? '🔴' : '🟠';
  const hd = a.desde.slice(11, 16), hh = a.hasta.slice(11, 16);
  return [
    a.simulado ? '⚠️ *SIMULACIÓN — no es una alerta real*' : null,
    `${emoji} *MAREA · alerta ${a.banda}* en ${a.zona_nombre}`,
    `Riesgo de inundación entre las *${hd}* y las *${hh}* de hoy.`,
    `Índice ${a.iri.toFixed(0)}/100 (sin calibrar, v0.1).`,
    '',
    accionRecomendada(a.banda),
    '',
    'Responde BAJA para dejar de recibir avisos de esta zona.',
  ].filter(Boolean).join('\n');
}

/** Guion de voz. Frases cortas, sin cifras largas: lo va a leer un TTS. */
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
