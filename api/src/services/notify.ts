/**
 * NOTIFICACIÓN — WhatsApp y voz.
 *
 * DECISIÓN DE ARQUITECTURA: la interfaz `Notificador` existe para que el
 * sistema NO dependa de que llegue la cuenta sandbox de Fontumi. Si a las
 * 13:00 no hay credenciales, corre con `ConsoleNotifier` y se conmuta con
 * una variable de entorno. La arquitectura no espera a nadie.
 *
 * POR QUÉ LA VOZ NO ES DECORATIVA: un gerente de hotel a las 3 a.m. no lee
 * WhatsApp; contesta el teléfono. Fontumi iAgents hace llamadas con voces
 * reales y acento local — es el canal correcto para una alerta roja, no un
 * pegote para ganar el premio bonus.
 */

import type { Banda, Env } from '../core/types';

export interface Destinatario {
  telefono: string;
  nombre?: string;
  establecimiento?: string;
  zona_id: string;
  /** Banda mínima a partir de la cual quiere recibir aviso. */
  umbral: Banda;
  /** Si además acepta llamada de voz en alerta roja. */
  voz: boolean;
}

export interface Aviso {
  zona_nombre: string;
  banda: Banda;
  iri: number;
  desde: string;
  hasta: string;
  ver_cop: number;
  simulado: boolean;
}

export interface Notificador {
  whatsapp(dest: Destinatario, msg: string): Promise<void>;
  voz(dest: Destinatario, guion: string): Promise<void>;
}

const ORDEN: Record<Banda, number> = { verde: 0, amarillo: 1, naranja: 2, rojo: 3 };

/** ¿Este destinatario quiere este aviso? */
export const aplica = (d: Destinatario, a: Aviso) =>
  d.zona_id === a.zona_nombre || ORDEN[a.banda] >= ORDEN[d.umbral];

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
    a.banda === 'rojo'
      ? 'Recomendado: subir inventario, avisar a huéspedes, no programar salidas.'
      : 'Recomendado: revisar drenajes y tener el inventario listo para subir.',
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

/** Fallback: no bloquea el desarrollo si Fontumi no ha respondido. */
export class ConsoleNotifier implements Notificador {
  async whatsapp(d: Destinatario, msg: string) {
    console.log(JSON.stringify({ canal: 'whatsapp', destino: d.telefono, zona: d.zona_id, msg }));
  }
  async voz(d: Destinatario, guion: string) {
    console.log(JSON.stringify({ canal: 'voz', destino: d.telefono, zona: d.zona_id, guion }));
  }
}

/**
 * TODO(quien tome esta rama): completar contra la API real de Fontumi One.
 * Pendiente de la cuenta sandbox. Endpoints y forma del payload salen de su
 * documentación — NO inventar la firma: si no llega la credencial, se entrega
 * con ConsoleNotifier y se dice en el pitch que la interfaz está lista.
 */
export class FontumiNotifier implements Notificador {
  constructor(private token: string, private base = 'https://api.fontumi.co') {}

  private async post(ruta: string, cuerpo: unknown) {
    const r = await fetch(`${this.base}${ruta}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}` },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`fontumi ${ruta} → ${r.status} ${await r.text().catch(() => '')}`);
    return r.json().catch(() => ({}));
  }

  async whatsapp(d: Destinatario, msg: string) {
    await this.post('/v1/whatsapp/send', { to: d.telefono, type: 'text', text: msg });
  }

  async voz(d: Destinatario, guion: string) {
    await this.post('/v1/iagents/call', { to: d.telefono, script: guion, locale: 'es-CO' });
  }
}

export const construirNotificador = (env: Env): Notificador =>
  env.FONTUMI_TOKEN ? new FontumiNotifier(env.FONTUMI_TOKEN) : new ConsoleNotifier();

/**
 * Anti-spam: máximo una alerta por zona y banda cada 6 h.
 * Sin esto, el cron de 15 min manda 24 mensajes por evento y el producto
 * se vuelve insoportable en la primera tormenta.
 */
export async function yaAvisado(env: Env, zona_id: string, banda: Banda): Promise<boolean> {
  if (!env.DB) return false;
  const r = await env.DB.prepare(
    `SELECT 1 FROM alertas_enviadas
      WHERE zona_id = ? AND banda = ? AND t > datetime('now','-6 hours') LIMIT 1`,
  ).bind(zona_id, banda).first();
  return !!r;
}
