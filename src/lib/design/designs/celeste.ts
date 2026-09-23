/**
 * Quinceañera Cielo Celeste.
 *
 * Azul celeste de día: nubes, plumas y mariposas de plata. Las otras
 * temáticas nuevas son de noche —farolillos, oro, estrellas, vino—; ésta es
 * la de la luz, y por eso manda el papel y el azul hondo aparece sólo donde
 * hace falta contraste: la cuenta atrás, los regalos y el pie.
 *
 * Sale del HTML «cielo celeste» hecho a mano, con adornos de Grok
 * recortados a PNG. Lo interactivo son componentes de la app: el velo
 * «nubes», que nació aquí y sirve en cualquier diseño, «Agendar», y las
 * plumas, que son la partícula con imagen propia apuntando a la de aquí.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/celeste";

const CELESTE = paleta({
  id: "celeste", nombre: "Celeste y plata",
  base: "#eaf4fd", tinta: "#1b3350", marca: "#3d6f9e", acento: "#1e3a5c", segundo: "#8fc3e8",
});
const AGUA = paleta({
  id: "agua", nombre: "Agua y blanco",
  base: "#effaf9", tinta: "#123338", marca: "#2c7c85", acento: "#17545c", segundo: "#7fc9cf",
});
const LAVANDA = paleta({
  id: "lavanda-cielo", nombre: "Lavanda y cielo",
  base: "#f4f2fd", tinta: "#241f45", marca: "#5b53a3", acento: "#3b3577", segundo: "#a9a3e8",
});
const NOCHE_AZUL = paleta({
  id: "noche-azul", nombre: "Azul de noche",
  base: "#12233b", tinta: "#e7eef6", marca: "#8fc3e8", acento: "#8fc3e8", segundo: "#cfe6f7",
});

/* Las secciones de azul hondo. */
const AZUL = ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts)";

