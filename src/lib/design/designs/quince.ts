/**
 * Los cinco de quince años.
 *
 * Eran los más parecidos entre sí de todo el catálogo: cinco variaciones de
 * blanco con dorado. Ahora hay un oscuro (Burdeos), uno con la foto arriba
 * (Amanecer), uno alineado a la izquierda (Hojas) y uno con la portada en
 * banda (Viaje).
 */

import { alpha, theme, type Design } from "../theme";
import * as deco from "../deco";
import {
  CORMORANT_JOST,
  DMSERIF_DMSANS,
  FRAUNCES_INTER,
  PLAYFAIR_KARLA,
} from "./fuentes";

/* ── Quince Blanco ──────────────────────────────────────────── */

const blanco: Design = {
  slug: "15-white",
  name: "Quince Blanco",
  occasion: "quince",
  mood: "Perla, oro viejo y rosa empolvado",
  fontUrl: PLAYFAIR_KARLA.url,
  layout: {
    hero: "panel",
    head: "rule",
    cards: "elevated",
    countdown: "circles",
    gallery: "grid",
    divider: "arc",
  },
  swatch: { unico: ["#fdfcfa", "#83653d", "#d8b9b9"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#fdfcfa", bgAlt: "#f6f0ea", card: "#ffffff",
        ink: "#2b2521", muted: "#6b6058", line: "#e6dcd2",
        brand: "#83653d", brand2: "#d8b9b9",
        accent: "#83653d", onAccent: "#ffffff",
        footerBg: "#2b2521", footerInk: "#f6f0ea",
      },
      type: { ...PLAYFAIR_KARLA, scale: 1.29, displayWeight: 400, displayTracking: "-0.01em" },
      shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "soft" },
      density: "normal",
      panelAlpha: 0.9,
      heroBg: "linear-gradient(165deg,#f6f0ea 0%,#fdfcfa 55%,#f4ecec 130%)",
      heroBase: "#f4ecec",
      splashBg: "radial-gradient(120% 90% at 50% 0%,#f6f0ea 0%,#fdfcfa 62%)",
    }),
  },
  deco: { ornament: deco.anillo },
};

/* ── Quince Burdeos ─────────────────────────────────────────── */

const burdeos: Design = {
  slug: "15-burdeos",
  name: "Quince Burdeos",
  occasion: "quince",
  mood: "Burdeos profundo y oro. Oscuro, para la noche",
  fontUrl: DMSERIF_DMSANS.url,
  layout: {
    hero: "minimal",
    head: "stacked",
    cards: "flat",
    countdown: "tiles",
    gallery: "mosaic",
    divider: "none",
  },
  swatch: { unico: ["#2d0713", "#48162a", "#e0b371"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#2d0713", bgAlt: "#3d0f1e", card: "#48162a",
        ink: "#f6e7ea", muted: "#d0aeb6", line: "#6a2b3d",
        brand: "#e0b371", brand2: "#b1607c",
        accent: "#e0b371", onAccent: "#2d0713",
        footerBg: "#1e040d", footerInk: "#e0b371",
      },
      type: { ...DMSERIF_DMSANS, scale: 1.33, displayWeight: 400, displayTracking: "-0.01em" },
      shape: { radius: 6, radiusSm: 6, btnRadius: "pill", shadow: "none" },
      density: "normal",
      heroBg: "radial-gradient(130% 100% at 50% 15%,#48162a 0%,#2d0713 70%)",
      heroInk: "light",
      heroBase: "#48162a",
    }),
  },
  css: () => `
.gifts-account{background:transparent}`,
  deco: { ornament: deco.rombo, hero: deco.rayos },
}

/* ── Quince Amanecer ────────────────────────────────────────── */

