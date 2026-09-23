/**
 * Boda en el Olivar.
 *
 * Verde oliva, lino y un poco de oro viejo: la boda mediterránea de la mesa
 * larga bajo los olivos. La capilla encalada, el brindis y los faroles son
 * las tres paradas del programa, y la invitación llega en un sobre de lino
 * con su lacre verde.
 *
 * Sale del HTML «boda en el olivar» hecho a mano, con adornos de Grok
 * recortados a PNG. Lo interactivo son componentes de la app: el sobre con
 * sello —que aquí trae el lacre del diseño mientras nadie suba uno propio—,
 * los padres bajados a invitados, «Agendar», la canción del RSVP y las hojas
 * de olivo, que son la partícula con imagen apuntando a la de aquí.
 *
 * Al revés que en Eterna, aquí la noche no es negra sino oliva hondo: el
 * verde es el tema y tiene que estar también en lo oscuro.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/olivar";

const OLIVAR = paleta({
  id: "olivar", nombre: "Oliva y lino",
  base: "#f7f3e8", tinta: "#2c2f22", marca: "#5f6b3a", acento: "#5f6b3a", segundo: "#b39a5b",
});
const SALVIA = paleta({
  id: "salvia", nombre: "Salvia",
  base: "#f4f5ee", tinta: "#2a3024", marca: "#5d6b48", acento: "#6b7a55", segundo: "#a3ac85",
});
const TERRACOTA = paleta({
  id: "terracota-oliva", nombre: "Terracota y oliva",
  base: "#f8f1ea", tinta: "#33261f", marca: "#9c5a3c", acento: "#9c5a3c", segundo: "#6b7440",
});
const NOCHE_OLIVO = paleta({
  id: "noche-olivo", nombre: "Noche de olivo",
  base: "#22261a", tinta: "#f1eddf", marca: "#c9d0a6", acento: "#a3ac85", segundo: "#dccb97",
});

/* Las secciones de noche: la cuenta atrás, los regalos y la ubicación. */
const NOCHE =
  ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--ol-caps:'Marcellus',Georgia,serif;--ol-script:'Parisienne',cursive;
  --ol-noche:color-mix(in srgb,var(--footer-bg) 78%,var(--brand));--ol-noche-ink:var(--footer-ink);
  --ol-oro:var(--brand-2);
  --ol-oro-claro:color-mix(in srgb,var(--brand-2) 55%,#fff)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--ol-caps)}
.section-label{font-size:12.5px;letter-spacing:.36em;padding-left:.36em;color:var(--brand)}
/* Parisienne es una caligrafía de trazo suelto: los títulos van en ella y
   no en serifa, que es lo que hace que esto se lea como una boda de campo y
   no como una participación de salón. */
.section-title{font-family:var(--ol-script);font-weight:400;font-size:clamp(44px,12.5vw,62px);line-height:1.1}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre{font-family:var(--ol-script);font-weight:400}
.hero-amp,.splash-amp,.footer-names .amp{display:block;font-size:.4em;line-height:1.3;color:var(--ol-oro-claro)}
@keyframes olFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes olMece{0%,100%{rotate:-2deg}50%{rotate:2deg}}

.ornament{margin:0 auto 22px}
.ol-rama{display:block;width:min(70%,280px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el sobre de lino ── */
#splash{background:radial-gradient(120% 80% at 50% 30%,var(--bg),var(--bg-alt))}
.splash-name{font-size:clamp(46px,14vw,70px);line-height:1.1;color:var(--brand)}
.splash-subtitle{color:var(--brand);letter-spacing:.34em}
.splash-date{font-family:var(--ol-caps);letter-spacing:.24em}
/* El lacre verde del diseño, mientras no se suba uno propio: la imagen que
   se sube llega como .con-imagen y gana. */
.inv-sobre-sello:not(.con-imagen){background:url(${A}/sello.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}
#splash .inv-sobre-nombre{font-family:var(--ol-script);font-size:clamp(34px,10vw,44px);color:var(--brand)}
#splash .inv-sobre-pista{color:var(--brand)}

/* ── Portada: la mesa bajo los olivos ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));
  background:var(--ol-noche);
  --hero-ink:#fbf8ef;--hero-ink-soft:rgba(251,248,239,.88);--hero-line:rgba(251,248,239,.3);
  --hero-brand:var(--ol-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.08) 0%,transparent 26%,
    color-mix(in srgb,var(--ol-noche) 55%,transparent) 60%,var(--ol-noche) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}

.hero-label{font-size:12.5px;letter-spacing:.46em;padding-left:.46em;margin:0;color:var(--ol-oro-claro)}
.hero-name{font-size:clamp(60px,17.5vw,98px);line-height:1.08;margin:2px 0 0;
  text-shadow:0 2px 18px rgba(0,0,0,.45)}
.hero-sub{font-style:italic;font-size:19px}
.hero-date{border-top:0;padding-top:0;margin-top:8px;font-family:var(--ol-caps);
  font-size:13px;letter-spacing:.3em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0}
.hero-scroll{color:var(--ol-oro-claro)}

/* ── El lino ── */
section{padding:92px 26px}
section.alt{background:linear-gradient(var(--bg),var(--bg-alt))}
#guests{padding-top:108px;padding-bottom:124px;background:linear-gradient(var(--bg),var(--bg-alt))}


#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(23px,6.2vw,29px);line-height:1.5;
  max-width:27ch;margin-inline:auto;color:var(--brand)}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--brand) 40%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--ol-caps);font-size:11px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17px;line-height:1.5;color:var(--ink);
  white-space:pre-line}
