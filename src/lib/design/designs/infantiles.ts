/**
 * Los diseños de primer añito y baby shower.
 *
 * Aquí niña y niño **eran dos templates** de cada diseño: el mismo marcado y
 * el mismo CSS, generados dos veces con otra paleta. Con la paleta elegible
 * al editar, son dos de las cuatro opciones de un solo diseño — se fueron
 * cinco archivos duplicados y la elección pasó de estar en el catálogo a
 * estar donde corresponde, en la invitación.
 */

import type { Design } from "../theme";
import { paleta } from "../paleta";
import * as deco from "../deco";
import { BALOO_NUNITO, FRAUNCES_INTER, QUICKSAND } from "./fuentes";

/* ── Paletas ────────────────────────────────────────────────── */

const ROSA = paleta({
  id: "rosa", nombre: "Rosa",
  base: "#fff7f9", tinta: "#45283a", marca: "#c74a75", segundo: "#f2a3bd",
});
const AZUL = paleta({
  id: "azul", nombre: "Azul",
  base: "#f4faff", tinta: "#1f3448", marca: "#2a72ad", segundo: "#86bde8",
});
const MENTA = paleta({
  id: "menta", nombre: "Menta",
  base: "#f4fbf8", tinta: "#173229", marca: "#2b8567", segundo: "#93d4bb",
});
const MOSTAZA = paleta({
  id: "mostaza", nombre: "Mostaza",
  base: "#fffcf2", tinta: "#3b3218", marca: "#9c7a1e", segundo: "#e8cd7a",
});
const TIERRA = paleta({
  id: "tierra", nombre: "Tonos tierra",
  base: "#fdf7f1", tinta: "#4a3229", marca: "#b56350", segundo: "#9aa87e",
});
const PIZARRA = paleta({
  id: "pizarra", nombre: "Azul pizarra",
  base: "#f6f7f5", tinta: "#27333d", marca: "#4a6f92", segundo: "#7f9273",
});
const LILA = paleta({
  id: "lila", nombre: "Lila",
  base: "#faf7fd", tinta: "#38294a", marca: "#7a56ab", segundo: "#c3aede",
});
const CIELO = paleta({
  id: "cielo", nombre: "Cielo",
  base: "#f5faff", tinta: "#1f3346", marca: "#2f6f9e", segundo: "#8dc0e4",
});
const EUCALIPTO = paleta({
  id: "eucalipto", nombre: "Eucalipto",
  base: "#fbf9f5", tinta: "#33342c", marca: "#5d6b4c", segundo: "#c69ea0",
});
const ARENA = paleta({
  id: "arena", nombre: "Arena",
  base: "#fdfaf4", tinta: "#3a3226", marca: "#8a6f45", segundo: "#d8c39a",
});
const TERRACOTA = paleta({
  id: "terracota", nombre: "Terracota",
  base: "#fffaf7", tinta: "#40261f", marca: "#c2543a", segundo: "#7fa79a",
});
const PETROLEO = paleta({
  id: "petroleo", nombre: "Azul petróleo",
  base: "#f6fbfc", tinta: "#12333a", marca: "#1f7285", segundo: "#c9a15a",
});
const DURAZNO = paleta({
  id: "durazno", nombre: "Durazno",
  base: "#fffaf6", tinta: "#42291f", marca: "#c0663c", segundo: "#f0b48c",
});
const GRIS = paleta({
  id: "gris", nombre: "Gris perla",
  base: "#f8f8f7", tinta: "#2b2c2e", marca: "#5f6469", segundo: "#a8aeb4",
});

/* ── Primer añito ───────────────────────────────────────────── */

const globos: Design = {
  slug: "1-globos",
  name: "Globos",
  occasion: "primer-ano",
  mood: "Festivo: globos flotando, confeti y esquinas muy redondas",
  fontUrl: BALOO_NUNITO.url,
  layout: { hero: "panel", head: "center", cards: "elevated", countdown: "tiles", gallery: "grid", divider: "arc" },
  type: { ...BALOO_NUNITO, scale: 1.29, displayWeight: 700, displayTracking: "-0.015em" },
  shape: { radius: 26, radiusSm: 18, btnRadius: "pill", shadow: "soft" },
  palettes: [ROSA, AZUL, MENTA, MOSTAZA],
  css: (t) => `
.hero-content{border:3px solid ${t.palette.card}}
.event-card,.feature-card,.gift-card,.guest-card{border-top:4px solid ${t.palette.brand}}
.gift-card{border-top-color:${t.palette.brand2}}
.feature-card:nth-child(even){border-top-color:${t.palette.brand2}}`,
  deco: {
    ornament: deco.estrellas,
    hero: (t) => deco.globos(t) + deco.confeti(t),
    splash: deco.confeti,
  },
};

