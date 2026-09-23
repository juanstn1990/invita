/**
 * Quince Dorado: una gala en oro.
 *
 * Sale del HTML «dorado» hecho a mano, con adornos generados con Grok y
 * recortados a PNG (corona, filigrana, divisor, laurel, destello). Como
 * Farolillos, lo propio del diseño va en CSS y en las piezas de adorno; lo
 * interactivo del HTML original —el sobre con sello, la cuenta atrás de
 * paletas, las fichas que se voltean, «Agendar», el polvo de oro— no está
 * aquí: son componentes de la app (ver src/lib/componentes.ts) y se eligen
 * desde el editor, en éste y en cualquier otro diseño.
 *
 * · Portada: el salón de gala con la lámpara, la corona flotando sobre el
 *   nombre y el nombre en lámina de oro, con un brillo que lo recorre.
 * · Secciones de marfil y de noche; la noche es el color del pie de la
 *   paleta, así que cambia con ella.
 * · El oro decorativo sale del segundo color de la paleta (que no se ajusta
 *   por contraste: nunca lleva texto pequeño), y los botones, del acento.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/dorado";

const DORADO = paleta({
  id: "dorado", nombre: "Marfil y oro",
  base: "#fbf6ec", tinta: "#140f08", marca: "#8f6a26", acento: "#8a6a2c", segundo: "#d4af5a",
});
const CHAMPAN_ROSA = paleta({
  id: "champan-rosa", nombre: "Rubor y oro",
  base: "#fbf3ef", tinta: "#2b1a17", marca: "#9a5f58", acento: "#c9a14a", segundo: "#d4af5a",
});
const BLANCO_ORO = paleta({
  id: "blanco-oro", nombre: "Blanco y oro",
  base: "#ffffff", tinta: "#1a1712", marca: "#8a6a2c", acento: "#c9a14a", segundo: "#d4af5a",
});
const NEGRO_ORO = paleta({
  id: "negro-oro", nombre: "Negro y oro",
  base: "#120e09", tinta: "#f4ead6", marca: "#d9b56a", acento: "#c9a14a", segundo: "#d4af5a",
});

/* Las secciones de noche: el id de la sección del diseño y la clase del
   bloque, para que una variante de cuenta atrás o de regalos también vaya
   de noche. */
const NOCHE = ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts)";