const css = () => `
:root{--cel-caps:'Cinzel',Georgia,serif;--cel-script:'Sacramento',cursive;
  --cel-hondo:var(--footer-bg);--cel-hondo-ink:var(--footer-ink);
  --cel-azul:var(--brand-2);
  --cel-claro:color-mix(in srgb,var(--brand-2) 40%,#fff);
  --cel-plata:color-mix(in srgb,var(--brand-2) 55%,var(--ink));
  --cel-lamina:linear-gradient(100deg,var(--cel-plata) 0%,var(--brand-2) 22%,#fff 44%,
    var(--cel-claro) 58%,var(--brand-2) 74%,var(--cel-plata) 92%,var(--brand-2) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-sobre-pista{font-family:var(--cel-caps)}
.section-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em}
.section-title{font-style:italic;font-weight:500;font-size:clamp(40px,11.5vw,56px);line-height:1.08}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
.hero-name,.footer-names{font-family:var(--cel-script);font-weight:400;
  background:var(--cel-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:celBrillo 7s ease-in-out infinite}
/* En el velo el fondo es el cielo claro, y ahí la lámina de plata no se
   lee: el nombre va en azul hondo. La forma abreviada reinicia el recorte,
   así que se repite en la misma regla. */
.splash-name{font-family:var(--cel-script);font-weight:400;
  background:linear-gradient(100deg,var(--cel-hondo),color-mix(in srgb,var(--cel-hondo) 65%,var(--brand-2)) 45%,
    var(--cel-hondo));background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:celBrillo 7s ease-in-out infinite}
@keyframes celBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes celFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}

.ornament{margin:2px auto 24px}
.cel-divisor{display:block;width:min(80%,330px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el cielo cerrado ── */
#splash{background:linear-gradient(var(--bg-alt),var(--bg));--inv-nube-img:url(${A}/nube.png)}
.splash-modal{background:transparent;box-shadow:none;color:var(--ink)}

.splash-name{font-size:clamp(62px,19vw,96px);line-height:1.05;padding-top:.06em}
.splash-subtitle{color:var(--muted);letter-spacing:.4em}
.splash-date{font-family:var(--cel-caps);letter-spacing:.24em}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(60px + env(safe-area-inset-bottom));
  background:var(--cel-hondo);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.88);--hero-line:rgba(255,255,255,.32);
  --hero-brand:var(--cel-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 35%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,transparent 30%,
    color-mix(in srgb,var(--cel-hondo) 52%,transparent) 64%,var(--cel-hondo) 98%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--cel-hondo) 40%,transparent),
    transparent) center/130% 115% no-repeat}

.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;margin:0}
.hero-name{font-size:clamp(80px,25vw,138px);line-height:1.05;margin:0;padding:.06em .08em 0;
  filter:drop-shadow(0 2px 12px rgba(0,0,0,.45))}
.hero-sub{font-family:var(--cel-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:6px;font-family:var(--cel-caps);
  font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:14px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--cel-claro)}

/* ── Papel ── */
section{padding:100px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
#guests{padding-top:116px;padding-bottom:124px;background:linear-gradient(var(--bg-alt),var(--bg))}

#confirmation{padding-bottom:132px;background:linear-gradient(var(--bg-alt),var(--bg))}
#features{padding-top:120px;background:linear-gradient(var(--bg-alt),var(--bg))}
.feature-card{background:var(--card);border-radius:18px;
  box-shadow:0 16px 30px -22px color-mix(in srgb,var(--ink) 50%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 35%,transparent)}
.feature-icon{color:var(--brand)}
.feature-title{font-family:var(--cel-caps);font-weight:600;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}
/* El globo preside la ubicación, que casi siempre es un bloque. */
.inv-block-ubicacion .container::before{content:"";display:block;width:min(34vw,140px);aspect-ratio:.71;
  margin:0 auto 8px;background:url(${A}/globo.png) center/contain no-repeat;
  filter:drop-shadow(0 8px 18px color-mix(in srgb,var(--brand-2) 45%,transparent))}

/* ── Azul hondo ──
   Con nubes en el filo: son las que separan el cielo del suelo, y lo que
   hace que el azul no entre de golpe. */
${AZUL}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--cel-hondo) 78%,var(--brand-2)),var(--cel-hondo));color:var(--cel-hondo-ink)}
${AZUL} .container{position:relative;z-index:2}
${AZUL} .section-label{color:var(--cel-claro)}
${AZUL} .section-title{color:#fff}
${AZUL} :is(.section-body,.gifts-text,.gifts-note){
  color:color-mix(in srgb,var(--cel-hondo-ink) 86%,transparent)}
${AZUL}::before,${AZUL}::after{content:"";position:absolute;left:-8%;right:-8%;height:120px;z-index:1;
  pointer-events:none;background:url(${A}/nube.png) center/contain no-repeat;opacity:.8}
${AZUL}::before{top:-34px}
${AZUL}::after{bottom:-34px;transform:scaleY(-1)}

/* La cuenta atrás, en cuatro cápsulas de nube. */
.countdown-grid{max-width:430px;margin:24px auto 0;gap:10px}
${AZUL} .countdown-ring{border:0;border-radius:999px;padding:18px 4px 14px;
  background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cel-claro) 55%,transparent)}
${AZUL} :is([data-cd],.ring-number){font-family:var(--cel-caps);font-weight:400;color:#fff}
${AZUL} .ring-label{font-size:9.5px;letter-spacing:.2em;
  color:color-mix(in srgb,var(--cel-hondo-ink) 75%,transparent)}
.gifts-account{background:rgba(255,255,255,.06);border-color:var(--cel-claro)}
.gifts-bank{color:var(--cel-claro)}

/* ── El itinerario: el hilo del viaje ── */
#events .events-grid{display:block;max-width:420px;margin:22px auto 0}
#events .container{position:relative}
#events .events-grid::before{content:"";position:absolute;left:33px;top:16px;bottom:16px;width:2px;
  background:linear-gradient(transparent,var(--brand-2),transparent)}
#events .event-card{position:relative;display:grid;grid-template-columns:52px 1fr;column-gap:18px;
  padding:14px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:left}
#events .event-card:hover{transform:none}
#events .event-card>*{grid-column:2;margin:0}
#events .event-icon{grid-column:1;grid-row:1/span 7;align-self:start;width:52px;height:52px;
  display:grid;place-items:center;border-radius:50%;background:var(--card);font-size:22px;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--brand-2) 70%,transparent)}
#events .event-time{order:1;font-family:var(--cel-caps);font-size:12.5px;letter-spacing:.2em;color:var(--brand)}
#events .event-type{order:2;font-family:var(--cel-caps);font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--muted)}
#events .event-title{order:3;font-style:italic;font-weight:500;font-size:23px;color:var(--ink)}
#events .event-place{order:4;margin-top:4px;font-size:15px}
#events .event-note{order:5;margin-top:4px}
#events .event-map-btn{order:6;justify-self:start;margin-top:10px}
/* El programa que trae el diseño es el «viaje» con el globo, como en el
   HTML: el globo baja por el hilo y va marcando cada momento. */
:root{--inv-viajero-img:url(${A}/globo.png)}
/* Con «section» delante: el CSS de los componentes va después del del
   diseño y, a igual peso, ganaba el acento azul marino. */
section .inv-ev-viaje::before{background:linear-gradient(transparent,var(--brand-2),transparent)}
section .inv-ev-viaje .inv-hito{background:#fff;box-shadow:0 0 0 2px var(--brand-2)}
section .inv-ev-viaje .event-card.pasada .inv-hito{background:var(--brand-2);
  box-shadow:0 0 0 2px var(--brand-2),0 0 0 6px color-mix(in srgb,var(--brand-2) 25%,transparent)}
section .inv-ev-viaje .event-time{font-family:var(--cel-caps);font-size:12.5px;letter-spacing:.2em;
  color:var(--cel-plata)}
section .inv-ev-viaje .event-type{font-family:inherit;font-style:italic;font-weight:500;font-size:23px;
  color:var(--ink);letter-spacing:0;text-transform:none}
section .inv-ev-viaje .event-title{font-family:inherit;font-size:16px;font-weight:400;font-style:normal;
  letter-spacing:0;text-transform:none;color:var(--muted)}
section .inv-ev-viaje .event-place{margin-top:2px;font-size:15px}

/* ── Botones ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 60%,var(--brand-2)) 45%,var(--accent));
  background-size:220% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--accent) 80%,#000);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}
/* En el azul hondo los botones se dan la vuelta: nube con letra azul. */
${AZUL} :is(.gifts-btn,.inv-mapa-btn:not(.inv-agendar),.inv-rsvp-btn:not(.inv-rsvp-no)){
  background:linear-gradient(100deg,var(--cel-claro),#fff 45%,var(--brand-2));
  background-size:220% 100%;color:var(--cel-hondo)}

/* ── Pie ── */
footer{padding:86px 24px calc(76px + env(safe-area-inset-bottom));background:var(--cel-hondo)}
footer .container{position:relative;z-index:2}

.footer-names{font-size:92px;line-height:1.05;padding-top:.06em}
.footer-date{font-family:var(--cel-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;color:var(--cel-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.footer-names,.splash-name,.hero-content::before,.splash-modal::before{animation:none}
}`;

