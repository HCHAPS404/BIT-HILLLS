/**
 * Sparkline de 24 h del IRI, para cada fila del ranking de zonas.
 *
 * Lo único que vale la pena robar del catálogo de componentes de moda es el
 * idioma del TERMINAL FINANCIERO: máxima densidad de información por pixel,
 * cero decoración. Una lista que solo da el valor actual esconde lo que más
 * importa en un sistema de alerta — si la zona va SUBIENDO o BAJANDO.
 *
 * Escala fija 0–100 (no auto-escalada): así las seis zonas se comparan entre
 * sí de un vistazo. Auto-escalar cada fila haría que un barrio tranquilo se
 * viera tan dramático como uno en rojo.
 */

interface Props {
  valores: number[];
  color: string;
  ancho?: number;
  alto?: number;
}

export function Sparkline({ valores, color, ancho = 64, alto = 16 }: Props) {
  if (!valores?.length) return <div style={{ width: ancho, height: alto }} />;

  const n = valores.length;
  const x = (i: number) => (i / Math.max(1, n - 1)) * ancho;
  const y = (v: number) => alto - (Math.max(0, Math.min(100, v)) / 100) * (alto - 1.5) - 0.75;

  const linea = valores.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${linea} L${ancho},${alto} L0,${alto} Z`;

  // Índice del pico: es el instante que le importa a quien decide.
  const iPico = valores.reduce((mejor, v, i) => (v > valores[mejor] ? i : mejor), 0);

  return (
    <svg width={ancho} height={alto} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      {/* Umbral naranja (50): referencia fija, no decoración */}
      <line x1={0} y1={y(50)} x2={ancho} y2={y(50)}
        stroke="var(--sonda-alta)" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d={area} fill={color} opacity="0.14" />
      <path d={linea} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(iPico)} cy={y(valores[iPico])} r="1.6" fill={color} />
    </svg>
  );
}
