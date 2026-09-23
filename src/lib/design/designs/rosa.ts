/**
 * Quince Rosa Encantada.
 *
 * Un cuento de princesa en amarillo y oro, **sin personajes ni marcas**: la
 * rosa bajo la campana, el salón dorado y el libro. Sale del HTML hecho a
 * mano, con adornos de Grok recortados a PNG.
 *
 * Lo interactivo son componentes de la app, que se eligen desde el editor
 * y sirven en cualquier diseño: el velo «libro de cuentos», el programa por
 * «capítulos», «Agendar» y los pétalos, que son la partícula con imagen
 * propia apuntando al pétalo de este diseño.
 *
 * Alterna pergamino (el papel del cuento) y ámbar (la noche del salón). La
 * noche sale del color del pie de la paleta, así que cambia con ella.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/rosa";

/* El amarillo manda, pero el acento no puede ser amarillo puro: un botón
   amarillo sobre pergamino no se distingue y su letra no se lee. El acento
   es el oro hondo, y el amarillo vive donde no lleva texto. */
const ROSA_ORO = paleta({
  id: "rosa-oro", nombre: "Amarillo y oro",
  base: "#fdf6e3", tinta: "#2a1c0e", marca: "#8a6414", acento: "#8a6414", segundo: "#e0b23c",
});
const MIEL = paleta({
  id: "miel", nombre: "Miel y crema",
  base: "#fdf3e6", tinta: "#33220f", marca: "#9a6a24", acento: "#9a6a24", segundo: "#e8b45c",
});
const AMBAR = paleta({
  id: "ambar-noche", nombre: "Ámbar de noche",
  base: "#241809", tinta: "#fdf3dc", marca: "#e8c163", acento: "#e0b23c", segundo: "#ffd85e",
});
const ROSAL = paleta({
  id: "rosal", nombre: "Rosa y oro viejo",
  base: "#fdf2ef", tinta: "#33201c", marca: "#9c5a52", acento: "#9c5a52", segundo: "#e0b23c",
});

/* La noche: la cuenta atrás, los regalos y el pie, más sus bloques. */
const NOCHE =
  ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts)";

