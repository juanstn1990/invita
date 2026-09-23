/**
 * Quinceañera Rosa Real.
 *
 * Rosa empolvado y oro rosa: de princesa, sin copiar a nadie. Sale del HTML
 * «rosa real» hecho a mano, con adornos de Grok recortados a PNG (corona,
 * abanico, ramo, esquinas, divisor, zapatilla, carroza, sello y pétalo).
 *
 * Lo interactivo son componentes de la app: el velo «abanico», que nació
 * con este diseño y sirve en cualquiera, «Agendar», y los pétalos, que son
 * la partícula con imagen propia apuntando al pétalo de aquí.
 *
 * Alterna pétalo (el papel) y vino (la noche del palacio). La noche sale
 * del color del pie de la paleta, así que cambia con ella.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/rosareal";

const ROSA_REAL = paleta({
  id: "rosa-real", nombre: "Rosa y oro rosa",
  base: "#fff6f7", tinta: "#41202c", marca: "#a35169", acento: "#a35169", segundo: "#e8a9b8",
});
const VINO = paleta({
  id: "vino-rosa", nombre: "Vino y rosa",
  base: "#31151f", tinta: "#fdeef1", marca: "#e8a9b8", acento: "#c3778c", segundo: "#e8a9b8",
});
const DURAZNO = paleta({
  id: "durazno-rosa", nombre: "Durazno y oro rosa",
  base: "#fff7f1", tinta: "#402519", marca: "#a9663c", acento: "#a9663c", segundo: "#e8b28f",
});
const LILA = paleta({
  id: "lila-rosa", nombre: "Lila y rosa",
  base: "#fbf6fd", tinta: "#33203f", marca: "#7d4f96", acento: "#7d4f96", segundo: "#d9a9d6",
});

/* La noche de este diseño: la cuenta atrás, los regalos y el pie. */
const NOCHE = ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts)";

