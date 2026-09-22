/**
 * Bloques: el orden de la invitación y el diseño de cada componente.
 *
 * Un bloque puede renderizarse de dos maneras:
 *
 * 1. `variant: ""` — se usa el marcado que ya trae el template. Es lo que
 *    hacía el sistema desde el principio y conserva el diseño tal cual.
 * 2. `variant: "algo"` — el marcado lo construimos nosotros, **con las mismas
 *    clases canónicas** (`.section-label`, `.event-card`, `.countdown-ring`…).
 *    Como esas clases son justo las que el mapa de bindings ya usa, el CSS del
 *    template las estiliza solo: el bloque alterno sale con la piel del diseño
 *    elegido sin escribir CSS por diseño.
 *
 * Lo mismo vale para los bloques nuevos (Párrafo, galerías extra): son
 *    marcado nuestro con clases del vocabulario común.
 */

import { iconoHtml } from "./iconos";
import type { FieldSpec, ListSpec, SectionData } from "./schema";
import { panelFields } from "./schema";

export interface Block {
  /** Estable, para reordenar sin perder el foco ni los datos. */
  id: string;
  type: string;
  /** "" = el marcado del propio diseño. */
  variant: string;
  /** Datos propios. Sólo en los bloques que se pueden repetir. */
  data?: SectionData;
}

export interface VariantSpec {
  id: string;
  name: string;
  hint: string;
  /** Sin el `.container` que centra y limita el ancho: para fotos a sangre. */
  bare?: boolean;
  /** Marcado interior del bloque. El texto es de relleno: lo reemplazan los
   *  bindings, igual que en los templates. */
  build?: () => string;
}

export interface BlockSpec {
  type: string;
  label: string;
  icon: string;
  /** Clave del esquema, si el bloque ya existía como sección. */
  section?: string;
  /** Se puede agregar más de una vez. */
  repeatable: boolean;
  /** Campos propios; los bloques con `section` los toman del esquema. */
  fields?: FieldSpec[];
  list?: ListSpec;
  variants: VariantSpec[];
}

/* ── Piezas comunes del marcado ───────────────────────────── */

// Sin `.ornament`: la filigrana que cada diseño mete bajo el título quedaba
// bien en su maquetación original y descolocada en la nuestra.
const head = (extra = "") => `
    <p class="section-label">Antetítulo</p>
    <h2 class="section-title">Título</h2>${extra}`;

const body = `
    <p class="section-body">Mensaje</p>`;

const UNIDADES: [string, string][] = [
  ["days", "Días"],
  ["hours", "Horas"],
  ["mins", "Minutos"],
  ["secs", "Segundos"],
];

/* ── Cuenta atrás ─────────────────────────────────────────── */

/**
 * Las cinco cuentas atrás comparten el marcado y se distinguen por su CSS,
 * que usa los tokens del diseño (`--inv-accent`, `--inv-font-title`…). El
 * `data-cd` es lo que el script busca para actualizar cada número.
 */
const reloj = (clase: string, anillo = false) => `${head()}${body}
    <div class="countdown-grid inv-cd ${clase}">
      ${UNIDADES.map(
        ([k, etiqueta]) =>
          `<div class="countdown-ring"${anillo ? ' data-cd-ring="' + k + '"' : ""}>` +
          `<div class="ring-inner">` +
          `<span class="ring-number" data-cd="${k}">--</span>` +
          `<span class="ring-label">${etiqueta}</span>` +
          `</div></div>`
      ).join("\n      ")}
    </div>`;