#confirmation{padding-bottom:130px;position:relative}

#features{padding-top:112px;background:linear-gradient(var(--bg),var(--bg-alt))}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;background:var(--card);border:0;border-radius:14px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 22%,transparent)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--brand)}
.feature-title{font-family:var(--ol-caps);font-weight:400;font-size:12px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brand)}

/* ── El programa: un camino entre olivos ──
   Cada parada lleva su dibujo —la capilla, el brindis, el farol— y se
   alternan a un lado y al otro de un sendero punteado. De la cuarta en
   adelante vuelve el ícono que se eligió, en su medallón. */
#events{background:color-mix(in srgb,var(--brand-2) 10%,color-mix(in srgb,var(--brand) 10%,var(--bg)))}
#events .events-grid{position:relative;display:block;max-width:440px;margin:18px auto 0}
#events .events-grid::before{content:"";position:absolute;left:50%;top:40px;bottom:40px;width:1px;
  translate:-50% 0;opacity:.5;
  background:repeating-linear-gradient(var(--brand) 0 6px,transparent 6px 12px)}
/* Dos columnas iguales con el sendero en el hueco del medio: el texto
   nunca lo pisa, venga de un lado o del otro. */
#events .event-card{position:relative;display:grid;grid-template-columns:1fr 1fr;column-gap:34px;
  align-items:center;padding:14px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:left}
#events .event-card:hover{transform:none}
#events .event-card>*{grid-column:2;margin:0}
#events .event-icon{grid-column:1;grid-row:1/span 7;justify-self:center;align-self:center;
  width:64px;height:64px;display:grid;place-items:center;border-radius:50%;background:var(--card);
  font-size:26px;box-shadow:0 0 0 1px color-mix(in srgb,var(--brand) 40%,transparent)}
#events .event-card:nth-child(-n+3) .event-icon{width:100%;max-width:160px;height:auto;aspect-ratio:1.1;
  font-size:0;border-radius:0;box-shadow:none;background:url(${A}/capilla.png) center/contain no-repeat;
  animation:olMece 7s ease-in-out infinite}
#events .event-card:nth-child(2) .event-icon{background-image:url(${A}/copas.png)}
#events .event-card:nth-child(3) .event-icon{background-image:url(${A}/farol.png);aspect-ratio:.7}
#events .event-card:nth-child(even){text-align:right}
#events .event-card:nth-child(even)>*{grid-column:1}
#events .event-card:nth-child(even) .event-icon{grid-column:2}
#events .event-time{order:1;font-family:var(--ol-caps);font-size:13px;letter-spacing:.2em;color:var(--brand-2)}
#events .event-type{order:2;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
#events .event-title{order:3;font-family:var(--ol-script);font-weight:400;font-size:29px;line-height:1.15;color:var(--ink)}
#events .event-place{order:4;margin-top:2px;font-size:16px;line-height:1.45}
#events .event-note{order:5;margin-top:4px;font-size:15px}
#events .event-map-btn{order:6;justify-self:start;margin-top:8px;padding:0 0 2px;background:none;border:0;
  border-radius:0;box-shadow:none;font-size:11px;letter-spacing:.2em;color:var(--brand);
  border-bottom:1px solid color-mix(in srgb,var(--brand) 45%,transparent)}
#events .event-card:nth-child(even) .event-map-btn{justify-self:end}

