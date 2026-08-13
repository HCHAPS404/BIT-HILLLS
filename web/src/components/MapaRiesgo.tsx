/**
 * Mapa a sangre completa. No es un widget dentro de una tarjeta: el mapa ES
 * el fondo de la aplicación y los datos van sobrepuestos como HUD.
 *
 * Base: Carto dark-matter / positron según el modo — gratis y sin token.
 * Encima un VELO de tono que asienta el basemap al color del chasis, y sobre
 * el velo las zonas con trama cartográfica.
 *
 * NOTA DE DIAGNÓSTICO: MapLibre solicita tiles DESDE su bucle de render. En
 * una pestaña oculta el navegador suspende requestAnimationFrame, así que el
 * mapa se queda en blanco sin pedir un solo tile y sin emitir un solo error.
 * Si el mapa aparece vacío, comprobar document.visibilityState antes de
 * buscar el fallo en este archivo.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoResp } from '../lib/api';
import { registrarTramas, EXPR_TRAMA, EXPR_COLOR } from '../lib/tramas';

/** Noche: carbón. Día: Voyager (parques, agua y vías con color, no gris). */
const ESTILOS = {
  noche: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  dia: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
} as const;

interface Props {
  datos: GeoResp | null;
  seleccion: string | null;
  onSeleccion: (id: string) => void;
  tema: 'noche' | 'dia';
}

