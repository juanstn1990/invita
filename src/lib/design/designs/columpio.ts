/**
 * Quinceañera Columpio de Flores.
 *
 * Lila, rosa y oro: un jardín encantado al atardecer, con un columpio de
 * madera colgado de una rama cargada de flores y mariposas doradas
 * revoloteando en la luz.
 *
 * Sale de referencias de pósters de película que trajo el cliente —el
 * arco de flores moradas colgando por los lados, la luz cálida, la paleta
 * lila-rosa-oro—. El arte es propio, generado con Grok inspirado en ese
 * estilo: nada de lo dibujado reproduce ningún personaje ni marca, sólo el
 * jardín, las flores y la luz.
 *
 * El arco de flores —la pieza que pidió el cliente— va en las dos esquinas
 * de arriba de la portada, espejado, formando el marco. El resto del arte
 * son adornos sueltos, nunca pegados en el CSS.
 *
 * Para los pétalos morados que se ven en la vista previa: es la partícula
 * «Pétalos» de siempre (`particulas.tipo = "petalos"`), que ya existía y
 * que ya se tiñe sola del color de marca de la paleta si no se le pone un
 * color a mano —por eso salen morados aquí sin escribir nada más—. No es un
 * valor por defecto del diseño porque eso no existe todavía en el proyecto
 * —ningún diseño enciende partículas solo—: se prende una vez en el editor,
 * en la sección Partículas, y punto.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/15-columpio";

const LILA_ORO = paleta({
  id: "columpio", nombre: "Lila y oro",
  base: "#fdf7f0", tinta: "#3a2a3d", marca: "#8b5aa8", acento: "#c9932f", segundo: "#f0c4dd",
});
const ROSA_ORO = paleta({
  id: "rosa-columpio", nombre: "Rosa y oro",
  base: "#fdf5f2", tinta: "#3d2430", marca: "#c0538a", acento: "#cf9a3a", segundo: "#dcb3d9",
});
const LAVANDA = paleta({
  id: "lavanda-columpio", nombre: "Lavanda pastel",
  base: "#faf6fb", tinta: "#423650", marca: "#a889c9", acento: "#d4a843", segundo: "#f5d5e8",
});
const NOCHE_MAGICA = paleta({
  id: "noche-columpio", nombre: "Noche mágica",
  base: "#241a2e", tinta: "#f3e9f5", marca: "#c9a0e0", acento: "#e0b34a", segundo: "#6b4f7a",
});

const css = () => `
:root{--cp-script:'Italianno',cursive;--cp-tit:'Cormorant Garamond',Georgia,serif;
  --cp-ui:'Jost',system-ui,sans-serif;
  /* Antes se mezclaba con blanco y el morado casi no se notaba: una
     invitación "morada" que en pantalla se veía casi crema. Mezclado con la
     propia marca en vez de con blanco, el papel se tiñe de verdad. */
  --cp-papel:color-mix(in srgb,var(--brand) 15%,var(--bg));
  --cp-tarjeta:color-mix(in srgb,var(--brand) 8%,var(--card));
  --cp-hilo:color-mix(in srgb,var(--brand) 26%,transparent)}
/* Un lavado suave de morado detrás de todo, no un color plano: es la
   diferencia entre "una invitación morada" y "un jardín con luz morada". */
body{background:
  radial-gradient(120% 60% at 50% 0%,color-mix(in srgb,var(--brand) 12%,transparent),transparent 60%),
  var(--bg)}

/* ── Letras ── */
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre,.social-hashtag{font-family:var(--cp-script);font-weight:400}
.section-title,.event-title,.ring-number{font-family:var(--cp-tit);font-weight:500}
.section-label,.hero-label,.splash-subtitle,.ring-label,.event-type,.feature-title,.gifts-bank,
.social-ig,.footer-copy,.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--cp-ui)}
.section-label{font-size:10.5px;letter-spacing:.36em;padding-left:.36em;text-transform:uppercase;color:var(--brand)}
.section-title{font-size:clamp(36px,10vw,50px);line-height:1.1;color:var(--ink)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:17.5px;line-height:1.7}

