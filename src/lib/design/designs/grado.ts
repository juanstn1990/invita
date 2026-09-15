/**
 * Los diseños de grado.
 *
 * Un grado no es una boda con birrete. Lo que se celebra es un logro propio y
 * el final de una etapa larga, no una unión ni una bendición, y eso pide otra
 * cosa: menos filigrana y más peso, más tipografía y menos flor.
 *
 * Los seis se separan por estructura, no por color —el color se elige al
 * editar—: enmarcado a la manera de un diploma, editorial con el nombre a
 * bandera, sobrio con banda, de anuario con la foto mandando, de pergamino
 * rasgado, y uno moderno sin cajas.
 */

import type { Design } from "../theme";
import { paleta } from "../paleta";
import * as deco from "../deco";
import {
  CORMORANT_INTER,
  DMSERIF_DMSANS,
  FRAUNCES_INTER,
  INTER_SOLO,
  MARCELLUS_JOST,
  PLAYFAIR_KARLA,
} from "./fuentes";

/* ── Paletas ────────────────────────────────────────────────────
   Las de un grado son las de una institución: azules y verdes profundos,
   vinos, y el dorado del cordón. Nada pastel — eso es de otra ocasión. */

const TOGA = paleta({
  id: "toga", nombre: "Azul noche y oro",
  base: "#f7f6f2", tinta: "#1b2436", marca: "#1f3a63", segundo: "#b08a3e",
});
const LAUREL = paleta({
  id: "laurel", nombre: "Verde laurel",
  base: "#f7faf6", tinta: "#1d2a1f", marca: "#2f5d3a", segundo: "#9bb08a",
});
const BORGONA = paleta({
  id: "borgona", nombre: "Borgoña y oro",
  base: "#fbf7f5", tinta: "#2c1a1c", marca: "#7a2434", segundo: "#c09a55",
});
const TINTA = paleta({
  id: "tinta", nombre: "Tinta y hueso",
  base: "#f6f5f1", tinta: "#1a1a18", marca: "#2b2b28", segundo: "#8a8578",
});
const PERGAMINO = paleta({
  id: "pergamino", nombre: "Pergamino",
  base: "#f7f1e4", tinta: "#33291c", marca: "#7d5c2c", segundo: "#b49a66",
});
const COBRE = paleta({
  id: "cobre", nombre: "Cobre y grafito",
  base: "#faf8f6", tinta: "#26221f", marca: "#a25a2c", segundo: "#6d6660",
});
const PIZARRA = paleta({
  id: "pizarra", nombre: "Pizarra y menta",
  base: "#f5f8f9", tinta: "#1d272b", marca: "#2d4a55", segundo: "#6fa89b",
});
const CIRUELA = paleta({
  id: "ciruela", nombre: "Ciruela",
  base: "#faf7fa", tinta: "#2a1f2e", marca: "#5b3566", segundo: "#a98bb5",
});

/* ── Los seis ───────────────────────────────────────────────── */

/**
 * El diploma: doble marco de hilos, todo centrado y sin sombras.
 * Es la forma que ya reconoce cualquiera que haya visto un título colgado.
 */
