/**
 * Los cuatro de primera comunión y bautizo.
 *
 * Tropical era el único con carácter y los otros tres eran el mismo blanco con
 * dorado. Ahora Blanco es enmarcado y sobrio, Vintage tiene textura de
 * pergamino y filo rasgado, Amanecer parte la portada, y Tropical va a la
 * izquierda sin cajas.
 */

import { alpha, theme, type Design } from "../theme";
import * as deco from "../deco";
import { CORMORANT_INTER, DMSERIF_DMSANS, MARCELLUS_JOST } from "./fuentes";

/* ── Comunión Blanco ────────────────────────────────────────── */

const blanco: Design = {
  slug: "c-white",
  name: "Comunión Blanco",
  occasion: "comunion",
  mood: "Blanco puro y oro, enmarcado con hilos",
  fontUrl: CORMORANT_INTER.url,
  layout: {
    hero: "frame",
    head: "rule",
    cards: "outline",
    countdown: "circles",
    gallery: "grid",
    divider: "none",
  },
  swatch: { unico: ["#ffffff", "#7c632f", "#c2ab73"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#ffffff", bgAlt: "#f6f5f1", card: "#ffffff",
        ink: "#26251f", muted: "#63615a", line: "#e3e1d8",
        brand: "#7c632f", brand2: "#c2ab73",
        accent: "#7c632f", onAccent: "#ffffff",
        footerBg: "#26251f", footerInk: "#f6f5f1",
      },
      type: { ...CORMORANT_INTER, scale: 1.3, displayWeight: 300, displayTracking: "0.02em" },
      shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
      density: "airy",
      panelRgb: "255,255,255",
      panelAlpha: 0.9,
      heroBg: "linear-gradient(180deg,#f6f5f1 0%,#ffffff 100%)",
      heroBase: "#f6f5f1",
    }),
  },
  deco: { ornament: deco.rombo, hero: deco.marco, splash: deco.marco },
};

/* ── Comunión Vintage ───────────────────────────────────────── */

const vintage: Design = {
  slug: "c-vintage",
  name: "Comunión Vintage",
  occasion: "comunion",
  mood: "Pergamino y oro envejecido, con filo rasgado",
  fontUrl: MARCELLUS_JOST.url,
  layout: {
    hero: "panel",
    head: "center",
    cards: "flat",
    countdown: "tiles",
    gallery: "stack",
    divider: "torn",
  },
  swatch: { unico: ["#f6f1e6", "#6d552e", "#ab9264"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#f6f1e6", bgAlt: "#ebe3d2", card: "#fdfaf2",
        ink: "#3a3225", muted: "#6b6049", line: "#d8cdb4",
        brand: "#6d552e", brand2: "#ab9264",
        accent: "#6d552e", onAccent: "#ffffff",
        footerBg: "#3a3225", footerInk: "#ebe3d2",
      },
      type: { ...MARCELLUS_JOST, scale: 1.26, displayWeight: 400, displayTracking: "0.02em" },
      shape: { radius: 6, radiusSm: 4, btnRadius: 2, shadow: "none" },
      density: "normal",
      panelAlpha: 0.9,
      heroBg: "linear-gradient(165deg,#ebe3d2 0%,#f6f1e6 60%,#e7dfcb 130%)",
      heroBase: "#e7dfcb",
    }),
  },
  css: (t) => `
/* Grano de pergamino, con degradados. */
body{background-image:
  repeating-linear-gradient(88deg,transparent 0 4px,${alpha(t.palette.brand2, 0.05)} 4px 5px),
  radial-gradient(60% 40% at 20% 10%,${alpha(t.palette.brand2, 0.07)} 0%,transparent 100%)}`,
  deco: { ornament: deco.anillo },
};

/* ── Comunión Amanecer ──────────────────────────────────────── */

const amanecer: Design = {
  slug: "c-amanecer",
  name: "Comunión Amanecer",
  occasion: "comunion",
  mood: "Melocotón y crema, con la foto arriba",
  fontUrl: DMSERIF_DMSANS.url,
  layout: {
    hero: "split",
    head: "stacked",
    cards: "elevated",
    countdown: "line",
    gallery: "mosaic",
    divider: "arc",
  },
  swatch: { unico: ["#fffaf7", "#945038", "#e3a884"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#fffaf7", bgAlt: "#fceee6", card: "#ffffff",
        ink: "#40291f", muted: "#7a5a48", line: "#eed9cc",
        brand: "#945038", brand2: "#e3a884",
        accent: "#945038", onAccent: "#ffffff",
        footerBg: "#40291f", footerInk: "#fceee6",
      },
      type: { ...DMSERIF_DMSANS, scale: 1.3, displayWeight: 400, displayTracking: "-0.012em" },
      shape: { radius: 20, radiusSm: 14, btnRadius: "pill", shadow: "soft" },
      density: "normal",
      heroBg: "linear-gradient(180deg,#fceee6 0%,#fffaf7 100%)",
      heroBase: "#fceee6",
    }),
  },
  deco: { ornament: deco.filete },
};

/* ── Comunión Tropical ──────────────────────────────────────── */

const tropical: Design = {
  slug: "c-tropical",
  name: "Comunión Tropical",
  occasion: "comunion",
  mood: "Verde selva y fucsia, sin cajas y a la izquierda",
  fontUrl: DMSERIF_DMSANS.url,
  layout: {
    hero: "minimal",
    head: "left",
    cards: "rule",
    countdown: "type",
    gallery: "grid",
    divider: "wave",
  },
  swatch: { unico: ["#fdf7f0", "#14685c", "#b02765"] },
  themes: {
    unico: theme({
      palette: {
        bg: "#fdf7f0", bgAlt: "#eaf1ea", card: "#ffffff",
        ink: "#16302a", muted: "#4e6b60", line: "#cfe0d5",
        brand: "#14685c", brand2: "#b02765",
        accent: "#14685c", onAccent: "#ffffff",
        footerBg: "#16302a", footerInk: "#eaf1ea",
      },
      type: { ...DMSERIF_DMSANS, scale: 1.32, displayWeight: 400, displayTracking: "-0.015em" },
      shape: { radius: 4, radiusSm: 4, btnRadius: "pill", shadow: "none" },
      density: "normal",
      heroBg: "linear-gradient(150deg,#14685c 0%,#16302a 85%)",
      heroInk: "light",
      // El verde selva es el tramo claro, y la marca del diseño es ese mismo
      // verde: en la portada hace falta otra.
      heroBase: "#14685c",
      heroBrand: "#f7ddce",
      heroAccent: "#eaf1ea",
      heroOnAccent: "#16302a",
    }),
  },
  css: (t) => `
/* El fucsia es el segundo color de marca: aparece en los adornos, nunca
   detrás de texto. */
.gallery-item:nth-child(3n+2) .gallery-ph{background:${alpha(t.palette.brand2, 0.12)}}
.event-icon{color:${t.palette.brand2}}`,
  deco: { ornament: deco.loto, hero: deco.aguada, splash: deco.aguada },
};

export const COMUNION: Design[] = [blanco, vintage, amanecer, tropical];