const countdown: BlockSpec = {
  type: "countdown",
  label: "Cuenta atrás",
  icon: "◷",
  section: "countdown",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "circulos",
      name: "Círculos",
      hint: "Cuatro círculos con el contorno del color de acento",
      build: () => reloj("inv-cd-circulos"),
    },
    {
      id: "tarjetas",
      name: "Tarjetas",
      hint: "Cuatro placas rellenas con el color de acento",
      build: () => reloj("inv-cd-tarjetas"),
    },
    {
      id: "anillos",
      name: "Anillos",
      hint: "Un aro de progreso que se va vaciando con el tiempo",
      build: () => reloj("inv-cd-anillos", true),
    },
    {
      id: "tipografico",
      name: "Tipográfico",
      hint: "Números grandes sin caja, separados por filetes",
      build: () => reloj("inv-cd-tipo"),
    },
    {
      id: "linea",
      name: "Una línea",
      hint: "Todo en un renglón, discreto",
      build: () => reloj("inv-cd-linea"),
    },
    {
      id: "capsulas",
      name: "Cápsulas",
      hint: "Cuatro píldoras rellenas, número y unidad en el mismo renglón",
      build: () => reloj("inv-cd-capsulas"),
    },
    {
      id: "placas",
      name: "Placas",
      hint: "Como un reloj de tablero, con la ranura a media altura",
      build: () => reloj("inv-cd-placas"),
    },
    {
      id: "reloj",
      name: "Reloj",
      hint: "Los cuatro números seguidos, separados por dos puntos",
      build: () => reloj("inv-cd-reloj"),
    },
    {
      id: "vertical",
      name: "En columna",
      hint: "Una fila por unidad, con el número a la izquierda; cómodo en móvil",
      build: () => reloj("inv-cd-vertical"),
    },
    {
      id: "orbitas",
      name: "Órbitas",
      hint: "Un aro que se vacía con el tiempo y una luna pequeña que le da la vuelta",
      build: () => reloj("inv-cd-orbitas", true),
    },
    {
      id: "paletas",
      name: "Paletas",
      hint: "Como un reloj de aeropuerto: cada número gira al cambiar",
      build: () => reloj("inv-cd-paletas"),
    },
    /* Las luciérnagas: cada número dentro de un halo que respira, con
       tres luciérnagas que revolotean alrededor a su aire. Al cambiar el
       número —el .tick que ya pone la cuenta atrás— el halo se enciende.
       Es CSS nada más: no hace falta script propio. */
    {
      id: "luciernagas",
      name: "Luciérnagas",
      hint: "Cada número en un halo de luz con luciérnagas alrededor; se enciende al cambiar",
      build: () => reloj("inv-cd-luciernagas"),
    },
    /* La marquesina: cada unidad en un letrero de cine con bombillas que
       se encienden por turnos alrededor. CSS nada más. */
    {
      id: "marquesina",
      name: "Marquesina",
      hint: "Cada número en un letrero de cine con bombillas que corren por el marco",
      build: () => reloj("inv-cd-marquesina"),
    },
    /* Las alas: cada número entre dos alas que respiran y baten al cambiar. */
    {
      id: "alas",
      name: "Alas",
      hint: "Cada número se posa entre dos alas de mariposa que baten al cambiar",
      build: () => reloj("inv-cd-alas"),
    },
    /* Los cristales: cada número en un cristal de hielo hexagonal que brilla. */
    {
      id: "cristales",
      name: "Cristales de hielo",
      hint: "Cada número dentro de un cristal hexagonal con facetas y un brillo que lo cruza",
      build: () => reloj("inv-cd-cristales"),
    },
    /* El reloj de bolsillo: la manecilla gira con lo que le queda al ciclo. */
    {
      id: "bolsillo",
      name: "Reloj de bolsillo",
      hint: "Cada unidad en la esfera de un reloj antiguo, con su manecilla girando",
      build: () => reloj("inv-cd-bolsillo", true),
    },
    {
      id: "medallon",
      name: "Medallón",
      hint: "Los días en un círculo grande y el resto pequeño debajo",
      build: () => reloj("inv-cd-medallon"),
    },
  ],
};

/* ── Invitados ────────────────────────────────────────────── */

const guests: BlockSpec = {
  type: "guests",
  label: "Invitados",
  icon: "❥",
  section: "guests",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "propia",
      name: "Propia",
      hint: "Mensaje centrado, sin la caja del diseño",
      build: () => `${head()}
    <p class="guests-text">Mensaje</p>
    <p class="guests-text guests-cierre">Mensaje de cierre</p>
    <p class="guests-address">Lugar y fecha</p>`,
    },
  ],
};


/* ── Programa ─────────────────────────────────────────────── */

const eventCard = (clase: string) => `<article class="event-card ${clase}">
        <span class="event-icon">✦</span>
        <p class="event-type">Tipo</p>
        <h3 class="event-title">Momento</h3>
        <p class="event-time">Hora</p>
        <p class="event-place">Lugar<small>Dirección</small></p>
        <p class="event-note">Nota</p>
        <a class="event-map-btn" href="#">¿Cómo llegar?</a>
      </article>`;

