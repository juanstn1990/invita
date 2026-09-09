/**
 * La hoja de estilo compartida por todos los diseños.
 *
 * Todo sale de dos sitios: los tokens del `Theme` y los slots del `Layout`.
 * No hay números sueltos —los tamaños salen de la escala tipográfica, el aire
 * de la densidad— así que cambiar la razón de la escala de un diseño mueve
 * todos sus tamaños a la vez y en proporción.
 *
 * Los slots son bloques de CSS sobre el **mismo marcado**. Eso es lo que hace
 * que dos diseños puedan no parecerse de estructura sin que el renderer, los
 * bindings o el reordenado de bloques se enteren.
 */

import { DECO_CSS } from "./deco";
import type { Layout, Theme } from "./theme";
import { alpha } from "./theme";

/* ────────────────────────────────────────────────────────────────
   Escala tipográfica
   ──────────────────────────────────────────────────────────────── */

/** El paso `n` de la escala, en px. `paso(t,0)` es el cuerpo. */
export const paso = (t: Theme, n: number): number =>
  Math.round(t.type.base * Math.pow(t.type.scale, n) * 10) / 10;

/** Un tamaño fluido: nunca menor que `min`, nunca mayor que `max`. */
const fluido = (t: Theme, min: number, vw: number, max: number): string =>
  `clamp(${paso(t, min)}px,${vw}vw,${paso(t, max)}px)`;

/* ────────────────────────────────────────────────────────────────
   Ritmo
   ──────────────────────────────────────────────────────────────── */

const AIRE: Record<Theme["density"], [number, number]> = {
  compact: [46, 54],
  normal: [64, 78],
  airy: [88, 108],
};

/* ────────────────────────────────────────────────────────────────
   Forma
   ──────────────────────────────────────────────────────────────── */

const radioBoton = (t: Theme): string =>
  t.shape.btnRadius === "pill" ? "999px" : `${t.shape.btnRadius}px`;

const sombra = (t: Theme): string => {
  if (t.shape.shadow === "none") return "none";
  if (t.shape.shadow === "lifted")
    return "0 4px 10px rgba(0,0,0,.05), 0 26px 56px -28px rgba(0,0,0,.34)";
  return "0 2px 4px rgba(0,0,0,.03), 0 16px 36px -24px rgba(0,0,0,.2)";
};

/* ────────────────────────────────────────────────────────────────
   Variables
   ──────────────────────────────────────────────────────────────── */

/**
 * Las variables del diseño (`--*`) y las de los componentes que inyecta el
 * renderer (`--inv-*`). Las segundas salían de muestrear el navegador; ahora
 * son las mismas del tema, así que la confirmación y los bloques con marcado
 * propio no pueden desafinar respecto al diseño.
 */
export function variablesDePaleta(t: Theme): string {
  return variables(t);
}

