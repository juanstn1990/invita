/**
 * Boda Rosalila.
 *
 * Crema, oliva y gris: la invitación de tarjetas. Cada sección es una ficha
 * de papel crema con las esquinas redondeadas sobre el fondo, los títulos en
 * caligrafía, los textos en gris y una ilustración a línea dentro de cada
 * una —los novios bailando, las notas, el sobre con el corazón, los anillos,
 * la cámara—. Las rosas de acuarela asoman por las esquinas.
 *
 * Calca una invitación que el cliente trajo, con su arte: de ahí salen la
 * estructura —**una sola ficha de «Ceremonia y recepción»**, que es lo que la
 * separa de los demás diseños de boda—, la tipografía (Dancing Script para
 * los títulos, Gwendolyn para el monograma, Lobster para la fecha, Questrial
 * para lo que es interfaz) y los colores: oliva, gris y papel crema.
 *
 * Lo interactivo es nuestro: el sobre con lacre, la galería «papel rasgado»,
 * el párrafo «cita» —las dos frases de la referencia— y la canción del RSVP,
 * que hace de su sección de música.
 *
 * La banda de la galería y la de confirmar son las dos únicas superficies a
 * sangre: en la referencia rompen la sucesión de fichas justo donde entran
 * las fotos, y sin ellas la invitación entera se lee como una sola lista.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/rosalila";

const OLIVA = paleta({
  id: "rosalila", nombre: "Crema y oliva",
  base: "#faf4ec", tinta: "#6b6b6b", marca: "#8c9c65", acento: "#9baa79", segundo: "#c47a6c",
});
const LILA = paleta({
  id: "lila-rosalila", nombre: "Lila y crema",
  base: "#f9f6fa", tinta: "#615c6b", marca: "#8272a0", acento: "#8272a0", segundo: "#c2a9c9",
});
const AZUL = paleta({
  id: "azul-rosalila", nombre: "Azul y blanco",
  base: "#f5f7fb", tinta: "#5d6672", marca: "#5b7095", acento: "#5b7095", segundo: "#a9bcd6",
});
const TERRACOTA = paleta({
  id: "terracota-rosalila", nombre: "Terracota y crema",
  base: "#fdf6f1", tinta: "#6f6259", marca: "#b4705d", acento: "#b4705d", segundo: "#c8a98c",
});

const css = () => `
:root{--rl-script:'Dancing Script',cursive;--rl-mono:'Gwendolyn',cursive;
  --rl-fecha:'Lobster',cursive;--rl-ui:'Questrial',system-ui,sans-serif;
  --rl-foto:'Rakkas',Georgia,serif;
  --rl-ficha:color-mix(in srgb,var(--bg) 62%,#fff);
  --rl-banda:color-mix(in srgb,var(--brand-2) 74%,#e2bb8e);
  --rl-banda-suave:color-mix(in srgb,var(--brand-2) 42%,#fff);
  --rl-sombra:0 12px 28px -20px rgba(90,78,64,.65)}
body{background:var(--bg)}

/* ── Letras ──
   Dancing Script lo escribe casi todo —títulos y textos, como en el
   original—, Questrial es lo que se pulsa y Lobster sólo la fecha. */
.section-title,.hero-sub,.event-title,.gifts-bank{font-family:var(--rl-script);font-weight:600}
.section-title{font-size:clamp(30px,8.6vw,38px);line-height:1.25;color:var(--ink)}
.section-label,.hero-label,.splash-subtitle,.ring-label,.event-type,.feature-title,.social-ig,
.footer-copy,.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.inv-mapa-btn,
.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--rl-ui)}
.section-label{font-size:11.5px;letter-spacing:.24em;padding-left:.24em;text-transform:uppercase;color:var(--brand)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub,.event-place,
.feature-text{font-family:var(--rl-script);font-weight:500;font-size:20px;line-height:1.5}
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre{font-family:var(--rl-script);font-weight:700}
.hero-date,.footer-date,.countdown .section-title{font-family:var(--rl-fecha);font-weight:400;letter-spacing:.02em}

/* Las rosas de las esquinas y la ramita de flores, que es lo que da el aire
   de papel pintado a mano. */
.ornament{margin:0 auto 14px}
.rl-ramita{display:block;width:min(20vw,74px);margin:0 auto;pointer-events:none}

/* ── Fichas: cada sección es una tarjeta de papel ──
   El original no maqueta secciones, maqueta tarjetas: una detrás de otra
   sobre el mismo papel. Aquí se hace con el .container, que ya envuelve el
   contenido de todas, y así vale para las secciones y para los bloques
   nuevos sin tocar el marcado de ninguna. */
section{padding:20px 14px;background:var(--bg)}
section.alt{background:var(--bg)}
section .container,.inv-block .container{position:relative;z-index:2;
  padding:40px 22px 36px;border-radius:22px;background:var(--rl-ficha);box-shadow:var(--rl-sombra)}

/* ── Bienvenida: el sobre con su lacre ──
   Las rosas de las esquinas no están aquí: nacen como adornos de la
   invitación —ver la lista de adornos, al final del archivo—, y así se
   pueden mover o quitar desde el editor. */
#splash{background:var(--bg)}
#splash .splash-modal{background:var(--rl-ficha);border-radius:22px;box-shadow:var(--rl-sombra)}
.splash-subtitle{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--brand)}
.splash-name{font-size:clamp(46px,14vw,62px);line-height:1.1;color:var(--ink)}
.splash-date{font-family:var(--rl-fecha);font-size:18px;letter-spacing:0;color:var(--muted)}
.inv-sobre-sello:not(.con-imagen){background:url(/disenos/lacres/oro.png) center/contain no-repeat;
  filter:hue-rotate(28deg) saturate(.75) drop-shadow(0 5px 10px rgba(80,75,50,.3));
  color:transparent;box-shadow:none;border:0}
