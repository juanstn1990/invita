/**
 * Los diseños de quince años.
 *
 * Eran los más parecidos entre sí de todo el catálogo: cinco variaciones de
 * blanco con dorado. El color pasó a ser una elección del editor, así que lo
 * que los separa es la estructura — uno con la foto arriba, uno enmarcado a
 * la izquierda, uno con la portada en banda, uno con el texto sobre la foto.
 */

import type { Design } from "../theme";
import { paleta } from "../paleta";
import * as deco from "../deco";
import {
  CORMORANT_JOST,
  DMSERIF_DMSANS,
  FRAUNCES_INTER,
  PLAYFAIR_KARLA,
  QUICKSAND,
} from "./fuentes";

/* ── Paletas ────────────────────────────────────────────────── */

const PERLA = paleta({
  id: "perla", nombre: "Perla y oro viejo",
  base: "#fdfcfa", tinta: "#2b2521", marca: "#9a7b52", segundo: "#d8b9b9",
});
const BURDEOS = paleta({
  id: "burdeos", nombre: "Burdeos y oro",
  base: "#2d0713", tinta: "#f6e7ea", marca: "#e0b371", segundo: "#b1607c",
});
const DURAZNO = paleta({
  id: "durazno", nombre: "Durazno y arena",
  base: "#fffaf4", tinta: "#43301f", marca: "#b06a3a", segundo: "#e0a878",
});
const HOJAS = paleta({
  id: "hojas", nombre: "Verde y crema",
  base: "#f8faf6", tinta: "#222c22", marca: "#3f6b47", segundo: "#7d9b78",
});
const LATON = paleta({
  id: "laton", nombre: "Azul noche y latón",
  base: "#f5f7fa", tinta: "#1c2634", marca: "#2c5075", segundo: "#9a7b3c",
});
const FUCSIA = paleta({
  id: "fucsia", nombre: "Fucsia y crema",
  base: "#fff8fa", tinta: "#3d1526", marca: "#b02765", segundo: "#f0a8c0",
});
const LILA = paleta({
  id: "lila", nombre: "Lila y plata",
  base: "#faf8fd", tinta: "#2f2740", marca: "#6b5495", segundo: "#b8a8d8",
});
const CORAL = paleta({
  id: "coral", nombre: "Coral y dorado",
  base: "#fffaf7", tinta: "#40241f", marca: "#c2543a", segundo: "#e8b088",
});
const TURQUESA = paleta({
  id: "turquesa", nombre: "Turquesa y arena",
  base: "#f5fbfb", tinta: "#123033", marca: "#1f7285", segundo: "#c9a15a",
});
const MEDIANOCHE = paleta({
  id: "medianoche", nombre: "Medianoche y plata",
  base: "#111726", tinta: "#e8ecf5", marca: "#a8b8d8", segundo: "#6d7a99",
});
const CHAMPAN = paleta({
  id: "champan", nombre: "Champán",
  base: "#fdfaf3", tinta: "#332c1f", marca: "#a08240", segundo: "#ddc9a0",
});
const ESMERALDA = paleta({
  id: "esmeralda", nombre: "Esmeralda profundo",
  base: "#0f2620", tinta: "#e6f2ec", marca: "#7fc4a3", segundo: "#c9a15a",
});
const ROSA = paleta({
  id: "rosa", nombre: "Rosa palo",
  base: "#fff8f9", tinta: "#40272f", marca: "#a4566a", segundo: "#e6b0bd",
});

/* ────────────────────────────────────────────────────────────────
   Un color por color

   Las de arriba se pensaron como combinaciones —"burdeos y oro", "turquesa y
   arena"— y son las que dan carácter. Éstas responden a otra pregunta, que es
   la que de verdad hace quien organiza unos quince: "lo quiero **morado**".

   Sólo hay que elegir cuatro colores; el resto lo deriva `paleta()` y el
   build verifica los pares. Cada una está pensada en el tono que le pega a la
   ocasión: los oscuros son profundos, no apagados, y los claros tienen la
   tinta bastante más oscura que el fondo — con un pastel sobre otro pastel no
   se lee nada.
   ──────────────────────────────────────────────────────────────── */