function variables(t: Theme): string {
  const p = t.palette;
  const [padY, padYAlt] = AIRE[t.density];
  return `
:root{
  --bg:${p.bg}; --bg-alt:${p.bgAlt}; --card:${p.card};
  --ink:${p.ink}; --muted:${p.muted}; --line:${p.line};
  --brand:${p.brand}; --brand-2:${p.brand2};
  --accent:${p.accent}; --on-accent:${p.onAccent};
  --footer-bg:${p.footerBg}; --footer-ink:${p.footerInk};

  --display:${t.type.display}; --sans:${t.type.body};
  --display-weight:${t.type.displayWeight};
  --display-leading:${t.type.displayLeading};
  --display-tracking:${t.type.displayTracking};
  --tracking:${t.type.tracking};
  --caps:${t.type.caps};
  --quote-style:${t.type.quoteStyle};

  --fs-micro:${paso(t, -1.6)}px;
  --fs-small:${paso(t, -1)}px;
  --fs-body:${paso(t, 0)}px;
  --fs-lead:${paso(t, 0.6)}px;
  --fs-h3:${fluido(t, 1, 4.4, 1.8)};
  --fs-h2:${fluido(t, 2, 7, 4)};
  --fs-display:${fluido(t, 4, 13, 6)};
  --fs-number:${fluido(t, 1.6, 6.4, 3)};

  --radius:${t.shape.radius}px; --radius-sm:${t.shape.radiusSm}px;
  --btn-radius:${radioBoton(t)};
  --border:${t.shape.border}px;
  --shadow:${sombra(t)};

  --pad-y:${padY}px; --pad-y-alt:${padYAlt}px;
  --gap:${Math.round(padY / 4)}px;

  --panel-rgb:${t.panelRgb};
  --panel-alpha:${t.panelAlpha};
  --hero-bg:${t.heroBg || p.bgAlt};
  --splash-bg:${t.splashBg || p.bg};
  --hero-ink:${t.heroInk === "light" ? "#fff" : p.ink};
  --hero-ink-soft:${t.heroInk === "light" ? "rgba(255,255,255,.84)" : p.muted};
  --hero-line:${t.heroInk === "light" ? "rgba(255,255,255,.4)" : p.line};
  --hero-brand:${t.heroBrand || p.brand};
  --hero-accent:${t.heroAccent || p.accent};
  --hero-on-accent:${t.heroOnAccent || p.onAccent};

  /* Los componentes que inyecta el renderer. Mismos valores, otro prefijo. */
  --inv-accent:${p.accent}; --inv-on-accent:${p.onAccent};
  --inv-ink:${p.ink}; --inv-surface:${p.card};
  --inv-field-bg:${p.card}; --inv-field-ink:${p.ink}; --inv-field-border:${p.line};
  --inv-focus:${alpha(p.accent, 0.24)};
  --inv-radius:${t.shape.radiusSm}px; --inv-btn-radius:${radioBoton(t)};
  --inv-font-ui:${t.type.body}; --inv-font-title:${t.type.display};
  --inv-tracking:${t.type.tracking}; --inv-caps:${t.type.caps};
}`;
}

/* ────────────────────────────────────────────────────────────────
   Base
   ──────────────────────────────────────────────────────────────── */

const RESET = `
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:var(--fs-body);line-height:1.62;overflow-x:hidden;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
h1,h2,h3{font-family:var(--display);font-weight:var(--display-weight);
  line-height:var(--display-leading);letter-spacing:var(--display-tracking)}
img,svg{display:block;max-width:100%}
a{color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}`;

/** Antetítulo, título y bajada. La cabecera de cada sección. */
const CABECERA = `
.section-label{font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);color:var(--brand);text-align:center}
.section-title{margin-top:10px;font-size:var(--fs-h2);text-align:center}
.ornament{display:grid;place-items:center;margin:18px auto 26px;color:var(--brand)}
.section-body{max-width:54ch;margin:18px auto 0;text-align:center;
  color:var(--muted);font-size:var(--fs-lead)}`;

const SECCIONES = `
section{position:relative;padding:var(--pad-y) 22px;overflow:hidden}
section.alt{background:var(--bg-alt)}
.container{width:min(780px,100%);margin:0 auto}
/* La cuadrícula de secciones anchas: la galería en mosaico se sale del texto. */
.container-wide{width:min(1040px,100%);margin:0 auto}`;

/* ────────────────────────────────────────────────────────────────
   Bienvenida
   ──────────────────────────────────────────────────────────────── */

const SPLASH = `
#splash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
  padding:22px;background:var(--splash-bg);overflow:hidden;
  transition:opacity .7s ease,visibility .7s ease}
#splash.hidden{opacity:0;visibility:hidden;pointer-events:none}
.splash-modal{position:relative;z-index:3;width:min(430px,100%);
  padding:44px 30px;text-align:center;
  background:rgba(var(--panel-rgb),var(--panel-alpha));
  border-radius:var(--radius);box-shadow:var(--shadow)}
.splash-subtitle{font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);color:var(--brand)}
.splash-name{margin:14px 0 12px;font-size:var(--fs-display);line-height:1}
.splash-date{margin-top:16px;font-size:var(--fs-small);
  letter-spacing:.14em;color:var(--muted)}
.splash-btns{display:flex;flex-direction:column;gap:10px;margin-top:28px}
/* Uno de los dos es un <a> al mapa y el otro un <button>: las tres primeras
   declaraciones son las que hacen que se vean iguales. */
.splash-btn{display:block;text-align:center;text-decoration:none;
  padding:14px 18px;border:var(--border) solid var(--accent);
  border-radius:var(--btn-radius);background:transparent;color:var(--accent);
  font:inherit;font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);cursor:pointer;transition:background .2s,color .2s}
.splash-btn:hover{background:var(--accent);color:var(--on-accent)}
.splash-btn-primary{background:var(--accent);color:var(--on-accent)}
.splash-btn-primary:hover{opacity:.9}`;

