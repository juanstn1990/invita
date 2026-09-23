/**
 * Quinceañera Alicia en el País de las Maravillas.
 *
 * Sale de una invitación impresa de verdad —la de Emily—: pergamino
 * envejecido, tinta sepia, el As de corazones en las esquinas, el conejo
 * blanco heraldo, el gato de Cheshire y el azul celeste reservado para la
 * quinceañera. El HTML «alicia» se hizo sobre ella con adornos de Grok.
 *
 * Tres componentes nacieron aquí y sirven en cualquier diseño: la apertura
 * «naipe» —el As se voltea y cae girando por la madriguera—, la cuenta
 * atrás «bolsillo» —relojes de bolsillo con la manecilla girando— y el
 * programa «naipes» —cada momento es una carta que se reparte—. El diseño
 * trae puestos los dos últimos (`variantes`).
 *
 * El papel no son secciones: son pergaminos rasgados puestos sobre la mesa,
 * que es el fondo de la página. El borde roto es un clip-path, así que no
 * hay imagen que cargar y se adapta al alto de cada sección.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/alicia";

const SEPIA = paleta({
  id: "sepia", nombre: "Pergamino y sepia",
  base: "#ecdcbc", tinta: "#3f2512", marca: "#6b3f1f", acento: "#6b3f1f", segundo: "#8cc4e8",
});
const TE = paleta({
  id: "te-celeste", nombre: "Té celeste",
  base: "#eef3f6", tinta: "#1f3140", marca: "#3f7fae", acento: "#3f7fae", segundo: "#c9a45c",
});
const REINA = paleta({
  id: "reina-corazones", nombre: "Reina de corazones",
  base: "#f3e6d6", tinta: "#3a1418", marca: "#a3242f", acento: "#a3242f", segundo: "#2a1a14",
});
const NOCHE = paleta({
  id: "madriguera", nombre: "La madriguera",
  base: "#241710", tinta: "#f3e6c8", marca: "#e0c08a", acento: "#e0c08a", segundo: "#8cc4e8",
});

/* El borde roto de los pergaminos. Generado una vez con un poco de azar y
   fijado aquí: si cambiara en cada render, cada vista tendría otro papel. */
const RASGADO =
  "polygon(0.0% 0.8%,3.8% 0.4%,7.7% 1.7%,11.5% 0.2%,15.4% 1.4%,19.2% 1.0%,23.1% 0.2%,26.9% 1.3%,30.8% 0.1%,34.6% 1.1%,38.5% 0.2%,42.3% 0.2%,46.2% 1.1%,50.0% 2.1%,53.8% 0.3%,57.7% 0.6%,61.5% 1.6%,65.4% 2.5%,69.2% 1.5%,73.1% 1.0%,76.9% 2.5%,80.8% 0.1%,84.6% 2.2%,88.5% 0.8%,92.3% 0.4%,96.2% 0.3%,100.0% 0.8%,98.2% 5.6%,99.6% 11.1%,98.7% 16.7%,98.6% 22.2%,99.2% 27.8%,98.8% 33.3%,99.9% 38.9%,99.9% 44.4%,99.5% 50.0%,98.5% 55.6%,99.1% 61.1%,99.3% 66.7%,98.7% 72.2%,99.0% 77.8%,99.3% 83.3%,98.3% 88.9%,98.5% 94.4%,100.0% 99.4%,96.2% 98.5%,92.3% 98.6%,88.5% 97.7%,84.6% 98.1%,80.8% 99.3%,76.9% 97.5%,73.1% 99.7%,69.2% 98.9%,65.4% 98.0%,61.5% 99.6%,57.7% 98.7%,53.8% 99.9%,50.0% 98.3%,46.2% 98.0%,42.3% 98.5%,38.5% 97.7%,34.6% 99.2%,30.8% 98.2%,26.9% 98.5%,23.1% 98.5%,19.2% 98.8%,15.4% 97.8%,11.5% 97.5%,7.7% 98.8%,3.8% 98.3%,0.0% 99.8%,1.5% 94.4%,1.4% 88.9%,2.2% 83.3%,1.8% 77.8%,0.6% 72.2%,0.8% 66.7%,1.5% 61.1%,0.0% 55.6%,1.0% 50.0%,0.4% 44.4%,0.3% 38.9%,0.1% 33.3%,1.7% 27.8%,0.3% 22.2%,0.5% 16.7%,0.9% 11.1%,1.9% 5.6%)";

/* Las secciones que van en pergamino; el programa va suelto sobre la mesa,
   porque los naipes ya son papel. */
