/**
 * Lo que un desconocido tiene que entender de una zona:
 * qué pasa, qué hacer, de qué tamaño es el número, y por qué cada componente.
 */

import type { DetalleZona } from '../lib/api';
import type { Idioma } from '../i18n';
import { T } from '../i18n';
import {
  accionRecomendada, fraseEstado, plantillaWhatsApp, porQueComponente,
  DEFINICIONES, type ClaveComponente,
} from '../lib/lectura';
import { Definicion } from './Definicion';
import { EscalaIRI } from './EscalaIRI';

export function LecturaZona({ detalle, idioma }: { detalle: DetalleZona; idioma: Idioma }) {
  const t = T[idioma];
  const def = DEFINICIONES[idioma];
  const frase = fraseEstado({
    zona: detalle.zona.nombre,
    iri: detalle.pico.iri,
    banda: detalle.pico.banda,
    ventana: detalle.ventana_critica,
    componentes: detalle.pico.componentes,
    simulado: detalle.simulado,
    idioma,
  });
  const accion = accionRecomendada(detalle.pico.banda, idioma);
  const mandaAviso = detalle.pico.banda === 'naranja' || detalle.pico.banda === 'rojo';
  const aviso = {
    zona_nombre: detalle.zona.nombre,
    banda: detalle.pico.banda,
    iri: detalle.pico.iri,
    desde: detalle.ventana_critica?.desde ?? detalle.pico.t,
    hasta: detalle.ventana_critica?.hasta ?? detalle.pico.t,
    ver_cop: detalle.ver_cop,
    simulado: detalle.simulado,
  };

  return (
    <>
      <div className="rotulo" style={{ color: 'var(--acento)' }}>{detalle.zona.nombre}</div>
      <h2
        className="frase-estado"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {frase.titular}
      </h2>
      <p className="frase-detalle">{frase.detalle}</p>

      <div className="accion-recomendada">
        {accion}
      </div>
      {mandaAviso && (
        <div className="rotulo" style={{ marginTop: 'var(--esp-2)', textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
          {t.mismoWhatsApp}
        </div>
      )}
      {mandaAviso && detalle.ventana_critica && (
        <details className="aviso-whatsapp">
          <summary>{t.verAvisoWhatsApp}</summary>
          <pre>{plantillaWhatsApp(aviso)}</pre>
        </details>
      )}

      <div style={{ marginTop: 'var(--esp-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--esp-3)', marginBottom: 'var(--esp-3)' }}>
          <span className="rotulo">
            <Definicion termino="IRI" titulo={def.IRI.titulo}>{def.IRI.cuerpo}</Definicion>
            {' '}{Math.round(detalle.pico.iri)} / 100
          </span>
          <span className="rotulo" style={{ color: 'var(--papel-tenue)', textTransform: 'none', letterSpacing: '0.03em' }}>
            {t.bandaDe[detalle.pico.banda]}
          </span>
        </div>
        <EscalaIRI iri={detalle.pico.iri} banda={detalle.pico.banda} idioma={idioma} />
        <div className="rotulo" style={{ marginTop: 'var(--esp-3)', textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
          {t.iriHonesto}
        </div>
      </div>
    </>
  );
}

export function ComponentesZona({ detalle, idioma }: { detalle: DetalleZona; idioma: Idioma }) {
  return (
    <div style={{ marginTop: 'var(--esp-5)', borderTop: 'var(--linea)', paddingTop: 'var(--esp-4)' }}>
      {([['R', detalle.pico.componentes.R], ['D', detalle.pico.componentes.D],
         ['O', detalle.pico.componentes.O], ['S', detalle.pico.componentes.S]] as const).map(([k, v]) => {
        const { nombre, linea } = porQueComponente(k as ClaveComponente, v, idioma, detalle.pico.componentes.R);
        return (
          <div key={k} style={{ marginBottom: 'var(--esp-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--esp-3)' }}>
              <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--papel)' }}>{nombre}</span>
              <span className="num" style={{ fontSize: 'var(--texto-sm)', color: 'var(--acento)' }}>{v.toFixed(2)}</span>
            </div>
            <div className="rotulo" style={{ marginTop: 'var(--esp-1)', textTransform: 'none', letterSpacing: '0.03em', lineHeight: 1.5 }}>
              {linea}
            </div>
          </div>
        );
      })}
    </div>
  );
}
