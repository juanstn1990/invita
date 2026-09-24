/**
 * Grado Dorado.
 *
 * Crema y dorado: la elegancia de una gala de graduación. Comparte el molde
 * de Grado Azul —el mismo tipo de portada ilustrada, el mismo reparto de
 * adornos por sección— y por eso se diferencia donde importa: la tinta es
 * cálida (marfil, no blanco frío), el acento es un dorado profundo y no un
 * azul, y la tipografía de título es una itálica ancha que se lee a fiesta
 * de gala y no a acta universitaria.
 *
 * El arte, generado con Grok para este diseño, es la misma escena que la de
 * Grado Azul —el claustro, el birrete, el diploma— pero en paleta cálida:
 * son piezas nuevas, no las mismas reteñidas, porque el dorado necesita su
 * propio balance de luces (el oro sobre un fondo frío se ve verdoso).
 *
 * Como Grado Azul, nace con todo el arte declarado como adornos: ninguna
 * pieza está en el CSS salvo la ilustración de portada —que es un fondo— y
 * el lacre, que es parte del sobre.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/g-dorado";

const DORADO = paleta({
  id: "g-dorado", nombre: "Crema y dorado",
  base: "#fbf8f1", tinta: "#3a2f1f", marca: "#8a6a2f", acento: "#a9803c", segundo: "#d9c194",
});
const MARFIL = paleta({
  id: "marfil-grado", nombre: "Marfil y bronce",
  base: "#faf6ee", tinta: "#332a1e", marca: "#795c34", acento: "#8f6f3c", segundo: "#c7ab7c",
});
const CHAMPAN = paleta({
  id: "champan-grado", nombre: "Champán",
  base: "#fcf9f2", tinta: "#3c3524", marca: "#96793f", acento: "#b0904e", segundo: "#e2cd9d",
});
const NEGRO_ORO = paleta({
  id: "negro-oro-grado", nombre: "Negro y oro",
  base: "#171310", tinta: "#f3ead6", marca: "#e4c98c", acento: "#c9a35c", segundo: "#8a713f",
});

const css = () => `
:root{--gd-tit:'Prata',Georgia,serif;--gd-ui:'Jost',system-ui,sans-serif;
  --gd-hilo:color-mix(in srgb,var(--brand) 28%,transparent);
  --gd-papel:color-mix(in srgb,var(--bg) 55%,#fff)}
body{background:var(--bg)}

/* ── Letras ──
   Prata para lo que se lee de lejos y Jost para lo que se pulsa. Igual que
   Grado Azul: es el mismo molde de letra, aquí lo que cambia es el color y
   el peso del acento. */
.section-title,.hero-name,.splash-name,.footer-names,.event-title,.ring-number{font-family:var(--gd-tit);font-weight:400}
.section-label,.hero-label,.splash-subtitle,.ring-label,.event-type,.feature-title,.gifts-bank,
.social-ig,.footer-copy,.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--gd-ui)}
.section-label{font-size:11px;letter-spacing:.34em;padding-left:.34em;text-transform:uppercase;color:var(--brand)}
.section-title{font-size:clamp(32px,9vw,44px);line-height:1.15;color:var(--ink)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:18px;line-height:1.7}

/* ── Bienvenida ── */
#splash{background:radial-gradient(120% 80% at 50% 12%,var(--gd-papel),var(--bg))}
.splash-subtitle{font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--brand)}
.splash-name{font-size:clamp(44px,13vw,60px);line-height:1.15;color:var(--ink)}
.splash-date{font-family:var(--gd-ui);font-size:12px;letter-spacing:.26em;color:var(--muted)}
/* El lacre dorado del diseño, mientras la invitación no suba el suyo. */
.inv-sobre-sello:not(.con-imagen){background:url(${A}/sello.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 5px 10px rgba(60,45,20,.35))}
#splash .inv-sobre-cuerpo{background:var(--gd-papel)}
#splash .inv-sobre-nombre{font-family:var(--gd-tit);font-size:clamp(30px,9vw,40px);color:var(--ink)}
#splash .inv-sobre-ante{color:var(--brand);letter-spacing:.28em}

/* ── Portada: el claustro dorado, y el nombre sobre un velo marfil ──
   El velo va de abajo arriba, igual que en Grado Azul: la luz de la
   ilustración entra por las ventanas, arriba, y taparla sería taparla. */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:#ede3ce;
  --hero-ink:#2c2312;--hero-ink-soft:rgba(44,35,18,.76);--hero-line:rgba(44,35,18,.22);
  --hero-brand:var(--brand)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 28%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to top,#fdfaf3 2%,rgba(253,250,243,.88) 26%,rgba(253,248,235,.2) 54%,transparent 72%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:11px;letter-spacing:.4em;padding-left:.4em;text-transform:uppercase;margin:0}
.hero-name{font-size:clamp(46px,14vw,68px);line-height:1.12;margin:4px 0 0}
.hero-date{margin-top:12px;border-top:0;padding-top:0;font-family:var(--gd-ui);font-size:12px;letter-spacing:.3em}
.hero-quote{font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0}