const diploma: Design = {
  slug: "g-diploma",
  name: "Grado Diploma",
  occasion: "grado",
  mood: "Enmarcado como un título, centrado y sin una sola sombra",
  fontUrl: CORMORANT_INTER.url,
  layout: { hero: "frame", head: "rule", cards: "outline", countdown: "type", gallery: "grid", divider: "none" },
  type: { ...CORMORANT_INTER, scale: 1.32, displayWeight: 300, displayTracking: "0.06em" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [TOGA, BORGONA, TINTA, LAUREL],
  deco: { ornament: deco.rombo, hero: deco.marco, splash: deco.marco },
};

/**
 * Editorial: el nombre grande a bandera y los títulos a la izquierda.
 * Para quien no quiere que su grado parezca una boda.
 */
const tesis: Design = {
  slug: "g-tesis",
  name: "Grado Tesis",
  occasion: "grado",
  mood: "El nombre enorme a bandera, títulos a la izquierda, sin adornos",
  fontUrl: FRAUNCES_INTER.url,
  layout: { hero: "editorial", head: "left", cards: "rule", countdown: "line", gallery: "mosaic", divider: "rule" },
  type: { ...FRAUNCES_INTER, scale: 1.4, displayWeight: 600, displayTracking: "-0.02em" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "compact",
  palettes: [TINTA, COBRE, TOGA, CIRUELA],
  deco: { ornament: deco.filete },
};

/**
 * La banda: una franja de lado a lado a media altura, como la del birrete.
 */
const cordon: Design = {
  slug: "g-cordon",
  name: "Grado Cordón",
  occasion: "grado",
  mood: "Una banda cruzada sobre la foto, como el cordón del birrete",
  fontUrl: PLAYFAIR_KARLA.url,
  layout: { hero: "band", head: "center", cards: "elevated", countdown: "tiles", gallery: "grid", divider: "arc" },
  type: { ...PLAYFAIR_KARLA, scale: 1.28, displayTracking: "0.01em" },
  shape: { radius: 10, radiusSm: 8, btnRadius: 999, shadow: "soft" },
  palettes: [BORGONA, TOGA, CIRUELA, LAUREL],
  deco: { ornament: deco.estrellas, hero: deco.rayos },
};

/**
 * Anuario: la foto manda y el texto se aparta. Para quien tiene una buena
 * foto con la toga y quiere que sea lo primero.
 */
const anuario: Design = {
  slug: "g-anuario",
  name: "Grado Anuario",
  occasion: "grado",
  mood: "La foto a pantalla completa y el texto encima, sin caja",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "minimal", head: "stacked", cards: "flat", countdown: "circles", gallery: "mosaic", divider: "wave" },
  type: { ...DMSERIF_DMSANS, scale: 1.3 },
  shape: { radius: 14, radiusSm: 10, btnRadius: 999, shadow: "soft" },
  palettes: [PIZARRA, TINTA, TOGA, COBRE],
  deco: { ornament: deco.hojas, hero: deco.aguada },
};

/**
 * Pergamino: textura de papel viejo y filo rasgado, para el grado que se
 * quiere ver antiguo a propósito.
 */
const pergamino: Design = {
  slug: "g-pergamino",
  name: "Grado Pergamino",
  occasion: "grado",
  mood: "Papel envejecido, filo rasgado y galería en columna",
  fontUrl: MARCELLUS_JOST.url,
  layout: { hero: "panel", head: "center", cards: "flat", countdown: "tiles", gallery: "stack", divider: "torn" },
  type: { ...MARCELLUS_JOST, scale: 1.26, displayTracking: "0.03em" },
  shape: { radius: 4, radiusSm: 2, btnRadius: 2, shadow: "none" },
  palettes: [PERGAMINO, BORGONA, TOGA, LAUREL],
  css: (t) => `
/* Grano de papel, con degradados: sin imágenes externas. */
body{background-image:
  repeating-linear-gradient(91deg,transparent 0 5px,${t.palette.line} 5px 6px),
  radial-gradient(70% 45% at 80% 8%,${t.palette.bgAlt} 0%,transparent 100%)}`,
  deco: { ornament: deco.anillo },
};

/**
 * Laurel: la corona del mérito, verde y aireada, con la foto partida arriba.
 */
const laurel: Design = {
  slug: "g-laurel",
  name: "Grado Laurel",
  occasion: "grado",
  mood: "Foto arriba y texto abajo, muy aireado, con hoja de laurel",
  fontUrl: CORMORANT_INTER.url,
  layout: { hero: "split", head: "rule", cards: "outline", countdown: "circles", gallery: "grid", divider: "rule" },
  type: { ...CORMORANT_INTER, scale: 1.34, displayWeight: 300, displayTracking: "0.04em" },
  shape: { radius: 2, radiusSm: 2, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [LAUREL, PIZARRA, PERGAMINO, TINTA],
  deco: { ornament: deco.hojas, splash: deco.arcos },
};

export const GRADO: Design[] = [diploma, tesis, cordon, anuario, pergamino, laurel];
