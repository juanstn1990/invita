/**
 * Quince Magnolia.
 *
 * Verde salvia, marfil y oro: el pantano al atardecer, con sus musgos
 * colgantes, sus luciérnagas y sus flores de magnolia flotando en el agua.
 * Sale de una referencia visual de un centro de mesa con una princesa y un
 * sapo —un cuento de hadas con pantano, no una boda de salón— pero el
 * personaje no se reproduce: eso es propiedad ajena y no se copia nunca,
 * aquí ni en ningún diseño de este proyecto. Lo que sí se recrea es el
 * ánimo: la paleta exacta del vestido (verde salvia, marfil, oro), la flor
 * de magnolia que lo decora, y el pantano de luciérnagas donde está
 * ambientada la historia. El ramo de las esquinas lleva, de propina, un
 * sapito de acuarela sobre una hoja de lirio — genérico, de cuento, no el
 * personaje de nadie.
 *
 * Como en Otoño: una sola pieza de adorno —el ramo de magnolias—, repetida
 * y volteada con `espejo`/`giro` en cada esquina y al pie, nunca una nueva
 * por sección.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/15-magnolia";

const MAGNOLIA = paleta({
  id: "magnolia", nombre: "Salvia y marfil",
  base: "#f7f1e2", tinta: "#2e3b24", marca: "#6f8c5a", acento: "#b8923f", segundo: "#d9b974",
});
const PANTANO = paleta({
  id: "pantano", nombre: "Pantano y cobre",
  base: "#f2f0e2", tinta: "#24321f", marca: "#3f5c4a", acento: "#b06a3a", segundo: "#c9a35c",
});
const JAZZ = paleta({
  id: "jazz-nueva-orleans", nombre: "Vino y oro",
  base: "#f8f0e6", tinta: "#34231d", marca: "#7a3b42", acento: "#c9a24a", segundo: "#d9a6a0",
});
const NOCHE_PANTANO = paleta({
  id: "noche-pantano", nombre: "Noche de pantano",
  base: "#1c2518", tinta: "#f0e8d4", marca: "#d9b974", acento: "#d9b974", segundo: "#c9a24a",
});

/* Las secciones de noche: la cuenta atrás, los regalos y la ubicación. */
const NOCHE =
  ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--mg-caps:'Cinzel',Georgia,serif;--mg-display:'Yesteryear',cursive;
  --mg-noche:var(--footer-bg);--mg-noche-ink:var(--footer-ink);
  --mg-oro:var(--brand-2);--mg-oro-claro:color-mix(in srgb,var(--brand-2) 55%,#fff)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,
.ring-label,.footer-copy,.feature-title,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{
  font-family:var(--mg-caps)}
.section-label{font-size:12.5px;letter-spacing:.34em;padding-left:.34em;color:var(--brand)}
.section-title{font-family:var(--mg-display);font-weight:400;
  font-size:clamp(42px,12vw,58px);line-height:1.15}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{
  font-size:19px;line-height:1.65}
.splash-name,.footer-names,.inv-sobre-nombre{
  font-family:var(--mg-display);font-weight:400;color:var(--brand)}
/* Sin tarjeta debajo —a diferencia del sobre y el modal, que llevan su
   propio fondo claro—, el nombre de la portada va directo sobre la foto
   de noche: por eso toma la tinta clara de #hero y no el verde de marca. */
.hero-name{font-family:var(--mg-display);font-weight:400}
.hero-amp,.splash-amp,.footer-names .amp{display:block;font-size:.5em;line-height:1.3;
  color:var(--mg-oro-claro)}

.ornament{margin:2px auto 22px}

/* ── Bienvenida: el sobre, con el pantano asomando detrás ── */
#splash{background:var(--mg-noche) url(${A}/portada.jpg) center 20%/cover no-repeat}
#splash::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(to bottom,transparent 28%,var(--mg-noche) 85%)}
.splash-modal{position:relative;z-index:2}
.splash-subtitle{color:var(--brand);letter-spacing:.32em}
.splash-name{font-size:clamp(50px,15vw,74px);line-height:1.1}
.splash-date{font-family:var(--mg-caps);letter-spacing:.22em;color:var(--muted)}
#splash .inv-sobre-cuerpo{background:color-mix(in srgb,var(--bg) 88%,var(--brand-2));
  box-shadow:0 30px 70px -22px rgba(30,40,20,.5),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 34%,transparent)}
#splash .inv-sobre-bolsillo::before,#splash .inv-sobre-bolsillo::after{
  background:color-mix(in srgb,var(--bg) 78%,var(--brand-2))}
#splash .inv-sobre-nombre{font-size:clamp(34px,10vw,46px)}
#splash .inv-sobre-pista{color:var(--brand);opacity:.85}
#splash .inv-sobre-sello{background:var(--brand-2);box-shadow:0 4px 10px rgba(30,40,20,.4)}

/* ── Portada: el pantano de noche, con el nombre bajo la luna ── */
#hero{background:var(--mg-noche);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.86);--hero-line:rgba(255,255,255,.32);
  --hero-brand:var(--mg-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center top}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;
  pointer-events:none;background:linear-gradient(to bottom,transparent 35%,
    color-mix(in srgb,var(--mg-noche) 55%,transparent) 62%,var(--mg-noche) 96%)}