const events: BlockSpec = {
  type: "events",
  label: "Programa",
  icon: "◐",
  section: "events",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "tarjetas",
      name: "Tarjetas",
      hint: "Una tarjeta por momento, en cuadrícula",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-tarjetas">
      ${eventCard("")}
    </div>`,
    },
    {
      id: "timeline",
      name: "Línea de tiempo",
      hint: "Vertical, con hilo y puntos",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-timeline">
      ${eventCard("")}
    </div>`,
    },
    /*
     * El itinerario: medallón, hilo y texto a la derecha.
     *
     * Variante nueva y no un retoque de «Línea de tiempo», que centra el
     * texto y marca cada momento con un punto pequeño. Son dos maneras
     * distintas de leer lo mismo y hay invitaciones publicadas usando la
     * otra: cambiarla les movería el suelo sin que nadie lo pidiera.
     *
     * El marcado es el mismo de siempre —la misma ficha, las mismas clases—
     * porque de esas clases cuelgan los bindings. Lo único suyo es la clase
     * del envoltorio y el CSS que cuelga de ella, que es lo que permite
     * añadir una manera de ver el programa sin tocar el renderer.
     */
    {
      id: "itinerario",
      name: "Itinerario",
      hint: "Medallón con el icono, hilo vertical y texto a la derecha",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-itinerario">
      ${eventCard("")}
    </div>`,
    },
    /* La constelación: una estrella por momento, unidas por una línea que
       se traza al bajar. El marcado es el de siempre metido en .inv-dato,
       más la estrella: los bindings buscan por clase dentro de la ficha. */
    {
      id: "constelacion",
      name: "Constelación",
      hint: "Una estrella por momento, unidas por una línea que se dibuja al bajar",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-constelacion">
      <svg class="inv-traza" aria-hidden="true"><path pathLength="1"/></svg>
      <article class="event-card">
        <i class="inv-luz" aria-hidden="true"></i>
        <div class="inv-dato">
          <span class="event-icon">✦</span>
          <p class="event-time">Hora</p>
          <p class="event-type">Tipo</p>
          <h3 class="event-title">Momento</h3>
          <p class="event-place">Lugar<small>Dirección</small></p>
          <p class="event-note">Nota</p>
          <a class="event-map-btn" href="#">¿Cómo llegar?</a>
        </div>
      </article>
    </div>`,
    },
    /* Los capítulos: el icono de cada momento es su número, y la ficha
       entra girando como una página que se pasa. */
    {
      id: "capitulos",
      name: "Capítulos",
      hint: "Fichas de pergamino que entran girando, con el número del momento al lado",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-capitulos">
      <article class="event-card">
        <span class="event-icon">✦</span>
        <p class="event-time">Hora</p>
        <p class="event-type">Tipo</p>
        <h3 class="event-title">Momento</h3>
        <p class="event-place">Lugar<small>Dirección</small></p>
        <p class="event-note">Nota</p>
        <a class="event-map-btn" href="#">¿Cómo llegar?</a>
      </article>
    </div>`,
    },
    /* El sendero: un camino que serpentea entre los momentos y una
       luciérnaga que lo recorre al bajar; cada parada se enciende cuando
       llega. La parada es un elemento propio con el ícono dentro: un
       momento sin ícono pierde su .event-icon —el renderer borra los campos
       vacíos— y sin esto el camino se saltaba esa parada. Como en la
       constelación, el resto de la ficha va dentro de .inv-dato. */
    {
      id: "sendero",
      name: "Sendero",
      hint: "Un camino que serpentea y una luciérnaga que lo recorre encendiendo cada momento",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-sendero">
      <svg class="inv-senda" aria-hidden="true"><path class="inv-senda-fondo"/><path class="inv-senda-luz" pathLength="1"/></svg>
      <i class="inv-luciernaga" aria-hidden="true"></i>
      <article class="event-card">
        <i class="inv-parada" aria-hidden="true"><span class="event-icon">✦</span></i>
        <div class="inv-dato">
          <p class="event-time">Hora</p>
          <p class="event-type">Tipo</p>
          <h3 class="event-title">Momento</h3>
          <p class="event-place">Lugar<small>Dirección</small></p>
          <p class="event-note">Nota</p>
          <a class="event-map-btn" href="#">¿Cómo llegar?</a>
        </div>
      </article>
    </div>`,
    },
    /* El viaje: un hilo vertical y algo que lo recorre al bajar —un globo
       en Cielo Celeste, lo que cada diseño ponga en --inv-viajero-img, o
       una esfera de luz si no pone nada—; cada parada se rellena cuando el
       viajero la pasa. Como en el sendero, la parada es un elemento propio
       y el ícono no se usa: el momento sin ícono no pierde su punto. */
    {
      id: "viaje",
      name: "Viaje",
      hint: "Un hilo con un globo que baja al hacer scroll y va marcando cada momento",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-viaje">
      <i class="inv-viajero" aria-hidden="true"></i>
      <article class="event-card">
        <i class="inv-hito" aria-hidden="true"></i>
        <div class="inv-dato">
          <span class="event-icon">✦</span>
          <p class="event-time">Hora</p>
          <p class="event-type">Tipo</p>
          <h3 class="event-title">Momento</h3>
          <p class="event-place">Lugar<small>Dirección</small></p>
          <p class="event-note">Nota</p>
          <a class="event-map-btn" href="#">¿Cómo llegar?</a>
        </div>
      </article>
    </div>`,
    },
    /* La cinta: una tira de película con perforaciones; cada momento es un
       fotograma numerado como escena que se «proyecta» al asomar. */
    {
      id: "cinta",
      name: "Cinta de cine",
      hint: "Una tira de película: cada momento es una escena que se proyecta al llegar",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-cinta">
      ${eventCard("")}
    </div>`,
    },
    /* Las postales: cada momento con su estampilla y matasellos. La
       estampilla es un elemento propio con el ícono dentro, para que un
       momento sin ícono conserve su sello. */
    {
      id: "postales",
      name: "Postales",
      hint: "Cada momento es una postal con su estampilla, que cae sobre la mesa al llegar",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-postales">
      <article class="event-card">
        <i class="inv-estampilla" aria-hidden="true"><span class="event-icon">✦</span></i>
        <p class="event-time">Hora</p>
        <p class="event-type">Tipo</p>
        <h3 class="event-title">Momento</h3>
        <p class="event-place">Lugar<small>Dirección</small></p>
        <p class="event-note">Nota</p>
        <a class="event-map-btn" href="#">¿Cómo llegar?</a>
      </article>
    </div>`,
    },
    /* Los naipes: cada momento es una carta —A♥, 2♠, 3♦…— que se reparte al asomar. */
    {
      id: "naipes",
      name: "Naipes",
      hint: "Cada momento es una carta de la baraja que se reparte sobre la mesa al llegar",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-naipes">
      ${eventCard("")}
    </div>`,
    },
    {
      id: "lista",
      name: "Lista compacta",
      hint: "Filas de hora, momento y lugar",
      build: () => `${head()}${body}
    <div class="events-grid inv-ev-lista">
      ${eventCard("")}
    </div>`,
    },
  ],
};