/* ── El papel y el hilo dorado ── */
section{padding:86px 24px;background:var(--bg)}
section.alt{background:var(--gd-papel)}
section .container{position:relative;z-index:2}
#guests [data-inv="guests.text"]{max-width:32ch;margin-inline:auto}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:430px;margin:22px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid var(--gd-hilo)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--gd-ui);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17px;line-height:1.5;color:var(--ink);white-space:pre-line}

/* ── Cuenta atrás: cuatro casillas de hilo dorado ── */
#countdown,.inv-block-countdown{background:var(--gd-papel)}
.countdown-grid{max-width:420px;margin-inline:auto;gap:10px}
.countdown-ring{background:var(--card);border:0;border-radius:3px;
  box-shadow:inset 0 0 0 1px var(--gd-hilo)}
.ring-number{font-size:32px;color:var(--brand)}
.ring-label{font-family:var(--gd-ui);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}

/* ── Ceremonia y celebración: fichas de papel con hilo ── */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:430px;margin:24px auto 0}
#events .event-card{padding:28px 22px;text-align:center;border:0;border-radius:3px;background:var(--card);
  box-shadow:0 14px 28px -24px rgba(60,45,20,.5),inset 0 0 0 1px var(--gd-hilo)}
#events .event-card:hover{transform:none}
#events .event-type{font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-size:28px;line-height:1.2;color:var(--ink)}
#events .event-time{font-family:var(--gd-ui);font-size:12.5px;letter-spacing:.22em;color:var(--brand)}
#events .event-place{font-size:16.5px;line-height:1.5}

/* ── Información útil y regalos ── */
#features{background:var(--gd-papel)}
#features .feature-card{padding:22px 16px;border:0;border-radius:3px;background:var(--card);
  box-shadow:inset 0 0 0 1px var(--gd-hilo)}
.feature-icon{color:var(--brand)}
.feature-title{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand)}
.gifts-account{background:var(--card);border:1px solid var(--gd-hilo);border-radius:3px}
.gifts-bank{color:var(--brand)}

/* ── El brindis: la única banda a sangre, para romper la sucesión de papel ── */
#social{background:linear-gradient(var(--gd-papel),color-mix(in srgb,var(--brand-2) 32%,var(--bg)))}
.social-hashtag{font-family:var(--gd-tit);font-size:30px;color:var(--brand)}

/* ── Confirmar ── */
#confirmation{padding-bottom:110px}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── Botones: dorado lleno y su contorno ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;
  box-shadow:0 10px 20px -14px color-mix(in srgb,var(--accent) 90%,#000);transition:filter .3s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.08)}
.event-map-btn,.inv-rsvp-no{background:transparent;color:var(--brand);box-shadow:inset 0 0 0 1px var(--accent)}

/* ── Pie ── */
footer{padding:74px 24px calc(66px + env(safe-area-inset-bottom));background:var(--gd-papel)}
footer .container{position:relative;z-index:2}
.footer-names{font-size:44px;line-height:1.2;color:var(--ink)}
.footer-date{font-family:var(--gd-ui);font-size:12px;letter-spacing:.26em}
.footer-copy{font-family:var(--gd-ui);font-size:10.5px;letter-spacing:.28em;color:var(--brand)}`;

export const gdorado: Design = {
  slug: "g-dorado-gala",
  name: "Grado Dorado",
  occasion: "grado",
  mood: "Crema y dorado, ilustrado: el birrete y el diploma en acuarela, laurel y copas de gala",
  fontUrl: gfont("family=Prata&family=Jost:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400"),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "mosaic", divider: "none" },
  type: {
    display: "'Prata', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 400,
    base: 17.5,
    scale: 1.26,
    displayTracking: "0.01em",
    tracking: "0.28em",
  },
  shape: { radius: 3, radiusSm: 3, btnRadius: "pill", shadow: "none" },
  palettes: [DORADO, MARFIL, CHAMPAN, NEGRO_ORO],
  padresEn: "guests",
  css,
  /*
   * Todo el arte, como adornos y no como CSS. Igual que Grado Azul: las doce
   * piezas nacen en los datos de la invitación y se mueven, se encogen o se
   * borran desde el editor sin tocar el diseño.
   */
  adornos: [
    { seccion: "splash", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 40 },
    { seccion: "splash", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 34, espejo: "hv" },
    { seccion: "hero", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 38, espejo: "h" },
    { seccion: "countdown", url: `${A}/birrete.png`, sitio: "cabecera", tamano: 34 },
    { seccion: "guests", url: `${A}/laurel.png`, sitio: "cabecera", tamano: 40 },
    { seccion: "events", url: `${A}/diploma.png`, sitio: "cabecera", tamano: 38 },
    { seccion: "gallery", url: `${A}/esquina.png`, sitio: "abajo-izq", tamano: 34, espejo: "v" },
    { seccion: "features", url: `${A}/libros.png`, sitio: "cabecera", tamano: 36 },
    { seccion: "gifts", url: `${A}/copas.png`, sitio: "cabecera", tamano: 26 },
    { seccion: "social", url: `${A}/copas.png`, sitio: "cabecera", tamano: 24 },
    { seccion: "confirm", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 36, espejo: "hv" },
    { seccion: "footer", url: `${A}/laurel.png`, sitio: "cabecera", tamano: 30 },
  ],
};
