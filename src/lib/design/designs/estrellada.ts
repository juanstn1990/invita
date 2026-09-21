/**
 * Quince Noche Estrellada.
 *
 * Sale del HTML «noche estrellada» hecho a mano, con adornos de Grok
 * recortados a PNG (luna, divisor, esquinas de plata, constelación, nubes,
 * sello). Como Dorado, lo interactivo son componentes de la app que se
 * eligen desde el editor: el velo «pide un deseo», la partícula «cielo
 * estrellado», la cuenta atrás «órbitas», el programa «constelación» y las
 * fichas «rasca y descubre».
 *
 * ── La noche es el fondo, no una sección ─────────────────────────
 *
 * Al revés que Farolillos o Dorado, aquí la página entera es de noche y las
 * secciones de noche son **transparentes**: así el cielo —el de estrellas
 * fijas del propio diseño, o la partícula «cielo estrellado» si se elige—
 * se ve de arriba abajo sin cortes. Las secciones de bruma (lavanda) lo
 * tapan, y en ellas se **redefinen las variables** de color: tinta oscura,
 * acento oscuro, superficie blanca. Cualquier componente que caiga ahí —la
 * confirmación, el rasca, la ficha de ubicación— se lee sin saber nada de
 * este diseño.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/estrellada";

const NOCHE = paleta({
  id: "estrellada", nombre: "Azul noche y plata",
  base: "#0b1026", tinta: "#eef0fa", marca: "#e6cf98", acento: "#c9d1e6", segundo: "#8ea3dc",
});
const VIOLETA = paleta({
  id: "violeta-noche", nombre: "Violeta y plata",
  base: "#140f2e", tinta: "#f1ecfb", marca: "#dcc58e", acento: "#d5cdf0", segundo: "#a592d6",
});
const OCEANO = paleta({
  id: "oceano-noche", nombre: "Azul océano",
  base: "#06182b", tinta: "#e8f1f8", marca: "#e0c98e", acento: "#bfd3e6", segundo: "#7fb0d6",
});
const NEGRO = paleta({
  id: "negro-plata", nombre: "Negro y plata",
  base: "#0a0a10", tinta: "#f0f0f5", marca: "#d6d9e6", acento: "#d6d9e6", segundo: "#9aa3c0",
});

/* Las secciones de bruma: las del diseño y los bloques propios que suelen
   llevar texto largo, que se lee mejor sobre claro. */
const BRUMA =
  ":is(#guests,#features,#gallery,.inv-block-features,.inv-block-gallery," +
  ".inv-block-paragraph,.inv-block-ubicacion)";

/* Estrellas fijas en CSS: el cielo existe aunque no se elija la partícula,
   y no cuesta ni un script. Un mosaico de 320 px con un puñado de puntos. */
