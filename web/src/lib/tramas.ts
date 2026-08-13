/**
 * TRAMAS CARTOGRÁFICAS para las zonas del mapa.
 *
 * Un relleno translúcido plano es lo que sale por defecto de cualquier
 * librería: se ve igual en todos los dashboards del mundo. Las cartas
 * náuticas y los mapas de amenaza reales nunca hacen eso — usan RAYADO,
 * donde el ángulo y la densidad codifican la clase.
 *
 * Aquí la trama no es decoración: **la densidad ES la severidad**. Se lee
 * en escala de grises, se lee impreso, y se distingue aunque el jurado sea
 * daltónico. Un coropleto plano falla las tres.
 *
 *   verde     → punteado disperso  (zona en observación)
 *   amarillo  → rayado suave 45°
 *   naranja   → rayado denso 45°
 *   rojo      → rayado cruzado     (máxima densidad de tinta)
 *
 * Se generan en canvas y se registran con map.addImage(), así no hay que
 * servir ningún PNG ni depender de un CDN.
 */

export type Banda = 'verde' | 'amarillo' | 'naranja' | 'rojo';

interface Spec {
  /** variable CSS de la que sale la tinta — así la trama sigue al modo día/noche */
  token: string;
  /** separación entre líneas en px — menor = más denso = más grave */
  paso: number;
  grosor: number;
  cruzado: boolean;
  punteado: boolean;
}

const SPECS: Record<Banda, Spec> = {
  verde:    { token: '--seco',    paso: 10, grosor: 1.0, cruzado: false, punteado: true },
  amarillo: { token: '--vigila',  paso: 9,  grosor: 1.1, cruzado: false, punteado: false },
  naranja:  { token: '--alerta',  paso: 5,  grosor: 1.3, cruzado: false, punteado: false },
  rojo:     { token: '--critico', paso: 4,  grosor: 1.5, cruzado: true,  punteado: false },
};

const tinta = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#888';

const LADO = 16; // el tile se repite cada 16 px

function dibujar(spec: Spec, dpr: number): ImageData {
  const px = LADO * dpr;
  const tintaColor = tinta(spec.token);
  const c = document.createElement('canvas');
  c.width = px; c.height = px;
  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  g.clearRect(0, 0, LADO, LADO);

  if (spec.punteado) {
    g.fillStyle = tintaColor;
    for (let y = 0; y < LADO; y += spec.paso) {
      for (let x = 0; x < LADO; x += spec.paso) {
        g.beginPath();
        g.arc(x + (y / spec.paso % 2 ? spec.paso / 2 : 0), y, spec.grosor, 0, Math.PI * 2);
        g.fill();
      }
    }
    return g.getImageData(0, 0, px, px);
  }

  g.strokeStyle = tintaColor;
  g.lineWidth = spec.grosor;
  g.lineCap = 'square';

  // Rayado a 45°: se dibuja de −LADO a 2·LADO para que el tile empalme.
  for (let i = -LADO; i < LADO * 2; i += spec.paso) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + LADO, LADO); g.stroke();
  }
  if (spec.cruzado) {
    for (let i = -LADO; i < LADO * 2; i += spec.paso) {
      g.beginPath(); g.moveTo(i + LADO, 0); g.lineTo(i, LADO); g.stroke();
    }
  }
  return g.getImageData(0, 0, px, px);
}

/** Registra las cuatro tramas en el mapa. Idempotente. */
export function registrarTramas(mapa: any) {
  const dpr = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
  (Object.keys(SPECS) as Banda[]).forEach((banda) => {
    const id = `trama-${banda}`;
    if (mapa.hasImage?.(id)) return;
    const d = dibujar(SPECS[banda], dpr);
    mapa.addImage(id, { width: d.width, height: d.height, data: new Uint8Array(d.data.buffer) }, { pixelRatio: dpr });
  });
}

export const EXPR_TRAMA: any = [
  'match', ['get', 'banda'],
  'rojo', 'trama-rojo',
  'naranja', 'trama-naranja',
  'amarillo', 'trama-amarillo',
  'trama-verde',
];

export const EXPR_COLOR: any = [
  'match', ['get', 'banda'],
  'rojo', '#E5533D', 'naranja', '#E8A33D', 'amarillo', '#E8C34D', '#6FBF73',
];
