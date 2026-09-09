/**
 * Constructor de paletas.
 *
 * Una paleta completa son trece colores que tienen que cumplir catorce pares
 * de contraste. Escribirlas a mano se hizo inviable en cuanto cada diseño
 * quiso cuatro: 42 diseños × 4 son 168 paletas, y afinar cada hex a ojo hasta
 * que pase el verificador es trabajo mecánico y de los que se hacen mal.
 *
 * Aquí se declaran **cinco decisiones** —el fondo, la tinta, la marca, el
 * acento y un segundo color— y el resto se deriva. Lo importante: los colores
 * que llevan texto **se ajustan solos** hasta cumplir su razón mínima, así que
 * una paleta construida con esto no puede salir ilegible. Si la decisión de
 * partida es imposible (marca casi blanca sobre fondo blanco), el ajuste la
 * oscurece hasta que sirva en vez de dejarla pasar.
 *
 * Es la misma idea que el resto del sistema: declarar poco y derivar mucho,
 * con la verificación dentro y no al lado.
 */

import { luminancia, razon } from "./contraste";
import type { Palette } from "./theme";

/* ────────────────────────────────────────────────────────────────
   Color
   ──────────────────────────────────────────────────────────────── */

type RGB = [number, number, number];

const aRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const aHex = ([r, g, b]: RGB): string =>
  "#" +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");

/** Mezcla dos colores. `t` 0 = el primero, 1 = el segundo. */
const mezclar = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = aRgb(a);
  const [r2, g2, b2] = aRgb(b);
  return aHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
};

const BLANCO = "#ffffff";
const NEGRO = "#000000";

/** Acerca un color al negro o al blanco, conservando su tono. */
const oscurecer = (c: string, t: number) => mezclar(c, NEGRO, t);
const aclarar = (c: string, t: number) => mezclar(c, BLANCO, t);

/** ¿Es una paleta oscura? Lo decide el fondo. */
const esOscura = (bg: string) => luminancia(bg) < 0.3;

/**
 * Empuja un color hasta que contraste lo suficiente contra **todos** los
 * fondos dados.
 *
 * Es el corazón del constructor: en vez de confiar en que el hex elegido
 * cumpla, se acerca al negro (sobre fondos claros) o al blanco (sobre
 * oscuros) en pasos pequeños hasta que cumple. Si no lo logra —una decisión
 * imposible— devuelve el extremo, que al menos se lee.
 */
function ajustar(color: string, fondos: string[], minimo: number): string {
  const cumple = (c: string) => fondos.every((f) => razon(c, f) >= minimo);
  if (cumple(color)) return color;

  /* Se prueban las **dos** direcciones y gana la que llegue. Antes se elegía
     una sola según si el fondo era oscuro, y con un fondo de luminosidad
     media eso escogía la dirección equivocada: sobre un gris medio empujaba
     el texto hacia el blanco, que ahí nunca pasa de 4:1, cuando hacia el
     negro sí llegaba. */
  let mejor = color;
  let mejorRazon = 0;
  for (const hacia of [NEGRO, BLANCO]) {
    for (let i = 1; i <= 40; i++) {
      const c = mezclar(color, hacia, i / 40);
      if (cumple(c)) return c;
      const r = Math.min(...fondos.map((f) => razon(c, f)));
      if (r > mejorRazon) { mejorRazon = r; mejor = c; }
    }
  }
  return mejor;
}

/* ────────────────────────────────────────────────────────────────
   El constructor
   ──────────────────────────────────────────────────────────────── */

export interface Decisiones {
  id: string;
  nombre: string;
  /** El fondo de la página. Decide si la paleta es clara u oscura. */
  base: string;
  /** La tinta principal. */
  tinta: string;
  /** Antetítulos, números de la cuenta atrás, ornamentos. Lleva texto. */
  marca: string;
  /** Botones rellenos. Por defecto, la marca. */
  acento?: string;
  /** Decorativo: degradados y adornos. Nunca lleva texto, así que no se ajusta. */
  segundo?: string;
  /**
   * Cómo es la portada sin foto.
   *
   * `suave` un degradado de la propia paleta · `profundo` un degradado hacia
   * la marca, para portadas de carácter · `plano` el fondo alterno a secas.
   */
  hero?: "suave" | "profundo" | "plano";
}