export const celeste: Design = {
  slug: "15-celeste",
  name: "Quinceañera Cielo Celeste",
  occasion: "quince",
  mood: "Celeste de día: nubes que se abren, plumas, corona de plata y azul hondo en los remansos",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Sacramento"
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
  palettes: [CELESTE, AGUA, LAVANDA, NOCHE_AZUL],
  variantes: { events: "viaje" },
  css,
  /*
   * Los adornos que trae puestos.
   *
   * Entran en los datos al crear la invitación, así que se mueven, se
   * encogen o se borran desde el editor. Antes eran capas de `background`
   * en el CSS de la sección y no había manera de tocarlos.
   */
  adornos: [
    { seccion: "splash", url: `${A}/corona.png`, sitio: "cabecera", tamano: 46 },
    { seccion: "hero", url: `${A}/corona.png`, sitio: "cabecera", tamano: 50 },
    { seccion: "guests", url: `${A}/ramo.png`, sitio: "cabecera", tamano: 52 },
    { seccion: "gifts", url: `${A}/sello.png`, sitio: "cabecera", tamano: 31 },
    { seccion: "footer", url: `${A}/corona.png`, sitio: "cabecera", tamano: 47 },
    /* La filigrana que va bajo cada título. Como adorno y no sólo en el
       CSS: así se puede mover, encoger o quitar de una sección suelta. */
    { seccion: "*", url: `${A}/divisor.png`, sitio: "titulo", tamano: 72 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 32 },
    { seccion: "guests", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 32 },
    { seccion: "confirm", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 32 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 28 },
  ],
  deco: {
    ornament: () => `<img class="cel-divisor" src="${A}/divisor.png" alt="">`,
  },
};
