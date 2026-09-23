/**
 * Quinceañera París.
 *
 * Rosa empolvado, negro de hierro forjado y oro: una noche en París. El
 * balcón con rosas, la torre que se enciende, la bicicleta con peonías,
 * los macarons y el perfume.
 *
 * Sale del HTML «París» hecho a mano, con adornos de Grok recortados a
 * PNG. Dos componentes nacieron aquí y sirven en cualquier diseño: la
 * apertura «ventana» —dos postigos de balcón que se abren— y el programa
 * «postales», cada momento con su estampilla y matasellos. La cuenta atrás
 * es «paletas», que aquí hace de tablero de salidas de una estación. El
 * diseño trae puestos el programa y la cuenta atrás (`variantes`); la
 * apertura se elige en la invitación.
 *
 * El papel es rosa y la noche es negra: la cuenta atrás, los regalos y el
 * pie, que es donde brilla el oro.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/paris";

const PARIS = paleta({
  id: "paris", nombre: "Rosa y negro",
  base: "#fdf6f4", tinta: "#2a2224", marca: "#b8627a", acento: "#b8627a", segundo: "#c9a45c",
});
const LAVANDA = paleta({
  id: "lavanda-paris", nombre: "Lavanda y oro",
  base: "#f8f4fb", tinta: "#26213a", marca: "#7a5ca8", acento: "#7a5ca8", segundo: "#c9a45c",
});
const MENTA = paleta({
  id: "menta-paris", nombre: "Menta y rosa",
  base: "#f3faf7", tinta: "#1f2e2a", marca: "#4f8a7a", acento: "#4f8a7a", segundo: "#d68ea2",
});
const NOIR = paleta({
  id: "noir-paris", nombre: "Noir",
  base: "#1c1718", tinta: "#fbeff1", marca: "#eec7cf", acento: "#eec7cf", segundo: "#c9a45c",
});

/* Las secciones de noche: la cuenta atrás, los regalos y la ubicación. */
const NOCHE = ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--pa-caps:'Tenor Sans',Arial,sans-serif;--pa-titulo:'Italiana',Georgia,serif;
  --pa-script:'Mrs Saint Delafield',cursive;
  --pa-noche:color-mix(in srgb,var(--footer-bg) 92%,var(--brand));--pa-noche-ink:var(--footer-ink);
  --pa-oro:var(--brand-2);--pa-oro-claro:color-mix(in srgb,var(--brand-2) 50%,#fff);
  --pa-rosa:color-mix(in srgb,var(--brand) 22%,var(--bg))}
body{background:var(--bg)}

/* ── Letras ──
   Italiana es preciosa en grande y se desdibuja en pequeño: las versalitas
   van en Tenor Sans y Italiana se queda para los títulos. */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,.ring-number,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{font-family:var(--pa-caps)}
.section-label{font-size:11.5px;letter-spacing:.3em;padding-left:.3em;color:var(--brand)}
.section-title{font-family:var(--pa-titulo);font-weight:400;font-size:clamp(36px,10vw,50px);line-height:1.1;
  letter-spacing:.04em}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names{font-family:var(--pa-script);font-weight:400;padding-top:.12em}
.hero-amp,.splash-amp,.footer-names .amp{font-size:.45em}
@keyframes paFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

.ornament{margin:4px auto 24px}
.pa-divisor{display:block;width:min(78%,320px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: la noche de París detrás de la ventana ── */
#splash{background:radial-gradient(90% 60% at 50% 40%,color-mix(in srgb,var(--pa-noche) 80%,var(--brand)),var(--pa-noche))}
.splash-modal{background:transparent;box-shadow:none;color:var(--pa-noche-ink)}
.splash-modal::before{content:"";display:block;width:92px;aspect-ratio:.55;margin:0 auto 6px;
  background:url(${A}/torre.png) center/contain no-repeat;
  filter:drop-shadow(0 0 16px color-mix(in srgb,var(--brand-2) 45%,transparent))}
.splash-name{font-size:clamp(78px,24vw,120px);line-height:1;color:color-mix(in srgb,var(--brand) 18%,#fff);
  text-shadow:0 0 24px color-mix(in srgb,var(--brand) 50%,transparent)}
.splash-subtitle{color:var(--pa-oro-claro);letter-spacing:.34em}
.splash-date{font-family:var(--pa-caps);letter-spacing:.24em;color:color-mix(in srgb,var(--pa-noche-ink) 80%,transparent)}

/* ── Portada: la calle con la torre al fondo ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:var(--pa-noche);
  --hero-ink:#fff6f2;--hero-ink-soft:rgba(255,246,242,.88);--hero-line:rgba(255,246,242,.3);--hero-brand:var(--pa-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.05),transparent 34%,
    color-mix(in srgb,var(--pa-noche) 55%,transparent) 64%,var(--pa-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:12.5px;letter-spacing:.42em;padding-left:.42em;margin:0;color:var(--pa-oro-claro)}
.hero-name{font-size:clamp(96px,30vw,150px);line-height:1;margin:0;color:color-mix(in srgb,var(--brand) 12%,#fff);
  text-shadow:0 2px 20px rgba(0,0,0,.5)}
.hero-sub{font-style:italic;font-size:19px}
.hero-date{border-top:0;padding-top:0;margin-top:0;font-family:var(--pa-caps);font-size:13.5px;letter-spacing:.28em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0}
.hero-scroll{color:var(--pa-oro-claro)}

/* ── El papel rosa ── */
section{padding:96px 26px}
section.alt{background:linear-gradient(var(--bg),var(--pa-rosa))}
#guests{padding-top:108px;padding-bottom:124px;background:linear-gradient(var(--bg),var(--pa-rosa))}
#guests::after{content:"";position:absolute;right:8px;bottom:8px;width:min(32vw,160px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#guests .container::before{content:"";display:block;width:min(58vw,240px);aspect-ratio:1.33;margin:0 auto 10px;
  background:url(${A}/bicicleta.png) center/contain no-repeat}
#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(22px,6vw,27px);line-height:1.5;
  max-width:27ch;margin-inline:auto;color:var(--brand)}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--brand) 40%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--pa-caps);font-size:11.5px;letter-spacing:.22em;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17.5px;line-height:1.5;color:var(--ink);white-space:pre-line}
