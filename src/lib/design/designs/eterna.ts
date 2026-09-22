/**
 * Boda Eterna.
 *
 * Blanco y oro, y la boda contada como boda: el monograma en su laurel, el
 * arco de rosas blancas con los anillos, los padres de cada lado, la
 * ceremonia y la recepción en dos fichas, la vestimenta y la canción que
 * cada invitado pide al confirmar.
 *
 * Sale del HTML «boda eterna» hecho a mano, con adornos de Grok recortados
 * a PNG. Lo interactivo son componentes de la app, y dos nacieron aquí: la
 * apertura de «anillos», que se unen y levantan el velo, y la canción del
 * RSVP. Ninguno de los dos depende de este diseño.
 *
 * El marfil es el papel y la noche es el contrapunto: la cuenta atrás, los
 * regalos y el pie van oscuros, que es lo que hace brillar el oro. Sin eso
 * el blanco y oro se queda plano, como una participación sin relieve.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/eterna";

const ETERNA = paleta({
  id: "eterna", nombre: "Blanco y oro",
  base: "#fdfbf7", tinta: "#241f18", marca: "#8a6d2f", acento: "#b08d46", segundo: "#b08d46",
});
const CHAMPAN = paleta({
  id: "champan", nombre: "Champán",
  base: "#faf4ea", tinta: "#2e2519", marca: "#8c6a3a", acento: "#b98f55", segundo: "#c9a26b",
});
const PERLA = paleta({
  id: "perla", nombre: "Perla y plata",
  base: "#fbfbfa", tinta: "#23262b", marca: "#5d6673", acento: "#8a939e", segundo: "#a7aeb7",
});
const NOCHE_ORO = paleta({
  id: "noche-oro", nombre: "Noche y oro",
  base: "#16130f", tinta: "#f6f0e4", marca: "#e4cd96", acento: "#c9a55c", segundo: "#c9a55c",
});

/* Las secciones de noche: la cuenta atrás, los regalos y la ubicación. */
const NOCHE =
  ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--et-caps:'Cinzel',Georgia,serif;--et-script:'Pinyon Script',cursive;
  --et-noche:var(--footer-bg);--et-noche-ink:var(--footer-ink);
  --et-oro:var(--brand-2);
  --et-lino:color-mix(in srgb,var(--bg) 90%,#fff);
  --et-oro-claro:color-mix(in srgb,var(--brand-2) 48%,#fff);
  --et-oro-hondo:color-mix(in srgb,var(--brand-2) 60%,#000);
  --et-lamina:linear-gradient(100deg,var(--et-oro-hondo) 0%,var(--brand-2) 22%,
    color-mix(in srgb,var(--brand-2) 16%,#fff) 44%,var(--et-oro-claro) 58%,var(--brand-2) 74%,
    var(--et-oro-hondo) 92%,var(--brand-2) 100%)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.guest-role,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{font-family:var(--et-caps)}
.section-label{font-size:12px;letter-spacing:.44em;padding-left:.44em;color:var(--brand)}
.section-title{font-style:italic;font-weight:400;font-size:clamp(38px,10.5vw,52px);line-height:1.1}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
/* Pinyon Script es fina y larga: pide tamaño para pesar lo mismo que una
   serifa, y aire arriba para que las mayúsculas no se corten. */
.hero-name,.splash-name,.footer-names{font-family:var(--et-script);font-weight:400;
  background:var(--et-lamina);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:etBrillo 8s ease-in-out infinite}
.hero-amp,.splash-amp,.footer-names .amp{display:block;font-size:.42em;line-height:1.4}
@keyframes etBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes etFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

.ornament{margin:2px auto 22px}
.et-divisor{display:block;width:min(76%,310px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el monograma en su laurel ── */
#splash{background:linear-gradient(var(--bg),color-mix(in srgb,var(--brand-2) 16%,var(--bg)))}
.splash-modal{background:url(${A}/marco.png) center/contain no-repeat;box-shadow:none;
  width:min(80vw,330px);aspect-ratio:.95;display:flex;flex-direction:column;justify-content:center;
  padding:15% 20% 13%;color:var(--ink)}
.splash-subtitle{font-size:9.5px;letter-spacing:.3em;padding-left:.3em;color:var(--brand);margin:0}
.splash-subtitle:first-child{display:none}
/* Sobre el marfil la lámina clara se pierde: aquí va el oro hondo. */
.splash-name{font-size:clamp(28px,8.4vw,36px);line-height:1.05;margin:4px 0 6px;padding-top:.1em;
  background:linear-gradient(100deg,var(--et-oro-hondo),var(--brand) 40%,var(--et-oro-hondo) 70%,var(--brand));
  background-size:220% 100%;-webkit-background-clip:text;background-clip:text}
.splash-date{font-family:var(--et-caps);font-size:8.5px;letter-spacing:.16em;line-height:1.7;
  color:var(--muted);margin:0 auto;max-width:17em;text-wrap:balance}
#splash .inv-sobre-pista{color:var(--brand);opacity:.8}
/* ── El sobre, como el de «Boda en el Olivar» ──
   El componente tiñe el sobre con el acento, y con una paleta cálida salía
   rosado. Aquí el papel manda —lino marfil— y el lacre es el sello de oro
   que ya preside la mesa de regalos, no un botón de color. */
#splash .inv-sobre-cuerpo{background:var(--et-lino);
  box-shadow:0 30px 70px -22px rgba(0,0,0,.45),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 34%,transparent)}
#splash .inv-sobre-bolsillo::before,#splash .inv-sobre-bolsillo::after{
  background:color-mix(in srgb,var(--et-lino) 93%,#000)}
#splash .inv-sobre-solapa{background:color-mix(in srgb,var(--et-lino) 96%,#fff)}
/* El lacre del diseño, mientras la invitación no suba el suyo: el mismo
   sello de oro que preside la mesa de regalos. Imagen y no máscara teñida
   con el acento: dentro del sobre —que vive en un contexto 3D, con
   perspectiva y su propia animación— la máscara no llega a pintarse.
   Un lacre de otro color se pone por invitación, en «Imagen del sello»
   (hay lacres listos en /disenos/lacres). */
.inv-sobre-sello:not(.con-imagen){background:url(${A}/sello.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 5px 11px rgba(0,0,0,.32))}
#splash .inv-sobre-ante{color:var(--brand)}
#splash .inv-sobre-nombre{font-family:var(--et-script);font-size:clamp(30px,9vw,40px);color:var(--brand)}

/* ── Portada: el arco de rosas ── */
#hero{place-items:end center;padding:0 24px calc(58px + env(safe-area-inset-bottom));
  background:var(--et-noche);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.9);--hero-line:rgba(255,255,255,.3);
  --hero-brand:var(--et-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 38%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.06) 0%,transparent 30%,
    color-mix(in srgb,var(--et-noche) 50%,transparent) 64%,var(--et-noche) 98%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-content::before{content:"";display:block;width:min(32vw,130px);aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/anillos.png) center/contain no-repeat;animation:etFlota 6s ease-in-out infinite;
  filter:drop-shadow(0 6px 18px color-mix(in srgb,var(--brand-2) 50%,transparent))}
.hero-label{font-size:12.5px;letter-spacing:.5em;padding-left:.5em;margin:0;color:var(--et-oro-claro)}
.hero-name{font-size:clamp(58px,17vw,96px);line-height:1.12;margin:0;padding:.06em .08em 0;
  filter:drop-shadow(0 2px 12px rgba(0,0,0,.45))}
.hero-sub{font-style:italic;font-size:19px}
.hero-date{border-top:0;padding-top:0;margin-top:6px;font-family:var(--et-caps);
  font-size:13px;letter-spacing:.3em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:14px auto 0}
.hero-scroll{color:var(--et-oro-claro)}

/* ── El papel ── */
section{padding:96px 26px}
section.alt{background:linear-gradient(var(--bg),var(--bg-alt))}
#guests{padding-top:112px;padding-bottom:120px;background:
  url(${A}/esquina.png) left 8px top 8px/min(30vw,155px) no-repeat,
  url(${A}/esquina-abajo.png) right 8px bottom 8px/min(30vw,155px) no-repeat,
  linear-gradient(var(--bg),var(--bg-alt))}
#guests .container::before{content:"";display:block;width:min(48vw,190px);aspect-ratio:1;margin:0 auto 12px;
  background:url(${A}/ramo.png) center/contain no-repeat}
#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(22px,6vw,27px);line-height:1.5;
  max-width:27ch;margin-inline:auto}
