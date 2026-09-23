/**
 * Grado Azul.
 *
 * Azul marino y blanco: el primer diseño de grado con arte propio. Los otros
 * siete son de tokens —filetes, marcos y tipografía— y eso está bien para una
 * participación sobria; éste es para quien quiere que la invitación se vea
 * ilustrada: el birrete y el diploma en acuarela sobre el mármol de un claustro,
 * la corona de laurel presidiendo los invitados, las copas en el brindis.
 *
 * El arte es propio, generado con Grok y recortado a PNG, y **nada de él está
 * en el CSS**: todas las piezas se declaran como adornos, así que nacen en los
 * datos de la invitación y quien la arma puede moverlas, encogerlas o
 * quitarlas. Es el primer diseño pensado así desde el principio; los anteriores
 * se migraron.
 *
 * Aquí el CSS sólo dice lo que el sistema de tokens todavía no sabe decir: la
 * letra de cada slot, el hilo azul que separa, el velo de la portada y la
 * banda del brindis.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/g-azul";

const AZUL = paleta({
  id: "g-azul", nombre: "Azul y blanco",
  base: "#f7fafd", tinta: "#1b2a40", marca: "#27476f", acento: "#2f5a8a", segundo: "#9dbcd8",
});
const MARINO = paleta({
  id: "marino", nombre: "Marino profundo",
  base: "#f5f7fa", tinta: "#111a28", marca: "#16283f", acento: "#1f3a5f", segundo: "#8ba3c0",
});
const CIELO = paleta({
  id: "cielo-grado", nombre: "Cielo y plata",
  base: "#f6fbfc", tinta: "#1e3340", marca: "#376a86", acento: "#3d7c9c", segundo: "#aed2e0",
});
const TINTA_ORO = paleta({
  id: "tinta-oro", nombre: "Tinta y oro",
  base: "#f8f7f3", tinta: "#18202e", marca: "#22334d", acento: "#9a7c3f", segundo: "#c3a86a",
});

const css = () => `
:root{--ga-tit:'Prata',Georgia,serif;--ga-ui:'Jost',system-ui,sans-serif;
  --ga-hilo:color-mix(in srgb,var(--brand) 26%,transparent);
  --ga-papel:color-mix(in srgb,var(--bg) 55%,#fff)}
body{background:var(--bg)}

/* ── Letras ──
   Prata para lo que se lee de lejos —el nombre, los títulos— y Jost para lo
   que se pulsa y para los antetítulos, que piden versalita ancha. */
.section-title,.hero-name,.splash-name,.footer-names,.event-title,.ring-number{font-family:var(--ga-tit);font-weight:400}
.section-label,.hero-label,.splash-subtitle,.ring-label,.event-type,.feature-title,.gifts-bank,
.social-ig,.footer-copy,.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--ga-ui)}
.section-label{font-size:11px;letter-spacing:.34em;padding-left:.34em;text-transform:uppercase;color:var(--brand)}
.section-title{font-size:clamp(32px,9vw,44px);line-height:1.15;color:var(--ink)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:18px;line-height:1.7}

/* ── Bienvenida ── */
#splash{background:radial-gradient(120% 80% at 50% 12%,var(--ga-papel),var(--bg))}
.splash-subtitle{font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--brand)}
.splash-name{font-size:clamp(44px,13vw,60px);line-height:1.15;color:var(--ink)}
.splash-date{font-family:var(--ga-ui);font-size:12px;letter-spacing:.26em;color:var(--muted)}
/* El lacre azul del diseño, mientras la invitación no suba el suyo. */
.inv-sobre-sello:not(.con-imagen){background:url(${A}/sello.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 5px 10px rgba(20,35,60,.35))}
#splash .inv-sobre-cuerpo{background:var(--ga-papel)}
#splash .inv-sobre-nombre{font-family:var(--ga-tit);font-size:clamp(30px,9vw,40px);color:var(--ink)}
#splash .inv-sobre-ante{color:var(--brand);letter-spacing:.28em}

/* ── Portada: el claustro, y el nombre sobre un velo blanco ──
   El velo va de abajo arriba y no a la inversa: la ilustración tiene la luz
   en las ventanas, arriba, y taparla sería tapar justo lo que se mira. */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:#dfe7f0;
  --hero-ink:#101c2c;--hero-ink-soft:rgba(16,28,44,.76);--hero-line:rgba(16,28,44,.22);
  --hero-brand:var(--brand)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 28%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to top,#fff 2%,rgba(255,255,255,.88) 26%,rgba(255,255,255,.2) 54%,transparent 72%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:11px;letter-spacing:.4em;padding-left:.4em;text-transform:uppercase;margin:0}