const PAPEL =
  ":is(#guests,#countdown,#features,#gifts,#confirmation,#gallery,.inv-block-countdown,.inv-block-features," +
  ".inv-block-gifts,.inv-block-paragraph,.inv-block-ubicacion)";

const css = () => `
:root{--al-caps:'Libre Baskerville',Georgia,serif;--al-script:'Great Vibes',cursive;
  --al-papel:color-mix(in srgb,var(--bg) 35%,#fbf6ea);--al-papel-2:color-mix(in srgb,var(--bg) 80%,#fff);
  --al-mesa:color-mix(in srgb,var(--bg) 78%,#8a5a2a);--al-hondo:color-mix(in srgb,var(--brand) 55%,#000);
  --inv-naipe-fondo:color-mix(in srgb,var(--bg) 40%,#fbf3de);--inv-naipe-rojo:#a3242f;--inv-surface:var(--al-papel)}
/* La mesa: pergamino envejecido, más oscuro en los bordes. */
body{background:
  radial-gradient(40% 30% at 20% 30%,rgba(160,110,50,.12),transparent 70%),
  radial-gradient(35% 25% at 80% 65%,rgba(140,90,40,.12),transparent 70%),
  radial-gradient(130% 90% at 50% 50%,var(--bg) 55%,var(--al-mesa) 100%) fixed,var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,.ring-number,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,.event-place,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{font-family:var(--al-caps)}
.section-label{font-size:11.5px;letter-spacing:.24em;padding-left:.24em;color:var(--brand)}
.section-title{font-family:var(--al-script);font-weight:400;font-size:clamp(46px,13vw,64px);line-height:1.1;color:var(--al-hondo)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.6}
.hero-name,.splash-name,.footer-names{font-family:var(--al-script);font-weight:400;padding-top:.08em}
.ornament{margin:4px auto 20px}
.al-divisor{display:block;width:min(78%,320px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: la madriguera, y el As encima ── */
#splash{background:radial-gradient(90% 60% at 50% 45%,color-mix(in srgb,var(--al-hondo) 75%,var(--brand)),color-mix(in srgb,var(--al-hondo) 55%,#000))}
.splash-modal{color:var(--ink);background-image:radial-gradient(120% 90% at 50% 50%,transparent 50%,rgba(150,105,50,.28) 100%)}
.splash-subtitle{font-size:11px;letter-spacing:.2em;color:var(--brand);margin:0}
.splash-subtitle[data-inv="splash.label"]{font-family:var(--al-script);font-size:26px;letter-spacing:0;text-transform:none;color:var(--al-hondo);margin-bottom:4px}
.splash-name{font-size:clamp(66px,20vw,96px);line-height:1;color:var(--al-hondo)}
.splash-date{font-family:var(--al-caps);font-size:11px;letter-spacing:.14em;color:var(--brand)}
#splash .inv-sobre-pista{color:color-mix(in srgb,var(--bg) 60%,#fff)}

/* ── Portada: el jardín del té ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:#2a180b;
  --hero-ink:#fbf3e2;--hero-ink-soft:rgba(251,243,226,.88);--hero-line:rgba(251,243,226,.4);--hero-brand:#f0d9ad}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(40,22,10,.05),transparent 34%,rgba(40,22,10,.6) 64%,#2a180b 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:12px;letter-spacing:.3em;padding-left:.3em;margin:0}
.hero-name{font-size:clamp(100px,32vw,160px);line-height:1;margin:0;text-shadow:0 2px 18px rgba(0,0,0,.55)}
.hero-date{border-top:0;padding-top:0;margin-top:4px;font-family:var(--al-caps);font-size:14px;letter-spacing:.14em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0}

/* ── Los pergaminos rasgados ── */
section,section.alt{padding:64px 16px;background:none}
${PAPEL} > .container{position:relative;max-width:520px;padding:54px 26px 50px;clip-path:${RASGADO};
  background:radial-gradient(120% 90% at 50% 40%,var(--al-papel) 40%,var(--al-papel-2) 100%);
  filter:drop-shadow(0 12px 18px rgba(60,35,15,.35))}

#guests > .container::after{content:"";position:absolute;left:12px;top:14px;width:min(24vw,110px);aspect-ratio:.95;
  background:url(${A}/esquina.png) center/contain no-repeat;pointer-events:none}
#guests .section-title{font-size:clamp(34px,9.6vw,44px);max-width:15ch;margin-inline:auto}
#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(21px,5.8vw,25px);line-height:1.5;max-width:26ch;margin-inline:auto;color:var(--brand)}
/* Los padres: una sola columna, el nombre en caligrafía y la frase debajo. */
.inv-padres-invitados{display:block;margin:18px auto 0;max-width:30ch}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0;border:0!important}
.inv-padres-invitados .hero-padres-tit{font-family:var(--al-script);font-size:38px;line-height:1.2;letter-spacing:0;text-transform:none;color:var(--al-hondo);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:2px;font-style:italic;font-size:18px;line-height:1.5;color:var(--muted);white-space:pre-line}

.inv-cd-bolsillo .ring-number{font-weight:700}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:18px 10px;border:0;border-radius:12px;background:rgba(255,255,255,.4);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 25%,transparent)}
#features .feature-card:nth-child(n+3){grid-column:1/-1}
.feature-icon{color:var(--al-hondo)}
.feature-title{font-weight:400;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand)}
#features .feature-card:nth-child(-n+2) .feature-text{font-family:var(--al-script);font-size:32px;line-height:1.1;color:var(--al-hondo)}

#gifts .gifts-text{font-family:var(--al-script);font-size:clamp(28px,8vw,34px);line-height:1.3;color:var(--al-hondo);max-width:20ch;margin-inline:auto}

#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0}

/* ── Los naipes sobre la mesa ── */
.inv-ev-naipes .event-time{font-weight:700;font-size:15px;letter-spacing:.08em;color:var(--al-hondo)}
.inv-ev-naipes .event-type{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.inv-ev-naipes .event-title{font-family:var(--al-script);font-weight:400;font-size:36px;line-height:1.1;color:var(--al-hondo)}
.inv-ev-naipes .event-place{font-size:12.5px;line-height:1.7;letter-spacing:.04em;text-transform:uppercase}
.inv-ev-naipes .event-map-btn{padding:0 0 2px;background:none;border:0;border-radius:0;box-shadow:none;font-size:10.5px;
  letter-spacing:.16em;color:var(--brand);border-bottom:1px solid color-mix(in srgb,var(--brand) 45%,transparent)}

/* ── Botones: café tinta ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:linear-gradient(100deg,var(--al-hondo),var(--brand));color:#fbf3e2;
  font-size:11.5px;letter-spacing:.14em;box-shadow:0 10px 20px -12px color-mix(in srgb,var(--al-hondo) 90%,transparent)}

/* ── Pie: la mesa del té ── */
footer{padding:60px 24px calc(64px + env(safe-area-inset-bottom));
  background:radial-gradient(90% 70% at 50% 30%,color-mix(in srgb,var(--al-hondo) 75%,var(--brand)),color-mix(in srgb,var(--al-hondo) 55%,#000))}
footer .container{position:relative;z-index:2}

.footer-names{font-size:96px;line-height:1;color:#f3e6c8}
.footer-date{font-family:var(--al-caps);letter-spacing:.2em;color:#f0d9ad}
.footer-copy{letter-spacing:.24em;color:#f0d9ad}
`;

