/**
 * Los cinco diseños infantiles, cada uno en versión niña y niño.
 *
 * Las dos versiones son el mismo diseño con otra paleta —y en algunos casos
 * otro adorno—, declaradas juntas para que no se desincronicen: era la razón
 * original de generarlos en vez de escribirlos a mano, y sigue valiendo.
 */

import { alpha, theme, type Design, type Palette, type Theme, type Variant } from "../theme";
import * as deco from "../deco";
import { BALOO_NUNITO, FRAUNCES_INTER, QUICKSAND } from "./fuentes";
import type { Pareja } from "./fuentes";

/**
 * Los dos temas de un infantil. Comparten forma, densidad y tipografía; sólo
 * cambia la paleta, que es exactamente la diferencia que debe haber entre la
 * versión de niña y la de niño.
 */
function dos(
  nina: Palette,
  nino: Palette,
  comun: {
    type: Pareja & Partial<Theme["type"]>;
    shape?: Partial<Theme["shape"]>;
    density?: Theme["density"];
    panelAlpha?: number;
    heroBg?: (p: Palette) => string;
    splashBg?: (p: Palette) => string;
    /** El tramo más adverso del degradado de la portada, para el verificador. */
    heroBase?: (p: Palette) => string;
  }
): Partial<Record<Variant, Theme>> {
  const uno = (variant: Variant, palette: Palette) =>
    theme({
      variant,
      palette,
      type: comun.type,
      shape: comun.shape,
      density: comun.density,
      panelAlpha: comun.panelAlpha,
      heroBg: comun.heroBg?.(palette),
      splashBg: comun.splashBg?.(palette),
      heroBase: comun.heroBase?.(palette) ?? palette.bgAlt,
    });
  return { nina: uno("nina", nina), nino: uno("nino", nino) };
}

/* ── 1 · Globos ─────────────────────────────────────────────── */

const globos: Design = {
  slug: "1-globos",
  name: "Globos",
  occasion: "primer-ano",
  mood: "Festivo: globos, confeti y un gran número 1",
  fontUrl: BALOO_NUNITO.url,
  layout: {
    hero: "panel",
    head: "center",
    cards: "elevated",
    countdown: "tiles",
    gallery: "grid",
    divider: "arc",
  },
  swatch: {
    nina: ["#fff7f9", "#a93860", "#f2a3bd"],
    nino: ["#f4faff", "#256498", "#86bde8"],
  },
  themes: dos(
    {
      bg: "#fff7f9", bgAlt: "#ffe7ee", card: "#ffffff",
      ink: "#45283a", muted: "#7d5567", line: "#f7cdda",
      brand: "#a93860", brand2: "#f2a3bd",
      accent: "#a93860", onAccent: "#ffffff",
      footerBg: "#45283a", footerInk: "#ffe7ee",
    },
    {
      bg: "#f4faff", bgAlt: "#dfeefb", card: "#ffffff",
      ink: "#1f3448", muted: "#4f6b83", line: "#c3dcf0",
      brand: "#256498", brand2: "#86bde8",
      accent: "#256498", onAccent: "#ffffff",
      footerBg: "#1f3448", footerInk: "#dfeefb",
    },
    {
      type: { ...BALOO_NUNITO, scale: 1.29, displayWeight: 700, displayTracking: "-0.015em" },
      shape: { radius: 26, radiusSm: 18, btnRadius: "pill", shadow: "soft" },
      density: "normal",
      panelAlpha: 0.92,
      heroBg: (p) => `linear-gradient(165deg,${p.bgAlt} 0%,${p.bg} 52%,${p.brand2} 140%)`,
      splashBg: (p) => `radial-gradient(120% 90% at 50% 0%,${p.bgAlt} 0%,${p.bg} 62%)`,
    }
  ),
  css: (t) => `
.hero-content{border:3px solid ${t.palette.card}}
.event-card,.feature-card,.gift-card,.guest-card{border-top:4px solid ${t.palette.brand}}
.gift-card{border-top-color:${t.palette.brand2}}
.feature-card:nth-child(even){border-top-color:${t.palette.brand2}}`,
  deco: {
    ornament: (t) => (t.variant === "nina" ? deco.lazo(t) : deco.estrellas(t)),
    hero: (t) => deco.globos(t) + deco.confeti(t),
    splash: deco.confeti,
  },
};

