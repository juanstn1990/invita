/**
 * Quinceañera Hollywood.
 *
 * Negro, oro y alfombra roja: la noche del estreno. La marquesina de
 * bombillas, los focos, la estrella del paseo de la fama, las palomitas y
 * el boleto dorado.
 *
 * Sale del HTML «Hollywood» hecho a mano, con adornos de Grok recortados a
 * PNG. Tres componentes nacieron aquí y sirven en cualquier diseño: la
 * apertura «claqueta» —¡acción!—, la cuenta atrás «marquesina», con las
 * bombillas corriendo por el marco, y el programa «cinta», una tira de
 * película con una escena por momento. El diseño trae puestos la cuenta
 * atrás y el programa (`variantes`); la apertura se elige en la invitación.
 *
 * No es Noche Carmesí con otro nombre: allí el rojo es el tema y el oro el
 * acento; aquí el negro es la sala de cine y el rojo es sólo la alfombra,
 * que asoma en dos secciones.
 */

import type { Design } from "../theme";
import { gfont } from "../theme";
import { paleta } from "../paleta";

const A = "/disenos/hollywood";

const ESTRENO = paleta({
  id: "estreno", nombre: "Negro, oro y alfombra roja",
  base: "#0d0b09", tinta: "#f6efe2", marca: "#d4af5a", acento: "#d4af5a", segundo: "#9d1627",
});
const PLATA = paleta({
  id: "plata-estreno", nombre: "Negro y plata",
  base: "#0c0c10", tinta: "#f1f1f5", marca: "#cfd3dc", acento: "#cfd3dc", segundo: "#5a2334",
});
const GLAM = paleta({
  id: "glam", nombre: "Rosa glam",
  base: "#120a0d", tinta: "#fbeef1", marca: "#f0a8c0", acento: "#e8c07a", segundo: "#8e2350",
});
const ESMERALDA = paleta({
  id: "esmeralda-estreno", nombre: "Esmeralda y oro",
  base: "#07110e", tinta: "#eef5f1", marca: "#d4af5a", acento: "#d4af5a", segundo: "#17553f",
});

/* Las dos secciones de alfombra roja. */
const ALFOMBRA = ":is(#countdown,#features,.inv-block-countdown,.inv-block-features)";