/* ────────────────────────────────────────────────────────────────
   Portada
   ──────────────────────────────────────────────────────────────── */

const HERO_BASE = `
#hero{position:relative;min-height:100svh;display:grid;place-items:center;
  padding:80px 22px;overflow:hidden;background:var(--hero-bg)}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;
  will-change:transform}
.hero-content{position:relative;z-index:3;width:min(470px,100%);
  padding:42px 30px;text-align:center;color:var(--hero-ink)}
.hero-label{font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);color:var(--hero-brand)}
.hero-name{margin:16px 0 10px;font-size:var(--fs-display);line-height:.98}
.hero-amp{display:block;margin:4px 0;font-size:.4em;line-height:1;
  color:var(--hero-brand);font-style:italic}
.splash-amp{display:block;margin:4px 0;font-size:.4em;line-height:1;
  color:var(--brand);font-style:italic}
.footer-names .amp{display:block;margin:4px 0;font-size:.4em;line-height:1;
  color:inherit;opacity:.7;font-style:italic}
.hero-sub{font-size:var(--fs-small);letter-spacing:var(--tracking);
  text-transform:var(--caps);color:var(--hero-ink-soft)}
.hero-date{margin-top:20px;padding-top:18px;border-top:var(--border) solid var(--hero-line);
  font-size:var(--fs-body);letter-spacing:.14em}
.hero-quote{margin-top:16px;font-size:var(--fs-small);
  font-style:var(--quote-style);color:var(--hero-ink-soft)}
.hero-btn{display:inline-block;margin-top:26px;padding:13px 28px;
  border-radius:var(--btn-radius);background:var(--hero-accent);
  color:var(--hero-on-accent);text-decoration:none;font-size:var(--fs-micro);
  letter-spacing:var(--tracking);text-transform:var(--caps)}
.hero-scroll{position:absolute;left:50%;bottom:24px;z-index:3;
  transform:translateX(-50%);color:var(--hero-brand);animation:bob 2.2s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,9px)}}`;

/** Los seis slots de portada. Mismo marcado, sitio y piel distintos. */
const HERO: Record<Layout["hero"], string> = {
  panel: `
.hero-content{background:rgba(var(--panel-rgb),var(--panel-alpha));
  backdrop-filter:blur(10px);border-radius:var(--radius);box-shadow:var(--shadow)}`,

  editorial: `
/* Bloque sólido apoyado abajo a la izquierda: se lee sea la foto clara u
   oscura, que es justo lo que un panel translúcido no garantiza. */
#hero{place-items:end start;padding:22px}
.hero-content{width:min(430px,100%);text-align:left;background:var(--card);
  border-radius:0;padding:38px 34px}
.hero-content .hero-date{letter-spacing:.1em}
.hero-scroll{left:auto;right:26px;transform:none}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(9px)}}`,

  minimal: `
/* Sin panel: el texto va directo sobre la foto y lo sostiene un velo.
   El velo y el texto claro van detrás de \`.con-foto\`, que pone el renderer
   sólo cuando hay foto de portada. Sin esa guarda el texto salía blanco
   sobre el fondo claro del diseño, es decir invisible, hasta que alguien
   subía una imagen. */
.hero-content{background:transparent;box-shadow:none;width:min(560px,100%)}
#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;
  background:linear-gradient(180deg,rgba(0,0,0,.12) 0%,rgba(0,0,0,.52) 100%)}
#hero.con-foto{--hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.84);
  --hero-line:rgba(255,255,255,.4)}
#hero.con-foto{--hero-brand:rgba(255,255,255,.86)}
#hero.con-foto .hero-amp{color:#fff}
#hero.con-foto .hero-scroll{color:#fff}`,

  band: `
/* Banda de lado a lado a media altura. Es la única que sale del ancho. */
.hero-content{width:100%;max-width:none;border-radius:0;padding:40px 22px;
  background:rgba(var(--panel-rgb),calc(var(--panel-alpha) * .96));
  backdrop-filter:blur(6px)}
.hero-content>*{max-width:520px;margin-left:auto;margin-right:auto}`,

  split: `
/* Foto arriba, nombres abajo sobre el fondo del diseño: nada se superpone,
   así que la foto se ve entera y el texto no necesita velo. */
#hero{display:grid;grid-template-rows:54svh auto;place-items:stretch;
  padding:0;background:var(--bg)}
.hero-bg{position:relative;grid-row:1;inset:auto;width:100%;height:100%}
.hero-content{grid-row:2;width:min(560px,100%);margin:0 auto;
  padding:44px 26px 76px;background:transparent}
/* La decoración se queda en la fila de la foto. Cubriendo toda la portada
   se colaba detrás de los nombres —el trigo de Campestre cruzaba la frase—
   y aquí, a diferencia de los otros slots, el texto no tiene panel que lo
   despegue del fondo. */
#hero .deco{top:0;bottom:auto;height:54svh}`,

  frame: `
/* Doble marco de hilos. El texto no lleva fondo: lo enmarca el trazo. */
.hero-content{background:transparent;padding:52px 40px;
  box-shadow:0 0 0 var(--border) var(--brand),0 0 0 calc(var(--border) * 5) transparent,
    0 0 0 calc(var(--border) * 6) var(--brand)}
.hero-content .hero-date{border-top-color:var(--brand)}`,
};