/* ── Galería ──────────────────────────────────────────────── */

const galleryItems = (n: number) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<div class="gallery-item"><div class="gallery-ph">` +
      `<span class="gallery-ph-text">${iconoHtml("camara")}<b>Foto ${i + 1}</b></span>` +
      `</div></div>`
  ).join("\n      ");

const gallery: BlockSpec = {
  type: "gallery",
  label: "Galería",
  icon: "▣",
  section: "gallery",
  repeatable: true,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "cuadricula",
      name: "Cuadrícula",
      hint: "Tres por fila, todas iguales",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-cuadricula">
      ${galleryItems(6)}
    </div>`,
    },
    {
      id: "mosaico",
      name: "Mosaico",
      hint: "La primera al doble de tamaño",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-mosaico">
      ${galleryItems(6)}
    </div>`,
    },
    {
      id: "tira",
      name: "Tira deslizable",
      hint: "Se pasan de lado con el dedo",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-tira">
      ${galleryItems(6)}
    </div>`,
    },
    /* El carrusel: una foto grande a la vez, con enganche y puntos. La
       tira deslizable enseña varias a medias, que está bien para mirar de
       reojo; ésta es para mirar una. */
    {
      id: "carrusel",
      name: "Carrusel",
      hint: "Una foto grande a la vez, se desliza con el dedo y lleva puntos",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-carrusel">
      ${galleryItems(6)}
    </div>
    <div class="inv-puntos" aria-hidden="true"></div>`,
    },
    /* El papel rasgado: la foto sin marco, rota a mano por los cuatro
       lados. Va una debajo de otra y grande, que es como luce el borde. */
    {
      id: "rasgada",
      name: "Papel rasgado",
      hint: "Una debajo de otra, con el borde roto a mano",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-rasgada">
      ${galleryItems(4)}
    </div>`,
    },
    {
      id: "polaroid",
      name: "Polaroid",
      hint: "Con marco blanco y ligeramente torcidas",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-polaroid">
      ${galleryItems(5)}
    </div>`,
    },
    {
      id: "arco",
      name: "Arco",
      hint: "Fotos rematadas en arco, como las de Martina",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-arco">
      ${galleryItems(6)}
    </div>`,
    },
    {
      id: "circulos",
      name: "Círculos",
      hint: "Fotos redondas, con un aro del color de acento",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-circulos">
      ${galleryItems(6)}
    </div>`,
    },
    {
      id: "marco",
      name: "Con paspartú",
      hint: "Cada foto enmarcada, con un filete por dentro",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-marco">
      ${galleryItems(4)}
    </div>`,
    },
    {
      id: "revista",
      name: "Revista",
      hint: "Una grande arriba y las demás en dos columnas",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-revista">
      ${galleryItems(5)}
    </div>`,
    },
    {
      id: "escalera",
      name: "Escalera",
      hint: "Dos columnas, una desplazada hacia abajo",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-escalera">
      ${galleryItems(6)}
    </div>`,
    },
    {
      id: "apilada",
      name: "Apiladas",
      hint: "Una debajo de otra a todo el ancho; lucen mucho en móvil",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-apilada">
      ${galleryItems(4)}
    </div>`,
    },
    {
      id: "mamposteria",
      name: "Mampostería",
      hint: "Alturas distintas que encajan entre sí, sin huecos",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-mamposteria">
      ${galleryItems(6)}
    </div>`,
    },
    {
      id: "cinta",
      name: "Cinta continua",
      hint: "Se desplazan solas de lado a lado, sin tocar nada",
      bare: true,
      build: () => `<div class="container">${head()}
    <p class="gallery-text">Mensaje</p></div>
    <div class="inv-ga-cinta-marco">
      <div class="gallery-grid inv-ga-cinta">
        ${galleryItems(6)}
      </div>
    </div>`,
    },
    {
      id: "collage",
      name: "Collage",
      hint: "Superpuestas y ladeadas, como fotos sueltas sobre una mesa",
      build: () => `${head()}
    <p class="gallery-text">Mensaje</p>
    <div class="gallery-grid inv-ga-collage">
      ${galleryItems(5)}
    </div>`,
    },
  ],
};

/* ── Información útil ─────────────────────────────────────── */

const featureCard = `<div class="feature-card">
        <span class="feature-icon">✦</span>
        <h3 class="feature-title">Título</h3>
        <p class="feature-text">Texto</p>
      </div>`;

