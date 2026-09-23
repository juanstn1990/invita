/**
 * Quinceañera Bosque Encantado.
 *
 * De noche en un claro del bosque: luciérnagas, hongos que brillan, un
 * columpio de flores, un ciervo blanco y un castillo escondido entre los
 * árboles. Se entra cruzando un arco de ramas.
 *
 * Sale del HTML «bosque encantado» hecho a mano, con adornos de Grok
 * recortados a PNG. Dos componentes nacieron aquí y sirven en cualquier
 * diseño: la cuenta atrás «luciérnagas» —cada número en un halo que respira
 * y se enciende al cambiar— y el programa «sendero» —un camino que
 * serpentea y una luciérnaga que lo recorre encendiendo cada momento—. Este
 * diseño los trae puestos (`variantes`); quien quiera otro los cambia.
 *
 * ── Todo es bosque ─────────────────────────────────────────────
 *
 * No hay secciones de papel: la página entera es de noche, alternando el
 * verde hondo con el claro de musgo. Así las luciérnagas de las partículas
 * se ven de arriba abajo, y la cuenta atrás y el sendero, que son luz, no
 * se apagan contra un fondo claro.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/bosque";

const BOSQUE = paleta({
  id: "bosque", nombre: "Bosque y luciérnagas",
  base: "#0b1812", tinta: "#eef3e6", marca: "#c8a6e6", acento: "#e8c872", segundo: "#8fb58a",
});
const CREPUSCULO = paleta({
  id: "crepusculo", nombre: "Crepúsculo lila",
  base: "#15122a", tinta: "#f1ecfa", marca: "#b9e0b4", acento: "#e8c872", segundo: "#a88fd6",
});
const NIEBLA = paleta({
  id: "niebla-bosque", nombre: "Niebla azul",
  base: "#0b1a20", tinta: "#e9f2f2", marca: "#bcd9f0", acento: "#f0d68a", segundo: "#7fb3a8",
});
const HADAS = paleta({
  id: "hadas", nombre: "Musgo y rosa",
  base: "#10170f", tinta: "#f5efe9", marca: "#f0b6cf", acento: "#f2d48a", segundo: "#9cc08a",
});

/* Las secciones de claro: un musgo más encendido que el resto. */
const CLARO =
  ":is(#guests,#features,#confirmation,.inv-block-features,.inv-block-paragraph,.inv-block-ubicacion)";

