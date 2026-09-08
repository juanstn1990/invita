/**
 * Los ocho diseños de boda.
 *
 * Los cinco originales eran todos el mismo clásico romántico —crema, serifa,
 * ornamento centrado— y se distinguían sólo por la paleta. Ahora cada uno
 * elige su propia combinación de slots: Editorial va a la izquierda y sin
 * ornamento, Nocturno es oscuro y enmarcado, Aurum es oscuro y formal,
 * Campestre parte la portada en dos. Coincidir en dos slots es normal;
 * coincidir en los seis era el problema.
 */

import { alpha, theme, type Design } from "../theme";
import * as deco from "../deco";
import {
  CORMORANT_INTER,
  CORMORANT_JOST,
  INTER_SOLO,
  MARCELLUS_JOST,
  PLAYFAIR_KARLA,
} from "./fuentes";

/* ── Vintage ────────────────────────────────────────────────── */

const vintage: Design = {
  slug: "vintage",
  name: "Vintage",
  occasion: "boda",
  mood: "Crema, salvia y dorado con hojas dibujadas",
  fontUrl: CORMORANT_JOST.url,
  layout: {
    hero: "frame",
    head: "rule",
    cards: "outline",
    countdown: "circles",
    gallery: "grid",
    divider: "rule",
  },
  swatch: { unico: ["#faf7f1", "#9aab9c", "#8a7248"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#faf7f1", bgAlt: "#f1ece1", card: "#ffffff",
        ink: "#3a3330", muted: "#6d635c", line: "#ddd4c6",
        brand: "#6e6249", brand2: "#9aab9c",
        accent: "#8a7248", onAccent: "#ffffff",
        footerBg: "#3a3330", footerInk: "#f1ece1",
      },
      type: { ...CORMORANT_JOST, scale: 1.28, displayWeight: 400, displayTracking: "0.01em" },
      shape: { radius: 4, radiusSm: 3, btnRadius: "pill", shadow: "none" },
      density: "airy",
      heroBg: "linear-gradient(165deg,#f1ece1 0%,#faf7f1 55%,#e4e9e2 130%)",
      // El tramo más oscuro: es el adverso para un texto en tinta.
      heroBase: "#e4e9e2",
      splashBg: "radial-gradient(120% 90% at 50% 0%,#f1ece1 0%,#faf7f1 62%)",
    }),
  },
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

/* ── Blanco Oro ─────────────────────────────────────────────── */

const white: Design = {
  slug: "white",
  name: "Blanco Oro",
  occasion: "boda",
  mood: "Blanco puro, oro y nada más",
  fontUrl: CORMORANT_INTER.url,
  layout: {
    hero: "minimal",
    head: "center",
    cards: "flat",
    countdown: "type",
    gallery: "mosaic",
    divider: "none",
  },
  swatch: { unico: ["#ffffff", "#c9a84c", "#7d6429"] },
  themes: {
    unico: theme({
      palette: {
        // El acento es el oro, no el blanco. Antes se muestreaba del CSS y
        // salía casi blanco: los números de la cuenta atrás desaparecían y el
        // hashtag no se leía.
        bg: "#ffffff", bgAlt: "#f7f4ee", card: "#ffffff",
        ink: "#211d18", muted: "#6a6156", line: "#e2dbcd",
        brand: "#7d6429", brand2: "#c9a84c",
        accent: "#7d6429", onAccent: "#ffffff",
        footerBg: "#211d18", footerInk: "#f7f4ee",
      },
      type: { ...CORMORANT_INTER, scale: 1.32, displayWeight: 300, displayTracking: "0.02em" },
      shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none", border: 1 },
      density: "airy",
      heroBg: "linear-gradient(180deg,#f7f4ee 0%,#ffffff 100%)",
      heroBase: "#f7f4ee",
    }),
  },
  deco: { ornament: deco.filete },
};

/* ── Marsala ────────────────────────────────────────────────── */

