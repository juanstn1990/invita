/**
 * Los diseños de boda.
 *
 * Los cinco originales eran el mismo clásico romántico —crema, serifa,
 * ornamento centrado— y se distinguían sólo por el color. Ahora el color es
 * lo que **se elige al editar**, y lo que distingue a un diseño de otro es su
 * combinación de slots: Editorial va a la izquierda y sin ornamento, Nocturno
 * es enmarcado, Campestre parte la portada en dos. Coincidir en dos slots es
 * normal; coincidir en los seis era el problema.
 *
 * Cada uno declara cuatro paletas. No son cuatro juegos de trece colores
 * escritos a mano: son cinco decisiones y `paleta()` deriva el resto,
 * ajustando lo que lleva texto hasta que cumpla su contraste.
 */

import type { Design } from "../theme";
import { paleta } from "../paleta";
import * as deco from "../deco";
import {
  CORMORANT_INTER,
  CORMORANT_JOST,
  DMSERIF_DMSANS,
  FRAUNCES_INTER,
  INTER_SOLO,
  MARCELLUS_JOST,
  PLAYFAIR_KARLA,
} from "./fuentes";

/* ────────────────────────────────────────────────────────────────
   Paletas que se repiten entre diseños de boda
   ──────────────────────────────────────────────────────────────── */

const CREMA = paleta({
  id: "crema", nombre: "Crema y salvia",
  base: "#faf7f1", tinta: "#3a3330", marca: "#6e6249", acento: "#8a7248", segundo: "#9aab9c",
});
const ORO = paleta({
  id: "oro", nombre: "Blanco y oro",
  base: "#ffffff", tinta: "#211d18", marca: "#c9a84c", segundo: "#e8d9a8",
});
const VINO = paleta({
  id: "vino", nombre: "Vino y terracota",
  base: "#fdf7f4", tinta: "#40161c", marca: "#8e2b36", segundo: "#c98a63",
});
const OLIVO = paleta({
  id: "olivo", nombre: "Marfil y olivo",
  base: "#faf9f3", tinta: "#2e332a", marca: "#5a6b43", segundo: "#8a9a6d",
});
const NOCHE = paleta({
  id: "noche", nombre: "Negro y oro",
  base: "#0e0e11", tinta: "#f0ece2", marca: "#cfa963", segundo: "#8a7346",
});
const BORGONA = paleta({
  id: "borgona", nombre: "Borgoña y oro",
  base: "#2a0d16", tinta: "#f4e6d8", marca: "#d4b06a", segundo: "#a8607a",
});
const LINO = paleta({
  id: "lino", nombre: "Lino y trigo",
  base: "#f7f2e7", tinta: "#3b3524", marca: "#6e7a4c", segundo: "#b08e58",
});
const TINTA = paleta({
  id: "tinta", nombre: "Blanco y tinta",
  base: "#ffffff", tinta: "#17150f", marca: "#55503f", acento: "#17150f", segundo: "#a89880",
});
const HUMO = paleta({
  id: "humo", nombre: "Humo y latón",
  base: "#f4f4f2", tinta: "#26261f", marca: "#6b6455", segundo: "#a89a6f",
});
const NIEBLA = paleta({
  id: "niebla", nombre: "Niebla y azul",
  base: "#f5f7fa", tinta: "#1c2634", marca: "#2c5075", segundo: "#8ea6c0",
});
const CIRUELA = paleta({
  id: "ciruela", nombre: "Ciruela y malva",
  base: "#fbf7fa", tinta: "#332338", marca: "#6d4472", segundo: "#b592bc",
});
const ARENA = paleta({
  id: "arena", nombre: "Arena y cobre",
  base: "#fdf8f2", tinta: "#3d2f22", marca: "#8c5a34", segundo: "#d9a678",
});
const PIZARRA = paleta({
  id: "pizarra", nombre: "Pizarra y hueso",
  base: "#1c1f22", tinta: "#eceae4", marca: "#c8c2b2", segundo: "#7f8b93",
});
const ROSAL = paleta({
  id: "rosal", nombre: "Rosa antiguo",
  base: "#fff8f7", tinta: "#43272c", marca: "#a15662", segundo: "#e0aab0",
});
const BOSQUE = paleta({
  id: "bosque", nombre: "Verde bosque",
  base: "#f6f9f5", tinta: "#1e2a20", marca: "#33604a", segundo: "#7fa38a",
});
const SELVA = paleta({
  id: "selva", nombre: "Selva profunda",
  base: "#12251f", tinta: "#e8f0e8", marca: "#8fbfa2", segundo: "#c9a15a",
});

/* ────────────────────────────────────────────────────────────────
   Los ocho de siempre
   ──────────────────────────────────────────────────────────────── */

