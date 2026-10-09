/**
 * Monocromo.
 *
 * Una invitación en blanco y negro: todas las hojas del mismo papel blanco,
 * sin color en ninguna parte y con las fotos en gris. Sale de un «save the
 * date» —la firma a mano arriba, el tríptico de fotos con la fecha en
 * números grandes encima, los nombres debajo y una línea entre filetes— y lo
 * estira a la invitación entera.
 *
 * Lo que lo define son tres decisiones y conviene leerlas juntas:
 *
 * 1. **Ninguna hoja alterna.** `papel()` iguala el fondo alterno, la tarjeta
 *    y el pie al fondo principal. El resto del catálogo se apoya en la
 *    alternancia para marcar el ritmo; aquí lo marca el aire y el filete,
 *    que es lo que hace un impreso elegante.
 * 2. **Todo lo que es foto va en gris.** Es el diseño entero: una sola foto
 *    a color sería la única mancha de la invitación, así que el filtro cae
 *    sobre todas las superficies que pueden llevar imagen, no sólo sobre la
 *    galería.
 * 3. **La firma.** Allura en el antetítulo de la portada y en los nombres;
 *    todo lo demás es la serifa. Dos letras, no tres.
 *
 * No trae ningún PNG: lo decorativo son filetes y el tríptico, que es un
 * degradado de dos franjas del color del papel sobre la foto.
 */

import type { Design, Palette } from "../theme";
import { paleta } from "../paleta";
import * as deco from "../deco";
import { CORMORANT_JOST_FIRMA } from "./fuentes";

/**
 * El papel, sin alternancia.
 *
 * `paleta()` deriva el fondo alterno, la tarjeta y el pie separándolos del
 * fondo —un 7 % hacia la tinta, el pie en negro— porque es lo que hace falta
 * para que una invitación normal tenga ritmo. Aquí ese ritmo sobra: lo que
 * se pidió es que todas las hojas sean la misma hoja. Se iguala después de
 * construirla y no antes para no tocar el constructor por un solo caso: lo
 * que se deriva de los fondos —la tinta, el filete, el secundario— ya está
 * medido contra el fondo original, y éste es más claro o igual, así que
 * ningún par empeora.
 */
const papel = (p: Palette): Palette => ({
  ...p,
  bgAlt: p.bg,
  card: p.bg,
  /* El pie, en negativo: es lo único de toda la invitación que invierte el
     papel, y por eso cierra. Sin alternancia de hojas, un pie del mismo
     blanco que el resto no se lee como pie sino como una sección más que se
     quedó sin título. `paleta()` ya pone el pie en la tinta cuando la
     paleta es clara, pero cuando es oscura sólo lo oscurece un poco más;
     aquí es siempre el revés exacto del papel, también en «Negativo». */
  footerBg: p.ink,
  footerInk: p.bg,
  /* La portada y la bienvenida también: el degradado que trae la paleta está
     escrito con el fondo alterno, que aquí ya no existe. */
  heroBg: p.bg,
  splashBg: p.bg,
  heroBase: p.bg,
});

const PAPEL = papel(
  paleta({
    id: "papel", nombre: "Papel blanco",
    base: "#ffffff", tinta: "#101010", marca: "#4b4b4b", acento: "#101010", segundo: "#8e8e8e",
  })
);
const HUESO = papel(
  paleta({
    id: "hueso", nombre: "Hueso",
    base: "#faf8f4", tinta: "#1a1816", marca: "#54504a", acento: "#1a1816", segundo: "#968f84",
  })
);
const PERLA = papel(
  paleta({
    id: "perla", nombre: "Perla",
    base: "#f4f5f6", tinta: "#15171a", marca: "#4d5056", acento: "#15171a", segundo: "#8d9096",
  })
);
/* El mismo diseño con el papel en negro. No es una paleta de color: es la
   misma decisión del revés, y es la única manera de salirse del blanco sin
   dejar de ser blanco y negro. */
const NEGATIVO = papel(
  paleta({
    id: "negativo", nombre: "Negativo",
    base: "#0d0d0e", tinta: "#f5f5f4", marca: "#c6c6c3", acento: "#f5f5f4", segundo: "#8b8b88",
  })
);

