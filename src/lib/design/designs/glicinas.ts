/**
 * Quinceañera Jardín de Glicinas.
 *
 * Lila de jardín: la pérgola con las glicinas colgando, mariposas y plata.
 * De día, como Celeste, pero con el morado por delante y un remanso de
 * noche en la cuenta atrás, los regalos y el pie.
 *
 * Sale del HTML «jardín de glicinas» hecho a mano, con adornos de Grok
 * recortados a PNG. Lo interactivo son componentes de la app: la galería
 * «carrusel», que nació aquí y sirve en cualquier diseño, «Agendar», y los
 * pétalos, que son la partícula con imagen propia apuntando al de aquí.
 *
 * La guirnalda cuelga del borde de arriba de las secciones de papel: es lo
 * que hace que se lea como un jardín y no como una lista de flores.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/glicinas";

const GLICINA = paleta({
  id: "glicina", nombre: "Lila y plata",
  base: "#faf7fd", tinta: "#2e2440", marca: "#6b4e9e", acento: "#6b4e9e", segundo: "#b9a3dd",
});
const LAVANDA = paleta({
  id: "lavanda", nombre: "Lavanda y verde",
  base: "#f7f6fb", tinta: "#2b2c3f", marca: "#5f63a0", acento: "#4d5290", segundo: "#a9aede",
});
const UVA = paleta({
  id: "uva", nombre: "Uva de noche",
  base: "#241a35", tinta: "#f0e9fa", marca: "#c4a9ee", acento: "#9e7ed6", segundo: "#c4a9ee",
});
const MALVA = paleta({
  id: "malva", nombre: "Malva y rosa",
  base: "#fdf6fa", tinta: "#3a2338", marca: "#96528a", acento: "#96528a", segundo: "#d9a5cf",
});

/* El remanso de noche del jardín. */
const NOCHE = ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts)";

