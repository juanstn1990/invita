/**
 * Boda Otoño.
 *
 * Terracota, beige y un ramo de rosas y trigo seco que preside cada esquina
 * de la invitación — la misma pieza, repetida y volteada, nunca una nueva
 * por sección. El sobre de lino se abre para revelar la portada; el programa
 * va en dos fichas (ceremonia y recepción) y la cuenta atrás y los regalos
 * caen en la noche de otoño, un marrón hondo y no un negro de siempre.
 *
 * Sale de una invitación de referencia (boda «Angel & Paola», tonos
 * terracota/beige/blanco) hecha en otra plataforma: se recreó la
 * combinación de secciones y el ánimo del papel, con arte propio generado
 * con Grok — nunca el archivo original.
 *
 * Adaptaciones a nuestra arquitectura, a propósito:
 * · La referencia ofrece confirmar por WhatsApp *o* por formulario a la vez;
 *   aquí `confirm.mode` es uno solo, así que el formulario (el más completo)
 *   es el que trae por defecto — quien organice puede cambiarlo a WhatsApp
 *   si quiere.
 * · El sello del sobre es el de siempre (`.inv-sobre-sello`, coloreado con
 *   el acento): no se generó uno propio para no repetir lo que ya hace la
 *   pieza de las esquinas.
 * · Vestimenta, colores reservados y regalo son las tres tarjetas del
 *   bloque «Información útil» (`features`), que ya trae exactamente esa
 *   forma — icono, título y texto — en vez de inventar una sección nueva.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/otono";

const OTONO = paleta({
  id: "otono", nombre: "Terracota y beige",
  base: "#f7ecdc", tinta: "#3b2a1d", marca: "#a8562f", acento: "#a8562f", segundo: "#c99a55",
});
const VINO = paleta({
  id: "vino-mostaza", nombre: "Vino y mostaza",
  base: "#f7ece1", tinta: "#332022", marca: "#7c3230", acento: "#7c3230", segundo: "#c08a2e",
});
const OLIVA = paleta({
  id: "oliva-cobre", nombre: "Oliva y cobre",
  base: "#f5f1e2", tinta: "#2b2e1f", marca: "#5f6b3a", acento: "#5f6b3a", segundo: "#b5652f",
});
const NOCHE_OTONO = paleta({
  id: "noche-otono", nombre: "Noche de otoño",
  base: "#251a11", tinta: "#f4e8d6", marca: "#dba360", acento: "#dba360", segundo: "#c98a52",
});

/* Las secciones de noche: la cuenta atrás, los regalos y la ubicación. */
const NOCHE =
  ":is(#countdown,#gifts,.inv-block-countdown,.inv-block-gifts,.inv-block-ubicacion)";