/* ────────────────────────────────────────────────────────────────
   Cabecera de sección
   ──────────────────────────────────────────────────────────────── */

const HEAD: Record<Layout["head"], string> = {
  center: "",

  left: `
/* El único alineado a la izquierda. Con el filete a la altura del antetítulo,
   que es lo que evita que el bloque quede flotando. */
/* Todo el texto de la sección, no sólo el título: las bajadas viven en una
   clase por sección (.guests-text, .gifts-text, .confirmation-text…) y si no
   se nombran se quedan centradas en medio de un diseño alineado. */
:is(.section-label,.section-title,.section-body,.guests-text,.guests-address,
  .gallery-text,.gifts-text,.gifts-note,.confirmation-text,
  .confirmation-deadline,.social-sub){text-align:left;margin-left:0}
.section-label{display:flex;align-items:center;gap:14px}
.section-label::after{content:"";flex:1;height:var(--border);background:var(--line)}
.ornament{place-items:start;margin-left:0}
#social .container{text-align:left}
.gifts-account{margin-left:0}
.event-card,.feature-card,.gift-card,.guest-card{text-align:left}
.guest-avatar{margin-left:0}`,

  rule: `
/* Filete a los dos lados del título: el clásico de invitación, hecho con
   flex en vez de pseudo-elementos posicionados, así se adapta al texto. */
.section-title{display:flex;align-items:center;justify-content:center;gap:18px}
.section-title::before,.section-title::after{content:"";width:min(64px,12vw);
  height:var(--border);background:var(--line)}`,

  stacked: `
/* Dos pisos de título: el antetítulo en la tipografía de los títulos y el
   título mucho más grande debajo.
   
   El primer intento ponía el antetítulo grande y desvaído *detrás* del
   título, como una marca de agua. Con etiquetas de una palabra funcionaba,
   pero "Información útil" a ese tamaño se parte en dos líneas en un móvil y
   choca con el título: parecía un error de render. Lo que da escala aquí es
   la diferencia de tamaño entre los dos pisos, no la superposición. */
.section-label{font-family:var(--display);font-size:var(--fs-h3);
  letter-spacing:0;text-transform:none;color:var(--brand);opacity:.9;
  line-height:1.2}
.section-title{margin-top:2px;font-size:var(--fs-display);line-height:1}`,
};

/* ────────────────────────────────────────────────────────────────
   Tarjetas
   ──────────────────────────────────────────────────────────────── */

const TARJETAS = ".event-card,.feature-card,.gift-card,.guest-card";

const CARDS: Record<Layout["cards"], string> = {
  elevated: `
${TARJETAS}{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow)}`,

  outline: `
${TARJETAS}{background:transparent;border:var(--border) solid var(--line);
  border-radius:var(--radius);box-shadow:none}`,

  flat: `
${TARJETAS}{background:var(--bg-alt);border-radius:var(--radius);box-shadow:none}
section.alt ${TARJETAS.split(",").join(",section.alt ")}{background:var(--card)}`,

  rule: `
/* Sin caja: sólo un filete arriba. Es lo que necesitan los diseños que no
   quieren ninguna superficie flotando. */
${TARJETAS}{background:transparent;border:0;border-top:var(--border) solid var(--line);
  border-radius:0;box-shadow:none;padding-left:0;padding-right:0}`,
};

