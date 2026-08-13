/**
 * Mapa a sangre completa. No es un widget dentro de una tarjeta: el mapa ES
 * el fondo de la aplicación y los datos van sobrepuestos como HUD.
 *
 * Base: Carto dark-matter — gratis, sin token, y su gris casi negro cae
 * exactamente sobre nuestra paleta de carta náutica.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoResp } from '../lib/api';

const ESTILO = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface Props {
  datos: GeoResp | null;
  seleccion: string | null;
  onSeleccion: (id: string) => void;
}

export function MapaRiesgo({ datos, seleccion, onSeleccion }: Props) {
  const cont = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const listo = useRef(false);

  useEffect(() => {
    if (!cont.current || mapa.current) return;
    const m = new maplibregl.Map({
      container: cont.current,
      style: ESTILO,
      center: [-75.529, 10.408],
      zoom: 12.1,
      attributionControl: { compact: true },
    });
    mapa.current = m;

    m.on('load', () => {
      m.addSource('zonas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      m.addLayer({
        id: 'zonas-relleno', type: 'fill', source: 'zonas',
        paint: {
          'fill-color': [
            'match', ['get', 'banda'],
            'rojo', '#E5533D', 'naranja', '#E8A33D', 'amarillo', '#E8C34D', '#6FBF73',
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 0.55, 0.28],
        },
      });

      m.addLayer({
        id: 'zonas-borde', type: 'line', source: 'zonas',
        paint: {
          'line-color': [
            'match', ['get', 'banda'],
            'rojo', '#E5533D', 'naranja', '#E8A33D', 'amarillo', '#E8C34D', '#6FBF73',
          ],
          'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 2.5, 1],
        },
      });

      m.addLayer({
        id: 'zonas-rotulo', type: 'symbol', source: 'zonas',
        layout: {
          'text-field': ['concat', ['get', 'nombre'], '  ', ['to-string', ['get', 'iri']]],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 11, 'text-letter-spacing': 0.08, 'text-anchor': 'center',
        },
        paint: { 'text-color': '#F2EDE3', 'text-halo-color': '#0A1420', 'text-halo-width': 1.6 },
      });

      m.on('click', 'zonas-relleno', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSeleccion(String(id));
      });
      m.on('mouseenter', 'zonas-relleno', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'zonas-relleno', () => { m.getCanvas().style.cursor = ''; });

      listo.current = true;
      if (datos) (m.getSource('zonas') as maplibregl.GeoJSONSource)?.setData(datos as any);
    });

    return () => { m.remove(); mapa.current = null; listo.current = false; };
  }, []);

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
        const color = f.properties.banda === 'rojo' ? '#E5533D' : '#E8A33D';
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