#splash .inv-sobre-cuerpo{background:#f2f1ec}
#splash .inv-sobre-nombre{font-size:clamp(36px,11vw,48px);color:var(--ink)}
#splash .inv-sobre-ante{color:var(--brand);letter-spacing:.24em}
#splash .inv-sobre-pista{color:var(--muted);font-size:12px}

/* ── Portada: papel crema y las rosas en dos esquinas ──
   Sin foto por defecto, como la referencia: el ramo arriba, el ramo abajo y
   los nombres en medio. La foto que suba la pareja entra igual y manda. */
#hero{place-items:center;padding:110px 24px;background:var(--bg);
  --hero-ink:var(--ink);--hero-ink-soft:var(--muted);--hero-line:color-mix(in srgb,var(--brand) 30%,transparent);
  --hero-brand:var(--brand)}
#hero.con-foto{background:none}
.hero-content{box-shadow:none;width:min(520px,100%);padding:0 16px;background:none}
.hero-label{font-size:11.5px;letter-spacing:.34em;text-transform:uppercase;margin:0 0 10px}
.hero-name{font-size:clamp(52px,16vw,74px);line-height:1.12;margin:0}
.hero-amp{font-size:.62em}
.hero-date{margin-top:14px;border-top:0;padding-top:0;font-size:17px;letter-spacing:.06em}
.hero-quote{font-family:var(--rl-script);font-weight:500;font-size:21px;line-height:1.45;max-width:26ch;margin:16px auto 0}
.hero-btn{margin-top:18px}

/* ── El mensaje de los novios, con el monograma al pie ──
   El monograma es la inicial de cada uno en Gwendolyn: el «&» lo pone el
   propio diseño y las letras salen de los nombres, así que no hay que
   dibujar una imagen por pareja. */
#guests .container{padding-bottom:26px}
#guests [data-inv="guests.text"],#guests [data-inv="guests.textSecondary"]{max-width:30ch;margin-inline:auto}
#guests .container::after{content:"";display:block;width:min(34vw,130px);aspect-ratio:1.1;margin:14px auto -6px;
  background:url(${A}/ramita.png) center/contain no-repeat}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:420px;margin:22px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 10px;text-align:center}
.inv-padres-invitados .hero-padres-tit{font-family:var(--rl-ui);font-size:10.5px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:5px;font-family:var(--rl-script);font-size:20px;
  line-height:1.4;color:var(--ink);white-space:pre-line}

/* ── Cuenta atrás: la fecha en Lobster y cuatro números sin caja ── */
#countdown .container,.inv-block-countdown .container{padding-top:34px}
#countdown .section-label,.inv-block-countdown .section-label{order:2;color:var(--brand);margin-top:6px}
#countdown .section-title,.inv-block-countdown .section-title{font-size:23px;color:var(--ink)}
.countdown-grid{max-width:390px;margin:14px auto 0;gap:6px}
.countdown-ring{background:none;border:0;border-radius:0;box-shadow:none;padding:6px 2px}
.ring-number{font-family:var(--rl-ui);font-size:23px;color:var(--muted)}
.ring-label{font-family:var(--rl-ui);font-size:10px;letter-spacing:.04em;text-transform:none;color:var(--muted)}

