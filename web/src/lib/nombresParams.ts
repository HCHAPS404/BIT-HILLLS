import type { Idioma } from '../i18n';
import { T } from '../i18n';

const CLAVE: Record<string, keyof typeof T.es> = {
  'ticket.hotel': 'pTicketHotel',
  'ticket.restaurante': 'pTicketRestaurante',
  'ticket.tour': 'pTicketTour',
  'ticket.retail': 'pTicketRetail',
  'eta.restaurante': 'pEtaRestaurante',
  'eta.hotel': 'pEtaHotel',
  'eta.tour': 'pEtaTour',
  'eta.retail': 'pEtaRetail',
  'tx_hora.restaurante': 'pTxRestaurante',
  'horas_recuperacion': 'pHorasRecup',
  'lluvia_umbral_mm': 'pUmbralLluvia',
  'mar_base_m': 'pMarBase',
  'mar_rango_m': 'pMarRango',
  'w_mar': 'pPesoMar',
  'w_obstr': 'pPesoCanal',
};

const FUENTE: Record<string, keyof typeof T.es> = {
  'ticket.hotel': 'fTicket',
  'ticket.restaurante': 'fTicket',
  'ticket.tour': 'fTicket',
  'ticket.retail': 'fTicket',
  'eta.hotel': 'fEtaHotel',
  'eta.restaurante': 'fEtaRestaurante',
  'eta.tour': 'fEtaTour',
  'eta.retail': 'fEtaRetail',
  'horas_recuperacion': 'fHorasRecup',
  'lluvia_umbral_mm': 'fUmbralLluvia',
  'mar_base_m': 'fMarBase',
  'mar_rango_m': 'fMarRango',
  'w_mar': 'fPeso',
  'w_obstr': 'fPeso',
};

export const GRUPO_RUBRO: Record<string, keyof typeof T.es> = {
  hotel: 'grupoHotel',
  restaurante: 'grupoRestaurante',
  tour: 'grupoTour',
  retail: 'grupoRetail',
};

function texto(idioma: Idioma, clave: keyof typeof T.es, respaldo: string): string {
  const v = T[idioma][clave];
  return typeof v === 'string' ? v : respaldo;
}

export function nombreParam(parametro: string, idioma: Idioma, respaldo?: string): string {
  const clave = CLAVE[parametro];
  return clave ? texto(idioma, clave, respaldo ?? parametro) : (respaldo ?? parametro);
}

export function fuenteParam(parametro: string, idioma: Idioma, respaldo: string): string {
  const clave = FUENTE[parametro];
  return clave ? texto(idioma, clave, respaldo) : respaldo;
}

export function nombreGrupoRubro(termino: string, idioma: Idioma): string {
  const clave = GRUPO_RUBRO[termino];
  return clave ? texto(idioma, clave, termino) : termino;
}
