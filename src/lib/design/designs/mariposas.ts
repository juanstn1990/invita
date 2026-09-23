/**
 * Quinceañera Jardín de Mariposas.
 *
 * Lila, rosa y un toque de turquesa con oro: mariposas iridiscentes en un
 * jardín al atardecer. «Fui oruga, fui capullo y ahora me toca volar».
 *
 * Sale del HTML «mariposas» hecho a mano, con adornos de Grok recortados a
 * PNG. Nacieron aquí, y sirven en cualquier diseño: la apertura «mariposa»
 * —bate las alas sobre el nombre y sale volando—, la cuenta atrás «alas»
 * —cada número posado en una mariposa que bate al cambiar— y el rumbo
 * «revolotea» de las partículas con imagen, para que una mariposa subida
 * vuele aleteando en vez de caer como un pétalo. El programa es el «viaje»
 * de Cielo Celeste con una mariposa por viajero.
 *
 * Las tres mariposas —la del velo, la de las alas del reloj y la que baja
 * por el hilo— salen de variables (--inv-mariposa-img, --inv-viajero-img):
 * el componente no sabe nada de este diseño.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/mariposas";

const MARIPOSAS = paleta({
  id: "mariposas", nombre: "Lila y turquesa",
  base: "#fcf8fd", tinta: "#3a2a48", marca: "#7c55a8", acento: "#7c55a8", segundo: "#6fc4bd",
});
const ROSA = paleta({
  id: "rosa-mariposa", nombre: "Rosa y oro",
  base: "#fdf6f9", tinta: "#45243a", marca: "#b0457e", acento: "#b0457e", segundo: "#c9a45c",
});
const AGUA = paleta({
  id: "turquesa-mariposa", nombre: "Turquesa y lila",
  base: "#f4fbfb", tinta: "#1e3b3d", marca: "#2f8a86", acento: "#2f8a86", segundo: "#b48fd6",
});
const NOCHE = paleta({
  id: "noche-mariposa", nombre: "Noche lila",
  base: "#241a30", tinta: "#f6effc", marca: "#d9b8f2", acento: "#d9b8f2", segundo: "#6fc4bd",
});

/* Las secciones de noche: los regalos y la ubicación. */
const OSCURO = ":is(#gifts,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--mp-caps:'Quicksand',Arial,sans-serif;--mp-script:'Petit Formal Script',cursive;
  --mp-noche:color-mix(in srgb,var(--footer-bg) 80%,var(--brand));--mp-noche-ink:var(--footer-ink);
  --mp-claro:color-mix(in srgb,var(--brand) 12%,var(--bg));
  --mp-rosa:color-mix(in srgb,var(--brand) 8%,color-mix(in srgb,var(--bg) 78%,#f3c3dc));
  --inv-mariposa-img:url(${A}/mariposa-velo.png);--inv-viajero-img:url(${A}/mariposa-lila.png)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{font-family:var(--mp-caps);font-weight:600}
.section-label{font-size:12px;letter-spacing:.3em;padding-left:.3em;color:var(--brand)}
.section-title{font-style:italic;font-weight:500;font-size:clamp(38px,10.5vw,52px);line-height:1.1}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names{font-family:var(--mp-script);font-weight:400;padding-top:.12em}
@keyframes mpFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

.ornament{margin:4px auto 24px}
.mp-divisor{display:block;width:min(78%,320px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el amanecer lila donde se posa la mariposa ── */
#splash{background:radial-gradient(90% 60% at 50% 30%,#fff,var(--mp-claro) 60%,var(--mp-rosa))}
.splash-modal{background:transparent;box-shadow:none;color:var(--ink)}
.splash-name{font-size:clamp(52px,16vw,78px);line-height:1.1;color:var(--brand)}
.splash-subtitle{color:var(--brand);letter-spacing:.3em}
.splash-date{font-family:var(--mp-caps);font-weight:600;letter-spacing:.24em;color:var(--muted)}
#splash .inv-sobre-pista{color:var(--brand)}

/* ── Portada: el jardín de las mariposas ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:var(--mp-noche);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.88);--hero-line:rgba(255,255,255,.3);
  --hero-brand:color-mix(in srgb,var(--brand) 25%,#fff)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.04),transparent 34%,
    color-mix(in srgb,var(--mp-noche) 55%,transparent) 64%,var(--mp-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-content::before{content:"";display:block;width:min(56vw,230px);aspect-ratio:2.2;margin:0 auto 2px;
  background:url(${A}/corona.png) center/contain no-repeat;animation:mpFlota 6s ease-in-out infinite}
.hero-label{font-size:12.5px;letter-spacing:.4em;padding-left:.4em;margin:0}
.hero-name{font-size:clamp(66px,20vw,104px);line-height:1.1;margin:0;text-shadow:0 2px 18px rgba(0,0,0,.45)}
.hero-date{border-top:0;padding-top:0;margin-top:6px;font-family:var(--mp-caps);font-weight:600;font-size:13px;letter-spacing:.3em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0}

/* ── El jardín ── */
section{padding:96px 26px}
section.alt{background:linear-gradient(var(--bg),var(--mp-claro))}
#guests{padding-top:104px;padding-bottom:124px;background:linear-gradient(var(--bg),var(--mp-claro))}
#guests::after{content:"";position:absolute;right:0;bottom:0;width:min(34vw,170px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#guests .container::before{content:"";display:block;width:min(46vw,180px);aspect-ratio:.8;margin:0 auto 10px;
  background:url(${A}/ramo.png) center/contain no-repeat}
#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(22px,6vw,27px);line-height:1.5;
  max-width:27ch;margin-inline:auto;color:var(--brand)}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid color-mix(in srgb,var(--brand) 35%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--mp-caps);font-weight:600;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17.5px;line-height:1.5;color:var(--ink);white-space:pre-line}
#countdown,.inv-block-countdown{background:linear-gradient(var(--mp-rosa),var(--mp-claro))}
.inv-cd-alas .ring-number{font-weight:500;color:var(--ink)}
.inv-cd-alas .ring-label{color:var(--brand)}
#features{padding-top:112px;background:linear-gradient(var(--mp-rosa),var(--mp-claro))}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;border:0;border-radius:18px;background:var(--card);
  box-shadow:0 14px 26px -20px color-mix(in srgb,var(--ink) 50%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--brand) 22%,transparent)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--brand)}
