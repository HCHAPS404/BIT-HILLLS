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
 *
 * REGLA: si el modelo no está seguro, devuelve `pendiente_revision: true` y
 * la señal entra con confianza baja. NUNCA inventa una severidad para rellenar.
 * Un dato inventado en el motor de riesgo es peor que un dato faltante.
 *
 * La agregación de reportes en una señal de obstrucción (decaimiento
 * exponencial, etc.) vive en `adapters/reportes.ts` — no se duplica acá.
 */

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
 * Pendiente (no bloquea el demo): guardar la foto en R2 si se quiere
 * historial visual de reportes, hoy solo se persiste la clasificación.
 */
const TIMEOUT_MS = 20_000;

/** El modelo no siempre responde rápido — sin límite, cuelga la respuesta al ciudadano. */
function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout tras ${ms}ms`)), ms)),
  ]);
}

export async function clasificarCanal(ai: Ai, imagen: ArrayBuffer): Promise<LecturaCanal> {
  const bytes = [...new Uint8Array(imagen)];

  const r = await conTimeout(
    ai.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: bytes,
      prompt: `${ESCALA}\n\nResponde SOLO con JSON: {"severidad":0-3,"confianza":0-1,"descripcion":"breve"}. Si la foto no muestra un canal o sumidero reconocible, responde {"severidad":0,"confianza":0,"descripcion":"no es un canal"}.`,
      max_tokens: 160,
    }),
    TIMEOUT_MS,
  );

  const texto: string = r?.description ?? '';
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