const css = () => `
:root{--ot-caps:'Cinzel',Georgia,serif;--ot-display:'Playfair Display',Georgia,serif;
  --ot-noche:var(--footer-bg);--ot-noche-ink:var(--footer-ink);
  --ot-oro:var(--brand-2);--ot-oro-claro:color-mix(in srgb,var(--brand-2) 55%,#fff)}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,
.ring-label,.footer-copy,.feature-title,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{
  font-family:var(--ot-caps)}
.section-label{font-size:12.5px;letter-spacing:.36em;padding-left:.36em;color:var(--brand)}
.section-title{font-family:var(--ot-display);font-style:italic;font-weight:400;
  font-size:clamp(38px,10.5vw,52px);line-height:1.15}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{
  font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names,.inv-sobre-nombre{
  font-family:var(--ot-display);font-style:italic;font-weight:400;color:var(--brand)}
.hero-amp,.splash-amp,.footer-names .amp{display:block;font-size:.4em;line-height:1.3;
  color:var(--ot-oro-claro);font-style:normal}

.ornament{margin:2px auto 22px}

/* ── Bienvenida: el sobre de lino terracota ── */
#splash{background:radial-gradient(120% 80% at 50% 25%,var(--bg),var(--bg-alt))}
.splash-subtitle{color:var(--brand);letter-spacing:.32em}
.splash-name{font-size:clamp(46px,14vw,68px);line-height:1.1}
.splash-date{font-family:var(--ot-caps);letter-spacing:.22em;color:var(--muted)}
#splash .inv-sobre-cuerpo{background:color-mix(in srgb,var(--bg) 88%,var(--brand-2));
  box-shadow:0 30px 70px -22px rgba(50,30,15,.45),
    inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 34%,transparent)}
#splash .inv-sobre-bolsillo::before,#splash .inv-sobre-bolsillo::after{
  background:color-mix(in srgb,var(--bg) 78%,var(--brand-2))}
#splash .inv-sobre-nombre{font-size:clamp(32px,9.6vw,42px)}
#splash .inv-sobre-pista{color:var(--brand);opacity:.85}
#splash .inv-sobre-sello{background:var(--brand-2);box-shadow:0 4px 10px rgba(50,30,15,.4)}

/* ── Portada ── */
#hero{background:linear-gradient(var(--bg),var(--bg-alt))}
.hero-label{color:var(--brand)}
.hero-name{font-size:clamp(52px,15vw,84px);line-height:1.1;margin:4px 0 0}
.hero-quote{font-style:italic;font-size:19px;line-height:1.55;max-width:30ch;margin:14px auto 0;
  color:var(--ink)}
.hero-date{font-family:var(--ot-caps);letter-spacing:.24em;font-size:12.5px}

/* ── Los padres, bajados a invitados ── */
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:26px auto 0;
  padding:18px 8px;border-radius:16px;background:var(--card);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 30%,transparent)}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{
  border-left:1px solid color-mix(in srgb,var(--brand-2) 40%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--ot-caps);font-size:10.5px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--brand);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:16px;line-height:1.55;
  color:var(--ink);white-space:pre-line}

/* ── Las tarjetas de información útil: vestimenta, colores, regalo ── */
#features .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
  max-width:520px;margin-inline:auto}
#features .feature-card{padding:20px 10px;background:var(--card);border:0;border-radius:14px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 26%,transparent);text-align:center}
.feature-icon{color:var(--brand);font-size:26px}
.feature-title{font-weight:400;font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--brand);margin-top:8px}
.feature-text{font-size:14.5px;line-height:1.5}
@media (max-width:430px){#features .features-grid{grid-template-columns:1fr 1fr}
  #features .feature-card:last-child:nth-child(odd){grid-column:1/-1}}

/* ── El programa: dos fichas, ceremonia y recepción ── */
#events .events-grid{display:grid;gap:16px;max-width:440px;margin:18px auto 0}
#events .event-card{background:var(--card);border:0;border-radius:16px;padding:22px 20px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand-2) 26%,transparent);text-align:left}
#events .event-icon{color:var(--brand);font-size:24px}
#events .event-type{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
#events .event-title{font-family:var(--ot-display);font-style:italic;font-weight:400;
  font-size:25px;color:var(--ink);margin-top:2px}
#events .event-time{font-family:var(--ot-caps);font-size:13px;letter-spacing:.16em;color:var(--brand)}
#events .event-place{margin-top:6px;font-size:15.5px}
#events .event-map-btn{margin-top:10px}

/* ── La noche de otoño: cuenta atrás, regalos, ubicación ── */
${NOCHE}{background:radial-gradient(120% 90% at 50% 0%,
  color-mix(in srgb,var(--ot-noche) 82%,var(--brand-2)),var(--ot-noche));color:var(--ot-noche-ink)}
${NOCHE} .container{position:relative;z-index:2}
${NOCHE} .section-label{color:var(--ot-oro-claro)}
${NOCHE} .section-title{color:#f4e8d6}
${NOCHE} :is(.section-body,.gifts-text,.gifts-note,.inv-mapa-dir){
  color:color-mix(in srgb,var(--ot-noche-ink) 82%,transparent)}
${NOCHE} :is([data-cd],.ring-number){color:var(--ot-oro-claro)}
${NOCHE} .ring-label{color:color-mix(in srgb,var(--ot-noche-ink) 70%,transparent)}
${NOCHE} .gifts-account{background:rgba(255,255,255,.06);
  border:1px solid color-mix(in srgb,var(--ot-oro-claro) 40%,transparent);border-radius:14px}
${NOCHE} .gifts-bank{color:var(--ot-oro-claro)}
${NOCHE} :is(.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no)){background:var(--ot-oro-claro);color:var(--ot-noche)}

/* ── Botones: terracota macizo, en píldora ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no){
  border:0;background:var(--accent);color:var(--on-accent);font-size:12px;letter-spacing:.2em;
  box-shadow:0 12px 24px -14px color-mix(in srgb,var(--accent) 90%,#000);
  transition:filter .3s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{filter:brightness(.92)}

/* ── Pie ── */
footer{background:var(--ot-noche);color:var(--ot-noche-ink)}
.footer-names{font-size:44px;line-height:1.1;padding:34px 0 30px;color:var(--ot-oro-claro)}
.footer-date{font-family:var(--ot-caps);letter-spacing:.24em;margin-top:8px}
.footer-copy{letter-spacing:.3em;color:var(--ot-oro-claro);opacity:.9}`;

export const otono: Design = {
  slug: "otono",
  name: "Boda Otoño",
  occasion: "boda",
  mood: "Terracota, beige y rosas de otoño: sobre de lino, ramo de esquina en toda la invitación",
  fontUrl: gfont(
    "family=Cinzel:wght@400;600&family=Playfair+Display:ital,wght@0,400;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400"
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
  shape: { radius: 16, radiusSm: 12, btnRadius: "pill", shadow: "none" },
  palettes: [OTONO, VINO, OLIVA, NOCHE_OTONO],
  padresEn: "guests",
  css,
  /*
   * Los adornos: una sola pieza —el ramo de rosas de otoño y trigo—, repetida
   * y volteada con `espejo`/`giro` en vez de generar una nueva por esquina.
   * Es lo que pidió quien organiza: "deben ser los mismos".
   */
  adornos: [
    { seccion: "splash", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 34, espejo: "h" },
    { seccion: "hero", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 36, espejo: "h" },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 22 },
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 30, giro: 180 },
    { seccion: "events", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
    { seccion: "features", url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 18, espejo: "h" },
    { seccion: "confirm", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 30, giro: 180 },
    { seccion: "gifts", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 28 },
    { seccion: "footer", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 40 },
    { seccion: "footer", url: `${A}/esquina.png`, sitio: "abajo-der", tamano: 36, giro: 180 },
  ],
};
