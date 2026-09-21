/**
 * Quinceañera Reina de Hielo.
 *
 * Azul rey, azul hielo, plata y blanco nieve: un palacio de cristal bajo
 * la aurora boreal. La tiara, el reno de hielo, la rosa congelada, el
 * zapato de cristal y el farol escarchado.
 *
 * Sale del HTML «reina de hielo» hecho a mano, con adornos de Grok
 * recortados a PNG. Nacieron aquí, y sirven en cualquier diseño: la
 * apertura «escarcha» —un vidrio congelado que se agrieta desde el dedo y
 * se rompe en pedazos— y la cuenta atrás «cristales», cada número dentro
 * de un cristal hexagonal. El programa es el «viaje» con un copo girando.
 *
 * Se alternan la noche azul y el hielo claro; la escarcha del velo se ve
 * sobre la noche, que es lo que deja leer el nombre empañado detrás.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/hielo";

const HIELO = paleta({
  id: "hielo", nombre: "Azul rey y plata",
  base: "#eef6fd", tinta: "#11244a", marca: "#1f3f8f", acento: "#4a7fcf", segundo: "#8fb8ea",
});
const AURORA = paleta({
  id: "aurora", nombre: "Aurora",
  base: "#effaf8", tinta: "#10303a", marca: "#1d6a78", acento: "#2f9aa4", segundo: "#9fe0d8",
});
const LILA_HIELO = paleta({
  id: "lila-hielo", nombre: "Lila escarchado",
  base: "#f5f3fd", tinta: "#221c4a", marca: "#4a3d9e", acento: "#7a6cd0", segundo: "#c2b8f2",
});
const PLATA = paleta({
  id: "plata-hielo", nombre: "Plata y blanco",
  base: "#f6f8fa", tinta: "#1e2733", marca: "#4b5a70", acento: "#7b8ca4", segundo: "#c7d3e0",
});

/* Las secciones de noche: la cuenta atrás, la vestimenta y la confirmación. */
const NOCHE = ":is(#countdown,#features,#confirmation,.inv-block-countdown,.inv-block-features,.inv-block-ubicacion)";

