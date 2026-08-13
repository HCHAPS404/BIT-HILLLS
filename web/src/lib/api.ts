/** Cliente de la API MAREA. En dev, vite proxy → localhost:8787. */

export const API = import.meta.env.VITE_API ?? '';

export interface Componentes { R: number; D: number; O: number; S: number; modificador: number }
export type Banda = 'verde' | 'amarillo' | 'naranja' | 'rojo';
export interface Punto { t: string; iri: number; banda: Banda; componentes: Componentes }

export interface PropsZona {
  id: string; nombre: string; es_turistica: boolean; nota: string;
  iri: number; iri_actual: number; banda: Banda; componentes: Componentes;
  ver_cop: number; horas_interrupcion: number;
  ventana_critica: { desde: string; hasta: string } | null;
  poblacion_expuesta: number; establecimientos: number; centro: [number, number];
  /** 24 h de IRI redondeado, para el sparkline del ranking */
  serie_iri?: number[];
}

export interface GeoResp {
  type: 'FeatureCollection';
  metadata: {
    generado: string; fuente: 'vivo' | 'escenario'; simulado: boolean;
    degradado: boolean; avisos: string[]; calibrado: false; version_modelo: string;
  };
  features: { type: 'Feature'; geometry: any; properties: PropsZona }[];
}

export interface DetalleZona {
  zona: { id: string; nombre: string; nota: string; es_turistica: boolean; susceptibilidad: number; establecimientos: Record<string, number> };
  fuente: 'vivo' | 'escenario'; simulado: boolean; degradado: boolean; avisos: string[];
  serie: Punto[]; actual: Punto; pico: Punto;
  ventana_critica: { desde: string; hasta: string } | null;
  horas_interrupcion: number; ver_cop: number;
  desglose: { categoria: string; establecimientos: number; cop_por_hora: number; cop_total: number; pct: number }[];
  cop_por_hora: number;
  sensibilidad: { parametro: string; bajo: number; alto: number; base: number; amplitud_pct: number }[];
}

const j = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json() as Promise<T>;
};

const qs = (o: Record<string, string | undefined>) =>
  Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');

export const getZonas = (escenario?: string, temporada?: string) =>
  j<GeoResp>(`${API}/api/zonas?${qs({ escenario, temporada })}`);

export const getRiesgo = (zona: string, escenario?: string, temporada?: string) =>
  j<DetalleZona>(`${API}/api/riesgo/${zona}?${qs({ escenario, temporada })}`);

export const getParams = () =>
  j<{ valores: any; meta: any[]; nota: string }>(`${API}/api/params`);

export const getEscenarios = () =>
  j<{ escenarios: any[]; nota: string }>(`${API}/api/escenarios`);

export const simular = (body: { overrides?: any; escenario?: string; temporada?: string }) =>
  j<{ geojson: GeoResp; resumen: any[]; ver_total_cop: number }>(`${API}/api/simular`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export const COLOR_BANDA: Record<Banda, string> = {
  verde: 'var(--seco)', amarillo: 'var(--vigila)', naranja: 'var(--alerta)', rojo: 'var(--critico)',
};

export const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const copCorto = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)} MM` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)} M` : `$${(n / 1e3).toFixed(0)} k`;

export const hhmm = (iso: string) => iso.slice(11, 16);