/* ── Portada: el columpio en la luz dorada, el marco de flores en las esquinas ── */
#hero{place-items:end center;padding:0 24px calc(58px + env(safe-area-inset-bottom));background:#f3e6d8}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 32%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to top,var(--bg) 4%,color-mix(in srgb,var(--bg) 88%,transparent) 26%,
    color-mix(in srgb,var(--bg) 20%,transparent) 54%,transparent 72%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:10.5px;letter-spacing:.42em;padding-left:.42em;text-transform:uppercase;margin:0;color:var(--brand)}
.hero-name{font-size:clamp(78px,25vw,128px);line-height:.9;margin:0;color:var(--brand)}
.hero-sub{font-family:var(--cp-tit);font-style:italic;font-size:19px}
.hero-date{margin-top:10px;border-top:0;padding-top:0;font-family:var(--cp-ui);font-size:12px;letter-spacing:.3em}
.hero-quote{font-family:var(--cp-tit);font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0}

/* ── El papel, y el hilo lila ──
   Las dos alternan, pero ninguna es neutra: la de "reposo" lleva un lavado
   fino de marca, la "alt" lo lleva fuerte. Antes sólo se notaba el morado en
   los títulos y los botones; el resto de la página se leía blanca. */
section{padding:88px 24px;background:color-mix(in srgb,var(--brand) 4%,var(--bg))}
section.alt{background:var(--cp-papel)}
section .container{position:relative;z-index:2}
/* Un resplandor detrás de cada título, como si la luz de la portada
   siguiera entrando: es la pieza "más creativa" y no cuesta nada de peso —es
   un gradiente, no una imagen. */
.section-title{position:relative}
.section-title::before{content:"";position:absolute;left:50%;top:50%;z-index:-1;
  width:220px;height:120px;transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--brand) 22%,transparent),transparent 72%)}
#guests [data-inv="guests.text"]{max-width:32ch;margin-inline:auto}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:430px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid var(--cp-hilo)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--cp-ui);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-family:var(--cp-tit);font-size:19px;
  line-height:1.5;color:var(--ink);white-space:pre-line}

/* ── Cuenta atrás ──
   El aro lleno de morado y el número en blanco —no morado sobre blanco— es
   el cambio de "un dato con acento" a "una pieza de la decoración". */