const features: BlockSpec = {
  type: "features",
  label: "Información útil",
  icon: "☰",
  section: "features",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "tarjetas",
      name: "Tarjetas",
      hint: "En cuadrícula, con ícono arriba",
      build: () => `${head()}
    <div class="features-grid inv-fe-tarjetas">
      ${featureCard}
    </div>`,
    },
    {
      id: "lista",
      name: "Lista",
      hint: "Ícono a la izquierda, texto a la derecha",
      build: () => `${head()}
    <div class="features-grid inv-fe-lista">
      ${featureCard}
    </div>`,
    },
    {
      id: "rasca",
      name: "Rasca y descubre",
      hint: "Cada ficha tapada con una capa de plata que se rasca con el dedo",
      build: () => `${head()}
    <div class="features-grid inv-fe-rasca">
      <div class="feature-card">
        <span class="feature-icon">✦</span>
        <h3 class="feature-title">Título</h3>
        <p class="feature-text">Texto</p>
        <div class="inv-rasca-capa" data-etiqueta="Rasca para descubrir"></div>
      </div>
    </div>`,
    },
    {
      id: "voltea",
      name: "Se voltean",
      hint: "Por delante el ícono y el título; se tocan y por detrás aparece el texto",
      build: () => `${head()}
    <div class="features-grid inv-fe-voltea">
      <div class="feature-card" role="button" tabindex="0" aria-pressed="false">
        <div class="inv-cara inv-cara-frente">
          <span class="feature-icon">✦</span>
          <h3 class="feature-title">Título</h3>
          <span class="inv-fe-pista">Toca</span>
        </div>
        <div class="inv-cara inv-cara-dorso"><p class="feature-text">Texto</p></div>
      </div>
    </div>`,
    },
  ],
};

/* ── Confirmación, regalos y redes ────────────────────────────
   Además de la del diseño llevan una variante propia, para que se puedan
   usar también en los templates que no traen esa sección: ahí antes el
   bloque quedaba inutilizable. */

const confirmacion: BlockSpec = {
  type: "confirm",
  label: "Confirmación (RSVP)",
  icon: "✓",
  section: "confirm",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "propia",
      name: "Propia",
      hint: "Sirve también en los diseños que no traen confirmación",
      build: () => `${head()}
    <p class="confirmation-text">Mensaje</p>
    <p class="confirmation-deadline">Nota</p>`,
    },
  ],
};

const regalos: BlockSpec = {
  type: "gifts",
  label: "Mesa de regalos",
  icon: "❁",
  section: "gifts",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "tarjetas",
      name: "Tarjetas",
      hint: "Las opciones de regalo en cuadrícula",
      build: () => `${head()}
    <p class="gifts-text">Mensaje</p>
    <div class="gifts-account inv-cuenta">
      <p class="gifts-bank">Transferencia</p>
      <p class="gifts-iban">Número de cuenta</p>
    </div>
    <p class="gifts-note">Nota</p>
    <div class="gifts-cards inv-gi-tarjetas">
      <div class="gift-card">
        <span class="gift-icon">🎁</span>
        <h3 class="gift-title">Título</h3>
        <p class="gift-desc">Descripción</p>
        <a class="gift-link" href="#">Ver</a>
      </div>
    </div>
    <a class="gifts-btn inv-boton" href="#">Ver mesa de regalos</a>`,
    },
    {
      id: "simple",
      name: "Sólo el mensaje",
      hint: "Texto y un botón, sin cuenta ni tarjetas",
      build: () => `${head()}
    <p class="gifts-text">Mensaje</p>
    <a class="gifts-btn inv-boton" href="#">Ver mesa de regalos</a>`,
    },
  ],
};

const redes: BlockSpec = {
  type: "social",
  label: "Redes y hashtag",
  icon: "#",
  section: "social",
  repeatable: false,
  variants: [
    { id: "", name: "La del diseño", hint: "El marcado original del template" },
    {
      id: "propia",
      name: "Propia",
      hint: "Hashtag grande y un botón a la cuenta",
      build: () => `${head()}
    <p class="social-sub">Mensaje</p>
    <span class="social-hashtag inv-hashtag">#Hashtag</span>
    <a class="social-ig inv-boton" href="#">@cuenta</a>`,
    },
  ],
};

/* ── Párrafo (bloque nuevo) ───────────────────────────────── */

const paragraph: BlockSpec = {
  type: "paragraph",
  label: "Párrafo",
  icon: "¶",
  repeatable: true,
  fields: [
    { key: "label", label: "Antetítulo", type: "text", placeholder: "Un momento" },
    { key: "title", label: "Título", type: "text", placeholder: "Nuestra historia" },
    { key: "text", label: "Texto", type: "textarea", span: 2 },
    {
      key: "textColor",
      label: "Color de las letras",
      type: "color",
      span: 2,
      help: "Se aplica a todo el bloque.",
    },
  ],
  variants: [
    {
      id: "simple",
      name: "Simple",
      hint: "Centrado, como el resto de las secciones",
      build: () => `${head()}
    <p class="section-body inv-pa-simple">Texto</p>`,
    },
    {
      id: "destacado",
      name: "Destacado",
      hint: "Texto grande entre comillas, para una frase",
      build: () => `${head()}
    <p class="section-body inv-pa-destacado">Texto</p>`,
    },
    /* La cita: la frase en su tarjeta y quién la dijo debajo. No usa el
       head() común porque la firma va dentro de la tarjeta, al pie. */
    {
      id: "cita",
      name: "Cita",
      hint: "La frase en una tarjeta y el antetítulo debajo, como firma",
      build: () => `
    <figure class="inv-pa-cita">
      <p class="section-body inv-cita-texto">Texto</p>
      <figcaption class="section-label inv-cita-firma">Antetítulo</figcaption>
    </figure>`,
    },
    {
      id: "dividido",
      name: "Dividido",
      hint: "Título a un lado y texto al otro",
      build: () => `<div class="inv-pa-dividido">
      <div class="inv-pa-lado">
        <p class="section-label">Antetítulo</p>
        <h2 class="section-title">Título</h2>
      </div>
      <p class="section-body">Texto</p>
    </div>`,
    },
  ],
};