/* Los padres, bajados de la portada (padresEn), en dos columnas con un
   filete de oro en medio. */
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:26px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--brand-2) 60%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--et-caps);font-size:11px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:16.5px;line-height:1.5;color:var(--ink);
  white-space:pre-line}
#confirmation{padding-bottom:132px;background:
  url(${A}/esquina-abajo.png) right 8px bottom 8px/min(30vw,155px) no-repeat,
  linear-gradient(var(--bg),var(--bg-alt))}
#events{background:
  url(${A}/esquina.png) left 8px top 8px/min(28vw,140px) no-repeat,
  color-mix(in srgb,var(--brand-2) 12%,var(--bg))}
#features .feature-card,#events .event-card{background:var(--card);border-radius:2px;border:0;
  box-shadow:0 18px 34px -26px color-mix(in srgb,var(--ink) 60%,transparent),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 30%,transparent)}
.feature-icon{color:var(--brand)}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}

/* ── El formulario: etiquetas en versalitas de oro ── */
/* La fecha límite ya va en negrita dentro del mensaje; repetida debajo
   sobraba. */
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0}
.inv-rsvp-btn{font-size:10.5px;letter-spacing:.16em}
.feature-title{font-family:var(--et-caps);font-weight:600;font-size:11.5px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brand)}