const css = () => `
:root{--hw-caps:'Josefin Sans',Arial,sans-serif;--hw-titulo:'Limelight',Georgia,serif;
  --hw-script:'Alex Brush',cursive;
  --hw-oro:var(--accent);--hw-oro-claro:color-mix(in srgb,var(--accent) 55%,#fff);
  --hw-oro-hondo:color-mix(in srgb,var(--accent) 60%,#000);
  --hw-lamina:linear-gradient(100deg,var(--hw-oro-hondo) 0%,var(--accent) 22%,color-mix(in srgb,var(--accent) 15%,#fff) 44%,
    var(--hw-oro-claro) 58%,var(--accent) 74%,var(--hw-oro-hondo) 92%,var(--accent) 100%);
  --hw-sala:color-mix(in srgb,var(--bg) 90%,var(--ink))}
body{background:var(--bg)}

/* ── Letras ── */
.section-label,.hero-label,.splash-subtitle,.event-type,.gifts-bank,.ring-label,
.hero-btn,.splash-btn,.confirm-btn,.gifts-btn,.event-map-btn,.social-ig,.footer-copy,.feature-title,
.inv-mapa-btn,.inv-rsvp-btn,.inv-rsvp-lab,.inv-sobre-pista{font-family:var(--hw-caps);font-weight:600}
.section-label{font-size:12px;letter-spacing:.34em;padding-left:.34em;color:var(--hw-oro)}
.section-title{font-family:var(--hw-titulo);font-weight:400;font-size:clamp(34px,9.6vw,48px);line-height:1.12;
  color:var(--hw-oro-claro);text-shadow:0 0 18px color-mix(in srgb,var(--accent) 35%,transparent)}
.section-body,.guests-text,.confirmation-text,.gifts-text,.gallery-text,.social-sub{font-size:19px;line-height:1.65}
.hero-name,.splash-name,.footer-names{font-family:var(--hw-script);font-weight:400;padding:.12em .08em 0;
  background:var(--hw-lamina);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:hwBrillo 7s ease-in-out infinite}
@keyframes hwBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes hwGira{0%,100%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.06)}}
.ring-number,.event-time{font-family:var(--hw-titulo)}

.ornament{margin:8px auto 24px}
.hw-divisor{display:block;width:min(76%,300px);margin:0 auto;pointer-events:none}

/* ── Bienvenida: la sala a oscuras ── */
#splash{background:radial-gradient(80% 55% at 50% 45%,color-mix(in srgb,var(--bg) 80%,var(--accent)),var(--bg))}
.splash-modal{background:transparent;box-shadow:none;color:var(--ink)}
.splash-name{font-size:clamp(80px,25vw,124px);line-height:1}
.splash-subtitle{color:var(--hw-oro);letter-spacing:.34em}
.splash-date{font-family:var(--hw-caps);font-weight:600;letter-spacing:.3em;color:var(--hw-oro)}
/* Con la claqueta, el nombre baja para dejarle sitio arriba. */
#splash.inv-velo-claqueta .splash-modal{margin-top:18vh}

/* ── Portada: el estreno ── */
#hero{place-items:end center;padding:0 24px calc(56px + env(safe-area-inset-bottom));background:var(--bg);
  --hero-ink:var(--ink);--hero-ink-soft:color-mix(in srgb,var(--ink) 80%,transparent);
  --hero-line:color-mix(in srgb,var(--ink) 30%,transparent);--hero-brand:var(--hw-oro)}
.hero-bg{background-image:url(${A}/portada.jpg);background-position:center 30%}
#hero::after,#hero.con-foto::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.1),transparent 30%,color-mix(in srgb,var(--bg) 55%,transparent) 60%,var(--bg) 97%)}
.hero-content{box-shadow:none;width:min(560px,100%);padding:0;background:none}
.hero-content::before{content:"";display:block;width:min(22vw,90px);aspect-ratio:1;margin:0 auto 4px;
  background:url(${A}/estrella.png) center/contain no-repeat;animation:hwGira 7s ease-in-out infinite;
  filter:drop-shadow(0 0 18px color-mix(in srgb,var(--accent) 60%,transparent))}
.hero-label{font-size:12.5px;letter-spacing:.42em;padding-left:.42em;margin:0;color:var(--hw-oro)}
.hero-name{font-size:clamp(100px,31vw,156px);line-height:1;margin:0;filter:drop-shadow(0 2px 12px rgba(0,0,0,.6))}
.hero-date{border-top:0;padding-top:0;margin-top:0;font-family:var(--hw-titulo);font-size:15px;letter-spacing:.2em}
.hero-quote{font-size:20px;line-height:1.45;max-width:28ch;margin:12px auto 0}
.hero-scroll{color:var(--hw-oro)}

/* ── La sala ── */
section{padding:96px 26px;background:radial-gradient(120% 80% at 50% 0%,var(--hw-sala),var(--bg))}
section.alt{background:radial-gradient(120% 80% at 50% 0%,var(--hw-sala),var(--bg))}
section .container{position:relative;z-index:2}
#guests{padding-bottom:124px;background:radial-gradient(120% 80% at 50% 0%,var(--hw-sala),var(--bg))}
#guests::after{content:"";position:absolute;right:8px;bottom:8px;width:min(30vw,150px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#guests .container::before{content:"";display:block;width:min(70vw,290px);aspect-ratio:1.9;margin:0 auto 12px;
  background:url(${A}/boleto.png) center/contain no-repeat;rotate:-4deg;filter:drop-shadow(0 12px 22px rgba(0,0,0,.6))}
#guests [data-inv="guests.text"]{font-style:italic;font-size:clamp(22px,6vw,27px);line-height:1.5;
  max-width:27ch;margin-inline:auto;color:var(--hw-oro-claro)}
.inv-padres-invitados{display:grid;grid-template-columns:1fr 1fr;max-width:440px;margin:24px auto 0}
.inv-padres-invitados .hero-padres-col{max-width:none;padding:0 12px;text-align:center}
.inv-padres-invitados .hero-padres-col + .hero-padres-col{border-left:1px solid color-mix(in srgb,var(--accent) 40%,transparent)}
.inv-padres-invitados .hero-padres-tit{font-family:var(--hw-caps);font-weight:600;font-size:10.5px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--hw-oro);margin:0}
.inv-padres-invitados .hero-padres-nom{margin-top:6px;font-size:17.5px;line-height:1.5;color:var(--ink);white-space:pre-line}
#events .container::before,.inv-block-events .container::before{content:"";display:block;width:min(40vw,160px);aspect-ratio:1;
  margin:0 auto 6px;background:url(${A}/camara.png) center/contain no-repeat}
#gifts .container::before,.inv-block-gifts .container::before{content:"";display:block;width:min(34vw,130px);aspect-ratio:.9;
  margin:0 auto 8px;background:url(${A}/palomitas.png) center/contain no-repeat;
  filter:drop-shadow(0 0 22px color-mix(in srgb,var(--accent) 30%,transparent))}
.gifts-account{background:transparent;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:8px}
.gifts-bank{color:var(--hw-oro)}
#confirmation{padding-bottom:130px}
#confirmation .container::before{content:"";display:block;width:min(26vw,100px);aspect-ratio:1;margin:0 auto 8px;
  background:url(${A}/estrella.png) center/contain no-repeat;filter:drop-shadow(0 0 20px color-mix(in srgb,var(--accent) 40%,transparent))}
#confirmation::after{content:"";position:absolute;right:8px;bottom:8px;width:min(30vw,150px);aspect-ratio:1;
  background:url(${A}/esquina.png) center/contain no-repeat;rotate:180deg;pointer-events:none}
#confirmation .confirmation-deadline{display:none}
.inv-rsvp-lab{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--hw-oro);opacity:1;text-align:left}
.inv-rsvp-lab .inv-rsvp-input{text-transform:none;letter-spacing:0;font-weight:400}

/* ── La alfombra roja ── */
${ALFOMBRA}{background:radial-gradient(120% 90% at 50% 0%,var(--brand-2),color-mix(in srgb,var(--brand-2) 55%,#000) 70%,
  color-mix(in srgb,var(--brand-2) 30%,#000))}
${ALFOMBRA} .section-label{color:var(--hw-oro-claro)}
#features .features-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:440px;margin-inline:auto}
#features .feature-card{padding:20px 14px;border:0;border-radius:8px;background:rgba(0,0,0,.25);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 40%,transparent)}
#features .feature-card:last-child:nth-child(odd){grid-column:1/-1}
.feature-icon{color:var(--hw-oro)}
.feature-title{font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--hw-oro-claro)}

/* ── La cinta ── */
.inv-ev-cinta .event-time{font-size:15px;letter-spacing:.14em}
.inv-ev-cinta .event-type{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--hw-oro-claro)}
.inv-ev-cinta .event-title{font-family:var(--hw-script);font-weight:400;font-size:40px;line-height:1.1}
.inv-ev-cinta .event-place{font-size:16px}
.inv-ev-cinta .event-map-btn{padding:0 0 2px;background:none;border:0;border-radius:0;box-shadow:none;
  font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--hw-oro);
  border-bottom:1px solid color-mix(in srgb,var(--accent) 50%,transparent)}

/* ── Botones: oro de estreno ── */
.hero-btn,.splash-btn-primary,.confirm-btn,.gifts-btn,.inv-rsvp-btn:not(.inv-rsvp-no),
.inv-mapa-btn:not(.inv-agendar){border:0;border-radius:4px;
  background:linear-gradient(100deg,var(--hw-oro-hondo),var(--accent) 30%,color-mix(in srgb,var(--accent) 25%,#fff) 50%,var(--accent) 70%,var(--hw-oro-hondo));
  background-size:220% 100%;color:var(--on-accent);font-size:12px;letter-spacing:.24em;
  box-shadow:0 0 22px -6px color-mix(in srgb,var(--accent) 70%,transparent);transition:background-position .8s,transform .2s}
.hero-btn:hover,.confirm-btn:hover,.gifts-btn:hover{background-position:100% 0}

/* ── Pie: el foco ── */
footer{padding:74px 24px calc(72px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 70%,#000)}
footer .container{position:relative;z-index:2}
footer .container::before{content:"";display:block;width:min(40vw,160px);aspect-ratio:1.1;margin:0 auto -6px;
  background:url(${A}/foco.png) center/contain no-repeat}
.footer-names{font-size:100px;line-height:1}
.footer-date{font-family:var(--hw-titulo);letter-spacing:.2em}
.footer-copy{letter-spacing:.3em;color:var(--hw-oro)}

@media (prefers-reduced-motion:reduce){
  .hero-name,.splash-name,.footer-names,.hero-content::before{animation:none}
}`;

export const hollywood: Design = {
  slug: "15-hollywood",
  name: "Quinceañera Hollywood",
  occasion: "quince",
  mood: "Negro, oro y alfombra roja: marquesina de bombillas, claqueta, cinta de cine y estrella de la fama",
  fontUrl: gfont(
    "family=Limelight&family=Josefin+Sans:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Alex+Brush"
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
  shape: { radius: 8, radiusSm: 6, btnRadius: 4, shadow: "none" },
  palettes: [ESTRENO, PLATA, GLAM, ESMERALDA],
  variantes: { countdown: "marquesina", events: "cinta" },
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
    { seccion: "guests", url: `${A}/esquina.png`, sitio: "arriba-izq", tamano: 30 },
  ],
  deco: {
    ornament: () => `<img class="hw-divisor" src="${A}/divisor.png" alt="">`,
  },
};
