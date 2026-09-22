/**
 * Boda Rosalila.
 *
 * Blanco y lila: el arco de rosas blancas e hidrangeas moradas, el sobre con
 * lacre lila y los iconos dibujados a línea —cámara, anillos, notas, sobre—
 * que separan una sección de otra.
 *
 * Calca la estructura de la invitación que un cliente trajo de referencia:
 * el sobre que se toca, los nombres sobre la ilustración, el mensaje de los
 * novios, la cuenta atrás, **una sola ficha de «Ceremonia y recepción»** —no
 * dos, que es lo que la distingue de los demás diseños de boda—, la galería
 * en papel rasgado, la cita en tarjeta, el dress code con los novios
 * dibujados, la música, la lluvia de sobres, el hashtag y la confirmación.
 *
 * El arte es propio, generado y recortado a PNG; de la referencia sale la
 * estructura, no los archivos. Lo interactivo son componentes de la app: el
 * sobre con sello, la galería «papel rasgado», el párrafo «cita» y la
 * canción del RSVP, que aquí hace de «agrega la música que quieres oír».
 *
 * Y la paleta se aparta a propósito: Boda Rosal ya ocupa el crema y la
 * salvia, así que aquí manda el morado —que es además el que pide el dress
 * code de la referencia—, con una variante oliva para quien quiera el
 * original.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/rosalila";

const LILA = paleta({
  id: "rosalila", nombre: "Blanco y lila",
  base: "#faf8f6", tinta: "#3c3545", marca: "#7c6a99", acento: "#7c6a99", segundo: "#b9a3c9",
});
const OLIVA = paleta({
  id: "oliva-rosalila", nombre: "Oliva y crema",
  base: "#f8f6ef", tinta: "#36382c", marca: "#6d7a4a", acento: "#6d7a4a", segundo: "#c6b6a0",
});
const AZUL = paleta({
  id: "azul-rosalila", nombre: "Azul y blanco",
  base: "#f5f7fb", tinta: "#2f3947", marca: "#4f6288", acento: "#4f6288", segundo: "#a9bcd6",
});
const ROSA = paleta({
  id: "rosa-rosalila", nombre: "Rosa antiguo",
  base: "#fdf7f5", tinta: "#443036", marca: "#a5697a", acento: "#a5697a", segundo: "#d8b7bd",
});

const css = () => `
:root{--rl-script:'Parisienne',cursive;--rl-caps:'Questrial',system-ui,sans-serif;
  --rl-tit:'Italiana',Georgia,serif;
  --rl-papel:color-mix(in srgb,var(--bg) 84%,#fff);
  --rl-lila-suave:color-mix(in srgb,var(--brand) 12%,var(--bg));
  --rl-filete:color-mix(in srgb,var(--brand) 32%,transparent)}
body{background:var(--bg)}

/* ── Letras ──
   Italiana para los títulos —una romana de asta finísima, que es lo que da
   el aire de participación impresa—, Questrial para lo que es interfaz y
   Parisienne sólo para los nombres. */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,.event-time,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista,.inv-sobre-ante{font-family:var(--rl-caps)}
.section-label{font-size:11px;letter-spacing:.38em;padding-left:.38em;color:var(--brand);text-transform:uppercase}
.section-title{font-family:var(--rl-tit);font-weight:400;font-size:clamp(38px,10.5vw,52px);
  line-height:1.1;letter-spacing:.02em;color:var(--ink)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:18px;line-height:1.75}
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre{font-family:var(--rl-script);font-weight:400}
.hero-amp,.splash-amp,.footer-names .amp{display:block;font-size:.5em;line-height:1.4;color:var(--brand-2)}
@keyframes rlFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