const marsala: Design = {
  slug: "marsala",
  name: "Marsala",
  occasion: "boda",
  mood: "Vino, terracota y olivo, con la portada en banda",
  fontUrl: PLAYFAIR_KARLA.url,
  layout: {
    hero: "band",
    head: "stacked",
    cards: "elevated",
    countdown: "tiles",
    gallery: "grid",
    divider: "arc",
  },
  swatch: { unico: ["#8e2b36", "#9d6b4a", "#f6e7e0"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#fdf7f4", bgAlt: "#f6e7e0", card: "#ffffff",
        ink: "#40161c", muted: "#6f4a48", line: "#e6cfc6",
        brand: "#8e2b36", brand2: "#9d6b4a",
        accent: "#8e2b36", onAccent: "#ffffff",
        footerBg: "#40161c", footerInk: "#f6e7e0",
      },
      type: { ...PLAYFAIR_KARLA, scale: 1.3, displayWeight: 400, displayTracking: "-0.015em" },
      shape: { radius: 14, radiusSm: 10, btnRadius: 4, shadow: "lifted" },
      density: "normal",
      panelRgb: "64,22,28",
      panelAlpha: 0.78,
      heroBg: "linear-gradient(150deg,#8e2b36 0%,#40161c 78%)",
      heroInk: "light",
      // El tramo claro del vino: el más adverso para un texto claro.
      heroBase: "#8e2b36",
      heroBrand: "#e8b79a",
      heroAccent: "#f6e7e0",
      heroOnAccent: "#40161c",
    }),
  },
  css: (t) => `
/* La banda va sobre un fondo vino: el antetítulo y el "&" van en el segundo
   color de marca, que sobre vino sí se lee. La tinta clara la resuelve
   \`heroInk\`, no una regla por diseño. */
.hero-label{color:${t.palette.brand2}}
.hero-amp{color:${t.palette.brand2}}
.hero-scroll{color:${t.palette.footerInk}}`,
  deco: { ornament: deco.rombo },
};

/* ── Aurum Wine ─────────────────────────────────────────────── */

const aurum: Design = {
  slug: "aurum-wine",
  name: "Aurum Wine",
  occasion: "boda",
  mood: "Borgoña oscuro y oro. El más formal del catálogo",
  fontUrl: CORMORANT_JOST.url,
  layout: {
    hero: "frame",
    head: "rule",
    cards: "outline",
    countdown: "circles",
    gallery: "mosaic",
    divider: "none",
  },
  swatch: { unico: ["#2a0d16", "#43182a", "#d4b06a"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#2a0d16", bgAlt: "#3a1220", card: "#43182a",
        ink: "#f4e6d8", muted: "#cdb49f", line: "#6b3a4a",
        brand: "#d4b06a", brand2: "#a8607a",
        accent: "#d4b06a", onAccent: "#2a0d16",
        footerBg: "#1c0810", footerInk: "#d4b06a",
      },
      type: { ...CORMORANT_JOST, scale: 1.3, displayWeight: 300, displayTracking: "0.03em" },
      shape: { radius: 2, radiusSm: 2, btnRadius: 0, shadow: "none" },
      density: "airy",
      panelRgb: "42,13,22",
      panelAlpha: 0.7,
      heroBg: "radial-gradient(120% 100% at 50% 0%,#43182a 0%,#2a0d16 70%)",
      heroBase: "#43182a",
    }),
  },
  css: () => `
/* En un diseño oscuro la línea discontinua de los datos bancarios se pierde;
   se apoya en el acento en vez de en el filete. */
.gifts-account{background:transparent}`,
  deco: { ornament: deco.rombo, hero: deco.rayos, splash: deco.rayos },
};

/* ── Ivory Leaf ─────────────────────────────────────────────── */

const ivory: Design = {
  slug: "ivory-leaf",
  name: "Ivory Leaf",
  occasion: "boda",
  mood: "Marfil y olivo, a la izquierda y sin cajas",
  fontUrl: CORMORANT_JOST.url,
  layout: {
    hero: "panel",
    head: "left",
    cards: "rule",
    countdown: "line",
    gallery: "stack",
    divider: "rule",
  },
  swatch: { unico: ["#faf9f3", "#5a6b43", "#8a9a6d"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#faf9f3", bgAlt: "#eff0e6", card: "#ffffff",
        ink: "#2e332a", muted: "#616b58", line: "#d8dcca",
        brand: "#5a6b43", brand2: "#8a9a6d",
        accent: "#5a6b43", onAccent: "#ffffff",
        footerBg: "#2e332a", footerInk: "#eff0e6",
      },
      type: { ...CORMORANT_JOST, scale: 1.26, displayWeight: 400, displayTracking: "0" },
      shape: { radius: 3, radiusSm: 3, btnRadius: 0, shadow: "none" },
      density: "airy",
      panelRgb: "255,255,255",
      panelAlpha: 0.88,
      heroBg: "linear-gradient(160deg,#eff0e6 0%,#faf9f3 60%,#e9ecdf 130%)",
      heroBase: "#e9ecdf",
    }),
  },
  deco: { ornament: deco.hojas, hero: deco.aros },
};

/* ── Editorial ──────────────────────────────────────────────── */

