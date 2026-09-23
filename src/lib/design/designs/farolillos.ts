/**
 * Quince Farolillos: la noche de los farolillos, hecha diseño.
 *
 * Sale de una invitación hecha a mano (un HTML suelto con adornos pintados
 * con Grok) y la pasa al sistema, para que sea editable como las otras 50:
 * mismos campos, mismos bloques, paletas elegibles. Lo que la hace ella va
 * todo aquí, en CSS y en cuatro piezas de adorno:
 *
 * · La portada es una ilustración (la torre y el lago), con farolillos que
 *   suben por el cielo y un degradado a la noche donde se apoya el nombre.
 * · Las secciones alternan papel y noche. La noche es el color del pie de la
 *   paleta, así que al cambiar de paleta la noche cambia con ella y nunca
 *   queda un bloque de otro color suelto.
 * · Lo pintado va sobre el papel (las esquinas de acuarela, la guirnalda) y
 *   lo que brilla sobre la noche (el sol, los farolillos). Es lo que decidió
 *   cada adorno al pintarse, y cambiarlo de fondo se nota.
 *
 * Todas las imágenes están en `public/disenos/farolillos/`. Se sirven desde
 * la propia app y no desde la biblioteca: son del diseño, no de una
 * invitación, y borrarlas de la biblioteca no puede romper el diseño.
 *
 * ── Por qué CSS con variables y nada de colores escritos ─────────
 *
 * La paleta la cambia el renderer sustituyendo las variables de `:root`, sin
 * volver a generar este CSS. Un color escrito aquí se quedaría igual al
 * cambiar de paleta, así que todo sale de `var(--…)`. Las únicas cifras de
 * color son blancos y el brillo de los farolillos, que no dependen de la
 * paleta: son luz.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/farolillos";

/* ── Paletas ────────────────────────────────────────────────────
   Las cuatro con el oro como segundo color: el oro es el de los farolillos,
   y los farolillos no cambian de color con la paleta. La marca es la del
   papel (antetítulos, horas), y el acento, el de los botones. */

const FAROLILLOS = paleta({
  id: "farolillos", nombre: "Lavanda y oro",
  base: "#f7f1e8", tinta: "#241838", marca: "#7a5fb0", acento: "#d9b26a", segundo: "#d9b26a",
});
const ROSA_ORO = paleta({
  id: "rosa-oro", nombre: "Rosa y oro",
  base: "#fbf3f2", tinta: "#34192a", marca: "#a4566a", acento: "#d9b26a", segundo: "#d9b26a",
});
const CELESTE_ORO = paleta({
  id: "celeste-oro", nombre: "Celeste y oro",
  base: "#f3f6fa", tinta: "#16223d", marca: "#4d6fa0", acento: "#d9b26a", segundo: "#d9b26a",
});
const VERDE_ORO = paleta({
  id: "verde-oro", nombre: "Verde y oro",
  base: "#f5f7f0", tinta: "#1c2a20", marca: "#4f7a55", acento: "#d9b26a", segundo: "#d9b26a",
});

/* ── El cielo ───────────────────────────────────────────────────
   El mismo PNG repetido con tamaño, sitio y ritmo distintos. Los números
   salen de una semilla y no de Math.random: el diseño se hornea una vez, y
   con azar cada build movería los farolillos y ensuciaría el diff. */

function azar(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function cielo(clase: string, n: number, bordes: boolean): string {
  const piezas: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = bordes ? 20 + azar(i, 1) * 14 : 22 + azar(i, 1) * 38;
    const x = bordes ? (i % 2 ? azar(i, 2) * 4 : 88 + azar(i, 2) * 5) : azar(i, 2) * 92;
    const d = 12 + azar(i, 3) * 12;
    const r = azar(i, 4) * 20;
    const deriva = azar(i, 5) * 60 - 30;
    piezas.push(
      `<img src="${A}/farolillo.png" alt="" style="left:${x.toFixed(1)}%;` +
        `--t:${t.toFixed(0)}px;--d:${d.toFixed(1)}s;--r:-${r.toFixed(1)}s;` +
        `--x:${deriva.toFixed(0)}px${t < 30 ? ";--b:.6px" : ""}">`
    );
  }
  return `<div class="far-cielo ${clase}" aria-hidden="true">${piezas.join("")}</div>`;
}

/* ── La hoja ────────────────────────────────────────────────── */

