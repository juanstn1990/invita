/**
 * Boda Rosal.
 *
 * Crema, rosas beige y verde salvia: la boda de jardín clásica, la que más
 * se pide. El sobre con su lacre verde, el arco de rosas en la portada, la
 * rama que baja por el borde de las secciones y el ramo presidiendo el
 * mensaje de los novios.
 *
 * Sale de una invitación que un cliente trajo como referencia; el arte es
 * propio, generado con Grok y recortado a PNG, y lo interactivo son los
 * componentes de la app: el sobre con sello —con el lacre del diseño—, los
 * padres bajados a invitados, «Agendar», los pétalos como partícula y la
 * canción del RSVP, que aquí hace de «agrega la música que quieres oír».
 *
 * Todo el papel es crema y el verde salvia es el acento: los botones, los
 * filetes y el lacre. Sin secciones oscuras, que es lo que la separa de
 * Eterna —allí la noche hace brillar el oro; aquí no hay noche, hay jardín.
 *
 * Tres componentes nacieron aquí y sirven en cualquier diseño: la apertura
 * «jardín» —el follaje se mece a los lados y una mariposa blanca se va
 * volando mientras el velo se disuelve sobre la foto—, la galería «papel
 * rasgado» —cada foto rota a mano por los cuatro lados— y el párrafo
 * «cita», la frase en su tarjeta con la firma debajo.
 *
 * La guirnalda de rosas quedó sólo donde manda —la cuenta atrás y el pie—;
 * bajo cada título va una ramita, que es la misma idea sin gritarla.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/rosal";

const ROSAL = paleta({
  id: "rosal", nombre: "Crema y salvia",
  base: "#f9f3ea", tinta: "#4a4038", marca: "#6f7f61", acento: "#6f7f61", segundo: "#c9a98f",
});
const BLUSH = paleta({
  id: "blush-rosal", nombre: "Blush y crema",
  base: "#fdf5f2", tinta: "#4b3a37", marca: "#a9707a", acento: "#a9707a", segundo: "#8a9a7b",
});
const ARENA = paleta({
  id: "arena-rosal", nombre: "Arena y oro viejo",
  base: "#faf5ec", tinta: "#443b2d", marca: "#9a7b43", acento: "#9a7b43", segundo: "#8a9a7b",
});
const LAVANDA = paleta({
  id: "lavanda-rosal", nombre: "Lavanda y salvia",
  base: "#f8f5fb", tinta: "#3f3550", marca: "#6d5a96", acento: "#6d5a96", segundo: "#8a9a7b",
});

const css = () => `
:root{--ro-script:'Tangerine',cursive;--ro-caps:'Cormorant Garamond',Georgia,serif;
  --ro-salvia:var(--brand);--ro-salvia-claro:color-mix(in srgb,var(--brand) 40%,#fff);
  --ro-crema:color-mix(in srgb,var(--bg) 82%,#fff);--ro-arena:color-mix(in srgb,var(--brand-2) 22%,var(--bg))}
body{background:var(--bg)}

/* ── Letras ──
   La caligrafía es Tangerine, que es muy fina: pide el doble de tamaño que
   una serifa para pesar lo mismo, y por eso los nombres van tan grandes. */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--ro-caps);font-weight:600}
.section-label{font-size:12px;letter-spacing:.34em;padding-left:.34em;color:var(--brand)}
.section-title{font-family:var(--ro-script);font-weight:700;font-size:clamp(52px,15vw,74px);line-height:1;color:var(--brand)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-style:italic;font-size:19px;line-height:1.7}
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre{font-family:var(--ro-script);font-weight:700}
.hero-amp,.splash-amp,.footer-names .amp{font-size:.7em}
@keyframes roFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}