#countdown,.inv-block-countdown{background:var(--cp-papel)}
.countdown-grid{max-width:420px;margin-inline:auto;gap:10px}
.countdown-ring{background:linear-gradient(160deg,var(--brand),color-mix(in srgb,var(--brand) 70%,#000));
  border:0;border-radius:16px;box-shadow:0 14px 26px -18px color-mix(in srgb,var(--brand) 70%,#000)}
.ring-number{font-size:34px;color:#fff}
.ring-label{font-family:var(--cp-ui);font-size:9px;letter-spacing:.24em;text-transform:uppercase;
  color:color-mix(in srgb,#fff 75%,transparent)}

/* ── Programa: fichas redondeadas, con canto morado ── */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:430px;margin:24px auto 0}
#events .event-card{padding:26px 22px;text-align:center;border:0;border-radius:18px;
  background:var(--cp-tarjeta);border-top:3px solid var(--brand);
  box-shadow:0 16px 32px -26px color-mix(in srgb,var(--brand) 60%,#000)}
#events .event-type{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-size:28px;line-height:1.15;color:var(--ink)}
#events .event-time{font-family:var(--cp-ui);font-size:12.5px;letter-spacing:.22em;color:var(--brand)}
#events .event-place{font-size:16.5px;line-height:1.5}

/* ── Información útil y regalos ── */
#features{background:var(--cp-papel)}
#features .feature-card{padding:22px 16px;border:0;border-radius:16px;background:var(--cp-tarjeta);
  box-shadow:inset 0 0 0 1px var(--cp-hilo)}
.feature-icon{color:var(--brand)}
.feature-title{font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--brand)}
.gifts-account{background:var(--cp-tarjeta);border:1px solid var(--cp-hilo);border-radius:16px}
.gifts-bank{color:var(--brand)}

/* ── El brindis: banda a sangre, lila profundo ── */
#social{background:linear-gradient(160deg,color-mix(in srgb,var(--brand) 85%,#000),
  var(--brand) 55%,color-mix(in srgb,var(--brand) 70%,#fff));color:#fdf3ff}
#social .section-label{color:rgba(253,243,255,.82)}
#social .section-title{color:#fff}
#social .social-sub{color:rgba(253,243,255,.88)}
.social-hashtag{font-size:40px;line-height:1.1;color:#fff}
#social .social-ig{background:#fff;color:var(--brand)}

/* ── Confirmar ── */
#confirmation{padding-bottom:112px}
.inv-rsvp-lab{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── Botones: oro lleno, píldora ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:11px;letter-spacing:.22em;text-transform:uppercase;
  box-shadow:0 12px 24px -16px color-mix(in srgb,var(--accent) 85%,#000);transition:filter .3s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.08)}
.event-map-btn,.inv-rsvp-no{background:transparent;color:var(--brand);box-shadow:inset 0 0 0 1px var(--accent)}

/* ── Pie ── */
footer{padding:76px 24px calc(68px + env(safe-area-inset-bottom));background:var(--cp-papel)}
footer .container{position:relative;z-index:2}
.footer-names{font-size:72px;line-height:1;color:var(--brand)}
.footer-date{font-family:var(--cp-ui);font-size:12px;letter-spacing:.26em}
.footer-copy{font-family:var(--cp-ui);font-size:10px;letter-spacing:.28em;color:var(--brand)}`;

export const columpio: Design = {
  slug: "15-columpio",
  name: "Quinceañera Columpio de Flores",
  occasion: "quince",
  mood: "Lila, rosa y oro: un columpio entre flores colgantes y mariposas doradas al atardecer",
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
    tracking: "0.28em",
  },
  shape: { radius: 16, radiusSm: 12, btnRadius: "pill", shadow: "soft" },
  palettes: [LILA_ORO, ROSA_ORO, LAVANDA, NOCHE_MAGICA],
  padresEn: "guests",
  css,
  /*
   * El arco de flores en las dos esquinas de la portada —espejado— es lo
   * que pidió el cliente: el marco floral que enseñó en las referencias.
   *
   * El velo de bienvenida se probó con un marco completo alrededor del
   * nombre y no convenció —quedaba forzado con la tarjeta encima—, así que
   * el velo se queda simple: la apertura «sobre», que ya existe en la casa.
   * El resto son piezas de apoyo: la guirnalda como filigrana de sección,
   * el ramo presidiendo Regalos, la mariposa suelta, el divisor fino.
   */
  adornos: [
    { seccion: "hero", url: `${A}/arco.png`, sitio: "arriba-izq", tamano: 42 },
    { seccion: "hero", url: `${A}/arco.png`, sitio: "arriba-der", tamano: 42, espejo: "h" },
    { seccion: "guests", url: `${A}/guirnalda.png`, sitio: "titulo", tamano: 58 },
    { seccion: "countdown", url: `${A}/divisor.png`, sitio: "titulo", tamano: 56 },
    { seccion: "events", url: `${A}/mariposa.png`, sitio: "cabecera", tamano: 20 },
    { seccion: "gallery", url: `${A}/guirnalda.png`, sitio: "titulo", tamano: 54 },
    { seccion: "features", url: `${A}/divisor.png`, sitio: "titulo", tamano: 52 },
    { seccion: "gifts", url: `${A}/ramo.png`, sitio: "cabecera", tamano: 34 },
    { seccion: "confirm", url: `${A}/mariposa.png`, sitio: "abajo-izq", tamano: 18, opacidad: 70 },
    { seccion: "footer", url: `${A}/guirnalda.png`, sitio: "cabecera", tamano: 50 },
  ],
};
