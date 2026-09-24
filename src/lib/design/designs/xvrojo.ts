/**
 * Quinceañera Rojo Carmesí.
 *
 * Blanco y rojo, que es la decoración que más se pide y que no teníamos: el
 * arco blanco flanqueado por muros de rosas rojas, las velas encendidas a
 * ras de suelo y el oro sólo donde toca —la corona, el filete—.
 *
 * Sale de cuatro fotos de montaje que trajo un cliente, y de ahí salen las
 * tres decisiones del diseño:
 *
 * · **El papel es blanco y el rojo es la fiesta.** En las fotos el fondo es
 *   una pared clara y las rosas son el color; al revés —fondo rojo con
 *   flores— queda discoteca. Por eso las secciones son blancas y el carmesí
 *   aparece en los títulos, los muros de rosas y una sola banda.
 * · **La luz viene de abajo.** Las velas están en el suelo y la pared se
 *   ilumina desde ahí: el velo de la portada va de abajo arriba y la banda
 *   del brindis se enciende por el pie.
 * · **Las rosas se amontonan en las esquinas, no se reparten.** En las fotos
 *   forman columnas; aquí son dos adornos altos en los bordes y no una
 *   guirnalda repartida.
 *
 * Estrena la apertura «velas»: el velo a oscuras con cinco velas que laten,
 * y al tocarlas la llamarada llena la pantalla. Es de la casa, así que
 * cualquier diseño puede usarla.
 *
 * Todo el arte son adornos —nada pegado en el CSS— salvo la ilustración de
 * la portada, que es un fondo, y el lacre, que es parte del sobre.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/xv-rojo";

const CARMESI = paleta({
  id: "xv-rojo", nombre: "Blanco y rojo",
  base: "#fdf8f7", tinta: "#2c1a1d", marca: "#9d1b2e", acento: "#b02335", segundo: "#d9a2a8",
});
const VINO = paleta({
  id: "vino-xv", nombre: "Vino y rosa",
  base: "#fdf6f6", tinta: "#33161c", marca: "#74162a", acento: "#8d2036", segundo: "#c98b95",
});
const ROJO_ORO = paleta({
  id: "rojo-oro", nombre: "Rojo y oro",
  base: "#fcf8f1", tinta: "#2a1d18", marca: "#9d1b2e", acento: "#a8813f", segundo: "#cdae6d",
});
const NOCHE_ROJA = paleta({
  id: "noche-roja", nombre: "Noche y rojo",
  base: "#1b1012", tinta: "#f7e9ea", marca: "#d8636f", acento: "#b02335", segundo: "#8c3a44",
});

const css = () => `
:root{--xr-script:'Italianno',cursive;--xr-tit:'Cormorant Garamond',Georgia,serif;
  --xr-ui:'Jost',system-ui,sans-serif;
  --xr-papel:color-mix(in srgb,var(--bg) 60%,#fff);
  --xr-hilo:color-mix(in srgb,var(--brand) 24%,transparent);
  --xr-vela:#ffd9a3}
body{background:var(--bg)}

/* ── Letras ──
   Italianno para los nombres —una caligrafía de trazo finísimo, que pide el
   doble de cuerpo que una serifa para pesar lo mismo— y Cormorant para los
   títulos. Jost, que es geométrica y seca, para lo que se pulsa: si todo
   fuera caligrafía no se distinguiría un botón de un adorno. */
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre,.social-hashtag{font-family:var(--xr-script);font-weight:400}
.section-title,.event-title,.ring-number{font-family:var(--xr-tit);font-weight:500}
.section-label,.hero-label,.splash-subtitle,.ring-label,.event-type,.feature-title,.gifts-bank,
.social-ig,.footer-copy,.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--xr-ui)}
.section-label{font-size:10.5px;letter-spacing:.38em;padding-left:.38em;text-transform:uppercase;color:var(--brand)}
.section-title{font-size:clamp(38px,11vw,54px);line-height:1.08;color:var(--ink)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:18px;line-height:1.7}

/* ── Bienvenida: el velo a oscuras y las velas encendidas ──
   La apertura «velas» pide fondo oscuro: sobre papel blanco una llama no es
   una llama, es una mancha amarilla. Se oscurece sólo el velo. */