const AMARILLO = paleta({
  id: "amarillo", nombre: "Amarillo y oro",
  base: "#fffdf2", tinta: "#332b0d", marca: "#a8820f", segundo: "#e8c34a",
});
const ROJO = paleta({
  id: "rojo", nombre: "Rojo profundo",
  base: "#2a0a0c", tinta: "#fbe9e9", marca: "#e5757a", segundo: "#c9a15a",
});
const MORADO = paleta({
  id: "morado", nombre: "Morado profundo",
  base: "#220f2e", tinta: "#f2e8f8", marca: "#c39ae0", segundo: "#d8b06a",
});
const VIOLETA = paleta({
  id: "violeta", nombre: "Violeta",
  base: "#faf7ff", tinta: "#291a3f", marca: "#6a3fa8", segundo: "#b79ae0",
});
const AZUL_BEBE = paleta({
  id: "azul-bebe", nombre: "Azul bebé",
  base: "#f7fbff", tinta: "#1b2c3f", marca: "#4d7ea8", segundo: "#bcd8ec",
});
const AZUL_CLARO = paleta({
  id: "azul-claro", nombre: "Azul claro",
  base: "#f3f9fd", tinta: "#10333f", marca: "#1d6fa5", segundo: "#8fc4e4",
});
const NEGRO = paleta({
  id: "negro", nombre: "Negro y plata",
  base: "#0d0d0f", tinta: "#f0f0f2", marca: "#c9c9cf", segundo: "#8a8a94",
});
const CAFE = paleta({
  id: "cafe", nombre: "Café y caramelo",
  base: "#241a14", tinta: "#f5ece4", marca: "#d0a06a", segundo: "#a8785a",
});
const NARANJA = paleta({
  id: "naranja", nombre: "Naranja y arena",
  base: "#fffaf5", tinta: "#3d2415", marca: "#c2612a", segundo: "#f0b98a",
});
const GRIS = paleta({
  id: "gris", nombre: "Gris y plata",
  base: "#f7f7f8", tinta: "#26262b", marca: "#5f6068", segundo: "#b9bac2",
});
const MENTA = paleta({
  id: "menta", nombre: "Menta",
  base: "#f5fdf9", tinta: "#173029", marca: "#2f7d63", segundo: "#a3d9c0",
});
const TERRACOTA = paleta({
  id: "terracota", nombre: "Terracota",
  base: "#fdf6f2", tinta: "#3c231a", marca: "#a9532f", segundo: "#dda283",
});

/* ── Los cinco de siempre ───────────────────────────────────── */

const blanco: Design = {
  slug: "15-white",
  name: "Quince Blanco",
  occasion: "quince",
  mood: "Panel translúcido, filetes al lado del título y filo en arco",
  fontUrl: PLAYFAIR_KARLA.url,
  layout: { hero: "panel", head: "rule", cards: "elevated", countdown: "circles", gallery: "grid", divider: "arc" },
  type: { ...PLAYFAIR_KARLA, scale: 1.29, displayTracking: "-0.01em" },
  shape: { radius: 18, radiusSm: 14 },
  /* Burdeos como cuarta: es la que más piden y la única oscura de las cuatro. */
  palettes: [PERLA, CHAMPAN, LILA, BURDEOS],
  deco: { ornament: deco.anillo },
};

const burdeos: Design = {
  slug: "15-burdeos",
  name: "Quince Burdeos",
  occasion: "quince",
  mood: "Texto sobre la foto, títulos de dos pisos y galería en mosaico",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "minimal", head: "stacked", cards: "flat", countdown: "tiles", gallery: "mosaic", divider: "none" },
  type: { ...DMSERIF_DMSANS, scale: 1.33, displayTracking: "-0.01em" },
  shape: { radius: 6, radiusSm: 6, shadow: "none" },
  /*
   * Burdeos lleva el catálogo de color entero.
   *
   * Los demás diseños ofrecen cuatro paletas escogidas para su carácter, y
   * eso está bien cuando quien elige viene por el diseño. Aquí viene por otro
   * sitio: unos quince se piensan **en un color** —"los quiero morados"— y
   * obligar a recorrer nueve diseños buscando quién trae morado es preguntar
   * al revés.
   *
   * Las cuatro de siempre van primero: son las que el diseño usaba y la
   * primera es la que se hornea en el template.
   */
  palettes: [
    BURDEOS, MEDIANOCHE, ESMERALDA, FUCSIA,
    ROJO, ROSA, MORADO, VIOLETA, LILA,
    AZUL_BEBE, AZUL_CLARO, TURQUESA,
    HOJAS, MENTA, AMARILLO, NARANJA, CORAL, TERRACOTA,
    CAFE, NEGRO, GRIS, CHAMPAN, PERLA,
  ],
  css: () => `
.gifts-account{background:transparent}

/* Los segundos, en el color secundario de la paleta.
   Son el único número que se mueve, y con los cuatro del mismo color el ojo
   no sabe dónde mirar: teñirlos separa "lo que cambia" de "lo que falta". Sale
   de la paleta y no de un color escrito, así que las veintitrés lo traen
   resuelto y ninguna queda desafinada. */
[data-cd="secs"]{color:var(--brand-2-ink)}`,
  deco: { ornament: deco.rombo, hero: deco.rayos },
};