export function MapaRiesgo({ datos, seleccion, onSeleccion, tema }: Props) {
  const cont = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const listo = useRef(false);
  const temaAplicado = useRef(tema);
  // montarCapas se define en un efecto con deps []: sin ref capturaría el
  // tema inicial y el velo conservaría la opacidad del modo anterior.
  const temaRef = useRef(tema);
  temaRef.current = tema;

  useEffect(() => {
    if (!cont.current || mapa.current) return;
    const m = new maplibregl.Map({
      container: cont.current,
      style: ESTILOS[temaRef.current],
      // Encuadre fijo (no fitBounds dinámico, es cámara de instrumento) pero
      // calculado del bounding box real de las 6 zonas — con center/zoom
      // fijos a mano, El Socorro (más al sureste, fuera del corredor
      // turístico) quedaba fuera de cámara y solo se veían 4 de 6 zonas.
      bounds: [
        [-75.56219, 10.37941],
        [-75.476, 10.42898],
      ],
      fitBoundsOptions: { padding: 60 },
      attributionControl: { compact: true },
    });
    mapa.current = m;
    // Handle de depuración: en un hackathon poder inspeccionar el mapa desde
    // la consola vale más que adivinar por qué una capa no pinta.
    (window as any).__mapa = m;

    /**
     * setStyle() borra fuentes y capas propias. Todo lo nuestro vive aquí para
     * poder re-montarlo tal cual al cambiar de modo, sin duplicar definiciones.
     *
     * ⚠ RE-ENTRANCIA — esto ya rompió el mapa una vez, dejarlo documentado:
     * addImage/addSource/addLayer EMITEN `styledata`. Como abajo escuchamos
     * `styledata` para re-montar tras un setStyle, cada addImage volvía a
     * entrar aquí. La guarda era `if (m.getSource('zonas')) return`, pero esa
     * condición solo se cumple al FINAL de la función: durante registrarTramas
     * todavía no existe, así que no protegía nada. La re-entrada terminaba
     * chocando en addSource ("Source zonas already exists"), la excepción moría
     * dentro de un handler de eventos y el mapa quedaba sin una sola capa
     * nuestra, sin un solo error en consola.
     *
     * La guarda tiene que ser una bandera propia puesta en la PRIMERA línea.
     */
    let montando = false;
    const montarCapas = () => {
      if (montando || m.getSource('zonas')) return;
      montando = true;
      try {
        construirCapas();
      } finally {
        montando = false;
      }
    };

    const construirCapas = () => {
      registrarTramas(m);
      const css = getComputedStyle(document.documentElement);

      /**
       * VELO DE TONO. El basemap trae su propio valor tonal y no coincide con
       * el chasis: positron es casi blanco —más claro que nuestros paneles— y
       * dark-matter tira a gris azulado frente al carbón. En los dos casos el
       * mapa se lee pálido y despegado de la interfaz.
       *
       * Va SOBRE el basemap y DEBAJO de las zonas: asienta el terreno sin
       * tocar el dato.
       */
      m.addSource('velo', {
        type: 'geojson',
        data: {
          type: 'Feature', properties: {},
          geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] },
        },
      });
      m.addLayer({
        id: 'velo', type: 'fill', source: 'velo',
        paint: {
          'fill-color': css.getPropertyValue('--abismo').trim() || '#131315',
          'fill-opacity': temaRef.current === 'dia' ? 0.06 : 0.16,
        },
      });

      m.addSource('zonas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // Base tenue: da color al polígono sin competir con la trama.
      m.addLayer({
        id: 'zonas-base', type: 'fill', source: 'zonas',
        paint: {
          'fill-color': EXPR_COLOR,
          'fill-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 0.52, 0.36],
        },
      });

      // Trama cartográfica: la DENSIDAD del rayado es la severidad.
      // Se lee en gris, se lee impresa y funciona con daltonismo.
      m.addLayer({
        id: 'zonas-relleno', type: 'fill', source: 'zonas',
        paint: {
          'fill-pattern': EXPR_TRAMA,
          'fill-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 1, 0.82],
        },
      });

      m.addLayer({
        id: 'zonas-borde', type: 'line', source: 'zonas',
        paint: {
          'line-color': EXPR_COLOR,
          'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 2.6, 1.3],
          'line-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 1, 0.9],
        },
      });

      // Los rótulos del mapa no pueden usar var(): MapLibre pinta en WebGL,
      // no en CSS. Se reusan los tokens ya leídos arriba.
      m.addLayer({
        id: 'zonas-rotulo', type: 'symbol', source: 'zonas',
        layout: {
          'text-field': ['concat', ['get', 'nombre'], '\nIRI ', ['to-string', ['get', 'iri']]],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 11.5, 'text-letter-spacing': 0.08, 'text-anchor': 'center',
        },
        paint: {
          'text-color': css.getPropertyValue('--papel').trim() || '#ECEAEE',
          'text-halo-color': css.getPropertyValue('--abismo').trim() || '#131315',
          'text-halo-width': 1.9,
        },
      });

      listo.current = true;
      if (datos) (m.getSource('zonas') as maplibregl.GeoJSONSource)?.setData(datos as any);
    };

    m.on('load', () => {
      montarCapas();
      m.on('click', 'zonas-relleno', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSeleccion(String(id));
      });
      m.on('mouseenter', 'zonas-relleno', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'zonas-relleno', () => { m.getCanvas().style.cursor = ''; });
    });

    // Tras un setStyle, MapLibre emite styledata con el estilo nuevo ya cargado.
    m.on('styledata', () => { if (m.isStyleLoaded()) montarCapas(); });
    // Los fallos de MapLibre ocurren dentro de su propio bucle: sin esto se
    // pierden en silencio, que es justo lo que costó una hora de diagnóstico.
    m.on('error', (e: any) => console.error('[MAREA] error de mapa:', e?.error?.message ?? e));

    return () => { m.remove(); mapa.current = null; listo.current = false; };
  }, []);

  // Cambio de modo: se cambia el basemap y se re-montan nuestras capas.
  useEffect(() => {
    const m = mapa.current;
    if (!m || temaAplicado.current === tema) return;
    temaAplicado.current = tema;
    listo.current = false;
    m.setStyle(ESTILOS[tema]);
  }, [tema]);

  // Datos → mapa
  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo.current || !datos) return;
    const src = m.getSource('zonas') as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      ...datos,
      features: datos.features.map((f, i) => ({ ...f, id: i })),
    } as any);
  }, [datos]);

  // Selección → feature-state
  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo.current || !datos) return;
    datos.features.forEach((f, i) =>
      m.setFeatureState({ source: 'zonas', id: i }, { sel: f.properties.id === seleccion }),
    );
  }, [seleccion, datos]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={cont} style={{ position: 'absolute', inset: 0 }} />
      {/* Ondas: literalmente una onda en el agua sobre cada zona en alerta */}
      <Ondas datos={datos} mapa={mapa} />
    </div>
  );
}

function Ondas({ datos, mapa }: { datos: GeoResp | null; mapa: React.RefObject<maplibregl.Map | null> }) {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !datos || !capa.current) return;
    const el = capa.current;

    const pintar = () => {
      const criticas = datos.features.filter((f) => f.properties.banda === 'rojo' || f.properties.banda === 'naranja');
      el.innerHTML = criticas.map((f) => {
        const p = m.project(f.properties.centro as any);
        const cssv = getComputedStyle(document.documentElement);
        const color = cssv.getPropertyValue(f.properties.banda === 'rojo' ? '--critico' : '--alerta').trim();
        return `<svg style="position:absolute;left:${p.x - 60}px;top:${p.y - 60}px;pointer-events:none" width="120" height="120">
          <circle class="onda" cx="60" cy="60" r="22" fill="none" stroke="${color}" stroke-width="1.5"/>
          <circle class="onda" cx="60" cy="60" r="22" fill="none" stroke="${color}" stroke-width="1" style="animation-delay:.8s"/>
        </svg>`;
      }).join('');
    };

    pintar();
    m.on('move', pintar);
    m.on('zoom', pintar);
    return () => { m.off('move', pintar); m.off('zoom', pintar); };
  }, [datos]);

  return <div ref={capa} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