/* Un halo de noche detrás del texto y no un panel: la ilustración sigue
   entera, pero lo que pasa detrás de las letras —la luna, el vapor
   encendido— baja de tono lo justo para que se lean. */
.hero-content{position:relative;z-index:3;box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--mg-noche) 52%,transparent) 55%,
    transparent) center/130% 118% no-repeat}
.hero-label{text-shadow:0 1px 14px rgba(0,0,0,.55)}
.hero-name{font-size:clamp(56px,16vw,92px);line-height:1.1;margin:4px 0 0;
  text-shadow:0 0 28px color-mix(in srgb,var(--mg-oro-claro) 45%,transparent)}
.hero-quote{font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0}
.hero-date{font-family:var(--mg-caps);letter-spacing:.24em;font-size:12.5px}

/* ── Los padres, bajados a invitados ── */
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:26px auto 0;
  padding:18px 8px;border-radius:16px;background:var(--card);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 30%,transparent)}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--brand-2) 40%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--mg-caps);font-size:10.5px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:16px;line-height:1.55;
  color:var(--ink);white-space:pre-line}

/* ── Las tarjetas de información útil ── */
#features .features-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;
  max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;background:var(--card);border:0;border-radius:14px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 26%,transparent);text-align:center}
.feature-icon{color:var(--brand);font-size:26px}
.feature-title{font-weight:400;font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--brand);margin-top:8px}
.feature-text{font-size:14.5px;line-height:1.5}

/* ── El programa: dos fichas, ceremonia y fiesta ── */
#events .events-grid{display:grid;gap:16px;max-width:440px;margin:18px auto 0}
#events .event-card{background:var(--card);border:0;border-radius:16px;padding:22px 20px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 26%,transparent);text-align:left}
#events .event-icon{color:var(--brand);font-size:24px}
#events .event-type{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
#events .event-title{font-family:var(--mg-display);font-weight:400;
  font-size:28px;color:var(--ink);margin-top:2px}
#events .event-time{font-family:var(--mg-caps);font-size:13px;letter-spacing:.16em;color:var(--brand)}
#events .event-place{margin-top:6px;font-size:15.5px}
#events .event-map-btn{margin-top:10px}

/* ── La noche de pantano: cuenta atrás, regalos, ubicación ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--mg-noche) 82%,var(--brand-2)),var(--mg-noche));color:var(--mg-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--mg-oro-claro)}
${NOCHE} .section-title{color:#f0e8d4}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){
  color:color-mix(in srgb,var(--mg-noche-ink) 82%,transparent)}
/* El cupo de cada número es «tarjeta clara» en el resto del diseño: aquí,
   de noche, se vuelve vidrio oscuro — si no, el número dorado pálido cae
   sobre un cuadro casi blanco y desaparece. */
${NOCHE} .countdown-ring{background:rgba(255,255,255,.06);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mg-oro-claro) 30%,transparent)}
${NOCHE} :is([data-cd],.ring-number){color:var(--mg-oro-claro)}
${NOCHE} .ring-label{color:color-mix(in srgb,var(--mg-noche-ink) 70%,transparent)}
${NOCHE} .gifts-account{background:rgba(255,255,255,.06);
  border:1px solid color-mix(in srgb,var(--mg-oro-claro) 40%,transparent);border-radius:14px}
${NOCHE} .gifts-bank{color:var(--mg-oro-claro)}
${NOCHE} :is(.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no)){background:var(--mg-oro-claro);color:var(--mg-noche)}

/* ── Botones: oro macizo, en píldora ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no){
  border:0;background:var(--accent);color:var(--on-accent);font-size:12px;letter-spacing:.2em;
  box-shadow:0 12px 24px -14px color-mix(in srgb,var(--accent) 90%,#000);
  transition:filter .3s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(.92)}

/* ── Pie ── */
footer{background:var(--mg-noche);color:var(--mg-noche-ink)}
.footer-names{font-size:52px;line-height:1.1;padding:34px 0 30px;color:var(--mg-oro-claro)}
.footer-date{font-family:var(--mg-caps);letter-spacing:.24em;margin-top:8px}
.footer-copy{letter-spacing:.3em;color:var(--mg-oro-claro);opacity:.9}`;

export const magnolia: Design = {
  slug: "15-magnolia",
  name: "Quince Magnolia",
  occasion: "quince",
  mood: "Pantano al atardecer: salvia, marfil y oro, musgos colgantes, luciérnagas y flores de magnolia en el agua",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Yesteryear"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 400,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.3em",
  },
  shape: { radius: 16, radiusSm: 12, btnRadius: "pill", shadow: "none" },
  palettes: [MAGNOLIA, PANTANO, JAZZ, NOCHE_PANTANO],
  padresEn: "guests",
  css,
  /*
   * Los adornos: una sola pieza —el ramo de magnolias, con su sapito y su
   * libélula—, repetida y volteada con `espejo`/`giro` en vez de generar una
   * nueva por esquina. Mismo patrón que Otoño: esquinas y pie, nada más.
   */
  adornos: [
    { seccion: "splash", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 34, espejo: "h" },
    { seccion: "hero", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 36, espejo: "h" },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 34 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 30, giro: 180 },
    { seccion: "events", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 26, espejo: "h" },
    { seccion: "confirm", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 30, giro: 180 },
    { seccion: "gifts", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 28 },
    { seccion: "footer", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 40 },
    { seccion: "footer", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 36, giro: 180 },
  ],
};