const css = () => `
:root{--rr-caps:'Cinzel',Georgia,serif;--rr-script:'Parisienne',cursive;
  --rr-noche:var(--footer-bg);--rr-noche-ink:var(--footer-ink);
  --rr-rosa:var(--brand-2);
  --rr-claro:color-mix(in srgb,var(--brand-2) 40%,#fff);
  --rr-hondo:color-mix(in srgb,var(--brand-2) 55%,#000);
  --rr-lamina:linear-gradient(100deg,var(--rr-hondo) 0%,var(--brand-2) 22%,
    color-mix(in srgb,var(--brand-2) 15%,#fff) 44%,var(--brand-2) 60%,
    var(--rr-hondo) 84%,var(--brand-2) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-sobre-pista,.inv-abanico-ante{font-family:var(--rr-caps)}
.section-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em}
.section-title{font-style:italic;font-weight:500;font-size:clamp(40px,11.5vw,56px);line-height:1.08}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
.hero-name,.splash-name,.footer-names,#splash .inv-abanico-nombre{font-family:var(--rr-script);
  font-weight:400;background:var(--rr-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:rrBrillo 7s ease-in-out infinite}
@keyframes rrBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes rrFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

.ornament{margin:2px auto 24px}
.rr-divisor{display:block;width:min(80%,330px);margin:0 auto;pointer-events:none}

/* ── Bienvenida ── */
#splash{background:radial-gradient(100% 70% at 50% 35%,
  color-mix(in srgb,var(--rr-noche) 80%,var(--brand-2)),var(--rr-noche))}
.splash-modal{background:var(--card);color:var(--ink);border-radius:10px;
  box-shadow:0 30px 70px -22px rgba(0,0,0,.6),inset 0 0 0 1px color-mix(in srgb,var(--rr-rosa) 45%,transparent)}
.splash-modal::before{content:"";display:block;width:150px;height:78px;margin:0 auto 6px;
  background:url(${A}/corona.png) center/contain no-repeat;
  filter:drop-shadow(0 4px 14px color-mix(in srgb,var(--rr-rosa) 45%,transparent))}
.splash-name{font-size:clamp(66px,20vw,104px);line-height:1.1;padding-top:.06em}
.splash-subtitle{letter-spacing:.4em}
.splash-date{font-family:var(--rr-caps);letter-spacing:.24em}
/* El abanico del velo es el de este diseño mientras nadie suba otro. */
#splash.inv-velo-abanico{--inv-abanico-img:url(${A}/abanico.png)}
#splash.inv-velo-abanico .inv-abanico-texto{color:#fff}
#splash.inv-velo-abanico .inv-abanico-ante{color:var(--rr-claro)}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(60px + env(safe-area-inset-bottom));
  background:var(--rr-noche);
  --hero-ink:#fff4f6;--hero-ink-soft:rgba(255,244,246,.86);--hero-line:rgba(255,244,246,.3);
  --hero-brand:var(--rr-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 35%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.08) 0%,transparent 28%,
    color-mix(in srgb,var(--rr-noche) 58%,transparent) 62%,var(--rr-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--rr-noche) 42%,transparent),
    transparent) center/130% 115% no-repeat}
/* La corona, con aire debajo: Parisienne tiene unas mayúsculas altísimas y
   sin margen la primera letra del nombre se le mete dentro. */
.hero-content::before{content:"";display:block;width:min(48vw,200px);aspect-ratio:1.57;margin:0 auto 14px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:rrFlota 5.5s ease-in-out infinite;
  filter:drop-shadow(0 6px 20px color-mix(in srgb,var(--rr-rosa) 50%,transparent))}
.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;margin:0;
  text-shadow:0 1px 12px rgba(0,0,0,.45)}
.hero-name{font-size:clamp(74px,22vw,122px);line-height:1.12;margin:0;padding:.08em .1em 0;
  filter:drop-shadow(0 2px 14px rgba(0,0,0,.45))}
.hero-sub{font-family:var(--rr-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:4px;font-family:var(--rr-caps);
  font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:14px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--rr-claro)}

/* ── Papel ── */
section{padding:100px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
#guests{padding-top:116px;padding-bottom:124px;background:linear-gradient(var(--bg-alt),var(--bg))}
#guests .container::before{content:"";display:block;width:min(52vw,210px);aspect-ratio:.75;margin:0 auto 12px;
  background:url(${A}/ramo.png) center/contain no-repeat}
#confirmation{padding-bottom:132px;background:linear-gradient(var(--bg-alt),var(--bg))}
#features{padding-top:120px;background:linear-gradient(var(--bg-alt),var(--bg))}
.feature-card{background:var(--card);border-radius:18px;
  box-shadow:0 16px 30px -22px color-mix(in srgb,var(--ink) 55%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--rr-rosa) 30%,transparent)}
.feature-icon{color:var(--brand)}
.feature-title{font-family:var(--rr-caps);font-weight:600;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}
/* La carroza preside la ubicación, que casi siempre es un bloque. */
.inv-block-ubicacion .container::before{content:"";display:block;width:min(44vw,180px);aspect-ratio:1.2;
  margin:0 auto 8px;background:url(${A}/carroza.png) center/contain no-repeat;
  filter:drop-shadow(0 8px 20px color-mix(in srgb,var(--rr-rosa) 40%,transparent))}

/* ── Vino ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--rr-noche) 80%,var(--brand-2)),var(--rr-noche));color:var(--rr-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--rr-rosa)}
${NOCHE} .section-title{color:#fff4f6}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note){
  color:color-mix(in srgb,var(--rr-noche-ink) 84%,transparent)}
#countdown .container::before{content:"";display:block;width:150px;aspect-ratio:1.57;margin:0 auto 6px;
  background:url(${A}/corona.png) center/contain no-repeat;
  filter:drop-shadow(0 0 22px color-mix(in srgb,var(--brand-2) 40%,transparent))}
#gifts .container::before{content:"";display:block;width:110px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 0 20px color-mix(in srgb,var(--brand-2) 35%,transparent))}
/* Los medallones de perla de la cuenta atrás. */
.countdown-grid{max-width:430px;margin:24px auto 0;gap:12px}
${NOCHE} .countdown-ring{border:0;border-radius:50%;aspect-ratio:1;display:grid;place-content:center;
  background:radial-gradient(120% 120% at 30% 25%,rgba(255,255,255,.14),rgba(255,255,255,.03));
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rr-claro) 55%,transparent),
    0 12px 26px -16px rgba(0,0,0,.8)}
${NOCHE} :is([data-cd],.ring-number){font-family:var(--rr-caps);font-weight:400;color:var(--rr-claro)}
${NOCHE} .ring-label{font-size:9.5px;letter-spacing:.2em;
  color:color-mix(in srgb,var(--rr-noche-ink) 72%,transparent)}
.gifts-account{background:rgba(255,244,246,.05);border-color:var(--rr-claro)}
.gifts-bank{color:var(--rr-rosa)}

/* ── El itinerario: medallón, hilo y texto a la derecha ──
   Es la forma de la variante «Itinerario», puesta también en el marcado de
   siempre: quien no cambie nada ya ve el hilo con sus medallones. */
#events .events-grid{display:block;max-width:430px;margin:20px auto 0}
#events .events-grid::before{content:"";position:absolute;left:27px;top:20px;bottom:20px;width:2px;
  background:linear-gradient(transparent,var(--brand-2),transparent)}
#events .container{position:relative}
#events .event-card{position:relative;display:grid;grid-template-columns:56px 1fr;column-gap:18px;
  padding:12px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:left}
#events .event-card:hover{transform:none}
#events .event-card>*{grid-column:2;margin:0}
#events .event-icon{grid-column:1;grid-row:1/span 7;align-self:start;width:56px;height:56px;
  display:grid;place-items:center;border-radius:50%;background:var(--card);font-size:24px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 35%,transparent)}
#events .event-time{order:1;font-family:var(--rr-caps);font-size:12.5px;letter-spacing:.2em;color:var(--brand)}
#events .event-type{order:2;font-family:var(--rr-caps);font-size:11px;letter-spacing:.18em;
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

/* ── Pie ── */
footer{padding:86px 24px calc(76px + env(safe-area-inset-bottom));background:var(--rr-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:170px;height:108px;margin:0 auto 2px;
  background:url(${A}/corona.png) center/contain no-repeat}
.footer-names{font-size:88px;line-height:1.1;padding-top:.06em}
.footer-date{font-family:var(--rr-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;color:var(--rr-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.hero-content::before{animation:none}
}`;

export const rosareal: Design = {
  slug: "15-rosareal",
  name: "Quinceañera Rosa Real",
  occasion: "quince",
  mood: "Rosa y oro rosa de princesa: jardín del palacio, corona, abanico y medallones de perla",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Parisienne"
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
  palettes: [ROSA_REAL, VINO, DURAZNO, LILA],
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
    ornament: () => `<img class="rr-divisor" src="${A}/divisor.png" alt="">`,
  },
};