const css = () => `
:root{--bq-caps:'Cinzel Decorative',Georgia,serif;--bq-script:'Great Vibes',cursive;
  --bq-oro:var(--accent);
  --bq-oro-claro:color-mix(in srgb,var(--accent) 55%,#fff);
  --bq-lila:var(--brand);
  --bq-musgo:color-mix(in srgb,var(--bg) 78%,var(--brand-2));
  --bq-hondo:color-mix(in srgb,var(--bg) 88%,var(--brand-2))}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.ring-number{font-family:var(--bq-caps)}
.section-label{font-size:12px;letter-spacing:.3em;padding-left:.3em;color:var(--bq-lila)}
.section-title{font-family:var(--bq-script);font-weight:400;font-size:clamp(48px,13.5vw,66px);line-height:1.1;
  color:var(--bq-oro-claro);text-shadow:0 0 22px color-mix(in srgb,var(--accent) 35%,transparent)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names{font-family:var(--bq-script);font-weight:400;color:var(--bq-oro-claro);
  text-shadow:0 0 30px color-mix(in srgb,var(--accent) 45%,transparent),0 2px 10px rgba(0,0,0,.6)}
@keyframes bqFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}

.ornament{margin:4px auto 24px}
.bq-divisor{display:block;width:min(78%,320px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el arco de ramas, que se cruza al entrar ── */
#splash{background:radial-gradient(90% 60% at 50% 45%,var(--bq-musgo),var(--bg));
  transition:opacity 1.1s ease .5s,visibility 1.1s ease .5s}
.splash-modal{background:url(${A}/arco.png) center/contain no-repeat;box-shadow:none;
  width:min(86vw,380px);aspect-ratio:.76;display:flex;flex-direction:column;justify-content:center;
  padding:16% 20% 12%;color:var(--ink)}
.splash-subtitle{font-size:10px;letter-spacing:.28em;color:var(--bq-lila);margin:0}
.splash-name{font-size:clamp(48px,14.5vw,68px);line-height:1.05;margin:2px 0}
.splash-date{font-family:var(--bq-caps);font-size:10px;letter-spacing:.24em;color:var(--muted);margin:0 0 10px}
.splash-btns{gap:8px}
/* Al entrar el arco se agranda hasta que se cruza, en vez de encogerse. */
#splash.hidden .splash-modal{transform:scale(3);opacity:0;
  transition:transform 1.4s cubic-bezier(.5,0,.2,1),opacity 1s ease .25s}

/* ── Portada: el claro con el columpio ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:var(--bg);
  --hero-ink:var(--ink);--hero-ink-soft:color-mix(in srgb,var(--ink) 80%,transparent);
  --hero-line:color-mix(in srgb,var(--ink) 30%,transparent);--hero-brand:var(--bq-lila)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 35%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.1),transparent 30%,
    color-mix(in srgb,var(--bg) 60%,transparent) 62%,var(--bg) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}

.hero-label{font-size:12.5px;letter-spacing:.42em;padding-left:.42em;margin:0;color:var(--bq-lila)}
.hero-name{font-size:clamp(80px,25vw,132px);line-height:1;margin:4px 0 0}
.hero-sub{font-style:italic;font-size:19px}
.hero-date{border-top:0;padding-top:0;margin-top:8px;font-family:var(--bq-caps);font-size:13px;letter-spacing:.26em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0;
  color:color-mix(in srgb,var(--ink) 80%,transparent)}
.hero-scroll{color:var(--bq-oro)}

/* ── El bosque y sus claros ── */
section{padding:96px 26px;background:linear-gradient(var(--bg),var(--bq-hondo) 40%,var(--bg))}
section.alt{background:linear-gradient(var(--bg),var(--bq-hondo) 40%,var(--bg))}
${CLARO}{background:radial-gradient(120% 80% at 50% 0%,var(--bq-musgo),var(--bq-hondo) 60%,var(--bg))}
section .container{position:relative;z-index:2}
#guests{padding-bottom:124px;background:radial-gradient(120% 80% at 50% 0%,var(--bq-musgo),var(--bq-hondo) 60%,var(--bg))}

#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(22px,6vw,27px);line-height:1.5;
  max-width:27ch;margin-inline:auto;color:var(--bq-oro-claro)}
/* La esquina de abajo es la misma de arriba girada: un fondo no se puede
   girar, así que va en una capa aparte. */
#confirmation{padding-bottom:132px}
/* Los padres, bajados de la portada, con un filete de oro en medio. */
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--accent) 35%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--bq-caps);font-size:10.5px;letter-spacing:.2em;
  color:var(--bq-lila);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17px;line-height:1.5;color:var(--ink);
  white-space:pre-line}

#features{padding-top:112px;background:radial-gradient(120% 80% at 50% 0%,var(--bq-musgo),var(--bq-hondo) 60%,var(--bg))}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;border:0;border-radius:18px;
  background:color-mix(in srgb,var(--ink) 5%,transparent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 28%,transparent)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--bq-oro)}
.feature-title{font-family:var(--bq-caps);font-weight:400;font-size:11.5px;letter-spacing:.18em;color:var(--bq-lila)}

/* ── La cuenta atrás: los hongos presiden el reloj de luciérnagas ── */

.inv-cd-luciernagas .ring-number{color:var(--bq-oro-claro)}
.inv-cd-luciernagas .ring-label{color:color-mix(in srgb,var(--ink) 72%,transparent)}

/* ── El sendero: las letras del programa ── */
.inv-ev-sendero .event-time{font-size:12.5px;letter-spacing:.14em;color:var(--bq-oro)}
.inv-ev-sendero .event-type{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--bq-lila)}
.inv-ev-sendero .event-title{font-family:var(--bq-script);font-weight:400;font-size:30px;line-height:1.15;color:var(--ink)}
.inv-ev-sendero .event-place{font-size:15.5px;line-height:1.4}
.inv-ev-sendero .event-map-btn{padding:0 0 2px;background:none;border:0;border-radius:0;box-shadow:none;
  font-size:10.5px;letter-spacing:.14em;color:var(--bq-oro);
  border-bottom:1px solid color-mix(in srgb,var(--accent) 50%,transparent)}

/* ── Regalos: el frasco de luciérnagas ── */

.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:18px}
.gifts-bank{color:var(--bq-oro)}

/* ── El formulario ── */
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10.5px;letter-spacing:.16em;color:var(--bq-lila);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{letter-spacing:0}

/* ── Botones: oro que brilla ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 45%,#fff) 50%,var(--accent));
  background-size:200% 100%;color:var(--on-accent);font-size:11.5px;letter-spacing:.16em;
  box-shadow:0 0 22px -4px color-mix(in srgb,var(--accent) 60%,transparent);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}

/* ── Pie: el castillo escondido ── */
footer{padding:70px 24px calc(72px + env(safe-area-inset-bottom));
  background:linear-gradient(var(--bg),color-mix(in srgb,var(--bg) 70%,#000))}
footer .container{position:relative;z-index:2}

.footer-names{font-size:80px;line-height:1.05}
.footer-date{font-family:var(--bq-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.28em;color:var(--bq-lila)}

@media (prefers-reduced-motion:reduce){
  .hero-content::before,#gifts .container::before{animation:none}
  #splash.hidden .splash-modal{transform:none}
}`;