.ornament{margin:2px auto 20px}
.ro-divisor{display:block;width:min(52%,210px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el sobre con su lacre ── */
#splash{background:radial-gradient(120% 80% at 50% 20%,var(--ro-crema),var(--bg))}
#splash::after{content:"";position:absolute;right:-30px;bottom:-20px;width:min(52vw,230px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none;z-index:0}
.splash-name{font-size:clamp(64px,20vw,96px);line-height:1;color:var(--brand)}
.splash-subtitle{color:var(--brand);letter-spacing:.3em}
.splash-date{font-family:var(--ro-caps);letter-spacing:.24em;color:var(--muted)}
/* El lacre verde del diseño, mientras nadie suba uno propio. */
.inv-sobre-sello:not(.con-imagen){background:url(${A}/sello.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 4px 7px rgba(60,55,45,.35))}
#splash .inv-sobre-nombre{font-family:var(--ro-script);font-size:clamp(46px,13vw,62px);color:var(--brand)}
#splash .inv-sobre-pista{color:var(--brand)}
/* Apertura «jardín»: las matas de follaje y la mariposa blanca del diseño.
   Las esquinas de rosas sobran cuando el follaje ya ocupa los dos lados. */
#splash.inv-velo-jardin{--inv-jardin-izq:url(${A}/follaje.png);--inv-mariposa-img:url(${A}/mariposa.png);
  background:radial-gradient(120% 80% at 50% 18%,var(--ro-crema),var(--bg))}
#splash.inv-velo-jardin::after{display:none}
#splash.inv-velo-jardin .inv-mariposa{top:9%}

/* ── Portada: el arco de rosas ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:#6b6252;
  --hero-ink:#fffaf3;--hero-ink-soft:rgba(255,250,243,.88);--hero-line:rgba(255,250,243,.35);
  --hero-brand:color-mix(in srgb,var(--brand) 25%,#fff)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 32%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.04),transparent 32%,rgba(60,54,44,.5) 64%,#3c362c 98%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-content::before{content:"";display:block;width:min(46vw,190px);aspect-ratio:2.4;margin:0 auto 2px;
  background:url(${A}/anillos.png) center/contain no-repeat;animation:roFlota 6s ease-in-out infinite}
.hero-label{font-size:12.5px;letter-spacing:.42em;padding-left:.42em;margin:0}
.hero-name{font-size:clamp(78px,24vw,124px);line-height:1;margin:0;text-shadow:0 2px 16px rgba(0,0,0,.4)}
.hero-sub{font-style:italic;font-size:19px}
.hero-date{border-top:0;padding-top:0;margin-top:6px;font-family:var(--ro-caps);font-weight:600;font-size:13px;letter-spacing:.3em}
.hero-quote{font-style:italic;font-size:20px;line-height:1.5;max-width:28ch;margin:12px auto 0}

/* ── El papel crema, con la rama por el borde ── */
section{padding:92px 24px;background:var(--bg)}
section.alt{background:var(--ro-crema)}
section .container{position:relative;z-index:2}
#guests{padding-top:104px;padding-bottom:116px;background:var(--ro-crema)}
#guests .container::before{content:"";display:block;width:min(50vw,200px);aspect-ratio:.82;margin:0 auto 8px;
  background:url(${A}/ramo.png) center/contain no-repeat}
#guests [data-inv="guests.text"]{max-width:30ch;margin-inline:auto}
/* Los padres, bajados de la portada, con un filete de salvia en medio. */
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:22px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--brand) 40%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--ro-caps);font-weight:600;font-size:11px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17px;line-height:1.5;color:var(--ink);white-space:pre-line}

/* ── La cuenta atrás: la fecha primero, como en una participación ── */
#countdown,.inv-block-countdown{background:var(--ro-arena)}
#countdown .container::before,.inv-block-countdown .container::before{content:"";display:block;width:min(64vw,280px);
  aspect-ratio:2.28;margin:0 auto 4px;background:url(${A}/divisor.png) center/contain no-repeat}
.countdown-grid{max-width:420px;margin-inline:auto}
.countdown-ring{background:var(--card);border:0;border-radius:4px;
  box-shadow:0 10px 20px -16px rgba(74,64,56,.6),inset 0 0 0 1px color-mix(in srgb,var(--brand) 22%,transparent)}
.ring-number{font-family:var(--ro-caps);font-weight:600;color:var(--brand)}
.ring-label{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}

/* ── Ceremonia y recepción: dos fichas de papel ── */
#events{;background-color:var(--bg)}
#events .events-grid{display:grid;grid-template-columns:1fr;gap:14px;max-width:430px;margin:20px auto 0}
#events .event-card{padding:26px 20px;text-align:center;border:0;border-radius:4px;background:var(--card);
  box-shadow:0 14px 28px -22px rgba(74,64,56,.7),inset 0 0 0 1px color-mix(in srgb,var(--brand) 20%,transparent)}
#events .event-card:hover{transform:none}
#events .event-card:nth-child(-n+2) .event-icon{display:block;width:88px;height:78px;margin:0 auto 6px;font-size:0;
  background:url(${A}/iglesia.png) center/contain no-repeat}