const amanecer: Design = {
  slug: "15-amanecer",
  name: "Quince Amanecer",
  occasion: "quince",
  mood: "Foto arriba y nombres abajo, con la cuenta atrás en un renglón",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "split", head: "center", cards: "elevated", countdown: "line", gallery: "stack", divider: "arc" },
  type: { ...DMSERIF_DMSANS, scale: 1.3, displayTracking: "-0.012em" },
  shape: { radius: 20, radiusSm: 14 },
  palettes: [DURAZNO, CORAL, PERLA, CHAMPAN],
  deco: { ornament: deco.anillo },
};

const hojas: Design = {
  slug: "15-hojas",
  name: "Quince Hojas",
  occasion: "quince",
  mood: "Enmarcado y a la izquierda, con cuenta atrás tipográfica",
  fontUrl: CORMORANT_JOST.url,
  layout: { hero: "frame", head: "left", cards: "outline", countdown: "type", gallery: "grid", divider: "rule" },
  type: { ...CORMORANT_JOST, scale: 1.28, displayTracking: "0.01em" },
  shape: { radius: 3, radiusSm: 3, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [HOJAS, TURQUESA, ESMERALDA, PERLA],
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

const viaje: Design = {
  slug: "15-viaje",
  name: "Quince Viaje",
  occasion: "quince",
  mood: "Portada en banda, filo de ola y galería en mosaico",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "band", head: "rule", cards: "elevated", countdown: "circles", gallery: "mosaic", divider: "wave" },
  type: { ...FRAUNCES_INTER, scale: 1.31, displayWeight: 500, displayTracking: "-0.02em" },
  shape: { radius: 12, radiusSm: 10, btnRadius: 4, shadow: "lifted" },
  palettes: [LATON, MEDIANOCHE, TURQUESA, CHAMPAN],
  deco: { ornament: deco.estrellas },
};

/* ── Los cuatro nuevos ──────────────────────────────────────── */

const corona: Design = {
  slug: "15-corona",
  name: "Quince Corona",
  occasion: "quince",
  mood: "Doble marco de hilos, sin cajas y con la galería en columna",
  fontUrl: CORMORANT_JOST.url,
  layout: { hero: "frame", head: "rule", cards: "rule", countdown: "circles", gallery: "stack", divider: "none" },
  type: { ...CORMORANT_JOST, scale: 1.34, displayWeight: 300, displayTracking: "0.05em" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [CHAMPAN, BURDEOS, MEDIANOCHE, PERLA],
  deco: { ornament: deco.rombo, hero: deco.marco, splash: deco.marco },
};

const confeti: Design = {
  slug: "15-confeti",
  name: "Quince Confeti",
  occasion: "quince",
  mood: "Festivo: confeti cayendo, esquinas muy redondas y tarjetas elevadas",
  fontUrl: QUICKSAND.url,
  layout: { hero: "panel", head: "center", cards: "elevated", countdown: "tiles", gallery: "grid", divider: "arc" },
  type: { ...QUICKSAND, scale: 1.28, displayWeight: 600, displayTracking: "-0.01em" },
  shape: { radius: 28, radiusSm: 20, btnRadius: "pill", shadow: "soft" },
  palettes: [FUCSIA, LILA, CORAL, TURQUESA],
  deco: { ornament: deco.estrellas, hero: (t) => deco.confeti(t), splash: deco.confeti },
};

const vals: Design = {
  slug: "15-vals",
  name: "Quince Vals",
  occasion: "quince",
  mood: "Editorial: bloque sólido en la esquina, sin ornamento y a la izquierda",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "editorial", head: "left", cards: "rule", countdown: "type", gallery: "mosaic", divider: "none" },
  type: { ...FRAUNCES_INTER, scale: 1.36, displayWeight: 500, displayTracking: "-0.03em", displayLeading: 1.02, quoteStyle: "normal" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [MEDIANOCHE, BURDEOS, LATON, PERLA],
  css: () => `.ornament{display:none}`,
};

const jardinXV: Design = {
  slug: "15-jardin",
  name: "Quince Jardín",
  occasion: "quince",
  mood: "Manchas de aguada, arcos y galería en columna",
  fontUrl: PLAYFAIR_KARLA.url,
  layout: { hero: "split", head: "stacked", cards: "flat", countdown: "line", gallery: "stack", divider: "wave" },
  type: { ...PLAYFAIR_KARLA, scale: 1.32, displayTracking: "-0.015em" },
  shape: { radius: 999, radiusSm: 18, btnRadius: "pill", shadow: "none" },
  palettes: [ROSA, HOJAS, LILA, DURAZNO],
  css: () => `
.gallery-item{border-radius:999px 999px var(--radius-sm) var(--radius-sm)}`,
  deco: { ornament: deco.hojas, hero: deco.acuarela, splash: deco.acuarela },
};

export const QUINCE: Design[] = [
  blanco, burdeos, amanecer, hojas, viaje,
  corona, confeti, vals, jardinXV,
];
