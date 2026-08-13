/**
 * ADAPTADOR — VISIÓN: foto de canal → severidad de obstrucción 0–3.
 *
 * CIERRA EL CICLO DEL PRODUCTO: el ciudadano que reporta mejora la predicción
 * que protege al negocio que paga la suscripción. Ese bucle ES el modelo de
 * negocio en una frase, y es lo que separa esto de "una app del clima".
 *
 * La severidad alimenta el componente `O` del IRI. Un canal al 70 % de sección
 * es una zona que se inunda con la mitad de lluvia.
 *
 * Corre con Workers AI (binding AI) — no requiere clave externa ni tarjeta.
 * Añadir a wrangler.jsonc:   "ai": { "binding": "AI" }
 *
 * REGLA: si el modelo no está seguro, devuelve `pendiente_revision: true` y
 * la señal entra con confianza baja. NUNCA inventa una severidad para rellenar.
 * Un dato inventado en el motor de riesgo es peor que un dato faltante.
 */

import type { Signal } from '../core/types';

export interface LecturaCanal {
  severidad: 0 | 1 | 2 | 3;
  /** 0–1. Baja confianza ⇒ el reporte se marca para revisión humana. */
  confianza: number;
  descripcion: string;
  pendiente_revision: boolean;
}

const ESCALA = `Clasifica la obstrucción del canal o sumidero en la foto:
0 = despejado, el agua corre libre
1 = basura dispersa, sección mayormente libre
2 = acumulación visible, sección reducida a la mitad
3 = obstruido, el agua no pasa o está estancada`;

/**
 * TODO(quien tome esta rama):
 *  1. Añadir el binding "ai" en wrangler.jsonc.
 *  2. Verificar el nombre del modelo de visión disponible en la cuenta.
 *  3. Conectar en POST /api/reportes: foto → severidad → Signal 'obstruccion'.
 *  4. Guardar la foto en R2 si se quiere historial (opcional para el demo).
 */
export async function clasificarCanal(ai: any, imagen: ArrayBuffer): Promise<LecturaCanal> {
  const bytes = [...new Uint8Array(imagen)];

  const r = await ai.run('@cf/llava-hf/llava-1.5-7b-hf', {
    image: bytes,
    prompt: `${ESCALA}\n\nResponde SOLO con JSON: {"severidad":0-3,"confianza":0-1,"descripcion":"breve"}. Si la foto no muestra un canal o sumideroreconocible, responde {"severidad":0,"confianza":0,"descripcion":"no es un canal"}.`,
    max_tokens: 160,
  });

  const texto: string = r?.description ?? r?.response ?? '';
  const m = texto.match(/\{[\s\S]*\}/);

  // Sin JSON parseable no adivinamos: va a revisión humana.
  if (!m) {
    return { severidad: 0, confianza: 0, descripcion: texto.slice(0, 160) || 'sin respuesta del modelo', pendiente_revision: true };
  }

  try {
    const p = JSON.parse(m[0]);
    const sev = Math.max(0, Math.min(3, Math.round(Number(p.severidad ?? 0)))) as 0 | 1 | 2 | 3;
    const conf = Math.max(0, Math.min(1, Number(p.confianza ?? 0)));
    return {
      severidad: sev,
      confianza: conf,
      descripcion: String(p.descripcion ?? '').slice(0, 200),
      // Umbral de duda: por debajo de 0.6 lo decide un humano, no el modelo.
      pendiente_revision: conf < 0.6,
    };
  } catch {
    return { severidad: 0, confianza: 0, descripcion: 'JSON inválido del modelo', pendiente_revision: true };
  }
}

/**
 * Reportes de una zona → señal de obstrucción 0–1.
 * Decaimiento exponencial con vida media de 10 días: un canal reportado hace
 * un mes ya no dice nada del estado de hoy, pero uno de ayer sí. Los reportes
 * marcados como pendientes de revisión pesan la mitad.
 */
export function obstruccionDesdeReportes(
  reportes: { severidad: number; t: string; pendiente_revision?: boolean }[],
  zona_id: string,
  t_valido: string,
  base: number,
): Signal {
  const ahora = Date.now();
  const VIDA_MEDIA_MS = 10 * 24 * 3600 * 1000;

  let num = 0, den = 0;
  for (const r of reportes) {
    const edad = ahora - new Date(r.t).getTime();
    if (edad < 0) continue;
    const peso = Math.pow(0.5, edad / VIDA_MEDIA_MS) * (r.pendiente_revision ? 0.5 : 1);
    num += (r.severidad / 3) * peso;
    den += peso;
  }

  // Sin reportes recientes caemos al estado base declarado de la zona.
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