/* ── 1 · Osito ──────────────────────────────────────────────── */

const osito: Design = {
  slug: "1-osito",
  name: "Osito",
  occasion: "primer-ano",
  mood: "Tierno: arcos, un osito dibujado y tonos tierra",
  fontUrl: QUICKSAND.url,
  layout: {
    hero: "split",
    head: "center",
    cards: "flat",
    countdown: "circles",
    gallery: "stack",
    divider: "arc",
  },
  swatch: {
    nina: ["#fdf7f1", "#93483a", "#9aa87e"],
    nino: ["#f6f7f5", "#426280", "#7f9273"],
  },
  themes: dos(
    {
      bg: "#fdf7f1", bgAlt: "#f7e6dc", card: "#ffffff",
      ink: "#4a3229", muted: "#7d5b4c", line: "#ecd3c4",
      brand: "#93483a", brand2: "#9aa87e",
      accent: "#93483a", onAccent: "#ffffff",
      footerBg: "#4a3229", footerInk: "#f7e6dc",
    },
    {
      bg: "#f6f7f5", bgAlt: "#e5ebef", card: "#ffffff",
      ink: "#27333d", muted: "#556876", line: "#cbd8e0",
      brand: "#426280", brand2: "#7f9273",
      accent: "#426280", onAccent: "#ffffff",
      footerBg: "#27333d", footerInk: "#e5ebef",
    },
    {
      type: { ...QUICKSAND, scale: 1.27, displayWeight: 600, displayTracking: "-0.01em" },
      shape: { radius: 24, radiusSm: 999, btnRadius: "pill", shadow: "none" },
      density: "normal",
      heroBg: (p) => `linear-gradient(180deg,${p.bgAlt} 0%,${p.bg} 100%)`,
    }
  ),
  css: () => `
/* El arco es el motivo del diseño: las fotos y las tarjetas lo repiten. */
.gallery-item{border-radius:999px 999px 24px 24px}
.guest-avatar{border-radius:999px 999px 12px 12px}`,
  deco: { ornament: deco.rombo, hero: deco.arcos },
};

/* ── bs · Nube ──────────────────────────────────────────────── */

const nube: Design = {
  slug: "bs-nube",
  name: "Nube",
  occasion: "baby-shower",
  mood: "Soñador: nubes, luna y estrellas flotando",
  fontUrl: QUICKSAND.url,
  layout: {
    hero: "panel",
    head: "rule",
    cards: "elevated",
    countdown: "circles",
    gallery: "grid",
    divider: "wave",
  },
  swatch: {
    nina: ["#faf7fd", "#7a56ab", "#c3aede"],
    nino: ["#f5faff", "#2f6f9e", "#8dc0e4"],
  },
  themes: dos(
    {
      bg: "#faf7fd", bgAlt: "#efe6f8", card: "#ffffff",
      ink: "#38294a", muted: "#64547a", line: "#ddd0ec",
      brand: "#7a56ab", brand2: "#c3aede",
      accent: "#7a56ab", onAccent: "#ffffff",
      footerBg: "#38294a", footerInk: "#efe6f8",
    },
    {
      bg: "#f5faff", bgAlt: "#e2eefa", card: "#ffffff",
      ink: "#1f3346", muted: "#4d6579", line: "#c6dcee",
      brand: "#2f6f9e", brand2: "#8dc0e4",
      accent: "#2f6f9e", onAccent: "#ffffff",
      footerBg: "#1f3346", footerInk: "#e2eefa",
    },
    {
      type: { ...QUICKSAND, scale: 1.28, displayWeight: 600, displayTracking: "-0.008em" },
      shape: { radius: 22, radiusSm: 16, btnRadius: "pill", shadow: "soft" },
      density: "normal",
      panelAlpha: 0.9,
      heroBg: (p) => `linear-gradient(170deg,${p.bgAlt} 0%,${p.bg} 55%,${p.brand2} 150%)`,
      splashBg: (p) => `radial-gradient(120% 90% at 50% 0%,${p.bgAlt} 0%,${p.bg} 60%)`,
    }
  ),
  deco: { ornament: deco.luna, hero: deco.flotantes, splash: deco.flotantes },
};