const css = () => `
/* Las letras de la invitación original: Great Vibes para los nombres y los
   títulos, Cinzel para los antetítulos y los botones, y Cormorant para leer. */
:root{--far-cinzel:'Cinzel',Georgia,serif;
  --far-noche:var(--footer-bg);--far-noche-ink:var(--footer-ink);
  --far-oro:var(--brand-2);
  --far-oro-claro:color-mix(in srgb,var(--brand-2) 55%,#fff)}
body{background:var(--bg)}

.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,
.ring-label,.footer-copy{font-family:var(--far-cinzel)}
.section-label{font-size:13px;letter-spacing:.34em;padding-left:.34em}
.section-title{font-weight:400;font-size:clamp(46px,13vw,64px);line-height:1.05;
  letter-spacing:0;color:var(--ink)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,
.social-sub{font-size:19px;line-height:1.6}

/* ── El adorno bajo cada título ──
   Dos imágenes, y cada sección enseña la suya: la guirnalda pintada sobre
   el papel, el sol dorado sobre la noche. */
.ornament{margin:6px auto 22px}
.far-orn{display:block;margin:0 auto;pointer-events:none}
.far-orn-papel{width:min(78%,300px)}
.far-orn-noche{display:none;width:58px;filter:drop-shadow(0 0 14px rgba(241,217,160,.55))}
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts) .far-orn-papel{display:none}
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts) .far-orn-noche{display:block}

/* ── Los farolillos ── */
.far-cielo{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.far-cielo img{position:absolute;bottom:-120px;width:var(--t,46px);opacity:0;
  filter:drop-shadow(0 0 12px rgba(241,217,160,.6)) blur(var(--b,0));
  animation:farSube var(--d,16s) linear var(--r,0s) infinite}
/* En la portada el cielo acaba donde empieza el texto: un farolillo pasando
   por detrás del nombre lo tapa justo cuando se lee. */
#hero .far-cielo,#splash .far-cielo{bottom:62%;
  -webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}
#hero .far-cielo img,#splash .far-cielo img{bottom:-60px}
@keyframes farSube{
  0%{transform:translate(0,0) rotate(-3deg);opacity:0}
  10%{opacity:.95}
  50%{transform:translate(var(--x,20px),-60vh) rotate(3deg)}
  85%{opacity:.85}
  100%{transform:translate(calc(var(--x,20px) * -.5),-120vh) rotate(-2deg);opacity:0}}
@keyframes farGira{to{transform:rotate(360deg)}}

/* ── Bienvenida ── */
#splash{background:var(--far-noche) url(${A}/portada.jpg) center 30%/cover no-repeat}
#splash::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,transparent 40%,
    color-mix(in srgb,var(--far-noche) 70%,transparent) 100%)}
.splash-modal{background:color-mix(in srgb,var(--far-noche) 58%,transparent);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  border:1px solid color-mix(in srgb,var(--far-oro) 40%,transparent);
  box-shadow:0 30px 60px -30px rgba(0,0,0,.6);color:#fff}
.splash-modal::before{content:"";display:block;width:62px;height:62px;margin:0 auto 10px;
  background:url(${A}/sol.png) center/contain no-repeat;
  filter:drop-shadow(0 0 16px rgba(241,217,160,.55));animation:farGira 60s linear infinite}
.splash-subtitle{color:var(--far-oro-claro);font-size:12px;letter-spacing:.4em}
.splash-name{color:#fff;font-size:clamp(64px,19vw,96px);font-weight:400;
  text-shadow:0 0 28px rgba(241,217,160,.45)}
.splash-date{color:rgba(255,255,255,.82);font-family:var(--far-cinzel);letter-spacing:.24em}
.splash-btn{border-color:color-mix(in srgb,var(--far-oro) 70%,transparent);color:#fff}

/* ── Portada ──
   La ilustración por defecto va en .hero-bg: si se sube otra foto, el
   renderer la pone en línea y gana sin tocar nada de aquí. */
#hero{place-items:end center;padding:0 24px calc(64px + env(safe-area-inset-bottom));
  background:var(--far-noche);
  --hero-ink:#fff;--hero-ink-soft:rgba(255,255,255,.86);--hero-line:rgba(255,255,255,.32);
  --hero-brand:var(--far-oro-claro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;
  pointer-events:none;background:linear-gradient(to bottom,transparent 35%,
    color-mix(in srgb,var(--far-noche) 55%,transparent) 62%,var(--far-noche) 96%)}
/* Un halo de noche detrás del texto y no un panel: la ilustración sigue
   entera, pero lo que pasa detrás de las letras —la torre, algún farolillo
   pintado— baja de tono lo justo para que se lean. */
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--far-noche) 52%,transparent),
    transparent) center/130% 115% no-repeat}
.hero-content::before{content:"";display:block;width:74px;height:74px;margin:0 auto 12px;
  background:url(${A}/sol.png) center/contain no-repeat;
  filter:drop-shadow(0 0 18px rgba(241,217,160,.55));animation:farGira 60s linear infinite}
.hero-label{font-size:14px;letter-spacing:.5em;padding-left:.5em;margin-bottom:0;
  text-shadow:0 1px 14px rgba(0,0,0,.55)}
/* La S de Great Vibes sube muy por encima de su renglón: sin este aire
   tapa el antetítulo. */
.hero-name{padding-top:.22em}
.hero-name{font-weight:400;font-size:clamp(72px,22vw,118px);line-height:1.1;margin:18px 0 6px;
  text-shadow:0 0 28px rgba(241,217,160,.45)}
.hero-sub{font-family:var(--far-cinzel);letter-spacing:.28em}
.hero-date{border-top:0;padding-top:0;margin-top:8px;font-family:var(--far-cinzel);
  font-size:14px;letter-spacing:.28em}
.hero-quote{font-size:21px;line-height:1.45;max-width:28ch;margin:16px auto 0}
.hero-parrafo{font-size:17px;max-width:34ch;margin-inline:auto}
.hero-scroll{color:var(--far-oro-claro)}

/* ── Papel ──
   Las secciones claras, con las esquinas de acuarela en el margen y no
   debajo del texto: un párrafo sobre una acuarela no se lee, se adivina. */
section{padding:96px 26px}
section.alt{background:linear-gradient(var(--bg-alt),var(--bg))}
#guests,#confirmation{padding-top:150px}
#guests{padding-bottom:120px;background:linear-gradient(var(--bg-alt),var(--bg))}
#confirmation{padding-bottom:150px;background:linear-gradient(var(--bg-alt),var(--bg))}
#gallery{background:var(--bg)}
#gallery{padding-top:140px}

/* ── Noche ──
   La cuenta atrás y los regalos van de noche, como el pie. */
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts){background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--far-noche) 78%,var(--brand)),var(--far-noche));
  color:var(--far-noche-ink)}
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts) .container{position:relative;z-index:2}
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts) .section-label{color:var(--far-oro)}
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts) .section-title{color:#fff}
:is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts) :is(.section-body,.gifts-text,.gifts-note){
  color:color-mix(in srgb,var(--far-noche-ink) 86%,transparent);
  max-width:300px;margin-inline:auto}
/* El sol detrás de la cuenta atrás, girando muy despacio. */
#countdown::before{content:"";position:absolute;left:50%;top:50%;z-index:0;
  width:min(130vw,640px);aspect-ratio:1;translate:-50% -50%;opacity:.11;
  background:url(${A}/sol.png) center/contain no-repeat;
  animation:farGira 180s linear infinite;pointer-events:none}
.countdown-grid{max-width:420px;margin:26px auto 0;gap:10px}
.countdown-ring{border:1px solid color-mix(in srgb,var(--far-oro) 45%,transparent);
  border-radius:14px;background:rgba(255,255,255,.04)}
.ring-number{font-family:var(--far-cinzel);font-weight:400;color:var(--far-oro-claro)}
/* Las variantes de cuenta atrás pintan sus números con la tinta de la
   paleta, que en la noche es oscuro sobre oscuro. */
:is(#countdown,.inv-block-countdown) :is([data-cd],.ring-number){color:var(--far-oro-claro)}
:is(#countdown,.inv-block-countdown) :is(.ring-label,.countdown-ring){
  color:color-mix(in srgb,var(--far-noche-ink) 80%,transparent)}
.ring-label{font-size:10px;letter-spacing:.2em;
  color:color-mix(in srgb,var(--far-noche-ink) 75%,transparent)}
/* Dos farolillos subiendo por los márgenes de los regalos. */
#gifts::before,#gifts::after{content:"";position:absolute;bottom:-90px;z-index:1;
  width:30px;height:34px;pointer-events:none;opacity:0;
  background:url(${A}/farolillo.png) center/contain no-repeat;
  filter:drop-shadow(0 0 10px rgba(241,217,160,.6));
  animation:farSube 17s linear infinite}
#gifts::before{left:3%}
#gifts::after{right:4%;width:24px;animation-duration:21s;animation-delay:-8s}
#gifts .container::before{content:"";display:block;width:84px;height:95px;margin:0 auto 6px;
  background:url(${A}/farolillo.png) center/contain no-repeat;
  filter:drop-shadow(0 0 14px rgba(241,217,160,.5))}
.gifts-account{background:rgba(255,255,255,.05);border-color:var(--far-oro)}
.gifts-bank{color:var(--far-oro)}

/* ── El itinerario: una línea de tiempo, no tarjetas ──
   La hora a la izquierda y el momento a la derecha, cosidos por un filete de
   oro. Sólo en la variante de siempre: las variantes de bloque traen su
   propio marcado y se estilan solas. */
#events .events-grid{display:block;position:relative;max-width:460px;
  margin:12px auto 0;text-align:left}
#events .events-grid::before{content:"";position:absolute;left:88px;top:8px;bottom:8px;
  width:1px;background:linear-gradient(transparent,var(--far-oro),transparent)}
#events .event-card{display:grid;grid-template-columns:72px 1fr;column-gap:32px;
  padding:12px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:left}
#events .event-card:hover{transform:none}
#events .event-card>*{grid-column:2;margin:0}
#events .event-time{grid-column:1;grid-row:1/span 7;align-self:start;padding-top:4px;
  text-align:right;font-family:var(--far-cinzel);font-weight:400;font-size:14px;
  line-height:1.3;color:var(--brand)}
#events .event-icon{display:none}
#events .event-type{font-family:var(--sans);font-size:22px;font-weight:500;
  letter-spacing:0;text-transform:none;color:var(--ink)}
#events .event-title{font-family:var(--sans);font-size:17px;font-weight:400;color:var(--muted)}
#events .event-place{margin-top:4px}
#events .event-map-btn{justify-self:start;margin-top:10px}

/* ── Las fichas de información: un ramillete encima de cada una ──
   Salvo si la ficha lleva su propia imagen de fondo: esa usa el ::before
   para su velo, y ahí manda la imagen que se eligió. */
.features-grid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));max-width:520px;
  margin-inline:auto}
.feature-card{background:color-mix(in srgb,var(--card) 72%,transparent);
  border:1px solid color-mix(in srgb,var(--brand) 22%,transparent);border-radius:18px;
  padding:20px 14px 18px;box-shadow:0 14px 30px -22px color-mix(in srgb,var(--ink) 45%,transparent)}
.feature-card:not(.inv-ficha-fondo)::before{content:"";display:block;height:78px;
  margin:0 auto 8px;background:url(${A}/ramillete.png) center/contain no-repeat}
.feature-card:not(.inv-ficha-fondo):nth-child(even)::before{
  background-image:url(${A}/ramillete-der.png)}
.feature-card:not(.inv-ficha-fondo) .feature-icon{display:none}
.feature-title{font-family:var(--far-cinzel);font-weight:600;font-size:14px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--brand)}
.feature-text{font-size:17px;color:var(--ink)}

/* ── Botones: oro con brillo ── */
/* También el del formulario de confirmación, que es un componente de la app
   y no del diseño: sin esto sería el único botón liso de la invitación. */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no){
  background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 62%,#f1d9a0),var(--accent));
  color:var(--on-accent);border:0;font-size:13px;letter-spacing:.2em;
  box-shadow:0 10px 24px -12px var(--accent)}

/* ── Pie ── */
footer{padding:80px 24px calc(64px + env(safe-area-inset-bottom));background:var(--far-noche)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:64px;height:64px;margin:0 auto 10px;
  background:url(${A}/sol.png) center/contain no-repeat;
  filter:drop-shadow(0 0 16px rgba(241,217,160,.5));animation:farGira 60s linear infinite}
.footer-names{font-size:64px;color:#fff}
.footer-date{font-family:var(--far-cinzel);letter-spacing:.24em}
.footer-copy{letter-spacing:.3em;opacity:.8}

@media (prefers-reduced-motion:reduce){
  .far-cielo{display:none}
  #gifts::before,#gifts::after{display:none}
  .hero-content::before,.splash-modal::before,footer .container::before,
  #countdown::before{animation:none}
}`;