/* ────────────────────────────────────────────────────────────────
   Cuenta atrás
   ──────────────────────────────────────────────────────────────── */

/**
 * Cuatro columnas siempre. El `minmax(0,1fr)` es lo que hace falta: con
 * `1fr` a secas el contenido mínimo de cada celda ganaba y la cuadrícula se
 * partía 3+1 en Blanco Oro, Marsala y Vintage.
 */
const CD_BASE = `
.countdown-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  gap:clamp(6px,2vw,12px);max-width:460px;margin:32px auto 0}
.countdown-ring{min-width:0;display:grid;place-items:center}
.ring-inner{min-width:0;text-align:center}
.ring-number{display:block;font-family:var(--display);font-size:var(--fs-number);
  line-height:1;color:var(--brand);font-variant-numeric:tabular-nums}
.ring-label{display:block;margin-top:6px;font-size:var(--fs-micro);
  letter-spacing:.1em;text-transform:var(--caps);color:var(--muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;

const COUNTDOWN: Record<Layout["countdown"], string> = {
  tiles: `
.countdown-ring{aspect-ratio:1;background:var(--card);
  border-radius:var(--radius-sm);box-shadow:var(--shadow)}`,

  circles: `
.countdown-ring{aspect-ratio:1;border:var(--border) solid var(--accent);
  border-radius:50%;background:transparent}`,

  type: `
/* Sin caja, separados por filetes. El número es la pieza. */
.countdown-grid{gap:0}
.countdown-ring{padding:6px 0;border-left:var(--border) solid var(--line)}
.countdown-ring:first-child{border-left:0}
.ring-number{font-size:var(--fs-h2)}`,

  line: `
/* Todo en un renglón, para cuando la sección debe pesar poco. */
.countdown-grid{max-width:520px;gap:clamp(10px,3vw,22px)}
.countdown-ring{padding:0}
.ring-inner{display:flex;align-items:baseline;justify-content:center;gap:5px}
.ring-number{font-size:var(--fs-h3)}
.ring-label{margin-top:0;font-size:var(--fs-micro)}`,
};

/* ────────────────────────────────────────────────────────────────
   Galería
   ──────────────────────────────────────────────────────────────── */

/**
 * El marcador de cada hueco es neutro y sale del propio tema. Antes se
 * pintaba con un color muestreado de la sección, y en Blanco Oro y Marsala
 * las casillas vacías salían en azul y verde saturados: parecía roto.
 */
const GALERIA_BASE = `
.gallery-grid{display:grid;gap:clamp(6px,1.6vw,10px);margin-top:30px}
.gallery-item{position:relative;overflow:hidden;border-radius:var(--radius-sm);
  background:var(--bg-alt)}
.gallery-ph{display:grid;place-items:center;width:100%;height:100%;
  background:var(--bg-alt);background-size:cover;background-position:center;
  color:var(--brand);transition:transform .7s cubic-bezier(.2,.7,.3,1)}
.gallery-item:hover .gallery-ph{transform:scale(1.06)}
.gallery-ph-text{font-size:var(--fs-micro);letter-spacing:.12em;
  text-transform:var(--caps);opacity:.6}`;

const GALLERY: Record<Layout["gallery"], string> = {
  grid: `
.gallery-grid{grid-template-columns:repeat(3,1fr)}
.gallery-item{aspect-ratio:1}`,

  mosaic: `
/* La primera de cada seis ocupa el doble: rompe la retícula sin desordenarla. */
.gallery-grid{grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr}
.gallery-item{aspect-ratio:1}
.gallery-item:nth-child(6n+1){grid-column:span 2;grid-row:span 2;aspect-ratio:auto}`,

  stack: `
/* Una columna ancha. Para diseños que esperan fotos verticales. */
.gallery-grid{grid-template-columns:repeat(2,1fr);max-width:620px;margin-inline:auto}
.gallery-item{aspect-ratio:3/4}
.gallery-item:nth-child(3n+1){grid-column:1 / -1;aspect-ratio:16/10}`,
};

/* ────────────────────────────────────────────────────────────────
   Filo entre la portada y el resto
   ──────────────────────────────────────────────────────────────── */

const DIVIDER: Record<Layout["divider"], string> = {
  none: `.divider{display:none}`,
  rule: `