/* ── Foto (bloque nuevo) ──────────────────────────────────── */

const marcoFoto = (clase: string) => `<figure class="inv-foto ${clase}">
      <div class="gallery-item inv-foto-marco">
        <div class="gallery-ph"><span class="gallery-ph-text">${iconoHtml("camara")}<b>Foto</b></span></div>
      </div>
      <figcaption class="inv-foto-pie">Pie de foto</figcaption>
    </figure>`;

const photo: BlockSpec = {
  type: "photo",
  label: "Foto",
  icon: "▢",
  repeatable: true,
  fields: [
    { key: "url", label: "Foto", type: "image", span: 2 },
    { key: "label", label: "Antetítulo", type: "text", placeholder: "Opcional" },
    { key: "title", label: "Título", type: "text", placeholder: "Opcional" },
    { key: "caption", label: "Pie de foto", type: "text", span: 2, placeholder: "Opcional" },
    {
      key: "textColor",
      label: "Color de las letras",
      type: "color",
      span: 2,
      help: "Se aplica al título y al pie de foto.",
    },
  ],
  variants: [
    {
      id: "completa",
      name: "A sangre",
      hint: "De borde a borde, como un respiro entre secciones",
      bare: true,
      build: () => marcoFoto("inv-foto-completa"),
    },
    {
      id: "marco",
      name: "Con marco",
      hint: "Centrada, con título y pie",
      build: () => `${head()}
    ${marcoFoto("inv-foto-marco-centrado")}`,
    },
    {
      id: "arco",
      name: "Arco",
      hint: "Recortada en arco, como un retrato",
      build: () => `${head()}
    ${marcoFoto("inv-foto-arco")}`,
    },
    {
      id: "rasgada",
      name: "Papel rasgado",
      hint: "Con el borde roto a mano, sobre el papel del diseño",
      build: () => `${head()}
    ${marcoFoto("inv-foto-rasgada")}`,
    },
  ],
};

/* ── Ubicación (bloque nuevo) ─────────────────────────────── */

const fichaMapa = `<div class="inv-mapa-datos">
        <p class="inv-mapa-lugar">Lugar</p>
        <p class="inv-mapa-dir">Dirección</p>
        <a class="inv-mapa-btn" href="#" target="_blank" rel="noopener">Cómo llegar</a><button
          class="inv-mapa-btn inv-agendar" type="button" data-inv-agendar>Agendar</button>
      </div>`;

const lienzoMapa = `<div class="inv-mapa-lienzo">
        <iframe class="inv-mapa-frame" src="" loading="lazy" title="Mapa del lugar"
          referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>`;

const ubicacion: BlockSpec = {
  type: "ubicacion",
  label: "Ubicación",
  icon: "◎",
  repeatable: true,
  fields: [
    { key: "label", label: "Antetítulo", type: "text", placeholder: "Dónde nos vemos" },
    { key: "title", label: "Título", type: "text", placeholder: "La ubicación" },
    { key: "text", label: "Mensaje", type: "textarea", span: 2 },
    { key: "place", label: "Nombre del lugar", type: "text", placeholder: "Hacienda El Cortijo" },
    { key: "address", label: "Dirección", type: "text", placeholder: "Carretera de Carmona km 8" },
    {
      key: "query",
      label: "Qué buscar en el mapa",
      type: "text",
      span: 2,
      placeholder: "Hacienda El Cortijo, Sevilla",
      help: "Una dirección, un nombre de lugar o unas coordenadas. Si lo dejas vacío se usa la dirección de arriba.",
    },
    {
      key: "mapUrl",
      label: "Link propio del mapa",
      type: "url",
      span: 2,
      help: "Opcional. Sin él, el botón abre la búsqueda en Google Maps.",
    },
    { key: "buttonText", label: "Texto del botón", type: "text", placeholder: "Cómo llegar" },
    {
      key: "calendarText",
      label: "Botón de calendario",
      type: "text",
      placeholder: "Agendar",
      help: "Descarga el evento al calendario del teléfono, con la fecha y la hora de la invitación. Vacío = sin botón.",
    },
    { key: "textColor", label: "Color de las letras", type: "color", span: 2 },
  ],
  variants: [
    {
      id: "mapa",
      name: "Mapa y ficha",
      hint: "El mapa arriba y los datos debajo",
      build: () => `${head()}
    <p class="section-body">Mensaje</p>
    <div class="inv-mapa inv-mapa-vertical">
      ${lienzoMapa}
      ${fichaMapa}
    </div>`,
    },
    {
      id: "ancho",
      name: "Mapa a sangre",
      hint: "El mapa de borde a borde, con los datos encima",
      bare: true,
      build: () => `<div class="inv-mapa inv-mapa-ancho">
      ${lienzoMapa}
      <div class="container">${fichaMapa}</div>
    </div>`,
    },
    {
      id: "ficha",
      name: "Sólo la ficha",
      hint: "Sin mapa incrustado, sólo lugar, dirección y botón",
      build: () => `${head()}
    <p class="section-body">Mensaje</p>
    <div class="inv-mapa inv-mapa-sola">
      ${fichaMapa}
    </div>`,
    },
  ],
};