const css = () => `
:root{--dor-caps:'Cinzel',Georgia,serif;--dor-script:'Pinyon Script',cursive;
  --dor-noche:var(--footer-bg);--dor-noche-ink:var(--footer-ink);
  --dor-oro:var(--brand-2);
  --dor-oro-claro:color-mix(in srgb,var(--brand-2) 50%,#fff);
  --dor-oro-hondo:color-mix(in srgb,var(--brand-2) 62%,#000);
  --dor-lamina:linear-gradient(100deg,var(--dor-oro-hondo) 0%,var(--dor-oro) 22%,
    color-mix(in srgb,var(--brand-2) 18%,#fff) 42%,var(--dor-oro) 58%,
    var(--dor-oro-hondo) 78%,var(--dor-oro) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn{font-family:var(--dor-caps)}
.section-label{font-size:12.5px;letter-spacing:.38em;padding-left:.38em}
.section-title{font-style:italic;font-weight:400;font-size:clamp(38px,11vw,56px);line-height:1.1}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{
  font-size:19px;line-height:1.6}

/* La lámina de oro: un degradado recortado a la letra que se desliza. */
.hero-name,.splash-name,.footer-names,#splash .inv-sobre-nombre{font-family:var(--dor-script);
  font-weight:400;background:var(--dor-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:dorBrillo 6s ease-in-out infinite}
@keyframes dorBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes dorFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes dorTitila{0%,100%{opacity:0;transform:scale(.4) rotate(0)}
  50%{opacity:1;transform:scale(1) rotate(45deg)}}

.ornament{margin:4px auto 24px}
.dor-divisor{display:block;width:min(76%,300px);margin:0 auto;pointer-events:none}

/* ── Bienvenida ── */
#splash{background:radial-gradient(90% 70% at 50% 40%,
  color-mix(in srgb,var(--dor-noche) 80%,var(--brand-2)),var(--dor-noche))}
.splash-modal{background:var(--card);color:var(--ink);border-radius:8px;
  box-shadow:0 30px 70px -22px rgba(0,0,0,.7),
    inset 0 0 0 1px color-mix(in srgb,var(--dor-oro) 45%,transparent)}
.splash-modal::before{content:"";display:block;width:120px;height:76px;margin:0 auto 8px;
  background:url(${A}/corona.png) center/contain no-repeat;
  filter:drop-shadow(0 4px 14px color-mix(in srgb,var(--dor-oro) 45%,transparent))}
.splash-name{font-size:clamp(64px,19vw,96px);line-height:1.15;padding-top:.08em}
.splash-subtitle{letter-spacing:.4em}
.splash-date{font-family:var(--dor-caps);letter-spacing:.24em}
/* El sobre con sello, en este diseño con el lacre dorado. */
#splash.inv-velo-sello{--inv-sello-img:url(${A}/sello.png)}
.inv-sobre-sello:not(.con-imagen){background:var(--inv-sello-img) center/contain no-repeat;
  box-shadow:none;color:transparent;filter:drop-shadow(0 6px 14px rgba(0,0,0,.4))}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(64px + env(safe-area-inset-bottom));
  background:var(--dor-noche);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,248,232,.86);--hero-line:rgba(255,255,255,.3);
  --hero-brand:var(--dor-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 35%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;
  pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.12) 0%,transparent 30%,
    color-mix(in srgb,var(--dor-noche) 60%,transparent) 60%,var(--dor-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--dor-noche) 45%,transparent),
    transparent) center/130% 115% no-repeat}
.hero-content::before{content:"";display:block;width:min(44vw,190px);aspect-ratio:1.6;
  margin:0 auto 4px;background:url(${A}/corona.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 22px color-mix(in srgb,var(--dor-oro) 45%,transparent));
  animation:dorFlota 5s ease-in-out infinite}
.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;
  text-shadow:0 1px 12px rgba(0,0,0,.5)}
.hero-name{font-size:clamp(78px,24vw,132px);line-height:1.15;margin:0;padding:.18em .1em 0;
  filter:drop-shadow(0 2px 14px rgba(0,0,0,.45))}
.hero-sub{font-family:var(--dor-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:8px;font-family:var(--dor-caps);
  font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:16px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--dor-oro-claro)}

/* ── Marfil ── */
section{padding:100px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
#guests,#confirmation,#gallery{background-repeat:no-repeat}
#guests{padding-top:120px;padding-bottom:130px;background:linear-gradient(var(--bg-alt),var(--bg))}
#confirmation{padding-bottom:140px;background:linear-gradient(var(--bg-alt),var(--bg))}
#gallery{padding-top:130px;background:var(--bg)}
/* El medallón de laurel con el XV, sobre los invitados. */
#guests .container::before{content:"XV";display:grid;place-items:center;
  width:min(52vw,210px);aspect-ratio:1;margin:0 auto 22px;
  background:url(${A}/laurel.png) center/contain no-repeat;
  font-family:var(--dor-caps);font-weight:600;font-size:clamp(42px,12vw,58px);
  letter-spacing:.06em;color:var(--brand)}

/* ── Noche ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--dor-noche) 86%,var(--brand-2)),var(--dor-noche));
  color:var(--dor-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--dor-oro)}
${NOCHE} .section-title{color:#fff}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note){
  color:color-mix(in srgb,var(--dor-noche-ink) 82%,transparent)}
/* Dos destellos que titilan en cada sección de noche. */
${NOCHE}::before,${NOCHE}::after{content:"";position:absolute;z-index:1;width:26px;height:26px;
  pointer-events:none;background:url(${A}/destello.png) center/contain no-repeat;
  animation:dorTitila 4s ease-in-out infinite}
${NOCHE}::before{top:16%;left:11%}
${NOCHE}::after{bottom:7%;right:7%;animation-delay:2s}

/* La cuenta atrás de siempre, con el aire de las paletas. */
.countdown-grid{max-width:430px;margin:26px auto 0;gap:10px}
#countdown .countdown-ring{border-radius:12px;border:0;
  background:linear-gradient(180deg,rgba(255,255,255,.07) 0 50%,rgba(255,255,255,.03) 50% 100%);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dor-oro) 45%,transparent)}
${NOCHE} :is([data-cd],.ring-number){font-family:var(--dor-caps);font-weight:400;
  color:var(--dor-oro-claro)}
${NOCHE} .ring-label{color:color-mix(in srgb,var(--dor-noche-ink) 72%,transparent);
  font-size:10px;letter-spacing:.24em}
/* En la de paletas, la placa es la noche de la paleta con el borde de oro. */
${NOCHE} .inv-cd-paletas .ring-number{color:var(--dor-oro-claro);
  background:linear-gradient(180deg,rgba(255,255,255,.08) 0 50%,rgba(255,255,255,.03) 50% 100%)}

/* ── Itinerario: una línea de oro al centro, los momentos a los lados ──
   La línea se dibuja al asomarse la sección, y los momentos entran con el
   escalonado de siempre de las tarjetas. */
#events .events-grid{display:block;position:relative;max-width:460px;margin:14px auto 0}
#events .events-grid::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:2px;
  translate:-50% 0;background:linear-gradient(var(--dor-oro-claro),var(--dor-oro),var(--dor-oro-hondo));
  transform-origin:top;transform:scaleY(0);transition:transform 1.8s cubic-bezier(.3,.7,.2,1) .2s}
#events.in .events-grid::before,.js #events:not(.reveal) .events-grid::before{transform:none}
#events .event-card{position:relative;display:grid;grid-template-columns:1fr 1fr;column-gap:36px;
  padding:14px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:right}
#events .event-card:hover{transform:none}
#events .event-card>*{grid-column:1;margin:0}
#events .event-time{grid-column:2;grid-row:1/span 7;align-self:start;text-align:left;
  padding-top:5px;font-family:var(--dor-caps);font-weight:400;font-size:14px;color:var(--brand)}
#events .event-card:nth-child(even){text-align:left}
#events .event-card:nth-child(even)>*{grid-column:2}
#events .event-card:nth-child(even) .event-time{grid-column:1;text-align:right}
#events .event-card::after{content:"";position:absolute;left:50%;top:22px;width:13px;height:13px;
  translate:-50% 0;border-radius:50%;background:var(--dor-oro);
  box-shadow:0 0 0 3px var(--bg-alt),0 0 0 4px var(--dor-oro),0 0 16px 3px
    color-mix(in srgb,var(--dor-oro) 60%,transparent)}
#events .event-icon{display:none}
#events .event-type{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:22px;
  letter-spacing:0;text-transform:none;color:var(--ink)}
#events .event-title{font-family:var(--sans);font-size:16px;font-weight:400;color:var(--muted)}
#events .event-place{margin-top:4px}
#events .event-map-btn{justify-self:end;margin-top:10px}
#events .event-card:nth-child(even) .event-map-btn{justify-self:start}

/* ── Fichas de información ── */
.feature-card{background:var(--card);border-radius:18px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dor-oro) 35%,transparent),
    0 16px 30px -22px color-mix(in srgb,var(--ink) 50%,transparent)}
.feature-icon{color:var(--dor-oro-hondo)}
.feature-title{font-family:var(--dor-caps);font-weight:600;font-size:14px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}

/* ── Regalos ── */
#gifts .container::before{content:"";display:block;width:110px;height:110px;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 0 18px color-mix(in srgb,var(--dor-oro) 35%,transparent))}
.gifts-account{background:rgba(255,255,255,.05);border-color:var(--dor-oro)}
.gifts-bank{color:var(--dor-oro)}

/* ── Botones: lámina de oro con un brillo que los barre ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,
.inv-rsvp-btn:not(.inv-rsvp-no),.inv-mapa-btn:not(.inv-agendar){position:relative;overflow:hidden;
  border:0;background:linear-gradient(100deg,color-mix(in srgb,var(--accent) 70%,#000),var(--accent) 30%,
    color-mix(in srgb,var(--accent) 40%,#fff) 50%,var(--accent) 70%,color-mix(in srgb,var(--accent) 70%,#000));
  background-size:220% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--accent) 80%,#000);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.splash-btn-primary:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}
.hero-btn::after,.splash-btn-primary::after,.confirm-btn::after,.gifts-btn::after,
.inv-rsvp-btn:not(.inv-rsvp-no)::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);
  transform:skewX(-20deg);animation:dorBarre 3.8s ease-in-out infinite;pointer-events:none}
@keyframes dorBarre{0%,60%{left:-60%}100%{left:130%}}

/* ── Pie ── */
footer{padding:90px 24px calc(70px + env(safe-area-inset-bottom));background:var(--dor-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:120px;height:76px;margin:0 auto 6px;
  background:url(${A}/corona.png) center/contain no-repeat}
.footer-names{font-size:74px;line-height:1.2;padding-top:.1em}
.footer-date{font-family:var(--dor-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;opacity:.85;color:var(--dor-oro-claro)}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.inv-sobre-nombre,.hero-content::before,
  ${NOCHE}::before,${NOCHE}::after{animation:none}
  .hero-btn::after,.splash-btn-primary::after,.confirm-btn::after,.gifts-btn::after,
  .inv-rsvp-btn::after{display:none}
  #events .events-grid::before{transform:none;transition:none}
}`;

export const dorado: Design = {
  slug: "15-dorado",
  name: "Quince Dorado",
  occasion: "quince",
  mood: "Gala en oro: salón con lámpara, corona, nombre en lámina de oro y secciones de marfil y noche",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400" +
      "&family=Pinyon+Script&family=Playfair+Display:ital@0;1"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 400,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.3em",
  },
  shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [DORADO, CHAMPAN_ROSA, BLANCO_ORO, NEGRO_ORO],
  /* El reloj de paletas de la invitación original. */
  variantes: { countdown: "paletas" },
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
    { seccion: "*", url: `${A}/divisor.png`, sitio: "titulo", tamano: 68 },
    { seccion: "guests", url: `${A}/filigrana.png`, sitio: "arriba-izq", tamano: 34 },
    { seccion: "guests", url: `${A}/filigrana-abajo.png`, sitio: "abajo-der", tamano: 34 },
    { seccion: "confirm", url: `${A}/filigrana-abajo.png`, sitio: "abajo-der", tamano: 34 },
    { seccion: "gallery", url: `${A}/filigrana.png`, sitio: "arriba-izq", tamano: 30 },
  ],
  deco: {
    ornament: () => `<img class="dor-divisor" src="${A}/divisor.png" alt="">`,
  },
};