.divider{height:0;border-top:var(--border) solid var(--line);
  width:min(120px,30vw);margin:0 auto}`,
  wave: `
.divider{height:46px;margin-top:-46px;position:relative;z-index:4;
  background:var(--bg);
  -webkit-mask:radial-gradient(60% 100% at 50% 100%,#000 99%,transparent 100%);
  mask:radial-gradient(60% 100% at 50% 100%,#000 99%,transparent 100%)}`,
  torn: `
/* Borde rasgado hecho con degradados cónicos: sin imágenes externas. */
.divider{height:14px;margin-top:-14px;position:relative;z-index:4;
  background:repeating-conic-gradient(from -45deg at 50% 0,
    var(--bg) 0deg 90deg,transparent 90deg 180deg) 0 0/22px 14px}`,
  arc: `
.divider{height:52px;margin-top:-52px;position:relative;z-index:4;
  background:var(--bg);border-radius:50% 50% 0 0/100% 100% 0 0}`,
};

/* ────────────────────────────────────────────────────────────────
   El resto de las secciones
   ──────────────────────────────────────────────────────────────── */

const CUERPO = `
/* ── Invitados ── */
.guests-text{max-width:52ch;margin:0 auto 12px;text-align:center;
  color:var(--muted);font-size:var(--fs-lead)}
.guests-address{margin-top:16px;text-align:center;font-size:var(--fs-small);
  letter-spacing:.14em;text-transform:var(--caps);color:var(--brand)}
.guests-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
  gap:12px;margin-top:30px}
.guest-card{padding:22px 14px;text-align:center}
.guest-avatar{display:grid;place-items:center;width:48px;height:48px;
  margin:0 auto 12px;border-radius:50%;background:var(--bg-alt);
  font-family:var(--display);font-size:var(--fs-h3);color:var(--brand)}
.guest-name{font-weight:600;font-size:var(--fs-body)}
.guest-role{margin-top:2px;font-size:var(--fs-small);color:var(--muted)}

/* ── Programa ── */
.events-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(252px,1fr));
  gap:16px;margin-top:32px}
.event-card{padding:30px 22px;text-align:center}
.event-icon{display:block;font-size:var(--fs-h2);line-height:1;color:var(--brand)}
.event-type{margin-top:14px;font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);color:var(--brand)}
.event-title{margin-top:6px;font-size:var(--fs-h3)}
.event-time{margin-top:12px;font-weight:600;font-size:var(--fs-body)}
.event-place{margin-top:6px;color:var(--muted);font-size:var(--fs-small)}
.event-place small{display:block;margin-top:3px;font-size:var(--fs-micro);opacity:.9}
.event-note{margin-top:10px;font-size:var(--fs-small);
  font-style:var(--quote-style);color:var(--muted)}
.event-map-btn{display:inline-block;margin-top:18px;padding:10px 20px;
  border:var(--border) solid var(--accent);border-radius:var(--btn-radius);
  color:var(--accent);text-decoration:none;font-size:var(--fs-micro);
  letter-spacing:var(--tracking);text-transform:var(--caps)}
.event-map-btn:hover{background:var(--accent);color:var(--on-accent)}

/* ── Confirmación ──
   El renderer reemplaza este formulario por su propio componente; lo que
   queda aquí es lo que se ve mientras se edita y en el diseño de muestra. */
.confirmation-text{max-width:48ch;margin:0 auto;text-align:center;
  color:var(--muted);font-size:var(--fs-lead)}
.confirmation-text strong{color:var(--ink);font-weight:600}
.confirmation-deadline{margin-top:14px;text-align:center;
  font-family:var(--display);font-size:var(--fs-h3);color:var(--brand)}
.confirm-form{display:flex;flex-direction:column;gap:11px;max-width:410px;
  margin:30px auto 0}
.confirm-input{width:100%;padding:14px 16px;font:inherit;font-size:var(--fs-body);
  color:var(--ink);background:var(--card);
  border:var(--border) solid var(--line);border-radius:var(--radius-sm)}
.confirm-input:focus{outline:none;border-color:var(--accent);
  box-shadow:0 0 0 3px var(--inv-focus)}
.confirm-btn{padding:16px;border:0;border-radius:var(--btn-radius);
  background:var(--accent);color:var(--on-accent);font:inherit;
  font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);cursor:pointer}

/* ── Galería y su bajada ── */
.gallery-text{max-width:50ch;margin:0 auto;text-align:center;
  color:var(--muted);font-size:var(--fs-lead)}

/* ── Información útil ── */
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(196px,1fr));
  gap:14px;margin-top:32px}
.feature-card{padding:26px 18px;text-align:center}
.feature-icon{display:block;font-size:var(--fs-h3);line-height:1;color:var(--brand)}
.feature-title{margin-top:12px;font-size:var(--fs-h3)}
.feature-text{margin-top:7px;font-size:var(--fs-small);color:var(--muted)}

/* ── Mesa de regalos ── */
.gifts-text{max-width:50ch;margin:0 auto;text-align:center;
  color:var(--muted);font-size:var(--fs-lead)}
.gifts-account{max-width:350px;margin:26px auto 0;padding:22px;text-align:center;
  background:var(--card);border:var(--border) dashed var(--accent);
  border-radius:var(--radius-sm)}
.gifts-bank{font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);color:var(--brand)}
.gifts-iban{margin-top:8px;font-size:var(--fs-body);letter-spacing:.05em;font-weight:600}
.gifts-note{margin-top:14px;text-align:center;font-size:var(--fs-small);color:var(--muted)}
.gifts-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(186px,1fr));
  gap:12px;margin-top:28px}
.gift-card{padding:24px 16px;text-align:center}
.gift-icon{display:block;font-size:var(--fs-h3);line-height:1;color:var(--brand)}
.gift-title{margin-top:10px;font-size:var(--fs-h3)}
.gift-desc{margin-top:5px;font-size:var(--fs-small);color:var(--muted)}
.gift-link{display:inline-block;margin-top:12px;font-size:var(--fs-micro);
  letter-spacing:var(--tracking);text-transform:var(--caps);color:var(--accent)}
.gifts-btn{display:block;width:max-content;max-width:100%;margin:28px auto 0;
  padding:15px 30px;border-radius:var(--btn-radius);background:var(--accent);
  color:var(--on-accent);text-decoration:none;font-size:var(--fs-micro);
  letter-spacing:var(--tracking);text-transform:var(--caps)}

/* ── Redes ── */
#social .container{text-align:center}
.social-sub{max-width:46ch;margin:0 auto;color:var(--muted);font-size:var(--fs-lead)}
.social-hashtag{display:block;margin-top:18px;font-family:var(--display);
  font-size:var(--fs-h2);color:var(--brand)}
.social-ig{display:inline-block;margin-top:14px;padding:11px 24px;
  border:var(--border) solid var(--accent);border-radius:var(--btn-radius);
  color:var(--accent);text-decoration:none;font-size:var(--fs-micro);
  letter-spacing:var(--tracking);text-transform:var(--caps)}
.social-ig:hover{background:var(--accent);color:var(--on-accent)}

/* ── Pie ── */
footer{position:relative;padding:56px 22px;text-align:center;
  background:var(--footer-bg);color:var(--footer-ink);overflow:hidden}
.footer-names{font-family:var(--display);font-size:var(--fs-h2);line-height:1}
.footer-date{margin-top:12px;font-size:var(--fs-small);letter-spacing:.16em;opacity:.8}
.footer-copy{margin-top:20px;font-size:var(--fs-micro);letter-spacing:var(--tracking);
  text-transform:var(--caps);opacity:.6}

/* ── Barra de progreso de lectura ── */
.progress{position:fixed;top:0;left:0;right:0;z-index:9998;height:2px;
  background:transparent;pointer-events:none}
.progress i{display:block;height:100%;width:0;background:var(--accent);
  transition:width .1s linear}`;

/* ────────────────────────────────────────────────────────────────
   Movimiento
   ──────────────────────────────────────────────────────────────── */

/**
 * El `.js` lo pone un script en el `<head>`. Sin esa guarda un fallo de
 * JavaScript deja la invitación en blanco, que es exactamente lo que pasó
 * una vez.
 */
const MOVIMIENTO = `
.js .reveal{opacity:0;transform:translateY(26px);
  transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.3,1)}
.js .reveal.in{opacity:1;transform:none}

/* Las tarjetas de cada grilla entran en cascada, no todas de golpe. */
.js .reveal :is(.countdown-grid,.guests-grid,.events-grid,.features-grid,
  .gifts-cards,.gallery-grid)>*{
  opacity:0;transform:translateY(16px) scale(.985);
  transition:opacity .55s ease,transform .55s cubic-bezier(.2,.7,.3,1)}
.js .reveal.in :is(.countdown-grid,.guests-grid,.events-grid,.features-grid,
  .gifts-cards,.gallery-grid)>*{opacity:1;transform:none}
.js .reveal.in :is(.countdown-grid,.guests-grid,.events-grid,.features-grid,
  .gifts-cards,.gallery-grid)>:nth-child(1){transition-delay:.10s}
.js .reveal.in :is(.countdown-grid,.guests-grid,.events-grid,.features-grid,
  .gifts-cards,.gallery-grid)>:nth-child(2){transition-delay:.18s}
.js .reveal.in :is(.countdown-grid,.guests-grid,.events-grid,.features-grid,
  .gifts-cards,.gallery-grid)>:nth-child(3){transition-delay:.26s}
.js .reveal.in :is(.countdown-grid,.guests-grid,.events-grid,.features-grid,
  .gifts-cards,.gallery-grid)>:nth-child(4){transition-delay:.34s}
.js .reveal.in :is(.gallery-grid,.guests-grid)>:nth-child(5){transition-delay:.42s}
.js .reveal.in :is(.gallery-grid,.guests-grid)>:nth-child(6){transition-delay:.50s}

/* Los segundos laten al cambiar. */
.ring-number.tick{animation:pulse .45s ease}
@keyframes pulse{0%{transform:scale(1)}35%{transform:scale(1.14)}100%{transform:scale(1)}}

.hero-btn,.gifts-btn,.confirm-btn,.splash-btn,.event-map-btn,.social-ig{
  transition:transform .25s ease,opacity .25s ease,background .25s ease,
    color .25s ease,box-shadow .25s ease}
.hero-btn:hover,.gifts-btn:hover,.confirm-btn:hover{transform:translateY(-2px)}
.event-card,.feature-card,.gift-card,.guest-card{
  transition:transform .35s cubic-bezier(.2,.7,.3,1),box-shadow .35s ease}
.event-card:hover,.feature-card:hover,.gift-card:hover{transform:translateY(-4px)}
#splash.hidden .splash-modal{transform:scale(.96);opacity:0;
  transition:transform .5s ease,opacity .4s ease}

@media (prefers-reduced-motion:reduce){
  .js .reveal,.js .reveal :is(.countdown-grid,.guests-grid,.events-grid,
    .features-grid,.gifts-cards,.gallery-grid)>*{
    opacity:1;transform:none;transition:none}
  .hero-scroll{animation:none}
  .gallery-item:hover .gallery-ph{transform:none}
  .ring-number.tick{animation:none}
  .progress{display:none}
  .event-card:hover,.feature-card:hover,.gift-card:hover,
  .hero-btn:hover,.gifts-btn:hover,.confirm-btn:hover{transform:none}
}

@media (max-width:430px){
  section{padding:calc(var(--pad-y) * .78) 18px}
  .hero-content{padding:34px 22px}
  .splash-modal{padding:34px 22px}
}`;

/* ────────────────────────────────────────────────────────────────
   La hoja completa
   ──────────────────────────────────────────────────────────────── */

/**
 * El orden importa y es este: **primero toda la base, después los slots.**
 *
 * Al principio los slots iban intercalados y `CUERPO` quedaba al final, así
 * que su `.event-card{text-align:center}` le pisaba el `text-align:left` del
 * slot `head:left` y las tarjetas de Editorial salían centradas en un diseño
 * alineado a la izquierda. Los slots son variaciones sobre la base: tienen
 * que venir después de ella, no en medio.
 */
export function baseCss(t: Theme, l: Layout): string {
  return [
    /* Base */
    variables(t),
    RESET,
    SPLASH,
    HERO_BASE,
    SECCIONES,
    CABECERA,
    CD_BASE,
    GALERIA_BASE,
    CUERPO,
    DECO_CSS,
    /* Slots: variaciones sobre lo anterior */
    HERO[l.hero],
    HEAD[l.head],
    COUNTDOWN[l.countdown],
    GALLERY[l.gallery],
    CARDS[l.cards],
    DIVIDER[l.divider],
    /* Movimiento, al final: apaga cosas de todo lo de arriba */
    MOVIMIENTO,
  ].join("\n");
}
