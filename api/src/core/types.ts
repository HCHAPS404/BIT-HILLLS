/**
 * CONTRATO CENTRAL DEL SISTEMA.
 *
 * Regla de arquitectura que se defiende ante el jurado:
 * el motor de riesgo NO conoce ninguna API externa. Solo consume `Signal`.
 * Cambiar de fuente de datos —o de dominio entero— es escribir un adaptador
 * nuevo en src/adapters/ que produzca Signal[]. Nada del core se toca.
 */

export type SignalTipo = 'lluvia_3h' | 'nivel_mar' | 'oleaje' | 'obstruccion';

export interface Signal {
  zona_id: string;
  tipo: SignalTipo;
  valor: number;
  unidad: string;
  /** ISO. Instante al que APLICA el dato, no cuándo se leyó. */
  t_valido: string;
  /** 0–1. Un pronóstico a 72 h vale menos que uno a 3 h. */
  confianza: number;
  fuente: string;
}

export type Categoria = 'hotel' | 'restaurante' | 'tour' | 'retail';

export interface Zona {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  /** S_zona ∈ [0.4, 1.0]. Cota + historial + proximidad a caño/ciénaga. */
  susceptibilidad: number;
  es_turistica: boolean;
  /** Estado base del canal 0–1. Los reportes ciudadanos lo mueven. */
  obstruccion_base: number;
  /**
   * Nivel de precio de la zona, relativo al corredor turístico premium (1.0).
   * SIN ESTO EL MODELO MIENTE: aplicar el ticket de un retail de Bocagrande a
   * una tienda de barrio de El Socorro infla el VER en un orden de magnitud.
   * Supuesto de equipo, declarado y editable.
   */
  factor_precio: number;
  establecimientos: Record<Categoria, number>;
  poblacion_expuesta: number;
  polygon: [number, number][];
  nota: string;
}

export type Banda = 'verde' | 'amarillo' | 'naranja' | 'rojo';

export interface Componentes {
  /** Disparador: lluvia normalizada 0–1 */
  R: number;
  /** Drenaje bloqueado por el mar 0–1 */
  D: number;
  /** Obstrucción de canal 0–1 */
  O: number;
  /** Susceptibilidad estática de la zona */
  S: number;
  /** Multiplicador resultante 0.55–1.00 */
  modificador: number;
}

export interface Evaluacion {
  zona_id: string;
  t: string;
  iri: number;
  banda: Banda;
  componentes: Componentes;
  ver_cop: number;
  horas_interrupcion: number;
  /** Literal, se serializa a la UI. El índice NO está calibrado. */
  calibrado: false;
  version_modelo: string;
}

export interface Env {
  DB?: D1Database;
  AI?: Ai;
  REPORTES?: R2Bucket;
  TEMPORADA?: string;
  FONTUMI_TOKEN?: string;
  /** Location ID de GoHighLevel (detrás de Fontumi). Requerido por su API para /contacts y /conversations. */
  FONTUMI_LOCATION_ID?: string;
}