#events,.inv-block-events{background:var(--pa-rosa)}
#features{padding-top:112px;background:linear-gradient(var(--bg),var(--pa-rosa))}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;border:0;border-radius:14px;background:var(--card);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 25%,transparent)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--brand)}
.feature-title{font-weight:400;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand)}
#confirmation{padding-bottom:130px}
#confirmation .container::before{content:"";display:block;width:96px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;filter:drop-shadow(0 6px 14px rgba(0,0,0,.3))}
#confirmation::after{content:"";position:absolute;right:8px;bottom:8px;width:min(30vw,150px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0}

/* ── Las postales ── */
.inv-ev-postales .event-time{font-size:13px;letter-spacing:.2em;color:var(--brand)}
.inv-ev-postales .event-type{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}
.inv-ev-postales .event-title{font-family:var(--pa-script);font-weight:400;font-size:40px;line-height:1.1;color:var(--ink)}
.inv-ev-postales .event-place{font-size:16px}
.inv-ev-postales .event-map-btn{padding:0 0 2px;background:none;border:0;border-radius:0;box-shadow:none;
  font-size:11px;letter-spacing:.2em;color:var(--brand);border-bottom:1px solid color-mix(in srgb,var(--brand) 45%,transparent)}

/* ── La noche ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--pa-noche) 85%,var(--brand)),var(--pa-noche));
  color:var(--pa-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--pa-oro-claro)}
${NOCHE} .section-title{color:#fff6f2}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){color:color-mix(in srgb,var(--pa-noche-ink) 80%,transparent)}
/* La torre preside el tablero de salidas. */
#countdown .container::before,.inv-block-countdown .container::before{content:"";display:block;
  width:min(30vw,120px);aspect-ratio:.55;margin:0 auto 6px;background:url(${A}/torre.png) center/contain no-repeat;
  filter:drop-shadow(0 0 18px color-mix(in srgb,var(--brand-2) 45%,transparent))}
${NOCHE} .inv-cd-paletas .ring-number{color:#fff6f2}
${NOCHE} .ring-label{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--pa-oro-claro)}
#gifts .container::before,.inv-block-gifts .container::before{content:"";display:block;width:min(32vw,130px);
  aspect-ratio:.82;margin:0 auto 8px;background:url(${A}/macarons.png) center/contain no-repeat}
.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--brand-2) 45%,transparent);border-radius:14px}
.gifts-bank{color:var(--pa-oro-claro)}
${NOCHE} .inv-mapa-datos{background:rgba(255,255,255,.05);color:var(--pa-noche-ink)}

/* ── Botones: negro que se vuelve rosa ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--ink);color:var(--bg);font-size:12.5px;letter-spacing:.22em;
  box-shadow:0 12px 24px -14px color-mix(in srgb,var(--ink) 90%,transparent);transition:background .3s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background:var(--brand)}
#hero .hero-btn,${NOCHE} :is(.gifts-btn,.inv-mapa-btn:not(.inv-agendar),.inv-rsvp-btn:not(.inv-rsvp-no)){
  background:color-mix(in srgb,var(--brand) 30%,#fff);color:var(--pa-noche)}

/* ── Pie ── */
footer{padding:76px 24px calc(72px + env(safe-area-inset-bottom));background:var(--pa-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:110px;aspect-ratio:.55;margin:0 auto 4px;
  background:url(${A}/torre.png) center/contain no-repeat}
.footer-names{font-size:96px;line-height:1;color:color-mix(in srgb,var(--brand) 30%,#fff)}
.footer-date{font-family:var(--pa-caps);letter-spacing:.26em}
.footer-copy{letter-spacing:.32em;color:var(--pa-oro-claro)}
`;

export const paris: Design = {
  slug: "15-paris",
  name: "Quinceañera París",
  occasion: "quince",
  mood: "Rosa empolvado, hierro forjado y oro: la torre, el balcón con rosas y postales de la noche",
  fontUrl: gfont(
    "family=Italiana&family=Tenor+Sans&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Mrs+Saint+Delafield"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 400,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.26em",
  },
  shape: { radius: 14, radiusSm: 12, btnRadius: "pill", shadow: "none" },
  palettes: [PARIS, LAVANDA, MENTA, NOIR],
  variantes: { countdown: "paletas", events: "postales" },
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
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 32 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
  ],
  deco: {
    ornament: () => `<img class="pa-divisor" src="${A}/divisor.png" alt="">`,
  },
};