.hero-name{font-size:clamp(46px,14vw,68px);line-height:1.12;margin:4px 0 0}
.hero-date{margin-top:12px;border-top:0;padding-top:0;font-family:var(--ga-ui);font-size:12px;letter-spacing:.3em}
.hero-quote{font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0}

/* ── El papel y el hilo azul ── */
section{padding:86px 24px;background:var(--bg)}
section.alt{background:var(--ga-papel)}
section .container{position:relative;z-index:2}
#guests [data-inv="guests.text"]{max-width:32ch;margin-inline:auto}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:430px;margin:22px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid var(--ga-hilo)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--ga-ui);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17px;line-height:1.5;color:var(--ink);white-space:pre-line}

/* ── Cuenta atrás: cuatro casillas de hilo ── */
#countdown,.inv-block-countdown{background:var(--ga-papel)}
.countdown-grid{max-width:420px;margin-inline:auto;gap:10px}
.countdown-ring{background:var(--card);border:0;border-radius:3px;
  box-shadow:inset 0 0 0 1px var(--ga-hilo)}
.ring-number{font-size:32px;color:var(--brand)}
.ring-label{font-family:var(--ga-ui);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}

/* ── Ceremonia y celebración: fichas de papel con hilo ── */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:430px;margin:24px auto 0}
#events .event-card{padding:28px 22px;text-align:center;border:0;border-radius:3px;background:var(--card);
  box-shadow:0 14px 28px -24px rgba(20,35,60,.6),inset 0 0 0 1px var(--ga-hilo)}
#events .event-card:hover{transform:none}
#events .event-type{font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-size:28px;line-height:1.2;color:var(--ink)}
#events .event-time{font-family:var(--ga-ui);font-size:12.5px;letter-spacing:.22em;color:var(--brand)}
#events .event-place{font-size:16.5px;line-height:1.5}

/* ── Información útil y regalos ── */
#features{background:var(--ga-papel)}
#features .feature-card{padding:22px 16px;border:0;border-radius:3px;background:var(--card);
  box-shadow:inset 0 0 0 1px var(--ga-hilo)}
.feature-icon{color:var(--brand)}
.feature-title{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand)}
.gifts-account{background:var(--card);border:1px solid var(--ga-hilo);border-radius:3px}
.gifts-bank{color:var(--brand)}

/* ── El brindis: la única banda a sangre, para romper la sucesión de papel ── */
#social{background:linear-gradient(var(--ga-papel),color-mix(in srgb,var(--brand-2) 28%,var(--bg)))}
.social-hashtag{font-family:var(--ga-tit);font-size:30px;color:var(--brand)}

/* ── Confirmar ── */
#confirmation{padding-bottom:110px}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── Botones: azul lleno y su contorno ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;
  box-shadow:0 10px 20px -14px color-mix(in srgb,var(--accent) 90%,#000);transition:filter .3s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.08)}
.event-map-btn,.inv-rsvp-no{background:transparent;color:var(--brand);box-shadow:inset 0 0 0 1px var(--accent)}

/* ── Pie ── */
footer{padding:74px 24px calc(66px + env(safe-area-inset-bottom));background:var(--ga-papel)}
footer .container{position:relative;z-index:2}
.footer-names{font-size:44px;line-height:1.2;color:var(--ink)}
.footer-date{font-family:var(--ga-ui);font-size:12px;letter-spacing:.26em}
.footer-copy{font-family:var(--ga-ui);font-size:10.5px;letter-spacing:.28em;color:var(--brand)}`;

export const gazul: Design = {
  slug: "g-azul",
  name: "Grado Azul",
  occasion: "grado",
  mood: "Azul marino y blanco, ilustrado: el birrete y el diploma en acuarela, laurel y copas",
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
  palettes: [AZUL, MARINO, CIELO, TINTA_ORO],
  padresEn: "guests",
  css,
  /*
   * Todo el arte, como adornos y no como CSS.
   *
   * Es el primer diseño escrito así de nacimiento: la invitación se crea con
   * estas piezas en sus datos, así que se mueven, se encogen o se borran desde
   * el editor sin tocar el diseño. Lo único que se queda en el CSS es la
   * ilustración de la portada —que es un fondo, no una pieza encima— y el
   * lacre del sobre, que es parte del sobre.
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