const css = () => `
:root{--mo-firma:'Allura',cursive;
  /* El contraste empujado un punto: una foto de móvil pasada a gris se queda
     lavada, y en una invitación sin más color que ella eso se nota. */
  --mo-gris:grayscale(1) contrast(1.06);
  --mo-hilo:var(--border) solid var(--line)}

/* ── Todo lo que es foto, en gris ──
   La lista es larga a propósito. Basta que se escape una superficie —el
   fondo de una sección, el vídeo de un bloque, un adorno subido— para que la
   invitación deje de ser en blanco y negro justo ahí, y es el tipo de fallo
   que no se ve hasta que alguien sube esa foto concreta. \`img\` y \`video\`
   cubren de una vez los adornos, los divisores y los bloques; el resto son
   las capas que se pintan con \`background-image\`. */
img,video,.hero-bg,.gallery-ph,.inv-fondo,.inv-fondo-global,
.inv-libro-tapa,.inv-cortina{filter:var(--mo-gris)}

/* ── Letras ──
   Allura sólo donde se lee como una firma. El interlineado va holgado
   porque sus trazos suben y bajan mucho más que una serifa y, con 1, dos
   renglones de nombres se tocan. */
.hero-name,.splash-name,.footer-names{font-family:var(--mo-firma);
  font-weight:400;letter-spacing:.01em;text-transform:none}
/* En caligrafía el ampersand es parte de la firma y va en la misma línea.
   Con aire a los lados: pegado se lee "JuanEMaría". */
.hero-amp,.splash-amp,.footer-names .amp{display:inline;margin:0 .14em;
  font-size:1em;line-height:1;font-style:normal;color:inherit}

.section-label,.splash-subtitle,.hero-sub,.event-type,.guest-role,
.gifts-bank,.ring-label{font-size:10.5px;letter-spacing:.38em;padding-left:.38em;
  text-transform:uppercase}
.section-title{font-weight:300;font-size:clamp(27px,7vw,38px);letter-spacing:.04em}
.section-title::before,.section-title::after{width:min(46px,9vw)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,
.social-sub{font-size:16px;line-height:1.8}
.ornament{margin:16px auto 26px}

/* Los botones: tinta rellena y esquina recta, sin más. */
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.inv-boton,.inv-mapa-btn,
.inv-rsvp-btn{font-size:10.5px;letter-spacing:.3em;padding-left:calc(26px + .3em)}

/* ── Bienvenida ── */
#splash{background:var(--splash-bg)}
.splash-modal{background:transparent;box-shadow:none;border:var(--mo-hilo);
  padding:48px 30px}
.splash-name{font-size:clamp(44px,13vw,64px);line-height:1.2;margin:10px 0 6px}
.splash-date{letter-spacing:.3em;font-size:11px}

/* ── Portada: el tríptico ──
   Dos franjas del color del papel cruzan la foto a sangre y la parten en
   tres paneles, como el original. Es un degradado sobre la foto que ya hay
   y no tres huecos de imagen: así quien arma la invitación sube **una**
   foto, como en todos los demás diseños, y el esqueleto no cambia.

   Van en el ::before de la portada y no en el de la foto porque la foto se
   mueve: lleva paralaje —se agranda un 22 % y se desliza al bajar—, y unas
   franjas pegadas a ella se irían con el movimiento y dejarían de caer en
   los tercios. Aquí se quedan quietas, que es lo que tiene que hacer un
   tríptico.

   Quedan **debajo del velo** de la portada y encima de la foto: el velo las
   apaga hasta un gris claro, así que separan los tres paneles sin ser una
   raya blanca que le parta un nombre por la mitad al texto de encima. */
#hero::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(90deg,
    transparent 0 calc(33.333% - 5px),var(--bg) calc(33.333% - 5px) calc(33.333% + 5px),
    transparent calc(33.333% + 5px) calc(66.666% - 5px),
    var(--bg) calc(66.666% - 5px) calc(66.666% + 5px),
    transparent calc(66.666% + 5px) 100%)}
/* Sin foto no hay tríptico que dibujar: serían dos franjas de papel sobre
   el papel. */
#hero:not(.con-foto)::before{display:none}
/* El velo del slot, un punto más hondo. Encima van una caligrafía fina y
   una frase de dos renglones, y lo que basta para un título en serifa no
   basta para esos trazos: el contraste de la foto que sube el organizador
   no se puede verificar en el build, así que se asegura aquí. */
#hero.con-foto::after{background:linear-gradient(180deg,rgba(0,0,0,.26) 0%,
  rgba(0,0,0,.40) 45%,rgba(0,0,0,.66) 100%)}

/* El orden de la portada: la fecha **antes** que los nombres, que es como
   se lee el original —primero cuándo, después quiénes—. El marcado viene en
   el orden de siempre y aquí sólo se reordena, sin tocar el esqueleto: por
   eso están numerados todos, que con flex un hijo sin order vale 0 y se
   iría delante del antetítulo. */
.hero-content{display:flex;flex-direction:column;align-items:center;
  width:min(560px,100%)}
.hero-label{order:1;font-size:10.5px;letter-spacing:.38em;padding-left:.38em;
  text-transform:uppercase;opacity:.82}
.hero-date{order:2;margin-top:clamp(14px,3svh,24px);padding-top:0;border-top:0;
  font-family:var(--display);font-weight:300;
  font-size:clamp(30px,8.4vw,54px);line-height:1.08;letter-spacing:.08em;
  text-wrap:balance}
.hero-name{order:3;margin:clamp(10px,2svh,18px) 0 0;
  font-size:clamp(40px,12vw,68px);line-height:1.2}
.hero-sub{order:4;margin-top:clamp(12px,2.4svh,20px)}
.hero-nombres{order:5}
.hero-bendicion{order:6}
.hero-padres{order:7;margin-top:22px}
.hero-cierre{order:8}
.hero-parrafo{order:9}
.hero-quote{order:10;font-size:16px;max-width:30ch;
  margin-left:auto;margin-right:auto}
.hero-btn{order:11}
/* La bajada entre filetes, que es la que cierra la portada. */
.hero-sub{display:flex;align-items:center;justify-content:center;gap:16px;
  opacity:.82}
.hero-sub::before,.hero-sub::after{content:"";width:min(46px,10vw);
  height:var(--border);background:var(--hero-line)}

/* ── Secciones ──
   Sin alternancia de papel, lo que separa una sección de la siguiente es el
   aire y un filete corto. */
section + section::before{content:"";display:block;width:46px;height:var(--border);
  background:var(--line);margin:0 auto calc(var(--pad-y) * .55)}

/* La cuenta atrás tipográfica, con el número en tinta y no en marca: aquí no
   hay color de marca que lo distinga, así que lo que lo hace pieza es el
   tamaño. */
.ring-number{color:var(--ink);font-weight:300}
.countdown-ring{border-left-color:var(--line)}

/* El tríptico, aquí sí: tres retratos en fila, que es la imagen del
   original. Son tres fotos distintas y el aire entre ellas es el del papel,
   no un marco. */
.gallery-grid{gap:10px}
.gallery-item{aspect-ratio:3/4;border:var(--mo-hilo);background:transparent}
.gallery-ph{background-color:transparent}

/* ── Las fichas: un índice, no tarjetas sin caja ──
   Las fichas vienen centradas y en cuadrícula, con el icono grande encima.
   Eso funciona cuando hay una caja que las contiene; aquí no la hay —el
   papel es uno solo— y quedaban como tarjetas a las que les hubieran
   quitado el recuadro: el filete cruzando toda la columna, el icono
   flotando y el texto centrado debajo sin nada que lo sostenga.

   Así que pasan a leerse como lo que son en un impreso: una lista en una
   sola columna, cada renglón partido en dos —lo que lo identifica a la
   izquierda, lo que cuenta a la derecha— y el filete separando. */
.events-grid,.features-grid,.gifts-cards{grid-template-columns:1fr;gap:0;
  max-width:540px;margin-left:auto;margin-right:auto}
.event-card,.feature-card,.gift-card{display:grid;grid-template-columns:auto 1fr;
  column-gap:clamp(16px,4.6vw,26px);text-align:left;padding:clamp(21px,4.8vw,28px) 0}
.guest-card{padding:24px 0 6px}

/* El programa: la hora a la izquierda, en la serifa y grande, con el filete
   que la separa de lo demás. El icono sobra —es la hora la que marca cada
   momento, y dos marcas compitiendo no marcan ninguna—. */
.event-icon{display:none}
.event-time{grid-column:1;grid-row:1 / span 6;margin:0;
  padding-right:clamp(16px,4.6vw,26px);border-right:var(--mo-hilo);
  min-width:3.7em;font-family:var(--display);font-weight:300;
  font-size:clamp(23px,6.2vw,30px);line-height:1.25;letter-spacing:.04em;
  color:var(--ink);font-variant-numeric:tabular-nums}
.event-card>:not(.event-time){grid-column:2}
.event-type{margin-top:3px}
.event-title{margin-top:5px;font-weight:300;font-size:clamp(21px,5.4vw,26px)}
.event-place{margin-top:9px}
.event-note{margin-top:7px}
/* Un momento sin hora no deja una columna vacía con su filete al lado. */
.event-card:not(:has(.event-time)){grid-template-columns:1fr}

/* Información útil y mesa de regalos: el icono pequeño a la izquierda, en
   tinta, haciendo de viñeta. */
.feature-icon,.gift-icon{grid-column:1;grid-row:1 / span 4;margin-top:2px;
  font-size:21px;color:var(--ink);opacity:.72}
.feature-card>:not(.feature-icon),.gift-card>:not(.gift-icon){grid-column:2}
.feature-title,.gift-title{margin-top:0;font-weight:300;
  font-size:clamp(19px,4.8vw,22px)}
.feature-text,.gift-desc{margin-top:5px}
.feature-card:not(:has(.feature-icon)),
.gift-card:not(:has(.gift-icon)){grid-template-columns:1fr}

/* El «cómo llegar» de cada momento y el enlace de cada regalo dejan de ser
   botones en contorno: dentro de una lista eran tres recuadros compitiendo
   con el único que importa, el de confirmar. Aquí son un enlace subrayado. */
.event-map-btn,.gift-link{display:inline-block;margin-top:13px;padding:0 0 3px;
  border:0;border-bottom:var(--border) solid var(--ink);border-radius:0;
  background:transparent;color:var(--ink);font-size:10px;
  letter-spacing:.24em;padding-left:.24em}
.event-map-btn:hover,.gift-link:hover{background:transparent;color:var(--ink);
  opacity:.6}

.guest-avatar{background:transparent;border:var(--mo-hilo);color:var(--ink)}

/* Los campos del formulario sobre papel blanco: lo único que los dibuja es
   el filete de abajo, como una línea de puntos de un impreso. */
.inv-rsvp-input{background:transparent;border:0;border-bottom:var(--mo-hilo);
  border-radius:0;padding:12px 2px;text-align:center}
.inv-rsvp-input:focus{border-bottom-color:var(--accent);box-shadow:none}
.gifts-account,.inv-cuenta{border-style:solid;border-color:var(--line)}

/* El pie en negativo. El filete que separa las secciones no hace falta
   aquí: lo que separa el pie del resto es el cambio de papel. */
.footer-names{font-size:clamp(34px,10vw,48px);line-height:1.2}

/* El calendario, cuando se agrega: el día marcado en tinta y no en color. */
.inv-cal-sem{color:var(--ink);opacity:.55}
.inv-cal-tarjeta,.inv-cal-hoja{box-shadow:none;border:var(--mo-hilo)}`;

export const monocromo: Design = {
  slug: "monocromo",
  name: "Monocromo",
  occasion: "boda",
  mood: "Blanco y negro: todas las hojas en papel blanco, las fotos en gris y una firma a mano",
  fontUrl: CORMORANT_JOST_FIRMA.url,
  layout: {
    hero: "minimal",
    head: "rule",
    cards: "rule",
    countdown: "type",
    gallery: "grid",
    divider: "none",
  },
  type: {
    ...CORMORANT_JOST_FIRMA,
    scale: 1.3,
    displayWeight: 300,
    displayTracking: "0.03em",
    tracking: "0.38em",
  },
  shape: { radius: 0, radiusSm: 0, btnRadius: 0, border: 1, shadow: "none" },
  density: "airy",
  palettes: [PAPEL, HUESO, PERLA, NEGATIVO],
  deco: { ornament: deco.filete },
  css,
};