const css = () => `
:root{--ros-caps:'Cinzel',Georgia,serif;--ros-script:'Tangerine',cursive;
  --ros-noche:var(--footer-bg);--ros-noche-ink:var(--footer-ink);
  --ros-oro:var(--brand-2);
  --ros-oro-claro:color-mix(in srgb,var(--brand-2) 45%,#fff);
  --ros-oro-hondo:color-mix(in srgb,var(--brand-2) 62%,#000);
  --ros-lamina:linear-gradient(100deg,var(--ros-oro-hondo) 0%,var(--brand-2) 20%,
    color-mix(in srgb,var(--brand-2) 20%,#fff) 42%,var(--brand-2) 58%,
    var(--ros-oro-hondo) 82%,var(--brand-2) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-sobre-pista{font-family:var(--ros-caps)}
.section-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em}
.section-title{font-style:italic;font-weight:500;font-size:clamp(40px,11.5vw,56px);line-height:1.08}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
/* Tangerine es una caligrafía muy fina y pequeña de caja: pide bastante más
   tamaño que una serifa para pesar lo mismo. */
.hero-name,.splash-name,.footer-names,#splash .inv-libro-nombre{font-family:var(--ros-script);
  font-weight:700;background:var(--ros-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:rosBrillo 7s ease-in-out infinite}
@keyframes rosBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes rosFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

.ornament{margin:2px auto 24px}
.ros-divisor{display:block;width:min(80%,330px);margin:0 auto;pointer-events:none}

/* ── Bienvenida ── */
#splash{background:radial-gradient(100% 70% at 50% 35%,
  color-mix(in srgb,var(--ros-noche) 82%,var(--brand-2)),var(--ros-noche))}
.splash-modal{background:var(--card);color:var(--ink);border-radius:8px;
  box-shadow:0 30px 70px -22px rgba(0,0,0,.7),inset 0 0 0 1px color-mix(in srgb,var(--ros-oro) 40%,transparent)}
.splash-modal::before{content:"";display:block;width:150px;height:78px;margin:0 auto 6px;
  background:url(${A}/corona.png) center/contain no-repeat;
  filter:drop-shadow(0 4px 14px color-mix(in srgb,var(--ros-oro) 45%,transparent))}
.splash-name{font-size:clamp(84px,25vw,120px);line-height:.95;padding-top:.06em}
.splash-subtitle{letter-spacing:.4em}
.splash-date{font-family:var(--ros-caps);letter-spacing:.24em}
/* El libro del velo, con la tapa de este diseño. */
#splash.inv-velo-libro{--inv-libro-img:url(${A}/libro.png)}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(60px + env(safe-area-inset-bottom));
  background:var(--ros-noche);
  --hero-ink:#fff8e6;--hero-ink-soft:rgba(255,248,230,.86);--hero-line:rgba(255,248,230,.3);
  --hero-brand:var(--ros-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 40%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.1) 0%,transparent 28%,
    color-mix(in srgb,var(--ros-noche) 62%,transparent) 62%,var(--ros-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--ros-noche) 45%,transparent),
    transparent) center/130% 115% no-repeat}
.hero-content::before{content:"";display:block;width:min(56vw,230px);aspect-ratio:1.9;margin:0 auto 2px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:rosFlota 5.5s ease-in-out infinite;
  filter:drop-shadow(0 6px 20px color-mix(in srgb,var(--ros-oro) 50%,transparent))}
.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;margin:0;
  text-shadow:0 1px 12px rgba(0,0,0,.5)}
.hero-name{font-size:clamp(96px,30vw,164px);line-height:.92;margin:0;padding:.06em .08em 0;
  filter:drop-shadow(0 2px 14px rgba(0,0,0,.5))}
.hero-sub{font-family:var(--ros-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:4px;font-family:var(--ros-caps);
  font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:14px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--ros-oro-claro)}

/* ── Pergamino ── */
section{padding:100px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
#guests{padding-top:116px;padding-bottom:124px;background:linear-gradient(var(--bg-alt),var(--bg))}
#guests .container::before{content:"";display:block;width:min(52vw,210px);aspect-ratio:.84;margin:0 auto 12px;
  background:url(${A}/ramo.png) center/contain no-repeat}
#confirmation{padding-bottom:132px;background:linear-gradient(var(--bg-alt),var(--bg))}
#features{padding-top:120px;background:linear-gradient(var(--bg-alt),var(--bg))}
.feature-card{background:var(--card);border-radius:18px;
  box-shadow:0 16px 30px -22px color-mix(in srgb,var(--ink) 55%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--ros-oro) 28%,transparent)}
.feature-icon{color:var(--ros-oro-hondo)}
.feature-title{font-family:var(--ros-caps);font-weight:600;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}
/* ── El programa: páginas del cuento ──
   La forma es la de la variante «Capítulos», pero puesta en el marcado de
   siempre: quien no cambie nada ya ve las páginas de pergamino con su
   lomo dorado, y quien elija la variante gana además el giro al entrar. */
#events .events-grid{display:block;max-width:440px;margin:18px auto 0}
/* En columna y con orden propio: en el cuento la hora va primero y el
   momento debajo, al revés del marcado de siempre. */
#events .event-card{position:relative;display:flex;flex-direction:column;margin:0 0 12px;
  padding:18px 20px 18px 86px;text-align:left;border-radius:4px 12px 12px 4px;
  background:var(--card);
  box-shadow:0 18px 30px -24px color-mix(in srgb,var(--ink) 60%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--ros-oro) 28%,transparent)}
#events .event-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;
  border-radius:4px 0 0 4px;background:linear-gradient(var(--ros-oro-hondo),var(--brand-2),var(--ros-oro-hondo))}
/* El número del momento, en su propia columna y centrado: un «VIII» es tres
   veces más ancho que un «I», y sin ancho fijo se mete bajo el texto. */
#events .event-icon{position:absolute;left:14px;top:50%;translate:0 -50%;width:60px;text-align:center;
  font-family:var(--ros-caps);font-weight:600;font-size:24px;letter-spacing:.04em;line-height:1;
  color:var(--brand)}
#events :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
#events .event-time{order:1;font-family:var(--ros-caps);font-size:12.5px;letter-spacing:.2em;
  color:var(--ros-oro-hondo)}
#events .event-type{order:2;font-family:var(--ros-caps);font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--muted)}
#events .event-title{order:3;font-style:italic;font-weight:500;font-size:24px;line-height:1.2;color:var(--ink)}
#events .event-place{order:4;margin-top:4px;font-size:15px}
#events .event-note{order:5;margin-top:4px}
#events .event-map-btn{order:6;align-self:flex-start;margin-top:10px}
#events .event-icon{order:0}

/* El candelabro preside la ubicación, que casi siempre es un bloque. */
.inv-block-ubicacion .container::before{content:"";display:block;width:min(30vw,130px);aspect-ratio:.62;
  margin:0 auto 8px;background:url(${A}/candelabro.png) center/contain no-repeat;
  filter:drop-shadow(0 0 22px color-mix(in srgb,var(--ros-oro) 35%,transparent))}

/* ── Ámbar ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--ros-noche) 82%,var(--brand-2)),var(--ros-noche));color:var(--ros-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--ros-oro)}
${NOCHE} .section-title{color:#fff8e6}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note){
  color:color-mix(in srgb,var(--ros-noche-ink) 84%,transparent)}
/* La rosa bajo la campana, con su resplandor que late. */
#countdown .container::before,#gifts .container::before{content:"";display:block;
  width:min(58vw,240px);aspect-ratio:.66;margin:0 auto 4px;
  background:url(${A}/rosa.png) center/contain no-repeat;
  filter:drop-shadow(0 0 34px color-mix(in srgb,var(--brand-2) 40%,transparent))}
#gifts .container::before{width:120px}
/* El resplandor va en la propia rosa y no en una capa aparte: puesta a una
   altura fija se descuadraba en cuanto el título ocupaba dos renglones. */
#countdown .container::before{animation:rosPalpita 4s ease-in-out infinite}
@keyframes rosPalpita{0%,100%{filter:drop-shadow(0 0 24px color-mix(in srgb,var(--brand-2) 30%,transparent))}
  50%{filter:drop-shadow(0 0 46px color-mix(in srgb,var(--brand-2) 60%,transparent))}}
.countdown-grid{max-width:420px;margin:22px auto 0;gap:10px}
${NOCHE} .countdown-ring{border-radius:14px;border:0;background:rgba(255,246,226,.06);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ros-oro) 40%,transparent)}
${NOCHE} :is([data-cd],.ring-number){font-family:var(--ros-caps);font-weight:400;color:var(--ros-oro-claro)}
${NOCHE} .ring-label{font-size:10px;letter-spacing:.2em;
  color:color-mix(in srgb,var(--ros-noche-ink) 70%,transparent)}
.gifts-account{background:rgba(255,246,226,.05);border-color:var(--ros-oro)}
.gifts-bank{color:var(--ros-oro)}

/* ── Botones: lámina de oro ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,color-mix(in srgb,var(--accent) 80%,#000),var(--accent) 30%,
    color-mix(in srgb,var(--accent) 45%,var(--brand-2)) 52%,var(--accent) 74%,
    color-mix(in srgb,var(--accent) 80%,#000));
  background-size:220% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--accent) 85%,#000);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}

/* ── Pie ── */
footer{padding:86px 24px calc(76px + env(safe-area-inset-bottom));background:var(--ros-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:170px;height:88px;margin:0 auto 2px;
  background:url(${A}/corona.png) center/contain no-repeat}
.footer-names{font-size:104px;line-height:.95;padding-top:.06em}
.footer-date{font-family:var(--ros-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;color:var(--ros-oro-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.hero-content::before,
  #countdown .container::before{animation:none}
}`;

export const rosa: Design = {
  slug: "15-rosa",
  name: "Quince Rosa Encantada",
  occasion: "quince",
  mood: "Cuento en amarillo y oro: salón dorado, rosa bajo la campana y páginas de pergamino",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Tangerine:wght@400;700"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 500,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.3em",
  },
  shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [ROSA_ORO, MIEL, AMBAR, ROSAL],
  /* Las páginas del cuento, con su giro al entrar. */
  variantes: { events: "capitulos" },
  css,
  /*
   * Los adornos que trae puestos.
   *
   * Entran en los datos al crear la invitación, así que se mueven, se
   * encogen o se borran desde el editor. Antes eran capas de `background`
   * en el CSS de la sección y no había manera de tocarlos.
   */
  adornos: [
    /* La filigrana que va bajo cada título. Como adorno y no sólo en el
       CSS: así se puede mover, encoger o quitar de una sección suelta. */
    { seccion: "*", url: `${A}/divisor.png`, sitio: "titulo", tamano: 72 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 32 },
    { seccion: "guests", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 32 },
    { seccion: "confirm", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 32 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 28 },
  ],
  deco: {
    ornament: () => `<img class="ros-divisor" src="${A}/divisor.png" alt="">`,
  },
};