/* ── Vídeo (bloque nuevo) ─────────────────────────────────── */

/**
 * El lienzo lleva **los dos** reproductores y el render borra el que no toca.
 *
 * Es a propósito: el marcado de un bloque se construye sin saber qué eligió
 * quien edita —`build()` no recibe datos—, así que la decisión se toma en
 * `ponerVideo()`, que sí los tiene. La alternativa era una variante por
 * fuente, y entonces cambiar de YouTube a un archivo subido obligaría a
 * cambiar también de variante y a perder la forma elegida.
 */
const lienzoVideo = `<div class="inv-video-lienzo">
        <iframe class="inv-video-frame" src="" title="Vídeo" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        <video class="inv-video-propio" controls playsinline preload="metadata"></video>
      </div>`;

const marcoVideo = (clase: string) => `<figure class="inv-video ${clase}">
      ${lienzoVideo}
      <figcaption class="inv-video-pie">Pie del vídeo</figcaption>
    </figure>`;

const video: BlockSpec = {
  type: "video",
  label: "Vídeo",
  icon: "▶",
  repeatable: true,
  fields: [
    {
      key: "fuente",
      label: "De dónde sale",
      type: "select",
      span: 2,
      options: [
        { value: "youtube", label: "De YouTube" },
        { value: "subido", label: "Un archivo que subo" },
      ],
    },
    {
      key: "youtubeUrl",
      label: "Link de YouTube",
      type: "url",
      span: 2,
      placeholder: "https://www.youtube.com/watch?v=...",
      help: "Vale cualquier forma del link: watch, youtu.be, shorts o embed. Si trae un minuto de inicio, se respeta.",
      showIf: { key: "fuente", value: "youtube" },
    },
    { key: "url", label: "El vídeo", type: "video", span: 2, showIf: { key: "fuente", value: "subido" } },
    {
      key: "poster",
      label: "Imagen de portada del vídeo",
      type: "image",
      span: 2,
      help: "Opcional. Sin ella, en iPhone se ve un recuadro negro hasta que se le da al play.",
      showIf: { key: "fuente", value: "subido" },
    },
    {
      key: "reproduccion",
      label: "Cómo se reproduce",
      type: "select",
      span: 2,
      options: [
        { value: "controles", label: "Con controles, al darle al play" },
        { value: "automatica", label: "Sola, en silencio y en bucle" },
      ],
      help: "La automática sólo funciona en silencio: ningún navegador deja que una página empiece a sonar sola. Para un clip corto de ambiente; para un vídeo con voz, controles.",
    },
    { key: "label", label: "Antetítulo", type: "text", placeholder: "Opcional" },
    { key: "title", label: "Título", type: "text", placeholder: "Opcional" },
    { key: "caption", label: "Pie del vídeo", type: "text", span: 2, placeholder: "Opcional" },
    { key: "textColor", label: "Color de las letras", type: "color", span: 2 },
  ],
  variants: [
    {
      id: "marco",
      name: "Apaisado",
      hint: "16:9 centrado, con título y pie",
      build: () => `${head()}
    ${marcoVideo("inv-video-16-9")}`,
    },
    {
      id: "vertical",
      name: "Vertical",
      hint: "9:16, para lo grabado con el celular de pie",
      build: () => `${head()}
    ${marcoVideo("inv-video-9-16")}`,
    },
    {
      id: "completa",
      name: "A sangre",
      hint: "De borde a borde, como un respiro entre secciones",
      bare: true,
      build: () => `<div class="inv-video inv-video-completa">
      ${lienzoVideo}
    </div>`,
    },
  ],
};

/**
 * Un bloque de HTML propio.
 *
 * Es la salida para lo que el editor no cubre: incrustar un reproductor, un
 * mapa, una tabla, un trozo de maquetación a mano. Es un bloque y no un campo
 * de una sección porque lo que se incrusta necesita **sitio propio** y poder
 * ir donde haga falta, no meterse dentro de otra cosa.
 *
 * Lo que se escribe pasa por `sanearHtml` antes de salir. Ver ahí el porqué —
 * en resumen: acaba en una página que abren los invitados, y en la vista
 * previa comparte origen con el editor.
 */