const css = () => `
:root{--hi-caps:'Marcellus SC',Georgia,serif;--hi-script:'Imperial Script',cursive;
  --hi-noche:color-mix(in srgb,var(--brand) 55%,#050d22);--hi-noche-2:color-mix(in srgb,var(--brand) 80%,#0b1b3d);
  --hi-claro:color-mix(in srgb,var(--brand-2) 22%,#fff);
  --hi-lamina:linear-gradient(100deg,color-mix(in srgb,var(--brand-2) 60%,#6a7f9c) 0%,#e8f1fb 22%,#fff 44%,
    color-mix(in srgb,var(--brand-2) 55%,#fff) 58%,#e8f1fb 74%,color-mix(in srgb,var(--brand-2) 60%,#6a7f9c) 92%,#e8f1fb 100%);
  --inv-viajero-img:url(${A}/copo.png)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,.ring-number,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{font-family:var(--hi-caps)}
.section-label{font-size:13px;letter-spacing:.3em;padding-left:.3em;color:var(--accent)}
.section-title{font-style:italic;font-weight:500;font-size:clamp(38px,10.5vw,52px);line-height:1.1}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names{font-family:var(--hi-script);font-weight:400;padding:.08em .06em 0;
  background:var(--hi-lamina);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:hiBrillo 8s ease-in-out infinite}
@keyframes hiBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes hiFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes hiGira{to{rotate:360deg}}

.ornament{margin:4px auto 24px}
.hi-divisor{display:block;width:min(78%,320px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el marco de escarcha en la noche ── */
#splash{background:radial-gradient(90% 60% at 50% 40%,var(--hi-noche-2),var(--hi-noche))}
.splash-modal{width:min(78vw,320px);aspect-ratio:.78;display:flex;flex-direction:column;justify-content:center;
  background:url(${A}/marco.png) center/contain no-repeat;box-shadow:none;padding:16%;color:#fff}
.splash-subtitle{font-size:11px;letter-spacing:.28em;color:#cfe2f7;margin:0}
.splash-name{font-size:clamp(52px,16vw,78px);line-height:1.1;margin:0}
.splash-date{font-family:var(--hi-caps);font-size:11px;letter-spacing:.24em;color:#cfe2f7;margin:0 0 8px}

/* ── Portada: el palacio bajo la aurora ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:var(--hi-noche);
  --hero-ink:#f7fbff;--hero-ink-soft:rgba(247,251,255,.86);--hero-line:rgba(247,251,255,.3);--hero-brand:#cfe2f7}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.04),transparent 32%,
    color-mix(in srgb,var(--hi-noche) 55%,transparent) 62%,var(--hi-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-content::before{content:"";display:block;width:min(54vw,220px);aspect-ratio:1.5;margin:0 auto 2px;
  background:url(${A}/tiara.png) center/contain no-repeat;animation:hiFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 0 18px rgba(185,211,242,.55))}
.hero-label{font-size:13px;letter-spacing:.4em;padding-left:.4em;margin:0}
.hero-name{font-size:clamp(84px,26vw,134px);line-height:1.05;margin:0;filter:drop-shadow(0 2px 14px rgba(0,20,60,.7))}
.hero-date{border-top:0;padding-top:0;margin-top:4px;font-family:var(--hi-caps);font-size:14px;letter-spacing:.28em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0}

/* ── El hielo claro ── */
section{padding:96px 26px}
section.alt{background:linear-gradient(var(--bg),var(--hi-claro))}
#guests{padding-bottom:124px;background:
  url(${A}/esquina.png) left 0 top 0/min(34vw,170px) no-repeat,linear-gradient(var(--bg),var(--hi-claro))}
#guests::after{content:"";position:absolute;right:0;bottom:0;width:min(34vw,170px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#guests .container::before{content:"";display:block;width:min(36vw,140px);aspect-ratio:.9;margin:0 auto 10px;
  background:url(${A}/rosa.png) center/contain no-repeat;filter:drop-shadow(0 10px 18px color-mix(in srgb,var(--brand) 35%,transparent))}
#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(22px,6vw,27px);line-height:1.5;
  max-width:27ch;margin-inline:auto;color:var(--brand)}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid color-mix(in srgb,var(--accent) 35%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--hi-caps);font-size:12px;letter-spacing:.22em;color:var(--accent);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17.5px;line-height:1.5;color:var(--ink);white-space:pre-line}
#events,.inv-block-events,#gifts,.inv-block-gifts{background:linear-gradient(var(--bg),var(--hi-claro))}
#gifts .container::before,.inv-block-gifts .container::before{content:"";display:block;width:min(28vw,110px);aspect-ratio:.66;
  margin:0 auto 8px;background:url(${A}/farol.png) center/contain no-repeat;
  filter:drop-shadow(0 0 20px color-mix(in srgb,var(--brand-2) 50%,transparent))}
.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:18px}
.gifts-bank{color:var(--accent)}

/* ── El viaje del copo ── */
section .inv-ev-viaje .event-time{font-size:13px;letter-spacing:.2em;color:var(--accent)}
section .inv-ev-viaje .event-type{font-family:inherit;font-weight:500;font-style:italic;font-size:24px;
  letter-spacing:0;text-transform:none;color:var(--ink)}
section .inv-ev-viaje .event-title{font-family:inherit;font-size:16.5px;font-weight:400;font-style:normal;
  letter-spacing:0;text-transform:none;color:var(--muted)}
section .inv-ev-viaje .event-map-btn{padding:0 0 2px;background:none;border:0;border-radius:0;box-shadow:none;
  font-size:11.5px;letter-spacing:.18em;color:var(--accent);border-bottom:1px solid color-mix(in srgb,var(--accent) 45%,transparent)}
section .inv-viajero{width:44px;height:44px;left:18px;animation:hiGira 8s linear infinite}

/* ── La noche azul ── */
${NOCHE}{background:radial-gradient(120% 80% at 50% 0%,var(--hi-noche-2),var(--hi-noche));color:#f7fbff}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:#b9d3f2}
${NOCHE} .section-title{color:#fff}
${NOCHE} :is(.section-body,.confirmation-text,.inv-mapa-dir){color:rgba(247,251,255,.82)}
#countdown .container::before,.inv-block-countdown .container::before{content:"";display:block;width:min(40vw,160px);
  aspect-ratio:.8;margin:0 auto 4px;background:url(${A}/reno.png) center/contain no-repeat;
  filter:drop-shadow(0 0 22px rgba(185,211,242,.4))}
/* Los cristales son claros aunque la sección sea de noche: tinta oscura. */
section .inv-cd-cristales .ring-number{color:#11244a;opacity:1}
section .inv-cd-cristales .ring-label{color:#2a4674;opacity:1}
${NOCHE} :is(.confirmation-text,.section-body) strong{color:#fff}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;border:0;border-radius:18px;background:rgba(255,255,255,.06);
  box-shadow:inset 0 0 0 1px rgba(207,226,247,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
#features :is(.feature-icon,.feature-title){color:#cfe2f7}
#features .feature-text{color:rgba(247,251,255,.85)}
.feature-title{font-weight:400;font-size:12.5px;letter-spacing:.2em}
#confirmation .container::before{content:"";display:block;width:92px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;filter:drop-shadow(0 6px 14px rgba(0,0,0,.4))}
#confirmation .confirmation-deadline{display:none}
#confirmation{--inv-field-bg:rgba(255,255,255,.07);--inv-field-ink:#f7fbff;--inv-field-border:rgba(207,226,247,.35);--inv-ink:#f7fbff}
.inv-rsvp-lab{font-size:12px;letter-spacing:.2em;color:#b9d3f2;opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{letter-spacing:0}
${NOCHE} .inv-mapa-datos{background:rgba(255,255,255,.06);color:#f7fbff}

/* ── Botones: del azul rey al hielo ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--brand),var(--accent) 50%,var(--brand-2));background-size:200% 100%;
  color:#fff;font-size:13px;letter-spacing:.2em;box-shadow:0 0 22px -6px color-mix(in srgb,var(--brand-2) 80%,transparent);
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}
#confirmation .inv-rsvp-no{color:#cfe2f7;border-color:rgba(207,226,247,.6)}

/* ── Pie: el copo ── */
footer{padding:76px 24px calc(72px + env(safe-area-inset-bottom));background:linear-gradient(var(--hi-noche),#050d20)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:90px;aspect-ratio:1;margin:0 auto 4px;
  background:url(${A}/copo.png) center/contain no-repeat;animation:hiGira 14s linear infinite}
.footer-names{font-size:84px;line-height:1.05}
.footer-date{font-family:var(--hi-caps);letter-spacing:.26em}
.footer-copy{letter-spacing:.3em;color:#b9d3f2}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.hero-content::before,footer .container::before,section .inv-viajero{animation:none}
}`;

export const hielo: Design = {
  slug: "15-hielo",
  name: "Quinceañera Reina de Hielo",
  occasion: "quince",
  mood: "Azul rey, hielo y plata: palacio de cristal bajo la aurora, un vidrio congelado que se rompe al tocarlo",
  fontUrl: gfont(
    "family=Marcellus+SC&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Imperial+Script"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 500,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.26em",
  },
  shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [HIELO, AURORA, LILA_HIELO, PLATA],
  variantes: { countdown: "cristales", events: "viaje" },
  padresEn: "guests",
  css,
  deco: {
    ornament: () => `<img class="hi-divisor" src="${A}/divisor.png" alt="">`,
  },
};