.feature-title{font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand)}
#confirmation{padding-bottom:130px}
#confirmation .container::before{content:"";display:block;width:92px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;filter:drop-shadow(0 6px 14px rgba(0,0,0,.25))}
#confirmation::after{content:"";position:absolute;right:0;bottom:0;width:min(30vw,150px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── El viaje de la mariposa ── */
section .inv-ev-viaje .event-time{font-size:12px;letter-spacing:.2em;color:var(--brand)}
section .inv-ev-viaje .event-type{font-family:inherit;font-weight:500;font-style:italic;font-size:24px;
  letter-spacing:0;text-transform:none;color:var(--ink)}
section .inv-ev-viaje .event-title{font-family:inherit;font-size:16.5px;font-weight:400;font-style:normal;
  letter-spacing:0;text-transform:none;color:var(--muted)}
section .inv-ev-viaje .event-map-btn{padding:0 0 2px;background:none;border:0;border-radius:0;box-shadow:none;
  font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--brand);
  border-bottom:1px solid color-mix(in srgb,var(--brand) 40%,transparent)}
section .inv-viajero{width:48px;height:48px;left:16px}

/* ── La noche ── */
${OSCURO}{background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--mp-noche) 80%,var(--brand)),var(--mp-noche));
  color:var(--mp-noche-ink)}
${OSCURO} .container{position:relative;z-index:2}
${OSCURO} .section-label{color:color-mix(in srgb,var(--brand) 30%,#fff)}
${OSCURO} .section-title{color:#fff}
${OSCURO} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){color:color-mix(in srgb,var(--mp-noche-ink) 80%,transparent)}
#gifts .container::before,.inv-block-gifts .container::before{content:"";display:block;width:min(34vw,130px);aspect-ratio:.72;
  margin:0 auto 8px;background:url(${A}/frasco.png) center/contain no-repeat}
.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--mp-noche-ink) 35%,transparent);border-radius:18px}
.gifts-bank{color:color-mix(in srgb,var(--brand) 30%,#fff)}
${OSCURO} .inv-mapa-datos{background:rgba(255,255,255,.06);color:var(--mp-noche-ink)}

/* ── Botones: del lila al turquesa ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 50%,var(--brand-2)) 50%,var(--brand-2));
  background-size:200% 100%;color:var(--on-accent);font-size:12.5px;letter-spacing:.2em;
  box-shadow:0 12px 24px -12px color-mix(in srgb,var(--accent) 80%,transparent);transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}

/* ── Pie: la mariposa grande ── */
footer{padding:76px 24px calc(72px + env(safe-area-inset-bottom));background:var(--mp-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:min(40vw,160px);aspect-ratio:1.2;margin:0 auto 4px;
  background:url(${A}/mariposa.png) center/contain no-repeat;animation:mpFlota 5s ease-in-out infinite}
.footer-names{font-size:64px;line-height:1.1;color:color-mix(in srgb,var(--brand) 20%,#fff)}
.footer-date{font-family:var(--mp-caps);font-weight:600;letter-spacing:.26em}
.footer-copy{letter-spacing:.3em;color:color-mix(in srgb,var(--brand) 30%,#fff)}

@media (prefers-reduced-motion:reduce){
  .hero-content::before,footer .container::before{animation:none}
}`;

export const mariposas: Design = {
  slug: "15-mariposas",
  name: "Quinceañera Jardín de Mariposas",
  occasion: "quince",
  mood: "Lila, rosa y turquesa: mariposas iridiscentes que baten las alas en un jardín al atardecer",
  fontUrl: gfont(
    "family=Quicksand:wght@500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Petit+Formal+Script"
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
  palettes: [MARIPOSAS, ROSA, AGUA, NOCHE],
  variantes: { countdown: "alas", events: "viaje" },
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
    /* La filigrana que va bajo cada título. Como adorno y no sólo en el
       CSS: así se puede mover, encoger o quitar de una sección suelta. */
    { seccion: "*", url: `${A}/divisor.png`, sitio: "titulo", tamano: 70 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 34 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
  ],
  deco: {
    ornament: () => `<img class="mp-divisor" src="${A}/divisor.png" alt="">`,
  },
};
