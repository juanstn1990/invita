/**
 * Los diseños de primera comunión y bautizo.
 *
 * Tropical era el único con carácter y los otros tres eran el mismo blanco con
 * dorado. Ahora el color se elige al editar y cada diseño tiene su estructura:
 * enmarcado, con textura de pergamino, con la foto arriba, o sin cajas.
 */

import type { Design } from "../theme";
import { paleta } from "../paleta";
import * as deco from "../deco";
import {
  CORMORANT_INTER,
  DMSERIF_DMSANS,
  MARCELLUS_JOST,
  QUICKSAND,
} from "./fuentes";

/* ── Paletas ────────────────────────────────────────────────── */

const NIEVE = paleta({
  id: "nieve", nombre: "Blanco y oro",
  base: "#ffffff", tinta: "#26251f", marca: "#8c7038", segundo: "#c2ab73",
});
const PERGAMINO = paleta({
  id: "pergamino", nombre: "Pergamino",
  base: "#f6f1e6", tinta: "#3a3225", marca: "#8a6c3c", segundo: "#ab9264",
});
const MELOCOTON = paleta({
  id: "melocoton", nombre: "Melocotón",
  base: "#fffaf7", tinta: "#40291f", marca: "#b56a45", segundo: "#e3a884",
});
const SELVA = paleta({
  id: "selva", nombre: "Verde selva y fucsia",
  base: "#fdf7f0", tinta: "#16302a", marca: "#14685c", segundo: "#b02765",
});
const CIELO = paleta({
  id: "cielo", nombre: "Cielo y plata",
  base: "#f6fafd", tinta: "#1d2c3a", marca: "#3d6c92", segundo: "#a8c6dd",
});
const OLIVA = paleta({
  id: "oliva", nombre: "Oliva y marfil",
  base: "#faf9f2", tinta: "#2c3126", marca: "#5f6f42", segundo: "#9aa878",
});
const TRIGO = paleta({
  id: "trigo", nombre: "Trigo y miel",
  base: "#fdf9ee", tinta: "#3a3220", marca: "#94702c", segundo: "#dcc07f",
});
const AGUA = paleta({
  id: "agua", nombre: "Agua y coral",
  base: "#f4fbfb", tinta: "#123033", marca: "#1f7285", segundo: "#e8917a",
});
const LAVANDA = paleta({
  id: "lavanda", nombre: "Lavanda",
  base: "#faf8fd", tinta: "#2f2740", marca: "#6b5495", segundo: "#c0b0dc",
});

/* ── Los cuatro de siempre ──────────────────────────────────── */

const blanco: Design = {
  slug: "c-white",
  name: "Comunión Blanco",
  occasion: "comunion",
  mood: "Enmarcado con hilos, sin sombras y muy aireado",
  fontUrl: CORMORANT_INTER.url,
  layout: { hero: "frame", head: "rule", cards: "outline", countdown: "circles", gallery: "grid", divider: "none" },
  type: { ...CORMORANT_INTER, scale: 1.3, displayWeight: 300, displayTracking: "0.02em" },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
  density: "airy",
  palettes: [NIEVE, CIELO, OLIVA, TRIGO],
  deco: { ornament: deco.rombo, hero: deco.marco, splash: deco.marco },
};

const vintage: Design = {
  slug: "c-vintage",
  name: "Comunión Vintage",
  occasion: "comunion",
  mood: "Textura de pergamino, filo rasgado y galería en columna",
  fontUrl: MARCELLUS_JOST.url,
  layout: { hero: "panel", head: "center", cards: "flat", countdown: "tiles", gallery: "stack", divider: "torn" },
  type: { ...MARCELLUS_JOST, scale: 1.26, displayTracking: "0.02em" },
  shape: { radius: 6, radiusSm: 4, btnRadius: 2, shadow: "none" },
  palettes: [PERGAMINO, TRIGO, OLIVA, NIEVE],
  css: (t) => `
/* Grano de pergamino, con degradados: sin imágenes externas. */
body{background-image:
  repeating-linear-gradient(88deg,transparent 0 4px,${t.palette.line} 4px 5px),
  radial-gradient(60% 40% at 20% 10%,${t.palette.bgAlt} 0%,transparent 100%)}`,
  deco: { ornament: deco.anillo },
};

const amanecer: Design = {
  slug: "c-amanecer",
  name: "Comunión Amanecer",
  occasion: "comunion",
  mood: "Foto arriba, títulos de dos pisos y galería en mosaico",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "split", head: "stacked", cards: "elevated", countdown: "line", gallery: "mosaic", divider: "arc" },
  type: { ...DMSERIF_DMSANS, scale: 1.3, displayTracking: "-0.012em" },
  shape: { radius: 20, radiusSm: 14 },
  palettes: [MELOCOTON, LAVANDA, CIELO, TRIGO],
  deco: { ornament: deco.filete },
};