/* ── Ceremonia y recepción: una sola ficha ──
   Una y no dos: en la referencia la ceremonia y la fiesta son el mismo sitio
   y la misma hora, y partirlo obliga a repetir el lugar. Si la invitación
   agrega un segundo momento, entra debajo con la misma pinta. */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:22px;margin-top:18px}
#events .event-card{padding:0;border:0;border-radius:0;background:none;box-shadow:none;text-align:center}
#events .event-card:hover{transform:none}
#events .event-icon{display:none}
#events .event-type{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-size:26px;line-height:1.3;color:var(--ink)}
#events .event-time{font-family:var(--rl-ui);font-size:14px;letter-spacing:.04em;color:var(--muted)}
#events .event-place{font-size:19px;line-height:1.45}

/* ── Galería: la banda de color, la cámara dibujada y las fotos rasgadas ── */
#gallery,.inv-block-gallery{padding:0;background:var(--rl-banda)}
#gallery .container,.inv-block-gallery .container{background:none;box-shadow:none;border-radius:0;
  padding:56px 18px 60px}
#gallery .section-title,.inv-block-gallery .section-title{color:#fff}
#gallery .section-label,.inv-block-gallery .section-label,
#gallery .gallery-text,.inv-block-gallery .gallery-text{color:rgba(255,255,255,.92)}
#gallery .container::before,.inv-block-gallery .container::before{content:"";display:block;
  width:min(52vw,200px);aspect-ratio:1.37;margin:2px auto 10px;
  background:url(${A}/camara.png) center/contain no-repeat}
#gallery .ornament,.inv-block-gallery .ornament{display:none}
.inv-ga-rasgada .gallery-item{filter:drop-shadow(0 14px 22px rgba(70,55,45,.3))}
.inv-ga-tresydos{gap:10px;margin-top:20px}

/* ── La cita: la ramita asomando por la esquina ── */
.inv-pa-cita{background:var(--rl-ficha);box-shadow:var(--rl-sombra);border-radius:22px;padding:44px 26px 34px}
.inv-block-paragraph .container{padding:0;background:none;box-shadow:none}
.inv-pa-cita::before{content:"";position:absolute;left:22px;top:14px;width:54px;aspect-ratio:1;
  background:url(${A}/ramita.png) center/contain no-repeat;opacity:.9}
.inv-cita-texto{font-family:var(--rl-script);font-weight:500;font-size:20px;line-height:1.5;color:var(--muted)}
.inv-cita-firma{font-family:var(--rl-script);font-weight:600;font-size:22px;letter-spacing:0;
  padding:0;text-transform:none;color:var(--muted)}

/* ── Dress code: los novios dibujados y dos columnas ── */
#features .ornament{width:min(40vw,150px);aspect-ratio:.86;margin:4px auto 16px;
  background:url(${A}/novios.png) center/contain no-repeat}
#features .ornament img{visibility:hidden}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;max-width:420px;margin-inline:auto}
#features .feature-card{padding:0;border:0;border-radius:0;background:none;box-shadow:none;text-align:center}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1;margin-top:4px}
#features .feature-icon{display:none}
.feature-title{font-size:19px;letter-spacing:0;text-transform:none;color:var(--brand)}
.feature-text{font-size:19px;color:var(--muted)}

/* ── Lluvia de sobres y confirmar ── */
#gifts .ornament,.inv-block-gifts .ornament{width:min(44vw,170px);aspect-ratio:1.38;margin:8px auto 12px;
  background:url(${A}/sobre.png) center/contain no-repeat}
#gifts .ornament img,.inv-block-gifts .ornament img{visibility:hidden}
#events .ornament{width:min(42vw,160px);aspect-ratio:1.42;margin:8px auto 10px;
  background:url(${A}/anillos.png) center/contain no-repeat}
#events .ornament img{visibility:hidden}
.gifts-account{background:color-mix(in srgb,var(--brand) 8%,transparent);border:0;border-radius:14px}
.gifts-bank{font-size:19px;color:var(--brand)}
#confirmation{padding:0;background:var(--rl-banda-suave)}
#confirmation .ornament{display:none}
#confirmation .container{background:none;box-shadow:none;border-radius:0;padding:56px 20px 64px}
#confirmation .section-title{font-family:var(--rl-ui);font-size:clamp(26px,7.4vw,32px);color:#fff}
#confirmation .section-label,#confirmation .confirmation-text{color:rgba(255,255,255,.94)}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;opacity:.95;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;color:var(--ink)}
.inv-rsvp-input,.inv-rsvp-area{background:rgba(255,255,255,.92);border-color:transparent}

