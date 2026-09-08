/**
 * Contraste, verificado en el build.
 *
 * El renderer tenía guardas para esto: `luzDe()` y `tintaSobreAcento()`
 * miraban si el color muestreado contrastaba y, si no, lo cambiaban por el
 * claro o el oscuro. Eran parches sobre valores que ya venían mal.
 *
 * Con los tokens declarados el problema se mueve al sitio correcto: si un
 * diseño elige un par ilegible, `npm run templates:build` falla y dice cuál.
 * El renderer deja de adivinar porque no le llega nada dudoso.
 */

import type { Theme } from "./theme";

/* ── Luminancia relativa, WCAG 2.1 ─────────────────────────── */

function canal(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function parse(color: string): [number, number, number] {
  const hex = color.trim();
  if (hex.startsWith("#")) {
    const h =
      hex.length === 4
        ? hex
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")
        : hex.slice(1);
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = hex.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) throw new Error(`Color que no sé leer: ${color}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

export function luminancia(color: string): number {
  const [r, g, b] = parse(color);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** La razón de contraste entre dos colores: 1 (igual) a 21 (negro y blanco). */
export function razon(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ── Los pares que tienen que cumplir ──────────────────────── */

/**
 * Cada par con su mínimo. No es 4.5 en todos a propósito:
 *
 * - El **texto de lectura** (cuerpo, secundario) va a 4.5: es lo que alguien
 *   se sienta a leer.
 * - Los **títulos y los números de la cuenta atrás** van a 3.0, el umbral de
 *   WCAG para texto grande. Son 30px o más.
 * - Los **filetes y bordes** van a 1.4: no llevan texto, sólo tienen que
 *   verse.
 */
const PARES: {
  nombre: string;
  frente: (t: Theme) => string;
  fondo: (t: Theme) => string;
  min: number;
}[] = [
  { nombre: "cuerpo sobre el fondo", frente: (t) => t.palette.ink, fondo: (t) => t.palette.bg, min: 4.5 },
  { nombre: "cuerpo sobre el fondo alterno", frente: (t) => t.palette.ink, fondo: (t) => t.palette.bgAlt, min: 4.5 },
  { nombre: "cuerpo sobre la tarjeta", frente: (t) => t.palette.ink, fondo: (t) => t.palette.card, min: 4.5 },
  { nombre: "texto secundario sobre el fondo", frente: (t) => t.palette.muted, fondo: (t) => t.palette.bg, min: 4.5 },
  { nombre: "texto secundario sobre el fondo alterno", frente: (t) => t.palette.muted, fondo: (t) => t.palette.bgAlt, min: 4.5 },
  { nombre: "texto secundario sobre la tarjeta", frente: (t) => t.palette.muted, fondo: (t) => t.palette.card, min: 4.5 },
  // El antetítulo es pequeño y en versalitas: es el que más se rompía.
  { nombre: "antetítulo (marca) sobre el fondo", frente: (t) => t.palette.brand, fondo: (t) => t.palette.bg, min: 4.5 },
  { nombre: "antetítulo (marca) sobre el fondo alterno", frente: (t) => t.palette.brand, fondo: (t) => t.palette.bgAlt, min: 4.5 },
  { nombre: "marca sobre la tarjeta", frente: (t) => t.palette.brand, fondo: (t) => t.palette.card, min: 4.5 },
  // Este es el par que fallaba en Burdeos: crema sobre oro.
  { nombre: "texto sobre el acento", frente: (t) => t.palette.onAccent, fondo: (t) => t.palette.accent, min: 4.5 },
  // Y este el de Blanco Oro: acento casi blanco sobre fondo casi blanco.
  { nombre: "acento sobre el fondo (botón en contorno)", frente: (t) => t.palette.accent, fondo: (t) => t.palette.bg, min: 3.0 },
  { nombre: "acento sobre el fondo alterno", frente: (t) => t.palette.accent, fondo: (t) => t.palette.bgAlt, min: 3.0 },
  { nombre: "pie: texto sobre su fondo", frente: (t) => t.palette.footerInk, fondo: (t) => t.palette.footerBg, min: 4.5 },
  { nombre: "filete sobre el fondo", frente: (t) => t.palette.line, fondo: (t) => t.palette.bg, min: 1.25 },
];

/**
 * Los pares de la portada. Sólo se comprueban si el tema declara `heroBase`,
 * el tramo más adverso de su `heroBg`: un degradado no es un color y no hay
 * forma de medirlo, así que el diseño dice contra qué quiere que se mida.
 *
 * Se comprueba **sin foto**. Con foto puesta el texto va sobre un velo
 * oscuro, que es un caso seguro por construcción.
 */
const PARES_PORTADA: {
  nombre: string;
  frente: (t: Theme) => string;
  min: number;
}[] = [
  { nombre: "portada: los nombres", frente: (t) => (t.heroInk === "light" ? "#ffffff" : t.palette.ink), min: 3.0 },
  { nombre: "portada: la frase", frente: (t) => (t.heroInk === "light" ? "#d8d8d8" : t.palette.muted), min: 4.5 },
  { nombre: "portada: el antetítulo", frente: (t) => t.heroBrand || t.palette.brand, min: 4.5 },
  { nombre: "portada: el botón", frente: (t) => t.heroAccent || t.palette.accent, min: 3.0 },
];

export interface Falla {
  par: string;
  frente: string;
  fondo: string;
  razon: number;
  min: number;
}

/** Los pares que no llegan al mínimo. Vacío = el tema pasa. */
export function revisar(t: Theme): Falla[] {
  const fallas: Falla[] = [];
  for (const p of PARES) {
    const frente = p.frente(t);
    const fondo = p.fondo(t);
    const r = razon(frente, fondo);
    if (r < p.min) {
      fallas.push({ par: p.nombre, frente, fondo, razon: r, min: p.min });
    }
  }

  if (t.heroBase) {
    for (const p of PARES_PORTADA) {
      const frente = p.frente(t);
      const r = razon(frente, t.heroBase);
      if (r < p.min) {
        fallas.push({ par: p.nombre, frente, fondo: t.heroBase, razon: r, min: p.min });
      }
    }
    // El texto sobre el botón de la portada se mide contra el botón, no
    // contra el fondo.
    const acento = t.heroAccent || t.palette.accent;
    const sobre = t.heroOnAccent || t.palette.onAccent;
    const r = razon(sobre, acento);
    if (r < 4.5) {
      fallas.push({ par: "portada: texto sobre el botón", frente: sobre, fondo: acento, razon: r, min: 4.5 });
    }
  }

  return fallas;
}

/** Una falla, en una línea legible para la consola del build. */
export const explicar = (f: Falla): string =>
  `${f.par}: ${f.frente} sobre ${f.fondo} da ${f.razon.toFixed(2)}:1, ` +
  `hace falta ${f.min.toFixed(1)}:1`;