export const bosque: Design = {
  slug: "15-bosque",
  name: "Quinceañera Bosque Encantado",
  occasion: "quince",
  mood: "Un claro del bosque de noche: luciérnagas, hongos que brillan, ciervo blanco y castillo escondido",
  fontUrl: gfont(
    "family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Great+Vibes"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'EB Garamond', Georgia, serif",
    body: "'EB Garamond', Georgia, serif",
    displayWeight: 400,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.26em",
  },
  shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [BOSQUE, CREPUSCULO, NIEBLA, HADAS],
  variantes: { countdown: "luciernagas", events: "sendero" },
  padresEn: "guests",
  css,
  /*
   * Los adornos que trae puestos.
   *
   * Entran en los datos al crear la invitación, así que se mueven, se
   * encogen o se borran desde el editor. Antes eran capas de `background`
   * en el CSS de la sección y no había manera de tocarlos.
   */
  adornos: [
    { seccion: "confirm", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 32, giro: 180 },
    { seccion: "hero", url: `${A}/corona.png`, sitio: "cabecera", tamano: 48 },
    { seccion: "guests", url: `${A}/ciervo.png`, sitio: "cabecera", tamano: 52 },
    { seccion: "countdown", url: `${A}/hongos.png`, sitio: "cabecera", tamano: 38 },
    { seccion: "gifts", url: `${A}/frasco.png`, sitio: "cabecera", tamano: 34 },
    { seccion: "footer", url: `${A}/castillo.png`, sitio: "cabecera", tamano: 56 },
    /* La filigrana que va bajo cada título. Como adorno y no sólo en el
       CSS: así se puede mover, encoger o quitar de una sección suelta. */
    { seccion: "*", url: `${A}/divisor.png`, sitio: "titulo", tamano: 70 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 34 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
  ],
  deco: {
    ornament: () => `<img class="bq-divisor" src="${A}/divisor.png" alt="">`,
  },
};