/* La flor bajo cada título, que es el separador de toda la invitación. */
.ornament{margin:6px auto 22px}
.rl-flor{display:block;width:min(24vw,96px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: el sobre con lacre lila ── */
#splash{background:
  url(${A}/rama.png) right -54px bottom -30px/min(46vw,190px) no-repeat,
  radial-gradient(120% 80% at 50% 16%,var(--rl-papel),var(--bg))}
.splash-name{font-size:clamp(56px,17vw,80px);line-height:1.05;color:var(--brand)}
.splash-subtitle{color:var(--brand);letter-spacing:.34em;font-size:10.5px;text-transform:uppercase}
.splash-date{font-family:var(--rl-caps);letter-spacing:.2em;color:var(--muted)}
.inv-sobre-sello:not(.con-imagen){background:url(/disenos/lacres/lila.png) center/contain no-repeat;
  color:transparent;box-shadow:none;border:0;filter:drop-shadow(0 5px 10px rgba(50,40,60,.32))}
#splash .inv-sobre-cuerpo{background:var(--rl-papel)}
#splash .inv-sobre-nombre{font-size:clamp(40px,12vw,54px);color:var(--brand)}
#splash .inv-sobre-ante{color:var(--brand);letter-spacing:.28em}
#splash .inv-sobre-pista{color:var(--brand)}

/* ── Portada: la ilustración a sangre y los nombres encima ── */
#hero{place-items:end center;padding:0 24px calc(54px + env(safe-area-inset-bottom));background:#6a6070;
  --hero-ink:#fffdfb;--hero-ink-soft:rgba(255,253,251,.9);--hero-line:rgba(255,253,251,.34);
  --hero-brand:color-mix(in srgb,var(--brand) 22%,#fff)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 28%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.05),transparent 30%,rgba(48,40,56,.5) 62%,#2f2838 98%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-label{font-size:11px;letter-spacing:.44em;padding-left:.44em;margin:0}
.hero-name{font-size:clamp(66px,20vw,104px);line-height:1;margin:0;text-shadow:0 2px 18px rgba(0,0,0,.4)}
.hero-sub{font-size:18px}
.hero-date{border-top:0;padding-top:0;margin-top:8px;font-family:var(--rl-caps);font-size:12px;letter-spacing:.3em}
.hero-quote{font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0}

/* ── El papel, con la rama asomando por un borde ── */
section{padding:88px 24px;background:var(--bg)}
section.alt{background:var(--rl-papel)}
section .container{position:relative;z-index:2}
#guests{padding-top:98px;background:
  url(${A}/rama.png) left -58px top -20px/min(40vw,170px) no-repeat,var(--rl-papel)}
#guests [data-inv="guests.text"]{max-width:32ch;margin-inline:auto}
/* Los padres bajan aquí desde la portada, con un filete en medio. */
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid var(--rl-filete)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--rl-caps);font-size:10.5px;letter-spacing:.26em;
  text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17px;line-height:1.5;color:var(--ink);white-space:pre-line}

/* ── Cuenta atrás: cuatro casillas de filete ── */
#countdown,.inv-block-countdown{background:var(--rl-lila-suave)}
.countdown-grid{max-width:430px;margin:22px auto 0;gap:10px}
.countdown-ring{background:transparent;border:0;border-radius:2px;box-shadow:inset 0 0 0 1px var(--rl-filete)}
.ring-number{font-family:var(--rl-tit);font-weight:400;font-size:34px;color:var(--brand)}
.ring-label{font-family:var(--rl-caps);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}

/* ── Ceremonia y recepción: una sola ficha, con la capilla encima ──
   Una y no dos: en la referencia la ceremonia y la fiesta son el mismo
   sitio y la misma hora, y partirlo en dos tarjetas obliga a repetir el
   lugar. Si la invitación agrega un segundo momento, entra igual debajo. */
#events .events-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:430px;margin:24px auto 0}
#events .event-card{padding:30px 22px 26px;text-align:center;border:0;border-radius:3px;background:var(--card);
  box-shadow:0 16px 30px -24px rgba(60,53,69,.7),inset 0 0 0 1px var(--rl-filete)}
#events .event-card:hover{transform:none}
#events .event-card:first-child .event-icon{display:block;width:96px;height:104px;margin:0 auto 10px;font-size:0;
  background:url(${A}/ceremonia.png) center/contain no-repeat}
#events .event-type{font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--brand)}
#events .event-title{font-family:var(--rl-tit);font-weight:400;font-size:30px;line-height:1.2;color:var(--ink)}
#events .event-time{font-size:12px;letter-spacing:.24em;color:var(--brand)}
#events .event-place{font-size:16.5px;line-height:1.5}