const osito: Design = {
  slug: "1-osito",
  name: "Osito",
  occasion: "primer-ano",
  mood: "El arco como motivo: fotos y avatares en arco, foto arriba",
  fontUrl: QUICKSAND.url,
  layout: { hero: "split", head: "center", cards: "flat", countdown: "circles", gallery: "stack", divider: "arc" },
  type: { ...QUICKSAND, scale: 1.27, displayWeight: 600, displayTracking: "-0.01em" },
  shape: { radius: 24, radiusSm: 999, btnRadius: "pill", shadow: "none" },
  palettes: [TIERRA, PIZARRA, ARENA, MENTA],
  css: () => `
.gallery-item{border-radius:999px 999px 24px 24px}
.guest-avatar{border-radius:999px 999px 12px 12px}`,
  deco: { ornament: deco.rombo, hero: deco.arcos },
};

const circo: Design = {
  slug: "1-circo",
  name: "Circo",
  occasion: "primer-ano",
  mood: "Títulos enormes, banda a lo ancho y confeti",
  fontUrl: BALOO_NUNITO.url,
  layout: { hero: "band", head: "stacked", cards: "elevated", countdown: "tiles", gallery: "mosaic", divider: "wave" },
  type: { ...BALOO_NUNITO, scale: 1.35, displayWeight: 700, displayTracking: "-0.02em", displayLeading: 1.02 },
  shape: { radius: 22, radiusSm: 16, btnRadius: "pill", shadow: "lifted" },
  palettes: [MOSTAZA, TERRACOTA, MENTA, LILA],
  deco: { ornament: deco.estrellas, hero: deco.confeti, splash: deco.confeti },
};

const pastelito: Design = {
  slug: "1-pastelito",
  name: "Pastelito",
  occasion: "primer-ano",
  mood: "Suave y en columna: círculos flotando y cuenta atrás en un renglón",
  fontUrl: QUICKSAND.url,
  layout: { hero: "panel", head: "rule", cards: "flat", countdown: "line", gallery: "stack", divider: "arc" },
  type: { ...QUICKSAND, scale: 1.26, displayWeight: 600, displayTracking: "-0.008em" },
  shape: { radius: 30, radiusSm: 22, btnRadius: "pill", shadow: "none" },
  palettes: [DURAZNO, LILA, CIELO, ROSA],
  deco: { ornament: deco.estrellas, hero: deco.flotantes, splash: deco.flotantes },
};