const amanecer: Design = {
  slug: "15-amanecer",
  name: "Quince Amanecer",
  occasion: "quince",
  mood: "Durazno y arena, con la foto arriba y los nombres abajo",
  fontUrl: DMSERIF_DMSANS.url,
  layout: {
    hero: "split",
    head: "center",
    cards: "elevated",
    countdown: "line",
    gallery: "stack",
    divider: "arc",
  },
  swatch: { unico: ["#fffaf4", "#92542b", "#e0a878"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#fffaf4", bgAlt: "#fbeddc", card: "#ffffff",
        ink: "#43301f", muted: "#7b6144", line: "#ecd8bd",
        brand: "#92542b", brand2: "#e0a878",
        accent: "#92542b", onAccent: "#ffffff",
        footerBg: "#43301f", footerInk: "#fbeddc",
      },
      type: { ...DMSERIF_DMSANS, scale: 1.3, displayWeight: 400, displayTracking: "-0.012em" },
      shape: { radius: 20, radiusSm: 14, btnRadius: "pill", shadow: "soft" },
      density: "normal",
      heroBg: "linear-gradient(180deg,#fbeddc 0%,#fffaf4 100%)",
      heroBase: "#fbeddc",
    }),
  },
  deco: { ornament: deco.anillo },
};

/* ── Quince Hojas ───────────────────────────────────────────── */

const hojas: Design = {
  slug: "15-hojas",
  name: "Quince Hojas",
  occasion: "quince",
  mood: "Verde bosque y crema, enmarcado y a la izquierda",
  fontUrl: CORMORANT_JOST.url,
  layout: {
    hero: "frame",
    head: "left",
    cards: "outline",
    countdown: "type",
    gallery: "grid",
    divider: "rule",
  },
  swatch: { unico: ["#f8faf6", "#3f6b47", "#7d9b78"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#f8faf6", bgAlt: "#e8efe4", card: "#ffffff",
        ink: "#222c22", muted: "#55634f", line: "#cddac6",
        brand: "#3f6b47", brand2: "#7d9b78",
        accent: "#3f6b47", onAccent: "#ffffff",
        footerBg: "#222c22", footerInk: "#e8efe4",
      },
      type: { ...CORMORANT_JOST, scale: 1.28, displayWeight: 400, displayTracking: "0.01em" },
      shape: { radius: 3, radiusSm: 3, btnRadius: 0, shadow: "none" },
      density: "airy",
      heroBg: "linear-gradient(160deg,#e8efe4 0%,#f8faf6 58%,#d9e5d4 130%)",
      heroBase: "#d9e5d4",
    }),
  },
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

/* ── Quince Viaje ───────────────────────────────────────────── */

const viaje: Design = {
  slug: "15-viaje",
  name: "Quince Viaje",
  occasion: "quince",
  mood: "Azul noche y latón, con la portada en banda",
  fontUrl: FRAUNCES_INTER.url,
  layout: {
    hero: "band",
    head: "rule",
    cards: "elevated",
    countdown: "circles",
    gallery: "mosaic",
    divider: "wave",
  },
  swatch: { unico: ["#f5f7fa", "#2c5075", "#9a7b3c"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#f5f7fa", bgAlt: "#e6ebf2", card: "#ffffff",
        ink: "#1c2634", muted: "#4f5d70", line: "#ccd6e2",
        brand: "#2c5075", brand2: "#9a7b3c",
        accent: "#2c5075", onAccent: "#ffffff",
        footerBg: "#1c2634", footerInk: "#e6ebf2",
      },
      type: { ...FRAUNCES_INTER, scale: 1.31, displayWeight: 500, displayTracking: "-0.02em" },
      shape: { radius: 12, radiusSm: 10, btnRadius: 4, shadow: "lifted" },
      density: "normal",
      panelRgb: "28,38,52",
      panelAlpha: 0.8,
      heroBg: "linear-gradient(155deg,#2c5075 0%,#1c2634 80%)",
      heroInk: "light",
      heroBase: "#2c5075",
      heroBrand: "#d8bd82",
      heroAccent: "#e6ebf2",
      heroOnAccent: "#1c2634",
    }),
  },
  css: (t) => `
/* Sobre azul noche el antetítulo va en latón, que es el que contrasta. */
.hero-label{color:${t.palette.brand2}}
.hero-scroll{color:${t.palette.footerInk}}`,
  deco: { ornament: deco.estrellas },
};

export const QUINCE: Design[] = [blanco, burdeos, amanecer, hojas, viaje];