/* ── La música, donde la referencia la tenía: junto a la canción del RSVP ── */
#confirmation .inv-rsvp-lab:has(input[name="cancion"])::after{content:"";display:block;width:110px;
  aspect-ratio:1.6;margin:6px auto 0;background:url(${A}/musica.png) center/contain no-repeat;
  filter:brightness(2.4) saturate(0)}

/* ── Hashtag: la foto a sangre con el título encima ── */
#social{padding:0;background:var(--rl-banda-suave)}
#social .container{background:none;box-shadow:none;border-radius:0;padding:64px 22px}
#social .section-title{font-family:var(--rl-foto);font-weight:400;font-size:clamp(28px,8vw,34px);color:#fff}
/* Aquí también manda la cámara, no la ramita: la sección es «comparte las
   fotos», y es el mismo dibujo que preside la galería. */
#social .ornament{width:min(46vw,180px);aspect-ratio:1.37;margin:10px auto 6px;
  background:url(${A}/camara.png) center/contain no-repeat}
#social .ornament img{visibility:hidden}
#social .section-label,#social .social-sub{color:rgba(255,255,255,.92)}
.social-hashtag{font-family:var(--rl-foto);font-size:26px;color:#fff}

/* ── Botones: píldora oliva ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar),.event-map-btn,.social-ig{border:0;background:var(--accent);color:#fff;
  font-size:14px;letter-spacing:.02em;text-transform:none;box-shadow:0 8px 18px -12px rgba(80,90,60,.9);
  transition:filter .3s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.06)}
.inv-rsvp-no{background:rgba(255,255,255,.85);color:var(--ink);box-shadow:none}

/* ── Pie ── */
footer{padding:26px 14px calc(30px + env(safe-area-inset-bottom));background:var(--bg)}
footer .container{position:relative;z-index:2;padding:40px 22px;border-radius:22px;
  background:var(--rl-ficha);box-shadow:var(--rl-sombra)}
.footer-names{font-size:40px;line-height:1.2;color:var(--ink)}
.footer-date{font-size:17px;color:var(--muted)}
.footer-copy{font-size:11px;letter-spacing:.16em;color:var(--brand)}

@media (max-width:380px){
  section .container,.inv-block .container{padding:34px 16px 30px}
}`;

export const rosalila: Design = {
  slug: "rosalila",
  name: "Boda Rosalila",
  occasion: "boda",
  mood: "Crema, oliva y gris: cada sección una ficha de papel, dibujos a línea y rosas en las esquinas",
  fontUrl: gfont(
    "family=Dancing+Script:wght@400..700&family=Gwendolyn:wght@400;700&family=Lobster&family=Questrial&family=Rakkas"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  variantes: { gallery: "tresydos" },
  type: {
    display: "'Dancing Script', cursive",
    body: "'Questrial', system-ui, sans-serif",
    displayWeight: 600,
    base: 17,
    scale: 1.2,
    displayTracking: "0",
    tracking: "0.24em",
  },
  shape: { radius: 22, radiusSm: 14, btnRadius: "pill", shadow: "soft" },
  palettes: [OLIVA, LILA, AZUL, TERRACOTA],
  padresEn: "guests",
  css,
  deco: {
    ornament: () => `<img class="rl-ramita" src="${A}/ramita.png" alt="">`,
  },
  /*
   * Las rosas y la ramita, puestas como adornos y no como fondo.
   *
   * Son lo único de este diseño que se coloca «encima»: van en una esquina,
   * y en una esquina es donde estorban cuando la pareja sube su propia foto
   * de portada o alarga el texto. Naciendo como adornos, el editor las
   * arrastra, las encoge o las borra sin tocar el diseño.
   *
   * Los dibujos que van debajo de un título —los novios, la cámara, el
   * sobre— se quedan en el CSS a propósito: ésos no están puestos encima de
   * la sección, son la sección.
   */
  adornos: [
    { seccion: "splash", url: `${A}/rosa.png`, sitio: "arriba-izq", tamano: 34 },
    { seccion: "splash", url: `${A}/ramita.png`, sitio: "abajo-der", tamano: 20 },
    { seccion: "hero", url: `${A}/rosa.png`, sitio: "arriba-izq", tamano: 36 },
    { seccion: "hero", url: `${A}/rosa.png`, sitio: "abajo-der", tamano: 34, espejo: "h" },
    { seccion: "footer", url: `${A}/ramita.png`, sitio: "arriba", tamano: 18 },
  ],
};