/* ── Ceremonia y recepción: fichas blancas, la paloma y el brindis ── */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:14px;max-width:440px;margin:22px auto 0}
#events .event-card{padding:26px 20px;text-align:center}
#events .event-card:hover{transform:none}
#events .event-card:nth-child(-n+2) .event-icon{display:block;width:74px;height:66px;margin:0 auto 8px;
  font-size:0;background:url(${A}/paloma.png) center/contain no-repeat}
#events .event-card:nth-child(2) .event-icon{background-image:url(${A}/copas.png);height:78px}
#events .event-type{font-family:var(--et-caps);font-size:11.5px;letter-spacing:.26em;
  text-transform:uppercase;color:var(--brand)}
#events .event-title{font-style:italic;font-weight:500;font-size:25px;color:var(--ink)}
#events .event-time{font-size:12px;letter-spacing:.2em;color:var(--brand)}
#events .event-place{font-size:16.5px}

/* ── La noche ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--et-noche) 82%,var(--brand-2)),var(--et-noche));color:var(--et-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--et-oro-claro)}
${NOCHE} .section-title{color:#fdfbf7}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){
  color:color-mix(in srgb,var(--et-noche-ink) 80%,transparent)}
#gifts .container::before{content:"";display:block;width:104px;aspect-ratio:1;margin:0 auto 10px;
  background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 16px color-mix(in srgb,var(--brand-2) 45%,transparent))}
.inv-block-ubicacion .container::before{content:"";display:block;width:min(34vw,140px);aspect-ratio:.87;
  margin:0 auto 8px;background:url(${A}/copas.png) center/contain no-repeat}
/* El reloj: cuatro casillas unidas por un hilo de oro, sin cajas sueltas. */
.countdown-grid{max-width:420px;margin:24px auto 0;gap:1px;
  background:color-mix(in srgb,var(--brand-2) 40%,transparent)}
${NOCHE} .countdown-ring{border:0;border-radius:0;padding:18px 4px 14px;background:var(--et-noche);box-shadow:none}
${NOCHE} :is([data-cd],.ring-number){font-family:var(--et-caps);font-weight:400;color:var(--et-oro-claro)}
${NOCHE} .ring-label{font-size:9.5px;letter-spacing:.22em;
  color:color-mix(in srgb,var(--et-noche-ink) 70%,transparent)}