export function paleta(d: Decisiones): Palette {
  const oscura = esOscura(d.base);
  const bg = d.base;

  /* El fondo alterno tiene que distinguirse del principal sin partir la
     página en dos: un 7% hacia la tinta en claro, un 6% hacia el blanco en
     oscuro. */
  const bgAlt = oscura ? aclarar(bg, 0.06) : mezclar(bg, d.tinta, 0.07);
  const card = oscura ? aclarar(bg, 0.1) : aclarar(bg, 0.55);

  /* Los tres fondos sobre los que puede caer texto. */
  const fondos = [bg, bgAlt, card];
  /* El más adverso para texto oscuro es el más oscuro, y al revés. */
  const adverso = [...fondos].sort((a, b) =>
    oscura ? luminancia(b) - luminancia(a) : luminancia(a) - luminancia(b)
  )[0];

  const ink = ajustar(d.tinta, fondos, 4.5);
  /* El secundario parte de la tinta aguada y se ajusta: sin el ajuste es el
     par que más se rompía, porque "gris a media distancia" no significa nada
     hasta medirlo. */
  const muted = ajustar(mezclar(ink, bg, 0.34), fondos, 4.5);
  const brand = ajustar(d.marca, fondos, 4.5);
  /* El acento cumple dos cosas a la vez: verse sobre el fondo (3.0, es un
     botón grande) y sostener su propia letra (4.5). Elegir la letra que
     contraste más no basta: si el acento queda a media luz, ninguna de las
     dos cumple. Así que primero se busca la letra y, si no llega, se empuja
     el acento hasta que sí. */
  const acentoBase = ajustar(d.acento ?? d.marca, [bg, bgAlt], 3.0);
  const letraOscura = oscura ? bg : ink;
  let accent = acentoBase;
  let onAccent = razon(BLANCO, accent) >= razon(letraOscura, accent) ? BLANCO : letraOscura;
  for (let i = 0; i <= 30 && razon(onAccent, accent) < 4.5; i++) {
    // Hacia donde haga falta para separarse de la letra elegida.
    accent = mezclar(acentoBase, onAccent === BLANCO ? NEGRO : BLANCO, (i + 1) / 30);
    if (razon(accent, bg) < 3.0 || razon(accent, bgAlt) < 3.0) {
      onAccent = onAccent === BLANCO ? letraOscura : BLANCO;
      accent = acentoBase;
    }
  }

  /* El filete no lleva texto, pero tiene que distinguirse del fondo. Con una
     paleta muy plana —un crema sobre otro crema— el 14% no alcanzaba. */
  const line = ajustar(mezclar(bg, ink, oscura ? 0.22 : 0.14), [bg], 1.3);
  const brand2 = d.segundo ?? mezclar(brand, bg, 0.4);

  const footerBg = oscura ? oscurecer(bg, 0.4) : ink;
  const footerInk = ajustar(oscura ? brand : bgAlt, [footerBg], 4.5);

  /* ── La portada ──
     El degradado es decorativo, pero el texto va encima. Así que primero se
     elige el tramo más adverso y después **se corrige hasta que el texto lo
     aguante**: es más honesto que declarar un tramo que el verificador
     rechaza, y evita el fallo que aparecía en las pruebas —un degradado que
     bajaba un poco más de lo que la tinta secundaria podía. */
  const modo = d.hero ?? "suave";

  /* Que la portada lleve texto claro lo decide la **tinta ya resuelta**, no
     si el fondo parecía oscuro. Con un fondo de luminosidad media las dos
     cosas discrepaban: `esOscura` decía "oscura" y el ajuste había elegido
     tinta negra, así que la portada pedía texto claro sobre un fondo medio y
     no se leía. */
  const claraEncima = modo === "profundo" || luminancia(ink) > 0.5;
  /* Lo que el verificador va a medir contra este fondo. */
  const encima: [string, number][] = claraEncima
    ? [[BLANCO, 3.0], ["#d8d8d8", 4.5]]
    : [[ink, 3.0], [muted, 4.5]];

  /** Acerca el tramo a un refugio hasta que todo lo de encima se lea. */
  const seguro = (tramo: string, refugio: string): string => {
    let c = tramo;
    for (let i = 0; i <= 30; i++) {
      if (encima.every(([col, min]) => razon(col, c) >= min)) return c;
      c = mezclar(tramo, refugio, (i + 1) / 30);
    }
    return refugio;
  };

  let heroBg: string;
  let heroBase: string;
  if (modo === "plano") {
    heroBase = seguro(bgAlt, bg);
    heroBg = heroBase;
  } else if (modo === "profundo") {
    /* Un degradado hacia el color de marca. Su tramo claro es el adverso
       para un texto claro, así que es el que se corrige. */
    const claro = seguro(brand, oscurecer(brand, 0.75));
    const hondo = oscurecer(claro, 0.5);
    heroBase = claro;
    heroBg = `linear-gradient(155deg,${claro} 0%,${hondo} 88%)`;
  } else {
    const borde = seguro(mezclar(bgAlt, brand2, 0.35), bg);
    heroBase = oscura ? seguro(bg, bgAlt) : borde;
    heroBg = `linear-gradient(165deg,${bgAlt} 0%,${bg} 55%,${borde} 130%)`;
  }

  const heroInk: "auto" | "light" = claraEncima ? "light" : "auto";
  /* Dentro de un degradado hecho con la propia marca, la marca no se ve. */
  const heroBrand = ajustar(
    modo === "profundo" ? aclarar(brand2, 0.55) : brand,
    [heroBase],
    4.5
  );
  const heroAccentBase = modo === "profundo" ? aclarar(bg, 0.12) : accent;
  const heroAccent = ajustar(heroAccentBase, [heroBase], 3.0);
  const heroOnAccent =
    razon(BLANCO, heroAccent) >= razon(letraOscura, heroAccent) ? BLANCO : letraOscura;

  return {
    id: d.id,
    nombre: d.nombre,
    bg, bgAlt, card, ink, muted, line, brand, brand2, accent, onAccent,
    footerBg, footerInk,
    panelAlpha: oscura ? 0.7 : 0.88,
    heroBg, splashBg: heroBg, heroBase, heroInk,
    heroBrand, heroAccent, heroOnAccent,
  };
}

/** Los tres colores del swatch del selector. */
export const swatch = (p: Palette): [string, string, string] => [p.bg, p.brand, p.brand2];