const editorial: Design = {
  slug: "editorial",
  name: "Editorial",
  occasion: "boda",
  mood: "Sans apretada, esquinas rectas, cero ornamento",
  fontUrl: INTER_SOLO.url,
  layout: {
    hero: "editorial",
    head: "left",
    cards: "rule",
    countdown: "type",
    gallery: "mosaic",
    divider: "none",
  },
  swatch: { unico: ["#ffffff", "#a89880", "#17150f"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#ffffff", bgAlt: "#f4f2ee", card: "#ffffff",
        ink: "#17150f", muted: "#5e5a4f", line: "#d9d5c9",
        brand: "#55503f", brand2: "#a89880",
        accent: "#17150f", onAccent: "#ffffff",
        footerBg: "#17150f", footerInk: "#f4f2ee",
      },
      type: {
        ...INTER_SOLO,
        scale: 1.36,
        displayWeight: 500,
        displayTracking: "-0.035em",
        displayLeading: 1.02,
        tracking: "0.14em",
        quoteStyle: "normal",
      },
      shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
      density: "airy",
      heroBg: "#f4f2ee",
      heroBase: "#f4f2ee",
    }),
  },
  css: () => `
/* El único sin ornamento: los filetes de 1px hacen todo el trabajo de
   separar, así que no hay nada que dibujar bajo los títulos. */
.ornament{display:none}
.hero-content .hero-name{text-transform:none}`,
};

/* ── Nocturno ───────────────────────────────────────────────── */

const nocturno: Design = {
  slug: "nocturno",
  name: "Nocturno",
  occasion: "boda",
  mood: "Negro y oro, para recepción de noche",
  fontUrl: CORMORANT_JOST.url,
  layout: {
    hero: "frame",
    head: "rule",
    cards: "outline",
    countdown: "circles",
    gallery: "grid",
    divider: "none",
  },
  swatch: { unico: ["#0e0e11", "#cfa963", "#f0ece2"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#0e0e11", bgAlt: "#16161b", card: "#1c1c22",
        ink: "#f0ece2", muted: "#b3ac9c", line: "#3a3730",
        brand: "#cfa963", brand2: "#8a7346",
        accent: "#cfa963", onAccent: "#0e0e11",
        footerBg: "#08080a", footerInk: "#cfa963",
      },
      type: { ...CORMORANT_JOST, scale: 1.32, displayWeight: 300, displayTracking: "0.04em" },
      shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
      density: "airy",
      panelRgb: "14,14,17",
      panelAlpha: 0.66,
      heroBg: "radial-gradient(130% 100% at 50% 10%,#1c1c22 0%,#0e0e11 68%)",
      heroBase: "#1c1c22",
    }),
  },
  css: () => `
.gifts-account{background:transparent}
/* El rombo del ornamento respira: es el único movimiento del diseño. */
.ornament svg{animation:respira 4.5s ease-in-out infinite}
@keyframes respira{0%,100%{opacity:.55}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.ornament svg{animation:none}}`,
  deco: { ornament: deco.rombo, hero: deco.marco, splash: deco.marco },
};

/* ── Campestre ──────────────────────────────────────────────── */

const campestre: Design = {
  slug: "campestre",
  name: "Campestre",
  occasion: "boda",
  mood: "Lino, trigo y verde seco, con la foto arriba y el texto abajo",
  fontUrl: MARCELLUS_JOST.url,
  layout: {
    hero: "split",
    head: "center",
    cards: "flat",
    countdown: "tiles",
    gallery: "stack",
    divider: "torn",
  },
  swatch: { unico: ["#f7f2e7", "#5c6640", "#b08e58"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#f7f2e7", bgAlt: "#ece3d1", card: "#fffdf7",
        ink: "#3b3524", muted: "#6b6148", line: "#d9cdb2",
        brand: "#5c6640", brand2: "#b08e58",
        accent: "#5d6440", onAccent: "#ffffff",
        footerBg: "#3b3524", footerInk: "#ece3d1",
      },
      type: { ...MARCELLUS_JOST, scale: 1.27, displayWeight: 400, displayTracking: "0.015em" },
      shape: { radius: 10, radiusSm: 8, btnRadius: 2, shadow: "none" },
      density: "normal",
      heroBg: "#ece3d1",
      heroBase: "#ece3d1",
    }),
  },
  css: (t) => `
/* Textura de papel kraft con degradados: sin imágenes externas, que es lo
   que obligó a quitar las de Unsplash de la versión anterior. */
body{background-image:
  repeating-linear-gradient(92deg,transparent 0 3px,${alpha(t.palette.brand2, 0.045)} 3px 4px),
  repeating-linear-gradient(2deg,transparent 0 5px,${alpha(t.palette.ink, 0.022)} 5px 6px)}
/* Las fotos van un grado torcidas, como pegadas en un álbum. */
.gallery-item{transform:rotate(-.5deg)}
.gallery-item:nth-child(even){transform:rotate(.6deg)}`,
  deco: { ornament: deco.rombo, hero: deco.aguada, footer: deco.aguada },
};

export const BODAS: Design[] = [
  vintage,
  white,
  marsala,
  aurum,
  ivory,
  editorial,
  nocturno,
  campestre,
];