const vintage: Design = {
  slug: "vintage",
  name: "Vintage",
  occasion: "boda",
  mood: "Enmarcado en hilos, con hojas dibujadas y mucho aire",
  fontUrl: CORMORANT_JOST.url,
  layout: { hero: "frame", head: "rule", cards: "outline", countdown: "circles", gallery: "grid", divider: "rule" },
  type: { ...CORMORANT_JOST, scale: 1.28, displayTracking: "0.01em" },
  shape: { radius: 4, radiusSm: 3, shadow: "none" },
  density: "airy",
  palettes: [CREMA, OLIVO, ROSAL, BORGONA],
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

const white: Design = {
  slug: "white",
  name: "Blanco Oro",
  occasion: "boda",
  mood: "Minimalista: esquinas rectas, cuenta atrás tipográfica y galería en mosaico",
  fontUrl: CORMORANT_INTER.url,
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "type", gallery: "mosaic", divider: "none" },
  type: { ...CORMORANT_INTER, scale: 1.32, displayWeight: 300, displayTracking: "0.02em" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [ORO, HUMO, TINTA, NOCHE],
  deco: { ornament: deco.filete },
};

const marsala: Design = {
  slug: "marsala",
  name: "Marsala",
  occasion: "boda",
  mood: "Portada en banda, títulos de dos pisos y tarjetas elevadas",
  fontUrl: PLAYFAIR_KARLA.url,
  layout: { hero: "band", head: "stacked", cards: "elevated", countdown: "tiles", gallery: "grid", divider: "arc" },
  type: { ...PLAYFAIR_KARLA, scale: 1.3, displayTracking: "-0.015em" },
  shape: { radius: 14, radiusSm: 10, btnRadius: 4, shadow: "lifted" },
  palettes: [VINO, CIRUELA, ARENA, BORGONA],
  deco: { ornament: deco.rombo },
};

const aurum: Design = {
  slug: "aurum-wine",
  name: "Aurum",
  occasion: "boda",
  mood: "El más formal: doble marco de hilos, galería en mosaico y rayos art déco",
  fontUrl: CORMORANT_JOST.url,
  layout: { hero: "frame", head: "rule", cards: "outline", countdown: "circles", gallery: "mosaic", divider: "none" },
  type: { ...CORMORANT_JOST, scale: 1.3, displayWeight: 300, displayTracking: "0.03em" },
  shape: { radius: 2, radiusSm: 2, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [BORGONA, NOCHE, PIZARRA, SELVA],
  css: () => `
/* En un diseño oscuro la línea discontinua de los datos bancarios se pierde;
   se apoya en el acento en vez de en el filete. */
.gifts-account{background:transparent}`,
  deco: { ornament: deco.rombo, hero: deco.rayos, splash: deco.rayos },
};

const ivory: Design = {
  slug: "ivory-leaf",
  name: "Ivory Leaf",
  occasion: "boda",
  mood: "A la izquierda y sin cajas: filetes en vez de tarjetas, galería en columna",
  fontUrl: CORMORANT_JOST.url,
  layout: { hero: "panel", head: "left", cards: "rule", countdown: "line", gallery: "stack", divider: "rule" },
  type: { ...CORMORANT_JOST, scale: 1.26, displayTracking: "0" },
  shape: { radius: 3, radiusSm: 3, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [OLIVO, CREMA, BOSQUE, HUMO],
  deco: { ornament: deco.hojas, hero: deco.aros },
};

const editorial: Design = {
  slug: "editorial",
  name: "Editorial",
  occasion: "boda",
  mood: "Sans apretada, bloque sólido en la esquina y cero ornamento",
  fontUrl: INTER_SOLO.url,
  layout: { hero: "editorial", head: "left", cards: "rule", countdown: "type", gallery: "mosaic", divider: "none" },
  type: {
    ...INTER_SOLO, scale: 1.36, displayWeight: 500,
    displayTracking: "-0.035em", displayLeading: 1.02, tracking: "0.14em", quoteStyle: "normal",
  },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [TINTA, HUMO, NIEBLA, PIZARRA],
  css: () => `
/* El único sin ornamento: los filetes de 1px hacen todo el trabajo de
   separar, así que no hay nada que dibujar bajo los títulos. */
.ornament{display:none}`,
};

const nocturno: Design = {
  slug: "nocturno",
  name: "Nocturno",
  occasion: "boda",
  mood: "Para recepción de noche: marco de esquinas abiertas y ornamento que respira",
  fontUrl: CORMORANT_JOST.url,
  layout: { hero: "frame", head: "rule", cards: "outline", countdown: "circles", gallery: "grid", divider: "none" },
  type: { ...CORMORANT_JOST, scale: 1.32, displayWeight: 300, displayTracking: "0.04em" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [NOCHE, BORGONA, PIZARRA, SELVA],
  css: () => `
.gifts-account{background:transparent}
/* El rombo del ornamento respira: es el único movimiento del diseño. */
.ornament svg{animation:respira 4.5s ease-in-out infinite}
@keyframes respira{0%,100%{opacity:.55}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.ornament svg{animation:none}}`,
  deco: { ornament: deco.rombo, hero: deco.marco, splash: deco.marco },
};

const campestre: Design = {
  slug: "campestre",
  name: "Campestre",
  occasion: "boda",
  mood: "Foto arriba y nombres abajo, con textura de papel y filo rasgado",
  fontUrl: MARCELLUS_JOST.url,
  layout: { hero: "split", head: "center", cards: "flat", countdown: "tiles", gallery: "stack", divider: "torn" },
  type: { ...MARCELLUS_JOST, scale: 1.27, displayTracking: "0.015em" },
  shape: { radius: 10, radiusSm: 8, btnRadius: 2, shadow: "none" },
  palettes: [LINO, ARENA, OLIVO, CREMA],
  css: (t) => `
/* Textura de papel kraft con degradados: sin imágenes externas, que es lo
   que obligó a quitar las de Unsplash de la versión anterior. */
body{background-image:
  repeating-linear-gradient(92deg,transparent 0 3px,${t.palette.line} 3px 4px),
  repeating-linear-gradient(2deg,transparent 0 5px,${t.palette.bgAlt} 5px 6px)}
/* Las fotos van un grado torcidas, como pegadas en un álbum. */
.gallery-item{transform:rotate(-.5deg)}
.gallery-item:nth-child(even){transform:rotate(.6deg)}`,
  deco: { ornament: deco.rombo, hero: deco.aguada, footer: deco.aguada },
};

/* ────────────────────────────────────────────────────────────────
   Los cuatro nuevos
   ──────────────────────────────────────────────────────────────── */

const capilla: Design = {
  slug: "capilla",
  name: "Capilla",
  occasion: "boda",
  mood: "Portada en arco y galería en columna: vertical y sereno",
  fontUrl: MARCELLUS_JOST.url,
  layout: { hero: "panel", head: "rule", cards: "outline", countdown: "circles", gallery: "stack", divider: "arc" },
  type: { ...MARCELLUS_JOST, scale: 1.29, displayTracking: "0.03em" },
  shape: { radius: 999, radiusSm: 18, btnRadius: "pill", shadow: "none" },
  density: "airy",
  palettes: [CREMA, HUMO, OLIVO, ARENA],
  css: () => `
/* El arco es el motivo: la portada, las fotos y los avatares lo repiten. */
.hero-content{border-radius:999px 999px var(--radius-sm) var(--radius-sm)}
.gallery-item{border-radius:999px 999px var(--radius-sm) var(--radius-sm)}
.guest-avatar{border-radius:999px 999px 6px 6px}`,
  deco: { ornament: deco.anillo, hero: deco.arcos, splash: deco.arcos },
};

const bruma: Design = {
  slug: "bruma",
  name: "Bruma",
  occasion: "boda",
  mood: "Texto sobre la foto sin caja, con una sola línea de cuenta atrás",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "minimal", head: "left", cards: "rule", countdown: "line", gallery: "mosaic", divider: "none" },
  type: { ...FRAUNCES_INTER, scale: 1.34, displayWeight: 400, displayTracking: "-0.025em", displayLeading: 1.04 },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [NIEBLA, HUMO, TINTA, PIZARRA],
  deco: { ornament: deco.filete },
};

const jardin: Design = {
  slug: "jardin",
  name: "Jardín",
  occasion: "boda",
  mood: "Botánico y suelto: manchas de aguada, tarjetas planas y filo de ola",
  fontUrl: CORMORANT_INTER.url,
  layout: { hero: "split", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "wave" },
  type: { ...CORMORANT_INTER, scale: 1.3, displayTracking: "0" },
  shape: { radius: 22, radiusSm: 16, btnRadius: "pill", shadow: "soft" },
  palettes: [BOSQUE, OLIVO, ROSAL, LINO],
  deco: { ornament: deco.hojas, hero: deco.acuarela, splash: deco.acuarela },
};

const gala: Design = {
  slug: "gala",
  name: "Gala",
  occasion: "boda",
  mood: "Banda a lo ancho, títulos enormes y galería en mosaico",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "band", head: "stacked", cards: "elevated", countdown: "tiles", gallery: "mosaic", divider: "none" },
  type: { ...DMSERIF_DMSANS, scale: 1.35, displayTracking: "-0.02em", displayLeading: 1.02 },
  shape: { radius: 6, radiusSm: 6, btnRadius: 2, shadow: "lifted" },
  palettes: [BORGONA, NOCHE, VINO, CIRUELA],
  deco: { ornament: deco.rombo, hero: deco.rayos },
};

export const BODAS: Design[] = [
  vintage, white, marsala, aurum, ivory, editorial, nocturno, campestre,
  capilla, bruma, jardin, gala,
];