/* ── La noche de olivo ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--ol-noche) 80%,var(--brand)),var(--ol-noche));color:var(--ol-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--ol-oro-claro)}
${NOCHE} .section-title{color:#fbf8ef}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){
  color:color-mix(in srgb,var(--ol-noche-ink) 82%,transparent)}
/* El reloj: cuatro cifras grandes con una hoja de olivo entre cada una, y
   sin cajas: es lo que lo diferencia del reloj de salón de Eterna. */
.countdown-grid{display:flex;justify-content:center;align-items:flex-start;gap:0;max-width:430px;margin:12px auto 0}
${NOCHE} .countdown-ring{flex:1;min-width:0;position:relative;border:0;border-radius:0;padding:0;
  background:none;box-shadow:none}
${NOCHE} .countdown-ring + .countdown-ring::before{content:"";position:absolute;left:-7px;top:14px;
  width:14px;height:24px;background:url(${A}/hoja.png) center/contain no-repeat;rotate:30deg;opacity:.8}
${NOCHE} :is([data-cd],.ring-number){font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;
  font-size:clamp(40px,12.5vw,58px);line-height:1;color:var(--ol-oro-claro);font-variant-numeric:lining-nums tabular-nums}
${NOCHE} .ring-label{margin-top:8px;font-size:10px;letter-spacing:.24em;
  color:color-mix(in srgb,var(--ol-noche-ink) 70%,transparent)}

.inv-block-ubicacion .container::before{content:"";display:block;width:min(34vw,140px);aspect-ratio:1.1;
  margin:0 auto 8px;background:url(${A}/copas.png) center/contain no-repeat}
.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--brand-2) 50%,transparent);border-radius:14px}
.gifts-bank{color:var(--ol-oro-claro)}
${NOCHE} .inv-mapa-datos{background:rgba(255,255,255,.05);color:var(--ol-noche-ink)}
${NOCHE} .inv-mapa-lugar{color:#fbf8ef}

/* ── El formulario ── */
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0}

/* ── Botones: oliva macizo, en píldora ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:12px;letter-spacing:.2em;
  box-shadow:0 12px 24px -14px color-mix(in srgb,var(--accent) 90%,#000);transition:filter .3s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(.9)}
${NOCHE} :is(.gifts-btn,.inv-mapa-btn:not(.inv-agendar),.inv-rsvp-btn:not(.inv-rsvp-no)){
  background:var(--ol-oro-claro);color:var(--ol-noche)}

/* ── Pie: la corona con el monograma ── */
footer{padding:80px 24px calc(72px + env(safe-area-inset-bottom));background:var(--ol-noche)}
footer .container{position:relative;z-index:2}

.footer-names{font-size:44px;line-height:1.1;padding:38px 0 34px;color:var(--ol-oro-claro)}
.footer-date{font-family:var(--ol-caps);letter-spacing:.26em;margin-top:10px}
.footer-copy{letter-spacing:.32em;color:var(--ol-oro-claro);opacity:.9}

@media (prefers-reduced-motion:reduce){
  .hero-content::before,#events .event-icon{animation:none}
}`;

export const olivar: Design = {
  slug: "olivar",
  name: "Boda en el Olivar",
  occasion: "boda",
  mood: "Verde oliva y lino: mesa larga bajo los olivos, capilla encalada, sobre con lacre verde",
  fontUrl: gfont(
    "family=Marcellus&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Parisienne"
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
  shape: { radius: 14, radiusSm: 12, btnRadius: "pill", shadow: "none" },
  palettes: [OLIVAR, SALVIA, TERRACOTA, NOCHE_OLIVO],
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
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 32, giro: 180 },
    { seccion: "confirm", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 30, giro: 180 },
    { seccion: "hero", url: `${A}/corona.png`, sitio: "cabecera", tamano: 40 },
    { seccion: "guests", url: `${A}/ramo.png`, sitio: "cabecera", tamano: 46 },
    { seccion: "gifts", url: `${A}/sello.png`, sitio: "cabecera", tamano: 27 },
    { seccion: "footer", url: `${A}/corona.png`, sitio: "cabecera", tamano: 42 },
    /* La filigrana que va bajo cada título. Como adorno y no sólo en el
       CSS: así se puede mover, encoger o quitar de una sección suelta. */
    { seccion: "*", url: `${A}/rama.png`, sitio: "titulo", tamano: 63 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 32 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 28 },
  ],
  deco: {
    ornament: () => `<img class="ol-rama" src="${A}/rama.png" alt="">`,
  },
};