export const alicia: Design = {
  slug: "15-alicia",
  name: "Quinceañera Alicia en el País de las Maravillas",
  occasion: "quince",
  mood: "Pergamino y sepia: el As de corazones, el conejo blanco, el gato de Cheshire y pergaminos rasgados",
  fontUrl: gfont(
    "family=Great+Vibes&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 500,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.2em",
  },
  shape: { radius: 12, radiusSm: 10, btnRadius: "pill", shadow: "none" },
  palettes: [SEPIA, TE, REINA, NOCHE],
  variantes: { countdown: "bolsillo", events: "naipes" },
  padresEn: "guests",
  css,
  /*
   * Los adornos que trae puestos: entran en los datos al crear la
   * invitación, así que se mueven, se encogen o se borran desde el editor.
   */
  adornos: [
    { seccion: "guests", url: `${A}/conejo.png`, sitio: "cabecera", tamano: 40 },
    { seccion: "countdown", url: `${A}/reloj.png`, sitio: "cabecera", tamano: 36 },
    { seccion: "gifts", url: `${A}/gato.png`, sitio: "titulo", tamano: 40 },
    { seccion: "confirm", url: `${A}/sello.png`, sitio: "cabecera", tamano: 23 },
    { seccion: "footer", url: `${A}/tetera.png`, sitio: "cabecera", tamano: 46 },
    /* La filigrana que va bajo cada título. Como adorno y no sólo en el
       CSS: así se puede mover, encoger o quitar de una sección suelta. */
    { seccion: "*", url: `${A}/divisor.png`, sitio: "titulo", tamano: 70 },
  ],
  deco: {
    ornament: () => `<img class="al-divisor" src="${A}/divisor.png" alt="">`,
  },
};
