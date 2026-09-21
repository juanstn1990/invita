/**
 * Quinceañera Noche Carmesí.
 *
 * Rojo terciopelo y oro: el salón de gala. La invitación se abre como un
 * teatro —el componente «telón»— y de ahí sale todo lo demás: los
 * candelabros, el brindis, los pétalos de rosa.
 *
 * Sale del HTML «noche carmesí» hecho a mano, con adornos de Grok
 * recortados a PNG. Lo interactivo son componentes de la app: el telón,
 * que nació aquí y sirve en cualquier diseño, «Agendar», y los pétalos,
 * que son la partícula con imagen propia apuntando al de aquí.
 *
 * El rojo es de las secciones de vino y el marfil es el papel: al revés
 * que en Dorado, donde manda el marfil, aquí el vino pesa más porque el
 * carmesí es el tema y no el acento.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/carmesi";

const CARMESI = paleta({
  id: "carmesi", nombre: "Carmesí y oro",
  base: "#fdf7f4", tinta: "#3a1c1c", marca: "#a51c2c", acento: "#a51c2c", segundo: "#c9962e",
});
const VINO = paleta({
  id: "vino-oro", nombre: "Vino y oro",
  base: "#2d0a10", tinta: "#fdeeea", marca: "#e8a27f", acento: "#c9962e", segundo: "#e0b25c",
});
const GRANATE = paleta({
  id: "granate", nombre: "Granate y cobre",
  base: "#fdf5f2", tinta: "#3b201a", marca: "#8f2e24", acento: "#8f2e24", segundo: "#c9762e",
});
const NEGRO_ROJO = paleta({
  id: "negro-rojo", nombre: "Negro y rojo",
  base: "#120b0d", tinta: "#f7eceb", marca: "#e4677a", acento: "#c9962e", segundo: "#d4404f",
});

/* Las secciones de vino: la cuenta atrás, el lugar, los regalos y el pie. */
const VINO_SEC =
  ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--car-caps:'Cinzel',Georgia,serif;--car-script:'Italianno',cursive;
  --car-vino:var(--footer-bg);--car-vino-ink:var(--footer-ink);
  --car-oro:var(--brand-2);
  --car-oro-claro:color-mix(in srgb,var(--brand-2) 45%,#fff);
  --car-oro-hondo:color-mix(in srgb,var(--brand-2) 62%,#000);
  --car-lamina:linear-gradient(100deg,var(--car-oro-hondo) 0%,var(--brand-2) 22%,
    color-mix(in srgb,var(--brand-2) 18%,#fff) 44%,var(--car-oro-claro) 58%,var(--brand-2) 74%,
    var(--car-oro-hondo) 92%,var(--brand-2) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-sobre-pista{font-family:var(--car-caps)}
.section-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em}
.section-title{font-style:italic;font-weight:500;font-size:clamp(40px,11.5vw,56px);line-height:1.08}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
/* Italianno es una caligrafía muy fina: pide bastante más tamaño que una
   serifa para pesar lo mismo en la portada. */
.hero-name,.splash-name,.footer-names{font-family:var(--car-script);font-weight:400;
  background:var(--car-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:carBrillo 7s ease-in-out infinite}
@keyframes carBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes carFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}

.ornament{margin:2px auto 24px}
.car-divisor{display:block;width:min(80%,330px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: detrás del telón ── */
#splash{background:radial-gradient(90% 70% at 50% 40%,
  color-mix(in srgb,var(--car-vino) 80%,var(--brand-2)),var(--car-vino))}
.splash-modal{background:transparent;box-shadow:none;color:#fff4ee}
.splash-modal::before{content:"";display:block;width:min(46vw,190px);aspect-ratio:1.7;margin:0 auto 8px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:carFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 6px 18px color-mix(in srgb,var(--brand-2) 45%,transparent))}
.splash-name{font-size:clamp(66px,20vw,104px);line-height:1;padding-top:.06em}
.splash-subtitle{color:var(--car-oro-claro);letter-spacing:.4em}
.splash-date{font-family:var(--car-caps);letter-spacing:.24em;color:rgba(255,244,238,.85)}

/* ── Portada ── */
#hero{place-items:end center;padding:0 24px calc(60px + env(safe-area-inset-bottom));
  background:var(--car-vino);
  --hero-ink:#fff4ee;--hero-ink-soft:rgba(255,244,238,.88);--hero-line:rgba(255,244,238,.3);
  --hero-brand:var(--car-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 40%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.1) 0%,transparent 28%,
    color-mix(in srgb,var(--car-vino) 60%,transparent) 62%,var(--car-vino) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--car-vino) 45%,transparent),
    transparent) center/130% 115% no-repeat}
.hero-content::before{content:"";display:block;width:min(52vw,215px);aspect-ratio:1.7;margin:0 auto 8px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:carFlota 5.5s ease-in-out infinite;
  filter:drop-shadow(0 6px 20px color-mix(in srgb,var(--brand-2) 50%,transparent))}
.hero-label{font-size:13px;letter-spacing:.55em;padding-left:.55em;margin:0}
.hero-name{font-size:clamp(84px,26vw,142px);line-height:.98;margin:0;padding:.06em .08em 0;
  filter:drop-shadow(0 2px 14px rgba(0,0,0,.5))}
.hero-sub{font-family:var(--car-caps);letter-spacing:.3em}
.hero-date{border-top:0;padding-top:0;margin-top:4px;font-family:var(--car-caps);
  font-size:13.5px;letter-spacing:.3em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:14px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--car-oro-claro)}