#events .event-card:nth-child(2) .event-icon{background-image:url(${A}/copas.png)}
#events .event-type{font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-family:var(--ro-script);font-weight:700;font-size:44px;line-height:1.05;color:var(--ink)}
#events .event-time{font-size:13px;letter-spacing:.2em;color:var(--brand)}
#events .event-place{font-size:16.5px;line-height:1.5}

/* ── Galería: fotos rasgadas a mano sobre el papel crema ── */
#gallery,.inv-block-gallery{background:var(--bg)}
.inv-ga-rasgada .gallery-item{filter:drop-shadow(0 14px 22px rgba(74,64,56,.22))}

/* ── La cita: la ramita asomando por la esquina de la tarjeta ── */
.inv-pa-cita{background:var(--card)}
.inv-pa-cita::after{content:"";position:absolute;right:-6px;top:-58px;width:min(30vw,124px);aspect-ratio:1.2;
  background:url(${A}/ramita.png) center/contain no-repeat;pointer-events:none;rotate:6deg}
.inv-cita-firma{font-family:var(--ro-script);font-size:30px;letter-spacing:0;padding:0;text-transform:none}

/* ── Dress code, música y regalos ── */
#features{background:var(--ro-crema)}
/* Aquí la filigrana son los novios dibujados, como en las invitaciones de
   papel: la ramita del resto de las secciones se esconde y queda el dibujo. */
#features .ornament{width:min(44vw,170px);aspect-ratio:.73;margin-bottom:10px;
  background:url(${A}/novios.png) center/contain no-repeat}
#features .ornament img{visibility:hidden}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;border:0;border-radius:4px;background:var(--card);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 20%,transparent)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--brand)}
.feature-title{font-weight:600;font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand)}
#gifts .container::before,.inv-block-gifts .container::before{content:"";display:block;width:min(30vw,120px);aspect-ratio:1;
  margin:0 auto 6px;background:url(${A}/sello.png) center/contain no-repeat;
  filter:drop-shadow(0 6px 12px rgba(60,55,45,.3))}
.gifts-account{background:var(--card);border:1px solid color-mix(in srgb,var(--brand) 30%,transparent);border-radius:4px}
.gifts-bank{color:var(--brand)}

/* ── Confirmar: aquí va la canción que pide cada invitado ── */
#confirmation{padding-bottom:120px;;background-color:var(--bg)}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── Botones: salvia lleno y su contorno ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:12px;letter-spacing:.2em;box-shadow:0 10px 20px -14px color-mix(in srgb,var(--accent) 90%,#000);
  transition:filter .3s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.08)}
.event-map-btn,.inv-rsvp-no{background:transparent;color:var(--brand);box-shadow:inset 0 0 0 1px var(--accent)}

/* ── Pie ── */
footer{padding:78px 24px calc(70px + env(safe-area-inset-bottom));background:var(--ro-arena)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:min(56vw,240px);aspect-ratio:2.28;margin:0 auto -2px;
  background:url(${A}/divisor.png) center/contain no-repeat}
.footer-names{font-family:var(--ro-script);font-size:78px;line-height:1;color:var(--brand)}
.footer-date{font-family:var(--ro-caps);font-weight:600;letter-spacing:.26em}
.footer-copy{letter-spacing:.3em;color:var(--brand)}

@media (prefers-reduced-motion:reduce){
  .hero-content::before{animation:none}
}`;

export const rosal: Design = {
  slug: "rosal",
  name: "Boda Rosal",
  occasion: "boda",
  mood: "Crema, rosas beige y verde salvia: arco de rosas, sobre con lacre y fichas de papel",
  fontUrl: gfont(
    "family=Tangerine:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "mosaic", divider: "none" },
  variantes: { gallery: "rasgada" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 500,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.28em",
  },
  shape: { radius: 4, radiusSm: 4, btnRadius: "pill", shadow: "none" },
  palettes: [ROSAL, BLUSH, ARENA, LAVANDA],
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
    { seccion: "*", url: `${A}/ramita.png`, sitio: "titulo", tamano: 47 },
    { seccion: "splash", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 52 },
    { seccion: "guests", url: `${A}/rama.png`, sitio: "arriba-der", tamano: 34 },
    { seccion: "events", url: `${A}/rama.png`, sitio: "abajo-izq", tamano: 34 },
    { seccion: "confirm", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 44 },
  ],
  deco: {
    ornament: () => `<img class="ro-divisor" src="${A}/ramita.png" alt="">`,
  },
};