const ESTRELLAS = [
  [12, 18, 1.2], [44, 62, .8], [70, 30, 1.4], [88, 80, .9], [26, 88, 1], [58, 8, .7],
  [8, 50, .8], [36, 40, .6], [80, 52, 1.1], [64, 92, .7], [94, 14, .8], [18, 70, .6],
]
  .map(([x, y, r]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%,rgba(255,255,255,.9) 50%,transparent 100%)`)
  .join(",");

const css = () => `
:root{--est-caps:'Cinzel',Georgia,serif;--est-script:'Allura',cursive;
  --est-plata:var(--accent);--est-azul:var(--brand-2);--est-oro:var(--brand);
  --est-lamina:linear-gradient(100deg,color-mix(in srgb,var(--accent) 55%,#000) 0%,var(--accent) 20%,#fff 40%,
    var(--brand) 52%,var(--accent) 66%,color-mix(in srgb,var(--accent) 55%,#000) 84%,var(--accent) 100%);
  --est-bruma:color-mix(in srgb,var(--ink) 93%,var(--brand-2));
  --est-bruma-2:color-mix(in srgb,var(--ink) 86%,var(--brand-2))}
body{background:${ESTRELLAS} 0 0/320px 320px repeat,
  radial-gradient(120% 80% at 50% 0%,color-mix(in srgb,var(--bg) 78%,var(--brand-2)),var(--bg) 60%) fixed,
  var(--bg)}
/* El cielo de la partícula va detrás del contenido: así asoma por las
   secciones de noche y se esconde detrás de la bruma. */
.inv-cielo{z-index:-1}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-deseo-pista{font-family:var(--est-caps)}
.section-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em}
.section-title{font-style:italic;font-weight:500;font-size:clamp(40px,11.5vw,58px);line-height:1.08}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
.hero-name,.splash-name,.footer-names,#splash .inv-sobre-nombre{font-family:var(--est-script);
  font-weight:400;background:var(--est-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:estBrillo 7s ease-in-out infinite}
@keyframes estBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes estFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes estDeriva{from{transform:translateX(-4%)}to{transform:translateX(4%)}}

.ornament{margin:4px auto 24px}
.est-divisor{display:block;width:min(78%,320px);margin:0 auto;pointer-events:none}

/* ── Bienvenida ── */
#splash{background:${ESTRELLAS} 0 0/320px 320px repeat,
  radial-gradient(110% 80% at 50% 30%,color-mix(in srgb,var(--bg) 75%,var(--brand-2)),var(--bg) 70%)}
.splash-modal{background:transparent;box-shadow:none;color:var(--ink)}
.splash-modal::before{content:"";display:block;width:min(42vw,170px);aspect-ratio:1;margin:0 auto 14px;
  background:url(${A}/luna.png) center/contain no-repeat;animation:estFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 0 30px color-mix(in srgb,var(--brand) 35%,transparent))}
.splash-name{font-size:clamp(70px,21vw,110px);line-height:1.1;padding-top:.1em}
.splash-subtitle{color:var(--brand);letter-spacing:.45em}
.splash-date{font-family:var(--est-caps);letter-spacing:.24em}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(64px + env(safe-area-inset-bottom));background:transparent;
  --hero-ink:#fff;--hero-ink-soft:rgba(238,240,250,.86);--hero-line:rgba(255,255,255,.3);--hero-brand:var(--brand)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,transparent 40%,color-mix(in srgb,var(--bg) 55%,transparent) 66%,var(--bg) 98%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--bg) 40%,transparent),transparent) center/130% 115% no-repeat}
.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;text-shadow:0 1px 12px rgba(0,0,0,.5)}
.hero-name{font-size:clamp(84px,26vw,140px);line-height:1.1;margin:0;padding:.14em .12em 0;
  filter:drop-shadow(0 0 18px color-mix(in srgb,var(--brand-2) 40%,transparent))}
.hero-sub{font-family:var(--est-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:6px;font-family:var(--est-caps);font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:16px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--accent)}

/* ── La noche: transparente, para que se vea el cielo ── */
section,section.alt,footer{background:transparent}
section{padding:100px 26px}
:is(#countdown,.inv-block-countdown) .container::before{content:"";display:block;width:110px;aspect-ratio:1;margin:0 auto 12px;
  background:url(${A}/luna.png) center/contain no-repeat;animation:estFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 0 24px color-mix(in srgb,var(--brand) 30%,transparent))}
:is(#gifts,.inv-block-gifts) .container::before{content:"";display:block;width:110px;aspect-ratio:1;margin:0 auto 12px;
  background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 0 20px color-mix(in srgb,var(--brand-2) 35%,transparent))}
#confirmation::after,.inv-block-confirm::after{content:"";position:absolute;left:-10%;right:-10%;bottom:-20px;height:160px;z-index:0;
  background:url(${A}/nubes.png) center bottom/contain no-repeat;opacity:.55;pointer-events:none;
  animation:estDeriva 30s ease-in-out infinite alternate}
#confirmation .container,.inv-block-confirm .container{position:relative;z-index:1}
#confirmation,.inv-block-confirm{padding-bottom:150px}
.countdown-ring{background:rgba(255,255,255,.04);border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
  border-radius:14px}