const primerLibro: Design = {
  slug: "1-cuento",
  name: "Cuento",
  occasion: "primer-ano",
  mood: "Como un libro ilustrado: enmarcado, sin cajas y a la izquierda",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "frame", head: "left", cards: "rule", countdown: "type", gallery: "grid", divider: "rule" },
  type: { ...FRAUNCES_INTER, scale: 1.3, displayWeight: 500, displayTracking: "-0.02em" },
  shape: { radius: 4, radiusSm: 4, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [ARENA, EUCALIPTO, GRIS, MOSTAZA],
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

const huellita: Design = {
  slug: "1-huellita",
  name: "Huellita",
  occasion: "primer-ano",
  mood: "Texto sobre la foto, galería en mosaico y aguada abajo",
  fontUrl: QUICKSAND.url,
  layout: { hero: "minimal", head: "center", cards: "outline", countdown: "circles", gallery: "mosaic", divider: "none" },
  type: { ...QUICKSAND, scale: 1.3, displayWeight: 700, displayTracking: "-0.012em" },
  shape: { radius: 20, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [MENTA, TIERRA, CIELO, DURAZNO],
  deco: { ornament: deco.rombo, hero: deco.aguada },
};

/* ── Baby shower ────────────────────────────────────────────── */

const nube: Design = {
  slug: "bs-nube",
  name: "Nube",
  occasion: "baby-shower",
  mood: "Soñador: círculos blandos flotando y filo de ola",
  fontUrl: QUICKSAND.url,
  layout: { hero: "panel", head: "rule", cards: "elevated", countdown: "circles", gallery: "grid", divider: "wave" },
  type: { ...QUICKSAND, scale: 1.28, displayWeight: 600, displayTracking: "-0.008em" },
  shape: { radius: 22, radiusSm: 16, btnRadius: "pill", shadow: "soft" },
  palettes: [LILA, CIELO, MENTA, DURAZNO],
  deco: { ornament: deco.luna, hero: deco.flotantes, splash: deco.flotantes },
};

const bosque: Design = {
  slug: "bs-bosque",
  name: "Bosque",
  occasion: "baby-shower",
  mood: "Botánico y sobrio: enmarcado, a la izquierda y en columna",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "frame", head: "left", cards: "outline", countdown: "line", gallery: "stack", divider: "rule" },
  type: { ...FRAUNCES_INTER, scale: 1.27, displayTracking: "-0.015em" },
  shape: { radius: 3, radiusSm: 3, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [EUCALIPTO, PIZARRA, ARENA, GRIS],
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

const acuarela: Design = {
  slug: "bs-acuarela",
  name: "Acuarela",
  occasion: "baby-shower",
  mood: "Manchas de aguada, títulos muy grandes y bloque en la esquina",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "editorial", head: "stacked", cards: "rule", countdown: "type", gallery: "mosaic", divider: "none" },
  type: {
    ...FRAUNCES_INTER, scale: 1.35, displayWeight: 500,
    displayTracking: "-0.03em", displayLeading: 1.03, quoteStyle: "normal",
  },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [TERRACOTA, PETROLEO, EUCALIPTO, GRIS],
  deco: { ornament: deco.filete, hero: deco.acuarela, splash: deco.acuarela },
};

const cigena: Design = {
  slug: "bs-cigena",
  name: "Cigüeña",
  occasion: "baby-shower",
  mood: "Foto arriba y nombres abajo, con arcos y tarjetas planas",
  fontUrl: QUICKSAND.url,
  layout: { hero: "split", head: "center", cards: "flat", countdown: "tiles", gallery: "stack", divider: "arc" },
  type: { ...QUICKSAND, scale: 1.28, displayWeight: 600, displayTracking: "-0.01em" },
  shape: { radius: 28, radiusSm: 20, btnRadius: "pill", shadow: "none" },
  palettes: [CIELO, ROSA, MENTA, ARENA],
  deco: { ornament: deco.luna, hero: deco.arcos },
};

const lunita: Design = {
  slug: "bs-lunita",
  name: "Lunita",
  occasion: "baby-shower",
  mood: "Para el turno de noche: oscuro, con estrellas y marco de hilos",
  fontUrl: QUICKSAND.url,
  layout: { hero: "frame", head: "rule", cards: "outline", countdown: "circles", gallery: "grid", divider: "none" },
  type: { ...QUICKSAND, scale: 1.29, displayWeight: 600, displayTracking: "-0.005em" },
  shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [
    paleta({ id: "noche", nombre: "Noche estrellada", base: "#141a2e", tinta: "#e8ecf8", marca: "#a8b8e0", segundo: "#e0c078" }),
    paleta({ id: "indigo", nombre: "Índigo", base: "#1a1f38", tinta: "#e6e9f5", marca: "#9fb0dd", segundo: "#c9a9d8" }),
    LILA,
    CIELO,
  ],
  css: () => `.gifts-account{background:transparent}`,
  deco: { ornament: deco.luna, hero: deco.rayos, splash: deco.rayos },
};

const pañal: Design = {
  slug: "bs-canastilla",
  name: "Canastilla",
  occasion: "baby-shower",
  mood: "Banda a lo ancho, títulos de dos pisos y galería en mosaico",
  fontUrl: BALOO_NUNITO.url,
  layout: { hero: "band", head: "stacked", cards: "elevated", countdown: "tiles", gallery: "mosaic", divider: "wave" },
  type: { ...BALOO_NUNITO, scale: 1.32, displayWeight: 700, displayTracking: "-0.02em" },
  shape: { radius: 24, radiusSm: 18, btnRadius: "pill", shadow: "lifted" },
  palettes: [DURAZNO, MENTA, LILA, MOSTAZA],
  deco: { ornament: deco.estrellas, hero: deco.confeti },
};

const semilla: Design = {
  slug: "bs-semilla",
  name: "Semilla",
  occasion: "baby-shower",
  mood: "Mínimo y aireado: texto sobre la foto, sin cajas ni ornamento",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "minimal", head: "left", cards: "rule", countdown: "type", gallery: "grid", divider: "none" },
  type: { ...FRAUNCES_INTER, scale: 1.33, displayWeight: 400, displayTracking: "-0.025em", quoteStyle: "normal" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [GRIS, EUCALIPTO, PETROLEO, ARENA],
  css: () => `.ornament{display:none}`,
};

export const INFANTILES: Design[] = [
  globos, osito, circo, pastelito, primerLibro, huellita,
  nube, bosque, acuarela, cigena, lunita, pañal, semilla,
];
