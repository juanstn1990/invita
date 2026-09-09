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
    <p class="guests-text">Mensaje de cierre</p>
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
  ],
};

/* ── Ubicación (bloque nuevo) ─────────────────────────────── */

const fichaMapa = `<div class="inv-mapa-datos">
        <p class="inv-mapa-lugar">Lugar</p>
        <p class="inv-mapa-dir">Dirección</p>
        <a class="inv-mapa-btn" href="#" target="_blank" rel="noopener">Cómo llegar</a>
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
];

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