const htmlPropio: BlockSpec = {
  type: "html",
  label: "HTML",
  icon: "‹›",
  repeatable: true,
  fields: [
    { key: "label", label: "Antetítulo", type: "text", placeholder: "Opcional" },
    { key: "title", label: "Título", type: "text", placeholder: "Opcional" },
    {
      key: "codigo",
      label: "Tu HTML",
      type: "textarea",
      span: 2,
      placeholder: '<iframe src="https://open.spotify.com/embed/..."></iframe>',
      help: "Se limpia antes de publicar: fuera scripts, manejadores de eventos y enlaces que ejecutan. Los iframes se aceptan de YouTube, Vimeo, Spotify, SoundCloud, Apple Music, Instagram, Google Maps, Drive y Calendar.",
    },
    { key: "textColor", label: "Color de las letras", type: "color", span: 2 },
  ],
  variants: [
    {
      id: "simple",
      name: "En el ancho del texto",
      hint: "Como el resto de las secciones",
      build: () => `${head()}
    <div class="inv-html" data-inv="html.codigo"></div>`,
    },
    {
      id: "ancho",
      name: "Ancho",
      hint: "Más aire a los lados, para una tabla o un mapa",
      build: () => `${head()}
    <div class="inv-html inv-html-ancho" data-inv="html.codigo"></div>`,
    },
    {
      id: "completa",
      name: "A sangre",
      hint: "De borde a borde, sin márgenes",
      bare: true,
      build: () => `<div class="inv-html inv-html-completa" data-inv="html.codigo"></div>`,
    },
  ],
};

/* ── Registro ─────────────────────────────────────────────── */

export const BLOCKS: BlockSpec[] = [
  countdown,
  guests,
  events,
  confirmacion,
  gallery,
  features,
  regalos,
  redes,
  paragraph,
  photo,
  video,
  ubicacion,
  htmlPropio,
];

/*
 * La capa detrás del texto, a todos los bloques que traen campos propios.
 *
 * Los ocho bloques de sección la reciben por su `SectionSpec`; los cinco
 * nuevos —párrafo, foto, vídeo, ubicación, HTML— declaran sus campos aquí y
 * se quedarían sin ella. Aquí y no escrita en cada uno por lo de siempre:
 * son cinco sitios, bastaba olvidarse en uno, y el sexto que se añada la
 * tendría que recordar. Empezó siendo sólo del párrafo y ése fue el error
 * que se está deshaciendo.
 */
for (const b of BLOCKS) {
  if (b.fields) b.fields = [...b.fields, ...panelFields];
}

export const BLOCK_BY_TYPE: Record<string, BlockSpec> = Object.fromEntries(
  BLOCKS.map((b) => [b.type, b])
);

/** Los que se pueden agregar desde el botón "+ Agregar bloque". */
export const ADDABLE = BLOCKS.filter((b) => b.repeatable);

/** Orden inicial, y el que se usa para migrar invitaciones viejas. */
export const DEFAULT_ORDER = [
  "countdown",
  "guests",
  "events",
  "confirm",
  "gallery",
  "features",
  "gifts",
  "social",
];

let contador = 0;
export function newBlockId(type: string): string {
  contador += 1;
  return `${type}-${Date.now().toString(36)}${contador.toString(36)}`;
}

export function defaultLayout(): Block[] {
  return DEFAULT_ORDER.map((type) => ({ id: `${type}-0`, type, variant: "" }));
}

export function variantOf(spec: BlockSpec, id: string): VariantSpec | undefined {
  return spec.variants.find((v) => v.id === id);
}

/**
 * El orden vive en `data.layout.blocks`, dentro de una entrada de sección
 * cualquiera, para no cambiar la forma de `InvitationData` ni el guardado del
 * editor. Al leer se completan los bloques que falten: así una invitación
 * creada antes de que existieran los bloques sigue abriendo bien.
 */
export function readLayout(data: Record<string, SectionData>): Block[] {
  const guardados = (data.layout?.blocks as Block[] | undefined) || [];
  const limpios = guardados.filter(
    (b) => b && typeof b.id === "string" && BLOCK_BY_TYPE[b.type]
  );
  const presentes = new Set(limpios.map((b) => b.type));
  const faltantes = DEFAULT_ORDER.filter((t) => !presentes.has(t)).map((type) => ({
    id: `${type}-0`,
    type,
    variant: "",
  }));
  const todos = [...limpios, ...faltantes];
  return todos.length ? todos : defaultLayout();
}

/** Datos iniciales de un bloque que se agrega desde el editor. */
export function blockDefaults(spec: BlockSpec): SectionData {
  if (spec.type === "paragraph") {
    return {
      enabled: true,
      label: "",
      title: "Nuestra historia",
      text: "Escribe aquí lo que quieras contar.",
      textColor: "",
    };
  }
  if (spec.type === "gallery") {
    return { enabled: true, label: "", title: "Más fotos", text: "", items: [] };
  }
  if (spec.type === "photo") {
    return { enabled: true, url: "", label: "", title: "", caption: "", textColor: "" };
  }
  if (spec.type === "video") {
    return {
      enabled: true, fuente: "youtube", youtubeUrl: "", url: "", poster: "",
      reproduccion: "controles", label: "", title: "Nuestro vídeo", caption: "",
      textColor: "",
    };
  }
  if (spec.type === "ubicacion") {
    return {
      enabled: true, label: "Dónde nos vemos", title: "La ubicación", text: "",
      place: "", address: "", query: "", mapUrl: "", buttonText: "Cómo llegar", textColor: "",
    };
  }
  return { enabled: true };
}
