/**
 * TRAMAS CARTOGRÁFICAS para las zonas del mapa.
 *
 * Un relleno translúcido plano es lo que sale por defecto de cualquier
 * librería. Las cartas de amenaza usan RAYADO: el tipo de marca codifica
 * la clase, y se lee en gris, impreso y con daltonismo.
 *
 * El tile chico (16px, paso 4) era una retícula de imprenta: al panear el
 * mapa producía moiré y mareaba. Aquí las marcas son GORDAS, de historieta.
 * Se cuentan a ojo. La severidad sigue en el TIPO, no en la frecuencia
 * espacial:
 *
 *   verde     → lunares grandes     (observación)
 *   amarillo  → dos fajas a 45°     (vigilancia)
 *   naranja   → fajas más juntas    (alerta)
 *   rojo      → aspa grande         (crítico)
 *
 * Se generan en canvas y se registran con map.addImage(), así no hay que
 * servir ningún PNG ni depender de un CDN.
 */

export type Banda = 'verde' | 'amarillo' | 'naranja' | 'rojo';

interface Spec {
  /** variable CSS de la que sale la tinta — así la trama sigue al modo día/noche */
  token: string;
  /** separación entre marcas en px. Debe dividir LADO para que el tile empalme. */
  paso: number;
  grosor: number;
  cruzado: boolean;
  punteado: boolean;
}

const SPECS: Record<Banda, Spec> = {
  verde:    { token: '--seco',    paso: 32, grosor: 5.0, cruzado: false, punteado: true },
  amarillo: { token: '--vigila',  paso: 32, grosor: 6.0, cruzado: false, punteado: false },
  naranja:  { token: '--alerta',  paso: 16, grosor: 5.5, cruzado: false, punteado: false },
  rojo:     { token: '--critico', paso: 32, grosor: 6.5, cruzado: true,  punteado: false },
};

const tinta = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#888';

/** 64px: cada marca es un dibujo, no un punto de trama. */
const LADO = 64;

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
    // Lunares interiores: no van al borde, el tile no se come medio círculo.
    const lunares: [number, number][] = [[18, 16], [46, 20], [30, 46], [14, 50]];
    for (const [x, y] of lunares) {
      g.beginPath();
      g.arc(x, y, spec.grosor, 0, Math.PI * 2);
      g.fill();
    }
    return g.getImageData(0, 0, px, px);
  }

  g.strokeStyle = tintaColor;
  g.lineWidth = spec.grosor;
  g.lineCap = 'round';

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