const css = () => `
:root{--gli-caps:'Cinzel',Georgia,serif;--gli-script:'Petit Formal Script',cursive;
  --gli-noche:var(--footer-bg);--gli-noche-ink:var(--footer-ink);
  --gli-lila:var(--brand-2);
  --gli-claro:color-mix(in srgb,var(--brand-2) 38%,#fff);
  --gli-hondo:color-mix(in srgb,var(--brand-2) 55%,#000);
  --gli-lamina:linear-gradient(100deg,var(--gli-hondo) 0%,var(--brand-2) 22%,#fff 44%,
    var(--gli-claro) 58%,var(--brand-2) 74%,var(--gli-hondo) 92%,var(--brand-2) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-sobre-pista{font-family:var(--gli-caps)}
.section-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em}
.section-title{font-style:italic;font-weight:500;font-size:clamp(40px,11.5vw,56px);line-height:1.08}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
.hero-name,.footer-names{font-family:var(--gli-script);font-weight:400;
  background:var(--gli-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:gliBrillo 7s ease-in-out infinite}
/* En el velo el fondo es papel claro y la lámina de lila no se lee: ahí el
   nombre va en lila hondo. La forma abreviada de background reinicia el
   recorte, así que se repite en la misma regla. */
.splash-name{font-family:var(--gli-script);font-weight:400;
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 62%,var(--brand-2)) 45%,
    var(--accent));background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:gliBrillo 7s ease-in-out infinite}
@keyframes gliBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes gliFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}

.ornament{margin:2px auto 24px}
.gli-divisor{display:block;width:min(80%,330px);margin:0 auto;pointer-events:none}

/* ── Bienvenida ── */
#splash{background:linear-gradient(var(--bg-alt),var(--bg))}
/* La guirnalda cuelga del borde de arriba del velo. */
#splash::before{content:"";position:absolute;top:-10px;left:-6%;right:-6%;height:min(38vw,190px);z-index:1;
  pointer-events:none;background:url(${A}/guirnalda.png) center top/contain no-repeat}
.splash-modal{background:transparent;box-shadow:none;color:var(--ink)}
.splash-modal::before{content:"";display:block;width:min(44vw,180px);aspect-ratio:1.3;margin:0 auto 10px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:gliFlota 6s ease-in-out infinite}
.splash-name{font-size:clamp(56px,17vw,86px);line-height:1.12;padding-top:.06em}
.splash-subtitle{color:var(--muted);letter-spacing:.4em}
.splash-date{font-family:var(--gli-caps);letter-spacing:.24em}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(60px + env(safe-area-inset-bottom));
  background:var(--gli-noche);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.88);--hero-line:rgba(255,255,255,.3);
  --hero-brand:var(--gli-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 38%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.06) 0%,transparent 30%,
    color-mix(in srgb,var(--gli-noche) 55%,transparent) 64%,var(--gli-noche) 98%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--gli-noche) 42%,transparent),
    transparent) center/130% 115% no-repeat}
.hero-content::before{content:"";display:block;width:min(48vw,200px);aspect-ratio:1.3;margin:0 auto 12px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:gliFlota 5.5s ease-in-out infinite;
  filter:drop-shadow(0 6px 18px color-mix(in srgb,var(--brand-2) 55%,transparent))}
.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;margin:0}
.hero-name{font-size:clamp(62px,19vw,104px);line-height:1.15;margin:0;padding:.06em .08em 0;
  filter:drop-shadow(0 2px 12px rgba(0,0,0,.45))}
.hero-sub{font-family:var(--gli-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:6px;font-family:var(--gli-caps);
  font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:14px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--gli-claro)}

/* ── Papel, con la glicina colgando ── */
section{padding:100px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
:is(#guests,#confirmation){padding-top:150px}
#guests::before,#confirmation::before{content:"";position:absolute;top:-10px;left:-6%;right:-6%;
  height:min(38vw,190px);z-index:1;pointer-events:none;
  background:url(${A}/guirnalda.png) center top/contain no-repeat}
#guests .container,#confirmation .container{position:relative;z-index:2}
#guests .container::before{content:"";display:block;width:min(34vw,140px);aspect-ratio:.46;margin:0 auto 12px;
  background:url(${A}/racimo.png) center/contain no-repeat}
#features{padding-top:120px;background:linear-gradient(var(--bg-alt),var(--bg))}
#gallery{background:var(--bg)}
.feature-card{background:var(--card);border-radius:18px;
  box-shadow:0 16px 30px -22px color-mix(in srgb,var(--ink) 50%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 32%,transparent)}
.feature-icon{color:var(--brand)}
.feature-title{font-family:var(--gli-caps);font-weight:600;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}
/* El farol preside la ubicación, que casi siempre es un bloque. */
.inv-block-ubicacion .container::before{content:"";display:block;width:min(30vw,125px);aspect-ratio:.67;
  margin:0 auto 8px;background:url(${A}/farol.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 18px color-mix(in srgb,var(--brand-2) 45%,transparent))}

/* ── El remanso de noche ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--gli-noche) 78%,var(--brand-2)),var(--gli-noche));color:var(--gli-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--gli-lila)}
${NOCHE} .section-title{color:#fff}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note){
  color:color-mix(in srgb,var(--gli-noche-ink) 86%,transparent)}
#countdown .container::before{content:"";display:block;width:120px;aspect-ratio:.67;margin:0 auto 6px;
  background:url(${A}/farol.png) center/contain no-repeat;animation:gliFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 0 22px color-mix(in srgb,var(--brand-2) 45%,transparent))}
#gifts .container::before{content:"";display:block;width:110px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 16px color-mix(in srgb,var(--brand-2) 50%,transparent))}
.countdown-grid{max-width:430px;margin:24px auto 0;gap:11px}
${NOCHE} .countdown-ring{border:0;border-radius:16px;padding:16px 4px 12px;
  background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--gli-claro) 45%,transparent)}
${NOCHE} :is([data-cd],.ring-number){font-family:var(--gli-caps);font-weight:400;color:#fff}
${NOCHE} .ring-label{font-size:9.5px;letter-spacing:.2em;
  color:color-mix(in srgb,var(--gli-noche-ink) 75%,transparent)}
.gifts-account{background:rgba(255,255,255,.06);border-color:var(--gli-claro)}
.gifts-bank{color:var(--gli-claro)}

/* ── El itinerario: medallón y hilo ── */
#events .events-grid{display:block;max-width:420px;margin:20px auto 0}
#events .container{position:relative}
#events .events-grid::before{content:"";position:absolute;left:25px;top:14px;bottom:14px;width:2px;
  background:linear-gradient(transparent,var(--brand-2),transparent)}
#events .event-card{position:relative;display:grid;grid-template-columns:52px 1fr;column-gap:18px;
  padding:12px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:left}
#events .event-card:hover{transform:none}
#events .event-card>*{grid-column:2;margin:0}
#events .event-icon{grid-column:1;grid-row:1/span 7;align-self:start;width:52px;height:52px;
  display:grid;place-items:center;border-radius:50%;background:var(--card);font-size:22px;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--brand-2) 70%,transparent)}
#events .event-time{order:1;font-family:var(--gli-caps);font-size:12.5px;letter-spacing:.2em;color:var(--brand)}
#events .event-type{order:2;font-family:var(--gli-caps);font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--muted)}
#events .event-title{order:3;font-style:italic;font-weight:500;font-size:23px;color:var(--ink)}
#events .event-place{order:4;margin-top:4px;font-size:15px}
#events .event-note{order:5;margin-top:4px}
#events .event-map-btn{order:6;justify-self:start;margin-top:10px}

/* ── Botones ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 55%,var(--brand-2)) 45%,var(--accent));
  background-size:220% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--accent) 85%,#000);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}
${NOCHE} :is(.gifts-btn,.inv-mapa-btn:not(.inv-agendar),.inv-rsvp-btn:not(.inv-rsvp-no)){
  background:linear-gradient(100deg,var(--gli-claro),#fff 45%,var(--brand-2));
  background-size:220% 100%;color:var(--gli-noche)}

/* ── Pie ── */
footer{padding:86px 24px calc(76px + env(safe-area-inset-bottom));background:var(--gli-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:170px;aspect-ratio:1.3;margin:0 auto 4px;
  background:url(${A}/corona.png) center/contain no-repeat}
.footer-names{font-size:74px;line-height:1.15;padding-top:.06em}
.footer-date{font-family:var(--gli-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;color:var(--gli-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.footer-names,.splash-name,.hero-content::before,.splash-modal::before,
  #countdown .container::before{animation:none}
}`;

export const glicinas: Design = {
  slug: "15-glicinas",
  name: "Quinceañera Jardín de Glicinas",
  occasion: "quince",
  mood: "Lila de jardín: glicinas colgando, corona de plata, faroles y un remanso de noche",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Petit+Formal+Script"
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
  palettes: [GLICINA, LAVANDA, UVA, MALVA],
  /* La galería del jardín es un paseo: una foto grande a la vez. */
  variantes: { gallery: "carrusel" },
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
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
    { seccion: "gallery", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 30 },
  ],
  deco: {
    ornament: () => `<img class="gli-divisor" src="${A}/divisor.png" alt="">`,
  },
};