/* ── Marfil ── */
section{padding:100px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
#guests{padding-top:116px;padding-bottom:124px;background:
  url(${A}/esquina.png) left 8px top 8px/min(32vw,165px) no-repeat,
  url(${A}/esquina-abajo.png) right 8px bottom 8px/min(32vw,165px) no-repeat,
  linear-gradient(var(--bg-alt),var(--bg))}
#guests .container::before{content:"";display:block;width:min(50vw,200px);aspect-ratio:.9;margin:0 auto 12px;
  background:url(${A}/ramo.png) center/contain no-repeat}
#confirmation{padding-bottom:132px;background:
  url(${A}/esquina-abajo.png) right 8px bottom 8px/min(32vw,165px) no-repeat,
  linear-gradient(var(--bg-alt),var(--bg))}
#features{padding-top:120px;background:
  url(${A}/esquina.png) left 8px top 8px/min(28vw,140px) no-repeat,
  linear-gradient(var(--bg-alt),var(--bg))}
.feature-card{background:var(--card);border-radius:18px;
  box-shadow:0 16px 30px -22px color-mix(in srgb,var(--ink) 55%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 30%,transparent)}
.feature-icon{color:var(--brand)}
.feature-title{font-family:var(--car-caps);font-weight:600;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brand)}

/* ── Vino ── */
${VINO_SEC}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--car-vino) 80%,var(--brand-2)),var(--car-vino));color:var(--car-vino-ink)}
${VINO_SEC} .container{position:relative;z-index:2}
${VINO_SEC} .section-label{color:var(--car-oro-claro)}
${VINO_SEC} .section-title{color:#fff4ee}
${VINO_SEC} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){
  color:color-mix(in srgb,var(--car-vino-ink) 84%,transparent)}
#countdown .container::before{content:"";display:block;width:120px;aspect-ratio:.64;margin:0 auto 6px;
  background:url(${A}/candelabro.png) center/contain no-repeat;animation:carFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 0 22px color-mix(in srgb,var(--brand-2) 45%,transparent))}
#gifts .container::before{content:"";display:block;width:110px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 16px color-mix(in srgb,var(--brand-2) 45%,transparent))}
/* El brindis preside la ubicación, que casi siempre es un bloque. */
.inv-block-ubicacion .container::before{content:"";display:block;width:min(40vw,165px);aspect-ratio:.87;
  margin:0 auto 8px;background:url(${A}/copas.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 18px color-mix(in srgb,var(--brand-2) 45%,transparent))}
.countdown-grid{max-width:430px;margin:24px auto 0;gap:11px}
${VINO_SEC} .countdown-ring{border:0;border-radius:14px;padding:16px 4px 12px;
  background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(0,0,0,.18));
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 55%,transparent)}
${VINO_SEC} :is([data-cd],.ring-number){font-family:var(--car-caps);font-weight:400;color:var(--car-oro-claro)}
${VINO_SEC} .ring-label{font-size:9.5px;letter-spacing:.2em;
  color:color-mix(in srgb,var(--car-vino-ink) 72%,transparent)}
.gifts-account{background:rgba(255,255,255,.05);border-color:var(--car-oro)}
.gifts-bank{color:var(--car-oro-claro)}
${VINO_SEC} .inv-mapa-datos{background:rgba(255,255,255,.06);color:var(--car-vino-ink)}
${VINO_SEC} .inv-mapa-lugar{color:#fff4ee}

/* ── El itinerario: medallón y hilo de oro ── */
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
  box-shadow:0 0 0 2px color-mix(in srgb,var(--brand-2) 80%,transparent)}
#events .event-time{order:1;font-family:var(--car-caps);font-size:12.5px;letter-spacing:.2em;color:var(--brand)}
#events .event-type{order:2;font-family:var(--car-caps);font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--muted)}
#events .event-title{order:3;font-style:italic;font-weight:500;font-size:23px;color:var(--ink)}
#events .event-place{order:4;margin-top:4px;font-size:15px}
#events .event-note{order:5;margin-top:4px}
#events .event-map-btn{order:6;justify-self:start;margin-top:10px}

/* ── Botones ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 60%,#fff) 45%,var(--accent));
  background-size:220% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--accent) 85%,#000);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}
/* En el vino los botones son de oro: el rojo sobre rojo no se ve. */
${VINO_SEC} :is(.gifts-btn,.inv-mapa-btn:not(.inv-agendar),.inv-rsvp-btn:not(.inv-rsvp-no)){
  background:linear-gradient(100deg,var(--car-oro-hondo),var(--brand-2) 45%,var(--car-oro-hondo));
  background-size:220% 100%;color:var(--car-vino)}

/* ── Pie ── */
footer{padding:86px 24px calc(76px + env(safe-area-inset-bottom));background:var(--car-vino)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:170px;aspect-ratio:1.7;margin:0 auto 2px;
  background:url(${A}/corona.png) center/contain no-repeat}
.footer-names{font-size:96px;line-height:1;padding-top:.06em}
.footer-date{font-family:var(--car-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.34em;color:var(--car-oro-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.hero-content::before,.splash-modal::before,
  #countdown .container::before{animation:none}
}`;

export const carmesi: Design = {
  slug: "15-carmesi",
  name: "Quinceañera Noche Carmesí",
  occasion: "quince",
  mood: "Rojo terciopelo y oro: telón de teatro, candelabros, brindis y pétalos de rosa",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Italianno"
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
  palettes: [CARMESI, VINO, GRANATE, NEGRO_ROJO],
  css,
  deco: {
    ornament: () => `<img class="car-divisor" src="${A}/divisor.png" alt="">`,
  },
};