:is(#countdown,.inv-block-countdown) :is([data-cd],.ring-number){font-family:var(--est-caps);font-weight:400;color:#fff}
.ring-label{letter-spacing:.22em;font-size:10px}
.gifts-account{background:rgba(255,255,255,.05);border-color:color-mix(in srgb,var(--accent) 60%,transparent)}
.event-card{background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 25%,transparent)}
.event-time{color:var(--brand);letter-spacing:.2em;font-size:13px;font-weight:400}
.event-type{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:24px;
  letter-spacing:0;text-transform:none;color:#fff}
.event-title{font-family:var(--sans);font-size:16px;font-weight:400;color:var(--muted)}

/* ── La bruma ──
   Clara, con la plata pintada y las flores. Las variables se redefinen
   aquí dentro: todo lo que cae en la bruma —del diseño o de la app— pasa a
   tinta oscura y acento oscuro sin tener que conocerla. */
${BRUMA}{background:linear-gradient(var(--est-bruma),var(--est-bruma-2));
  --ink:var(--bg);--muted:color-mix(in srgb,var(--bg) 68%,var(--est-bruma));
  --brand:color-mix(in srgb,var(--bg) 50%,var(--brand-2));--line:color-mix(in srgb,var(--bg) 18%,transparent);
  --card:#fff;--accent:var(--bg);--on-accent:var(--ink-claro,#fff);
  --inv-ink:var(--bg);--inv-surface:#fff;--inv-accent:var(--bg);--inv-on-accent:#fff;
  --inv-field-bg:#fff;--inv-field-ink:var(--bg);--inv-field-border:color-mix(in srgb,var(--bg) 20%,transparent);
  color:var(--bg)}
${BRUMA} .section-title{color:var(--bg)}
${BRUMA} :is(.section-body,.guests-text,.gallery-text,.feature-text,.inv-mapa-dir){color:var(--muted)}
#guests{padding-top:110px;padding-bottom:130px;background:
  url(${A}/esquina.png) left 10px top 10px/min(34vw,170px) no-repeat,
  url(${A}/esquina-abajo.png) right 10px bottom 10px/min(34vw,170px) no-repeat,
  linear-gradient(var(--est-bruma),var(--est-bruma-2))}
#guests .container::before{content:"";display:block;width:min(64vw,260px);aspect-ratio:1.06;margin:0 auto 18px;
  background:url(${A}/constelacion.png) center/contain no-repeat;filter:brightness(.5) saturate(1.4)}
#features{background:url(${A}/esquina.png) left 10px top 10px/min(30vw,150px) no-repeat,
  linear-gradient(var(--est-bruma),var(--est-bruma-2));padding-top:120px}
${BRUMA} .feature-card{background:#fff;border-radius:18px;
  box-shadow:0 16px 30px -22px color-mix(in srgb,var(--bg) 50%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--bg) 14%,transparent)}
${BRUMA} .feature-title{font-family:var(--est-caps);font-weight:600;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}
${BRUMA} .inv-mapa-datos{background:#fff}

/* ── Botones: plata con un brillo; en la bruma, de noche ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--accent),#fff 45%,color-mix(in srgb,var(--accent) 60%,var(--brand)) 70%,var(--accent));
  background-size:220% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 10px 30px -12px color-mix(in srgb,var(--brand-2) 80%,transparent);transition:background-position .8s,transform .2s}
${BRUMA} :is(.inv-mapa-btn:not(.inv-agendar),.gifts-btn){
  background:linear-gradient(100deg,var(--bg),color-mix(in srgb,var(--bg) 70%,var(--brand-2)) 50%,var(--bg));
  background-size:220% 100%;color:#fff}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}

/* ── Pie ── */
footer{padding:90px 24px calc(80px + env(safe-area-inset-bottom));color:var(--ink)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:120px;aspect-ratio:1;margin:0 auto 6px;
  background:url(${A}/luna.png) center/contain no-repeat}
.footer-names{font-size:84px;line-height:1.2;padding-top:.1em}
.footer-date{font-family:var(--est-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;color:var(--accent);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.splash-modal::before,#countdown .container::before,
  #confirmation::after{animation:none}
}`;

export const estrellada: Design = {
  slug: "15-estrellada",
  name: "Quince Noche Estrellada",
  occasion: "quince",
  mood: "Cielo de estrellas de arriba abajo, luna de plata, constelaciones y secciones de bruma",
  fontUrl: gfont("family=Allura&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500"),
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
  palettes: [NOCHE, VIOLETA, OCEANO, NEGRO],
  /* La forma es el diseño: las órbitas y la constelación salen de fábrica,
     como en la invitación de la que nació. Se pueden cambiar en el editor. */
  variantes: { countdown: "orbitas", events: "constelacion" },
  css,
  deco: {
    ornament: () => `<img class="est-divisor" src="${A}/divisor.png" alt="">`,
  },
};