/* ── bs · Bosque ────────────────────────────────────────────── */

const bosque: Design = {
  slug: "bs-bosque",
  name: "Bosque",
  occasion: "baby-shower",
  mood: "Botánico y sobrio: eucalipto, enmarcado y a la izquierda",
  fontUrl: FRAUNCES_INTER.url,
  layout: {
    hero: "frame",
    head: "left",
    cards: "outline",
    countdown: "line",
    gallery: "stack",
    divider: "rule",
  },
  swatch: {
    nina: ["#fbf9f5", "#5d6b4c", "#c69ea0"],
    nino: ["#f8f9f7", "#466274", "#7e9782"],
  },
  themes: dos(
    {
      bg: "#fbf9f5", bgAlt: "#eeeae2", card: "#ffffff",
      ink: "#33342c", muted: "#5f6152", line: "#d9d5c8",
      brand: "#5d6b4c", brand2: "#c69ea0",
      accent: "#5d6b4c", onAccent: "#ffffff",
      footerBg: "#33342c", footerInk: "#eeeae2",
    },
    {
      bg: "#f8f9f7", bgAlt: "#e7ebe8", card: "#ffffff",
      ink: "#2b332f", muted: "#556059", line: "#d1d8d3",
      brand: "#466274", brand2: "#7e9782",
      accent: "#466274", onAccent: "#ffffff",
      footerBg: "#2b332f", footerInk: "#e7ebe8",
    },
    {
      type: { ...FRAUNCES_INTER, scale: 1.27, displayWeight: 400, displayTracking: "-0.015em" },
      shape: { radius: 3, radiusSm: 3, btnRadius: 0, shadow: "none" },
      density: "airy",
      heroBg: (p) => `linear-gradient(160deg,${p.bgAlt} 0%,${p.bg} 60%,${p.bgAlt} 140%)`,
    }
  ),
  deco: { ornament: deco.hojas, hero: deco.aros, splash: deco.aros },
};

/* ── bs · Acuarela ──────────────────────────────────────────── */

const acuarela: Design = {
  slug: "bs-acuarela",
  name: "Acuarela",
  occasion: "baby-shower",
  mood: "Manchas de acuarela y títulos muy grandes",
  fontUrl: FRAUNCES_INTER.url,
  layout: {
    hero: "editorial",
    head: "stacked",
    cards: "rule",
    countdown: "type",
    gallery: "mosaic",
    divider: "none",
  },
  swatch: {
    nina: ["#fffaf7", "#a6442d", "#7fa79a"],
    nino: ["#f6fbfc", "#1f7285", "#c9a15a"],
  },
  themes: dos(
    {
      bg: "#fffaf7", bgAlt: "#fbeae3", card: "#ffffff",
      ink: "#40261f", muted: "#7a5245", line: "#f0d4c8",
      brand: "#a6442d", brand2: "#7fa79a",
      accent: "#a6442d", onAccent: "#ffffff",
      footerBg: "#40261f", footerInk: "#fbeae3",
    },
    {
      bg: "#f6fbfc", bgAlt: "#e3f0f3", card: "#ffffff",
      ink: "#12333a", muted: "#4a6a72", line: "#c5dfe4",
      brand: "#1f7285", brand2: "#c9a15a",
      accent: "#1f7285", onAccent: "#ffffff",
      footerBg: "#12333a", footerInk: "#e3f0f3",
    },
    {
      type: {
        ...FRAUNCES_INTER,
        scale: 1.35,
        displayWeight: 500,
        displayTracking: "-0.03em",
        displayLeading: 1.03,
        quoteStyle: "normal",
      },
      shape: { radius: 0, radiusSm: 0, btnRadius: 0, shadow: "none" },
      density: "airy",
      heroBg: (p) => p.bgAlt,
    }
  ),
  deco: { ornament: deco.filete, hero: deco.acuarela, splash: deco.acuarela },
};

export const INFANTILES: Design[] = [globos, osito, nube, bosque, acuarela];