#splash{background:radial-gradient(120% 90% at 50% 100%,#3a1218,#170a0d 70%)}
#splash.inv-velo-velas{--inv-vela-img:url(${A}/vela.png)}
/* Sobre el velo oscuro, el panel del nombre sobra: una caja clara tapa
   justo la penumbra que hace que las velas se lean como velas. El nombre va
   suelto, con su propia sombra. */
#splash .splash-modal{background:none;box-shadow:none;border:0}
#splash .splash-name{text-shadow:0 2px 26px rgba(0,0,0,.55)}
/* Y la pista, por encima de la fila de velas y no detrás. */
#splash.inv-velo-velas .inv-sobre-pista{bottom:26vh;color:var(--xr-vela);
  text-shadow:0 1px 10px rgba(40,10,14,.8)}
#splash .splash-subtitle{color:var(--xr-vela);letter-spacing:.34em;font-size:10.5px;text-transform:uppercase}
#splash .splash-name{font-size:clamp(70px,22vw,110px);line-height:.95;color:#fff6ef}
#splash .splash-date{font-family:var(--xr-ui);font-size:12px;letter-spacing:.28em;color:rgba(255,238,228,.72)}
#splash .splash-text,#splash [data-inv="splash.text"]{color:rgba(255,238,228,.82)}
#splash .inv-sobre-pista{color:var(--xr-vela);opacity:.9}
/* Y si la invitación elige el sobre en vez de las velas, su lacre es rojo. */
.inv-sobre-sello:not(.con-imagen){background:url(${A}/sello.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 5px 12px rgba(60,10,18,.5))}
#splash .inv-sobre-cuerpo{background:#f7ece9}
#splash .inv-sobre-nombre{font-family:var(--xr-script);font-size:clamp(46px,14vw,64px);color:var(--brand)}

/* ── Portada: el arco, y el nombre saliendo de la luz de las velas ── */
#hero{place-items:end center;padding:0 24px calc(58px + env(safe-area-inset-bottom));background:#e9ded9;
  --hero-ink:#2c1a1d;--hero-ink-soft:rgba(44,26,29,.78);--hero-line:rgba(44,26,29,.2);
  --hero-brand:var(--brand)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to top,#fff 3%,rgba(255,252,250,.9) 24%,rgba(255,244,236,.25) 52%,transparent 70%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:10.5px;letter-spacing:.44em;padding-left:.44em;text-transform:uppercase;margin:0}
.hero-name{font-size:clamp(76px,24vw,124px);line-height:.92;margin:0}
.hero-sub{font-family:var(--xr-tit);font-style:italic;font-size:19px}
.hero-date{margin-top:10px;border-top:0;padding-top:0;font-family:var(--xr-ui);font-size:12px;letter-spacing:.3em}
.hero-quote{font-family:var(--xr-tit);font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0}

/* ── El papel blanco, y el hilo carmesí ── */
section{padding:90px 24px;background:var(--bg)}
section.alt{background:var(--xr-papel)}
section .container{position:relative;z-index:2}
#guests [data-inv="guests.text"]{max-width:32ch;margin-inline:auto}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:430px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid var(--xr-hilo)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--xr-ui);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-family:var(--xr-tit);font-size:19px;
  line-height:1.5;color:var(--ink);white-space:pre-line}

/* ── Cuenta atrás ── */
#countdown,.inv-block-countdown{background:var(--xr-papel)}
.countdown-grid{max-width:420px;margin-inline:auto;gap:10px}
.countdown-ring{background:var(--card);border:0;border-radius:2px;box-shadow:inset 0 0 0 1px var(--xr-hilo)}
.ring-number{font-size:34px;color:var(--brand)}
.ring-label{font-family:var(--xr-ui);font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}

/* ── Programa: fichas blancas con hilo ── */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:430px;margin:24px auto 0}
#events .event-card{padding:28px 22px;text-align:center;border:0;border-radius:2px;background:var(--card);
  box-shadow:0 14px 30px -24px rgba(80,14,26,.55),inset 0 0 0 1px var(--xr-hilo)}
#events .event-card:hover{transform:none}
#events .event-type{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-size:30px;line-height:1.15;color:var(--ink)}
#events .event-time{font-family:var(--xr-ui);font-size:12.5px;letter-spacing:.22em;color:var(--brand)}
#events .event-place{font-size:16.5px;line-height:1.5}

/* ── Información útil y regalos ── */
#features{background:var(--xr-papel)}
#features .feature-card{padding:22px 16px;border:0;border-radius:2px;background:var(--card);
  box-shadow:inset 0 0 0 1px var(--xr-hilo)}