const tropical: Design = {
  slug: "c-tropical",
  name: "Comunión Tropical",
  occasion: "comunion",
  mood: "Sin cajas y a la izquierda, con filo de ola y texto sobre la foto",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "minimal", head: "left", cards: "rule", countdown: "type", gallery: "grid", divider: "wave" },
  type: { ...DMSERIF_DMSANS, scale: 1.32, displayTracking: "-0.015em" },
  shape: { radius: 4, radiusSm: 4, shadow: "none" },
  palettes: [SELVA, AGUA, OLIVA, CIELO],
  css: (t) => `
/* El segundo color aparece en los huecos de la galería, nunca tras texto. */
.gallery-item:nth-child(3n+2) .gallery-ph{background:${t.palette.bgAlt}}
.event-icon{color:${t.palette.brand2}}`,
  deco: { ornament: deco.loto, hero: deco.aguada, splash: deco.aguada },
};

/* ── Los cuatro nuevos ──────────────────────────────────────── */

const paloma: Design = {
  slug: "c-paloma",
  name: "Comunión Paloma",
  occasion: "comunion",
  mood: "El arco como motivo: portada, fotos y avatares lo repiten",
  fontUrl: CORMORANT_INTER.url,
  layout: { hero: "panel", head: "rule", cards: "outline", countdown: "circles", gallery: "stack", divider: "arc" },
  type: { ...CORMORANT_INTER, scale: 1.29, displayWeight: 300, displayTracking: "0.03em" },
  shape: { radius: 999, radiusSm: 18, btnRadius: "pill", shadow: "none" },
  density: "airy",
  palettes: [CIELO, NIEVE, LAVANDA, AGUA],
  css: () => `
.hero-content{border-radius:999px 999px var(--radius-sm) var(--radius-sm)}
.gallery-item{border-radius:999px 999px var(--radius-sm) var(--radius-sm)}
.guest-avatar{border-radius:999px 999px 6px 6px}`,
  deco: { ornament: deco.anillo, hero: deco.arcos, splash: deco.arcos },
};

const espiga: Design = {
  slug: "c-espiga",
  name: "Comunión Espiga",
  occasion: "comunion",
  mood: "Campestre: aguada abajo, tarjetas planas y cuenta atrás en placas",
  fontUrl: MARCELLUS_JOST.url,
  layout: { hero: "split", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "torn" },
  type: { ...MARCELLUS_JOST, scale: 1.28, displayTracking: "0.015em" },
  shape: { radius: 10, radiusSm: 8, btnRadius: 2, shadow: "none" },
  palettes: [TRIGO, OLIVA, PERGAMINO, MELOCOTON],
  deco: { ornament: deco.hojas, hero: deco.aguada, footer: deco.aguada },
};

const vitral: Design = {
  slug: "c-vitral",
  name: "Comunión Vitral",
  occasion: "comunion",
  mood: "Portada en banda, títulos grandes y rayos desde la esquina",
  fontUrl: DMSERIF_DMSANS.url,
  layout: { hero: "band", head: "stacked", cards: "elevated", countdown: "tiles", gallery: "mosaic", divider: "none" },
  type: { ...DMSERIF_DMSANS, scale: 1.34, displayTracking: "-0.02em", displayLeading: 1.03 },
  shape: { radius: 8, radiusSm: 6, btnRadius: 2, shadow: "lifted" },
  palettes: [LAVANDA, CIELO, SELVA, AGUA],
  deco: { ornament: deco.rombo, hero: deco.rayos },
};

const primera: Design = {
  slug: "c-primera",
  name: "Comunión Primera",
  occasion: "comunion",
  mood: "Redondeado y amable, con la cuenta atrás en un renglón",
  fontUrl: QUICKSAND.url,
  layout: { hero: "panel", head: "center", cards: "elevated", countdown: "line", gallery: "grid", divider: "wave" },
  type: { ...QUICKSAND, scale: 1.27, displayWeight: 600, displayTracking: "-0.008em" },
  shape: { radius: 26, radiusSm: 18, btnRadius: "pill", shadow: "soft" },
  palettes: [AGUA, MELOCOTON, LAVANDA, TRIGO],
  deco: { ornament: deco.estrellas, hero: deco.flotantes, splash: deco.flotantes },
};

export const COMUNION: Design[] = [
  blanco, vintage, amanecer, tropical,
  paloma, espiga, vitral, primera,
];
