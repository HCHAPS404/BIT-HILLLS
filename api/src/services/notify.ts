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
 *
 * `accionRecomendada` también la usa la UI (web/src/lib/lectura.ts) para que
 * el aviso en pantalla y el de WhatsApp digan lo mismo — si cambias una
 * acción acá, cámbiala allá también (son el mismo texto a propósito).
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
  zona_id: string;
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

/**
 * ¿Este destinatario quiere este aviso? Su zona y su banda mínima.
 * (Bug corregido: comparaba zona_id contra zona_nombre — nunca podía
 * matchear. Ahora compara el campo correcto y exige ambas condiciones.)
 */
export const aplica = (d: Destinatario, a: Aviso) =>
  d.zona_id === a.zona_id && ORDEN[a.banda] >= ORDEN[d.umbral];

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
 * Fontumi corre sobre GoHighLevel — la API real es
 * `services.leadconnectorhq.com`, NO `api.fontumi.co` (adivinado en una
 * versión anterior de este archivo, nunca verificado). Verificado en
 * producción el 2026-08-13 contra la cuenta real: crear/actualizar
 * contacto (`POST /contacts/upsert`, 201) → enviar mensaje
 * (`POST /conversations/messages`, type "WhatsApp", 201 = la API lo
 * acepta). El token necesita scopes `contacts.write` y
 * `conversations/message.write` en la integración privada.
 *
 * Requiere `FONTUMI_LOCATION_ID` además de `FONTUMI_TOKEN` — GoHighLevel
 * exige el location id en cada request, no viaja en el token.
 *
 * VOZ (iAgents) SIGUE SIN CONFIRMAR: no encontramos un endpoint público
 * de GoHighLevel para llamadas de voz con AI — probablemente es una
 * capa propia de Fontumi encima de GHL, no documentada donde miramos.
 * NO se adivina la firma: falla explícito en vez de un request que
 * probablemente sea 404. Conectar cuando llegue la documentación real.
 */
export class FontumiNotifier implements Notificador {
  constructor(
    private token: string,
    private locationId: string,
    private base = 'https://services.leadconnectorhq.com',
  ) {}

  private async request(ruta: string, cuerpo: unknown) {
    const r = await fetch(`${this.base}${ruta}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.token}`,
        version: '2021-07-28',
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`fontumi ${ruta} → ${r.status} ${await r.text().catch(() => '')}`);
    return r.json().catch(() => ({}));
  }

  /** GoHighLevel exige un contactId — no se puede mandar solo con el teléfono. */
  private async contactId(d: Destinatario): Promise<string> {
    const r: any = await this.request('/contacts/upsert', {
      locationId: this.locationId,
      phone: d.telefono,
      firstName: d.nombre ?? d.establecimiento ?? 'Suscriptor MAREA',
    });
    const id = r?.contact?.id ?? r?.id;
    if (!id) throw new Error('fontumi: upsert de contacto no devolvió id');
    return id;
  }

  async whatsapp(d: Destinatario, msg: string) {
    const contactId = await this.contactId(d);
    await this.request('/conversations/messages', { type: 'WhatsApp', contactId, message: msg });
  }

  async voz(_d: Destinatario, _guion: string): Promise<void> {
    throw new Error('FontumiNotifier.voz(): endpoint de iAgents sin confirmar, ver comentario de la clase');
  }
}

export const construirNotificador = (env: Env): Notificador =>
  env.FONTUMI_TOKEN && env.FONTUMI_LOCATION_ID
    ? new FontumiNotifier(env.FONTUMI_TOKEN, env.FONTUMI_LOCATION_ID)
    : new ConsoleNotifier();

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

/** Deja constancia de que se avisó, para que yaAvisado() lo detecte después. */
export async function registrarAviso(
  env: Env,
  zona_id: string,
  banda: Banda,
  canal: 'whatsapp' | 'voz' | 'consola',
  destinatarios: number,
): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare(
    'INSERT INTO alertas_enviadas (zona_id, banda, canal, destinatarios) VALUES (?,?,?,?)',
  ).bind(zona_id, banda, canal, destinatarios).run();
}

/** Suscriptores de una zona. Filtrar por umbral corre en aplica(), no acá. */
export async function leerDestinatarios(env: Env, zona_id: string): Promise<Destinatario[]> {
  if (!env.DB) return [];
  const r = await env.DB.prepare(
    'SELECT telefono, nombre, establecimiento, zona_id, umbral, voz FROM suscriptores WHERE zona_id = ?',
  ).bind(zona_id).all<{ telefono: string; nombre: string | null; establecimiento: string | null; zona_id: string; umbral: Banda; voz: number }>();
  return (r.results ?? []).map((s) => ({
    telefono: s.telefono,
    nombre: s.nombre ?? undefined,
    establecimiento: s.establecimiento ?? undefined,
    zona_id: s.zona_id,
    umbral: s.umbral,
    voz: !!s.voz,
  }));
}