.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--brand-2) 50%,transparent);border-radius:0}
.gifts-bank{color:var(--et-oro-claro)}
${NOCHE} .inv-mapa-datos{background:rgba(255,255,255,.05);color:var(--et-noche-ink)}
${NOCHE} .inv-mapa-lugar{color:#fdfbf7}

/* ── Y si la invitación le pone su propio papel a una sección de noche ──
   El fondo propio entra como una capa dentro de la sección (.inv-fondo).
   Cuando está, la noche sobra: las casillas negras del reloj sobre un papel
   claro se ven como cuatro agujeros. Se quedan transparentes —el hilo de oro
   de la rejilla sigue dibujando las cuatro casillas— y la tinta vuelve a ser
   la del diseño. Lo resuelve el CSS y no quien edita, que si no son ocho
   colores que arreglar a mano. */
${NOCHE}:has(> .inv-fondo) .countdown-grid{background:none;gap:0}
${NOCHE}:has(> .inv-fondo) .countdown-ring{
  background:color-mix(in srgb,var(--ink) 9%,transparent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 45%,transparent)}
${NOCHE}:has(> .inv-fondo) :is([data-cd],.ring-number){color:var(--brand)}
${NOCHE}:has(> .inv-fondo) .ring-label{color:color-mix(in srgb,var(--ink) 62%,transparent)}
${NOCHE}:has(> .inv-fondo) .section-title{color:var(--ink)}
${NOCHE}:has(> .inv-fondo) .section-label,${NOCHE}:has(> .inv-fondo) .gifts-bank{color:var(--brand)}
${NOCHE}:has(> .inv-fondo) :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){color:var(--ink)}
${NOCHE}:has(> .inv-fondo) .inv-mapa-datos{background:rgba(0,0,0,.04);color:var(--ink)}
${NOCHE}:has(> .inv-fondo) .inv-mapa-lugar{color:var(--ink)}

/* ── Botones: oro liso y contorno fino ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;border-radius:var(--btn-radius,0);
  background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 45%,#fff) 45%,var(--accent));
  background-size:220% 100%;color:var(--on-accent);font-size:11.5px;letter-spacing:.24em;
  transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}
.event-map-btn,.inv-rsvp-no{border-radius:var(--btn-radius,0);background:transparent;color:var(--brand);
  box-shadow:inset 0 0 0 1px var(--accent)}
/* Con un color de botón elegido a mano, el oro sobra: el degradado que hace
   de lámina sobre el oro, sobre un verde de campo hace de plástico. Liso, y
   una sombra corta debajo, que es como lo lleva «Boda en el Olivar». */
body.inv-btn-propio :is(.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,
  .inv-rsvp-btn:not(.inv-rsvp-no),.inv-mapa-btn:not(.inv-agendar)){background:var(--accent);
  box-shadow:0 12px 24px -14px color-mix(in srgb,var(--accent) 90%,#000)}
${NOCHE} :is(.gifts-btn,.inv-mapa-btn:not(.inv-agendar),.inv-rsvp-btn:not(.inv-rsvp-no)){
  background:linear-gradient(100deg,var(--et-oro-hondo),var(--brand-2) 45%,var(--et-oro-hondo));
  background-size:220% 100%;color:var(--et-noche)}

/* ── Pie: la paloma y el monograma ── */
footer{padding:82px 24px calc(74px + env(safe-area-inset-bottom));background:var(--et-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:120px;aspect-ratio:1;margin:0 auto 6px;
  background:url(${A}/paloma.png) center/contain no-repeat}
/* Con una foto en el pie, la paloma sobra: cae en el centro, que es justo
   donde está la gente de la foto. El adorno es del diseño y la foto es de
   quien se casa; manda la foto. */
footer:has(> .inv-fondo) .container::before{display:none}
.footer-names{font-size:56px;line-height:1.1;padding-top:.08em}
.footer-date{font-family:var(--et-caps);letter-spacing:.26em}
.footer-copy{letter-spacing:.34em;color:var(--et-oro-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.hero-content::before{animation:none}
}`;

export const eterna: Design = {
  slug: "eterna",
  name: "Boda Eterna",
  occasion: "boda",
  mood: "Blanco y oro: monograma en laurel, arco de rosas blancas, anillos que se unen al abrir",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Pinyon+Script"
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
  shape: { radius: 2, radiusSm: 2, btnRadius: 0, shadow: "none" },
  palettes: [ETERNA, CHAMPAN, PERLA, NOCHE_ORO],
  padresEn: "guests",
  css,
  deco: {
    ornament: () => `<img class="et-divisor" src="${A}/divisor.png" alt="">`,
  },
};
