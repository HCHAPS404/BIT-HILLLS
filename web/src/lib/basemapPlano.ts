/**
 * Recolorea el Voyager de día hacia un plano ilustrado:
 * tierra crema, vía ámbar, agua cian, parque lima.
 * MapLibre pinta en WebGL: aquí sí van hex, no var().
 */

const TIERRA = '#F4EFE4';
const PARQUE = '#8FCF5A';
const AGUA = '#5BC4E3';
const VIA = '#F0B429';
const VIA_BORDE = '#FFFFFF';
const VIA_MENOR = '#FFFFFF';
const VIA_MENOR_BORDE = '#E8E0D4';
const MANZANA = '#D2C9BB';

function pintar(mapa: { setPaintProperty: (id: string, k: string, v: unknown) => void }, id: string, prop: string, valor: unknown) {
  try { mapa.setPaintProperty(id, prop, valor); } catch { /* capa sin esa pintura */ }
}

export function pintarBasemapPlano(mapa: { getStyle: () => { layers?: { id: string; type: string }[] } | undefined; setPaintProperty: (id: string, k: string, v: unknown) => void }) {
  const capas = mapa.getStyle()?.layers ?? [];
  for (const capa of capas) {
    const { id, type } = capa;
    if (id === 'background') {
      pintar(mapa, id, 'background-color', TIERRA);
      continue;
    }
    if (id === 'water' || id === 'water_shadow') {
      pintar(mapa, id, 'fill-color', AGUA);
      continue;
    }
    if (id === 'waterway') {
      pintar(mapa, id, 'line-color', AGUA);
      continue;
    }
    if (/^landcover$|^park_|^landuse$/.test(id) && type === 'fill') {
      pintar(mapa, id, 'fill-color', PARQUE);
      pintar(mapa, id, 'fill-opacity', 1);
      continue;
    }
    if (id === 'landuse_residential') {
      pintar(mapa, id, 'fill-color', TIERRA);
      continue;
    }
    if (id === 'building' || id === 'building-top') {
      pintar(mapa, id, 'fill-color', MANZANA);
      if (id === 'building-top') pintar(mapa, id, 'fill-outline-color', VIA_MENOR_BORDE);
      continue;
    }
    if (!type || type !== 'line') continue;
    const mayor = /mot|trunk|pri|sec/.test(id);
    const menor = /minor|service/.test(id);
    if (mayor && /fill/.test(id)) pintar(mapa, id, 'line-color', VIA);
    else if (mayor && /case/.test(id)) pintar(mapa, id, 'line-color', VIA_BORDE);
    else if (menor && /fill/.test(id)) pintar(mapa, id, 'line-color', VIA_MENOR);
    else if (menor && /case/.test(id)) pintar(mapa, id, 'line-color', VIA_MENOR_BORDE);
  }
}