/* ── Galería en papel rasgado, y la cita en su tarjeta ── */
#gallery,.inv-block-gallery{background:var(--bg)}
.inv-ga-rasgada .gallery-item{filter:drop-shadow(0 14px 22px rgba(60,53,69,.22))}
.inv-pa-cita{background:var(--card);box-shadow:0 16px 30px -26px rgba(60,53,69,.6),inset 0 0 0 1px var(--rl-filete)}
.inv-pa-cita::after{content:"";position:absolute;right:-4px;top:-46px;width:min(22vw,92px);aspect-ratio:1;
  background:url(${A}/flor.png) center/contain no-repeat;pointer-events:none}
.inv-cita-texto{font-style:italic}
.inv-cita-firma{font-family:var(--rl-script);font-size:26px;letter-spacing:0;padding:0;text-transform:none;color:var(--brand)}

/* ── Dress code: los novios dibujados, y las fichas en dos columnas ── */
#features{background:var(--rl-papel)}
#features .ornament{width:min(40vw,150px);aspect-ratio:.73;margin-bottom:12px;
  background:url(${A}/novios.png) center/contain no-repeat}
#features .ornament img{visibility:hidden}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:22px 14px;border:0;border-radius:3px;background:var(--card);
  box-shadow:inset 0 0 0 1px var(--rl-filete)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--brand)}
.feature-title{font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--brand)}

/* ── Lluvia de sobres: el sobre con su lazo ── */
#gifts .container::before,.inv-block-gifts .container::before{content:"";display:block;width:min(46vw,180px);
  aspect-ratio:1.5;margin:0 auto 4px;background:url(${A}/regalo.png) center/contain no-repeat;
  animation:rlFlota 7s ease-in-out infinite}
.gifts-account{background:var(--card);border:1px solid var(--rl-filete);border-radius:3px}
.gifts-bank{color:var(--brand)}

/* ── Confirmar: aquí va la canción, que en la referencia era su sección de
   música. Por eso la preside el gramófono. ── */
#confirmation{padding-bottom:110px;background:var(--bg)}
#confirmation .container::before{content:"";display:block;width:min(44vw,180px);aspect-ratio:1.3;
  margin:0 auto 2px;background:url(${A}/musica.png) center/contain no-repeat}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--brand);opacity:1;text-align:left}
/* Donde ya preside una ilustración, la flor del título sobra. */
#gifts .ornament,.inv-block-gifts .ornament,#confirmation .ornament{display:none}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── Botones: lila liso y su contorno ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;background:var(--accent);color:var(--on-accent);
  font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  box-shadow:0 12px 22px -16px color-mix(in srgb,var(--accent) 90%,#000);transition:filter .3s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(1.08)}
.event-map-btn,.inv-rsvp-no{background:transparent;color:var(--brand);box-shadow:inset 0 0 0 1px var(--accent)}

/* ── Hashtag y pie ── */
#social{background:var(--rl-lila-suave)}
.social-hashtag{font-family:var(--rl-script);font-size:34px;color:var(--brand)}
footer{padding:72px 24px calc(66px + env(safe-area-inset-bottom));background:var(--rl-papel)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:min(24vw,96px);aspect-ratio:1;margin:0 auto 2px;
  background:url(${A}/flor.png) center/contain no-repeat}
.footer-names{font-family:var(--rl-script);font-size:62px;line-height:1.1;color:var(--brand)}
.footer-date{font-family:var(--rl-caps);letter-spacing:.24em}
.footer-copy{letter-spacing:.3em;color:var(--brand)}

@media (prefers-reduced-motion:reduce){
  #gifts .container::before,.inv-block-gifts .container::before{animation:none}
}`;

export const rosalila: Design = {
  slug: "rosalila",
  name: "Boda Rosalila",
  occasion: "boda",
  mood: "Blanco y lila: arco de hidrangeas, una sola ficha de ceremonia y recepción, fotos en papel rasgado",
  fontUrl: gfont(
    "family=Parisienne&family=Italiana&family=Questrial&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  variantes: { gallery: "rasgada" },
  type: {
    display: "'Italiana', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 400,
    base: 17.5,
    scale: 1.24,
    displayTracking: "0.02em",
    tracking: "0.3em",
  },
  shape: { radius: 3, radiusSm: 3, btnRadius: "pill", shadow: "none" },
  palettes: [LILA, OLIVA, AZUL, ROSA],
  padresEn: "guests",
  css,
  deco: {
    ornament: () => `<img class="rl-flor" src="${A}/flor.png" alt="">`,
  },
};