.feature-icon{color:var(--brand)}
.feature-title{font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--brand)}
.gifts-account{background:var(--card);border:1px solid var(--xr-hilo);border-radius:2px}
.gifts-bank{color:var(--brand)}

/* ── El brindis: la única banda a sangre, encendida por el pie ──
   Es el eco de las fotos: la pared blanca con la luz de las velas subiendo
   desde el suelo. Una sola en toda la invitación, que si no deja de ser un
   acento y pasa a ser el fondo. */
#social{background:linear-gradient(to top,color-mix(in srgb,var(--brand) 82%,#000),var(--brand) 40%,
  color-mix(in srgb,var(--brand) 78%,#fff));color:#fff4f2}
#social .section-label{color:rgba(255,244,242,.82)}
#social .section-title{color:#fff}
#social .social-sub{color:rgba(255,244,242,.88)}
.social-hashtag{font-size:40px;line-height:1.1;color:#fff}
#social .social-ig{background:#fff;color:var(--brand)}

/* ── Confirmar ── */
#confirmation{padding-bottom:112px}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── Botones: carmesí lleno y su contorno ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  box-shadow:0 10px 22px -14px color-mix(in srgb,var(--accent) 90%,#000);transition:filter .3s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.08)}
.event-map-btn,.inv-rsvp-no{background:transparent;color:var(--brand);box-shadow:inset 0 0 0 1px var(--accent)}

/* ── Pie ── */
footer{padding:76px 24px calc(68px + env(safe-area-inset-bottom));background:var(--xr-papel)}
footer .container{position:relative;z-index:2}
.footer-names{font-size:72px;line-height:1;color:var(--brand)}
.footer-date{font-family:var(--xr-ui);font-size:12px;letter-spacing:.26em}
.footer-copy{font-family:var(--xr-ui);font-size:10px;letter-spacing:.28em;color:var(--brand)}`;

export const xvrojo: Design = {
  slug: "15-rojo",
  name: "Quince Rojo Carmesí",
  occasion: "quince",
  mood: "Blanco y rojo: arco de rosas, velas encendidas y una sola banda carmesí",
  fontUrl: gfont(
    "family=Italianno&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "mosaic", divider: "none" },
  type: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 500,
    base: 17.5,
    scale: 1.28,
    displayTracking: "0.01em",
    tracking: "0.3em",
  },
  shape: { radius: 2, radiusSm: 2, btnRadius: "pill", shadow: "none" },
  palettes: [CARMESI, VINO, ROJO_ORO, NOCHE_ROJA],
  padresEn: "guests",
  css,
  /*
   * Los muros de rosas, la corona y el ramo: adornos, no CSS.
   *
   * Las columnas van en los bordes y en pares —una arriba a un lado, otra
   * abajo al otro—, que es como se amontonan en las fotos: si se repartieran
   * en las cuatro esquinas quedaría un marco, y un marco es otro diseño.
   *
   * Y van a media tinta. El texto queda por encima —se comprobó—, pero rosa
   * oscura debajo de tinta oscura no se lee igual: la opacidad es lo que
   * deja que la columna siga siendo un muro y el párrafo siga leyéndose.
   */
  adornos: [
    { seccion: "hero", url: `${A}/rosas.png`, sitio: "arriba-izq", tamano: 34, opacidad: 95 },
    { seccion: "guests", url: `${A}/corona.png`, sitio: "cabecera", tamano: 40 },
    { seccion: "guests", url: `${A}/rosas.png`, sitio: "abajo-der", tamano: 24, espejo: "h", opacidad: 55 },
    { seccion: "countdown", url: `${A}/divisor.png`, sitio: "titulo", tamano: 56 },
    { seccion: "events", url: `${A}/ramo.png`, sitio: "cabecera", tamano: 38 },
    { seccion: "gallery", url: `${A}/rosas.png`, sitio: "arriba-der", tamano: 24, espejo: "h", opacidad: 55 },
    { seccion: "features", url: `${A}/divisor.png`, sitio: "titulo", tamano: 52 },
    { seccion: "gifts", url: `${A}/ramo.png`, sitio: "cabecera", tamano: 32 },
    { seccion: "confirm", url: `${A}/rosas.png`, sitio: "abajo-izq", tamano: 24, opacidad: 55 },
    { seccion: "footer", url: `${A}/divisor.png`, sitio: "cabecera", tamano: 48 },
  ],
};
