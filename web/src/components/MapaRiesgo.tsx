/**
 * Mapa a sangre completa. No es un widget dentro de una tarjeta: el mapa ES
 * el fondo de la aplicación y los datos van sobrepuestos como HUD.
 *
 * Base: Carto dark-matter / positron según el modo — gratis y sin token.
 * Encima va un VELO de tono que asienta el basemap al color del chasis, y
 * sobre el velo las zonas con trama cartográfica.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoResp } from '../lib/api';
import { registrarTramas, EXPR_TRAMA, EXPR_COLOR } from '../lib/tramas';

/** El basemap sigue al modo: carbón de noche, papel de día. */
const ESTILOS = {
  noche: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  dia: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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
      center: [-75.529, 10.408],
      zoom: 12.1,
      attributionControl: { compact: true },
    });
    mapa.current = m;
    // Handle de depuración: en un hackathon poder inspeccionar el mapa desde
    // la consola vale más que adivinar por qué una capa no pinta.
    (window as any).__mapa = m;

    /**
     * setStyle() borra fuentes y capas propias. Todo lo nuestro vive aquí para
     * poder re-montarlo tal cual al cambiar de modo, sin duplicar definiciones.
     */
    const montarCapas = () => {
      if (m.getSource('zonas')) return;
      registrarTramas(m);
      const css = getComputedStyle(document.documentElement);

      m.addSource('zonas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // Base tenue: da color al polígono sin competir con la trama.
      m.addLayer({
        id: 'zonas-base', type: 'fill', source: 'zonas',
        paint: {
          'fill-color': EXPR_COLOR,
          'fill-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 0.34, 0.18],
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
          'text-field': ['concat', ['get', 'nombre'], '  ', ['to-string', ['get', 'iri']]],
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