export const farolillos: Design = {
  slug: "15-farolillos",
  name: "Quince Farolillos",
  occasion: "quince",
  mood: "Cuento de noche: farolillos que suben, acuarelas y secciones de papel y noche",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Great+Vibes"
  ),
  layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "grid", divider: "none" },
  type: {
    display: "'Great Vibes', cursive",
    body: "'Cormorant Garamond', Georgia, serif",
    displayWeight: 400,
    base: 18,
    scale: 1.26,
    displayTracking: "0",
    tracking: "0.3em",
  },
  shape: { radius: 18, radiusSm: 14, btnRadius: "pill", shadow: "none" },
  palettes: [FAROLILLOS, ROSA_ORO, CELESTE_ORO, VERDE_ORO],
  css,
  /*
   * Los adornos que trae puestos.
   *
   * Entran en los datos al crear la invitación, así que se mueven, se
   * encogen o se borran desde el editor. Antes eran capas de `background`
   * en el CSS de la sección y no había manera de tocarlos.
   */
  adornos: [
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 40 },
    { seccion: "guests", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 40 },
    { seccion: "confirm", url: `${A}/esquina-abajo.png`, sitio: "abajo-der", tamano: 40 },
    { seccion: "gallery", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 34 },
  ],
  deco: {
    splash: () => cielo("far-cielo-velo", 12, false),
    hero: () => cielo("far-cielo-portada", 14, false),
    ornament: () =>
      `<img class="far-orn far-orn-papel" src="${A}/guirnalda.png" alt="">` +
      `<img class="far-orn far-orn-noche" src="${A}/sol.png" alt="">`,
    footer: () => cielo("far-cielo-pie", 8, true),
  },
};
