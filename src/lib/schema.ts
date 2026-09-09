/**
 * Esquema canónico de una invitación.
 *
 * Los 14 templates de `templates/` comparten el mismo modelo de contenido
 * (splash → hero → countdown → invitados → eventos → confirmación →
 * galería → info → regalos), sólo cambia la piel. Este archivo es la única
 * fuente de verdad: describe qué campos existen, cómo se llaman en el
 * formulario del editor y qué valor traen por defecto.
 *
 * `src/lib/bindings.ts` mapea cada campo de aquí a un selector CSS dentro de
 * cada template; `src/lib/render.ts` aplica ese mapa sobre el HTML.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "datetime"
  | "url"
  | "tel"
  | "image"
  | "emoji"
  | "select"
  | "range"
  | "color"
  /** Varias fotos, con orden. Sólo en el constructor visual. */
  | "gallery";

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  /** Sólo para "range". */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Posición del control cuando el campo está vacío (= lo que trae el diseño). */
  fallback?: number;
  /** Ancho en la grilla del formulario: 1 = media fila, 2 = fila completa. */
  span?: 1 | 2;
}

export interface ListSpec {
  key: string;
  label: string;
  /** Singular, para el botón "+ agregar ___". */
  itemLabel: string;
  min: number;
  max: number;
  fields: FieldSpec[];
  defaultItem: Record<string, string>;
}

export interface SectionSpec {
  key: string;
  label: string;
  icon: string;
  /** Si es false, la sección no se puede apagar (hero, footer, datos). */
  optional: boolean;
  /** Nota que se muestra bajo el título de la sección en el editor. */
  hint?: string;
  fields: FieldSpec[];
  list?: ListSpec;
  /**
   * La sección acepta imagen de fondo propia. La portada no: su fondo ya es
   * la foto del organizador, y dos fondos compitiendo no significan nada.
   */
  fondo?: boolean;
  /** La sección acepta adornos. Todas menos `event`, que no se dibuja. */
  adornos?: boolean;
}

/* ────────────────────────────────────────────────────────────────
   Campos reutilizados
   ──────────────────────────────────────────────────────────────── */

const sectionHeaderFields = (
  labelPh: string,
  titlePh: string
): FieldSpec[] => [
  { key: "label", label: "Antetítulo", type: "text", placeholder: labelPh },
  { key: "title", label: "Título", type: "text", placeholder: titlePh },
];

/** Color de las letras. Vacío = el que trae el diseño. */
const textColor: FieldSpec = {
  key: "textColor",
  label: "Color de las letras",
  type: "color",
  span: 2,
  help: "Se aplica a toda la sección. Los botones y enlaces conservan su color.",
};

/**
 * Imagen de fondo de una sección.
 *
 * Es distinta de la decoración: el fondo cubre la sección entera y va detrás
 * de todo, mientras que un adorno es una pieza que se coloca donde se quiera
 * y puede ir encima del texto.
 */
const fondoFields: FieldSpec[] = [
  {
    key: "fondoUrl",
    label: "Imagen de fondo",
    type: "image",
    span: 2,
    help: "Cubre la sección entera, detrás del texto.",
  },
  {
    key: "fondoAjuste",
    label: "Cómo se ajusta",
    type: "select",
    fallback: 0,
    options: [
      { value: "", label: "Cubrir (recorta)" },
      { value: "contener", label: "Contener (entera)" },
      { value: "repetir", label: "Repetir en mosaico" },
    ],
  },
  {
    key: "fondoOpacidad",
    label: "Opacidad del fondo",
    type: "range",
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    fallback: 100,
  },
];

/* ────────────────────────────────────────────────────────────────
   Adornos
   ──────────────────────────────────────────────────────────────── */

/** Las nueve posiciones de un adorno dentro de su sección. */
export const SITIOS: { value: string; label: string }[] = [
  { value: "arriba-izq", label: "Arriba a la izquierda" },
  { value: "arriba", label: "Arriba al centro" },
  { value: "arriba-der", label: "Arriba a la derecha" },
  { value: "izq", label: "Al centro, a la izquierda" },
  { value: "centro", label: "Al centro" },
  { value: "der", label: "Al centro, a la derecha" },
  { value: "abajo-izq", label: "Abajo a la izquierda" },
  { value: "abajo", label: "Abajo al centro" },
  { value: "abajo-der", label: "Abajo a la derecha" },
  { value: "sangre", label: "A sangre (cubre la sección)" },
];

/**
 * Los adornos de una sección: imágenes que el organizador coloca donde
 * quiera, del tamaño que quiera, delante o detrás del texto.
 *
 * Cada sección tiene su propia lista. Es lo que permite poner un marco floral
 * en la portada y una guirnalda sólo en el pie sin que el diseño tenga que
 * saber nada de ninguno de los dos.
 */
export const ADORNOS: ListSpec = {
  key: "adornos",
  label: "Adornos",
  itemLabel: "adorno",
  min: 0,
  max: 8,
  fields: [
    { key: "url", label: "Imagen", type: "image", span: 2 },
    { key: "sitio", label: "Dónde", type: "select", options: SITIOS, fallback: 0 },
    {
      key: "tamano",
      label: "Tamaño",
      type: "range",
      min: 5,
      max: 100,
      step: 1,
      unit: "% del ancho",
      fallback: 40,
    },
    {
      key: "capa",
      label: "Capa",
      type: "select",
      fallback: 0,
      options: [
        { value: "", label: "Debajo del texto" },
        { value: "encima", label: "Encima del texto" },
      ],
      help: "Encima tapa el texto, así que conviene bajarle la opacidad.",
    },
    {
      key: "opacidad",
      label: "Opacidad",
      type: "range",
      min: 5,
      max: 100,
      step: 5,
      unit: "%",
      fallback: 100,
    },
    { key: "giro", label: "Giro", type: "range", min: -180, max: 180, step: 5, unit: "°", fallback: 0 },
    {
      key: "espejo",
      label: "Voltear",
      type: "select",
      fallback: 0,
      options: [
        { value: "", label: "Como está" },
        { value: "h", label: "En horizontal" },
        { value: "v", label: "En vertical" },
        { value: "hv", label: "En las dos" },
      ],
      help: "Para usar una misma esquina en los cuatro lados.",
    },
  ],
  defaultItem: { url: "", sitio: "arriba-izq", tamano: "40", capa: "", opacidad: "100", giro: "0", espejo: "" },
};

/* ────────────────────────────────────────────────────────────────
   Secciones
   ──────────────────────────────────────────────────────────────── */

/**
 * Formas y sitios de la foto de portada.
 *
 * La portada es lo más de autor de cada diseño —marcos, adornos, marcas de
 * agua— así que estas variaciones **no rehacen su marcado**: sólo cambian
 * dónde se coloca la foto y con qué recorte. Todo lo demás sigue siendo del
 * template.
 *
 * `forma` es el recorte y `donde` dice si la foto va antes o después del
 * bloque de los nombres; `fondo` es el comportamiento de siempre, a sangre
 * detrás de todo.
 */
export interface HeroDisposicion {
  id: string;
  name: string;
  hint: string;
  forma: "fondo" | "circulo" | "ovalo" | "arco" | "marco" | "tarjeta" | "banda";
  donde: "fondo" | "antes" | "despues";
}

export const HERO_DISPOSICIONES: HeroDisposicion[] = [
  { id: "", name: "A sangre", hint: "La foto de fondo, detrás de todo, como viene el diseño",
    forma: "fondo", donde: "fondo" },
  { id: "circulo", name: "Círculo arriba", hint: "Recortada en redondo, sobre los nombres",
    forma: "circulo", donde: "antes" },
  { id: "circulo-abajo", name: "Círculo abajo", hint: "Recortada en redondo, bajo los nombres",
    forma: "circulo", donde: "despues" },
  { id: "arco", name: "Arco", hint: "Rematada en arco sobre los nombres, como una portada de capilla",
    forma: "arco", donde: "antes" },
  { id: "arco-abajo", name: "Arco abajo", hint: "El mismo arco, bajo los nombres",
    forma: "arco", donde: "despues" },
  { id: "ovalo", name: "Óvalo", hint: "Un óvalo vertical, al modo antiguo",
    forma: "ovalo", donde: "antes" },
  { id: "marco", name: "Con marco", hint: "Con paspartú blanco y sombra, como una foto puesta encima",
    forma: "marco", donde: "antes" },
  { id: "tarjeta", name: "Tarjeta abajo", hint: "Apaisada y con las esquinas redondeadas, bajo los nombres",
    forma: "tarjeta", donde: "despues" },
  { id: "banda", name: "Banda arriba", hint: "Una franja de lado a lado sobre los nombres",
    forma: "banda", donde: "antes" },
  { id: "banda-abajo", name: "Banda abajo", hint: "La misma franja, bajo los nombres",
    forma: "banda", donde: "despues" },
];

export const HERO_POR_ID: Record<string, HeroDisposicion> = Object.fromEntries(
  HERO_DISPOSICIONES.map((d) => [d.id, d])
);

export const SECTIONS: SectionSpec[] = [
  {
    key: "event",
    label: "Datos del evento",
    icon: "◈",
    optional: false,
    hint: "Se usan en toda la invitación: portada, cuenta atrás, pie de página.",
    fields: [
      {
        key: "type",
        label: "Tipo de evento",
        type: "select",
        options: [
          { value: "boda", label: "Boda" },
          { value: "quince", label: "Quince años" },
          { value: "comunion", label: "Primera comunión / Bautizo" },
          { value: "primer-ano", label: "Primer añito" },
          { value: "baby-shower", label: "Baby shower" },
          { value: "cumpleanos", label: "Cumpleaños" },
          { value: "grado", label: "Grado" },
          { value: "otro", label: "Otro" },
        ],
      },
      { key: "name1", label: "Nombre principal", type: "text", placeholder: "Juan" },
      {
        key: "name2",
        label: "Segundo nombre",
        type: "text",
        placeholder: "María",
        help: "Déjalo vacío si la invitación es de una sola persona (quince, cumpleaños).",
      },
      {
        key: "paleta",
        label: "Paleta de colores",
        type: "select",
        span: 2,
        fallback: 0,
        /* Las opciones las pone el editor: dependen del diseño elegido, y el
           esquema no sabe cuál es. Vacío = la paleta por defecto. */
        options: [],
        help: "Cambia los colores sin cambiar el diseño.",
      },
      {
        key: "date",
        label: "Fecha y hora",
        type: "datetime",
        span: 2,
        help: "Alimenta la cuenta atrás en vivo.",
      },
      {
        key: "dateLabel",
        label: "Fecha como se muestra",
        type: "text",
        span: 2,
        placeholder: "15 · Noviembre · 2025",
        help: "Texto libre. Si lo dejas vacío se genera desde la fecha.",
      },
      { key: "city", label: "Ciudad", type: "text", placeholder: "Bogotá" },
      {
        key: "quote",
        label: "Frase",
        type: "textarea",
        span: 2,
        placeholder: "El amor no se mira, se vive juntos mirando en la misma dirección.",
      },
    ],
  },

  {
    key: "splash",
    label: "Pantalla de bienvenida",
    icon: "✦",
    optional: true,
    hint: "El velo que se ve antes de entrar a la invitación.",
    fields: [
      { key: "label", label: "Antetítulo", type: "text", placeholder: "Te invitamos a celebrar" },
      { key: "subtitle", label: "Subtítulo", type: "text", placeholder: "Nuestra Boda" },
      { key: "ctaPrimary", label: "Botón principal", type: "text", placeholder: "Abrir invitación" },
      { key: "ctaSecondary", label: "Botón secundario", type: "text", placeholder: "Confirmar asistencia" },
      {
        key: "musicUrl",
        label: "Música de fondo (URL .mp3)",
        type: "url",
        span: 2,
        help: "Opcional. Si la pones, la invitación ofrece entrar con música.",
      },
      textColor,
    ],
  },

  {
    key: "hero",
    label: "Portada",
    icon: "❖",
    optional: false,
    fields: [
      { key: "label", label: "Antetítulo", type: "text", placeholder: "Te invitamos a nuestra" },
      { key: "subtitle", label: "Subtítulo", type: "text", placeholder: "Nuestra Boda" },
      { key: "cta", label: "Texto del botón", type: "text", placeholder: "Descubrir más" },
      {
        key: "panelOpacity",
        label: "Opacidad del contenedor",
        type: "range",
        span: 2,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        fallback: 75,
        help: "Qué tan opaco es el bloque donde van los nombres. En 0 el texto queda directo sobre la foto.",
      },
      {
        key: "backgroundUrl",
        label: "Foto de portada",
        type: "image",
        span: 2,
        help: "Opcional. Sin foto se usa el fondo original del diseño.",
      },
      {
        key: "disposicion",
        label: "Cómo va la foto",
        type: "select",
        span: 2,
        options: HERO_DISPOSICIONES.map((d) => ({ value: d.id, label: d.name })),
        help: "A sangre detrás de todo, o recortada en una forma sobre los nombres.",
      },
      textColor,
    ],
  },

  {
    key: "countdown",
    label: "Cuenta atrás",
    icon: "◷",
    optional: true,
    hint: "Corre en vivo contra la fecha del evento.",
    fields: [
      ...sectionHeaderFields("La cuenta atrás", "¡Faltan solo…!"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      textColor,
    ],
  },

  {
    key: "guests",
    label: "Invitados",
    icon: "❥",
    optional: true,
    fields: [
      {
        key: "saludoInvitado",
        label: "Saludo para quien abre su link",
        type: "text",
        span: 2,
        placeholder: "Con mucho cariño para {nombre}",
        help: "Sólo se ve cuando la dirección trae nombres (?invitado=…). Déjalo vacío para no mostrar nada.",
      },
      ...sectionHeaderFields("Con todo nuestro amor", "Queridos invitados"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      { key: "textSecondary", label: "Mensaje de cierre", type: "textarea", span: 2 },
      { key: "address", label: "Línea de lugar y fecha", type: "text", span: 2 },
      textColor,
    ],
    // Sin lista de nombres: los nombres son los de quien abre su enlace y
    // llegan por la dirección. Una lista fija aquí sólo servía para que todas
    // las invitaciones enseñaran los mismos invitados de ejemplo.
  },

  {
    key: "events",
    label: "Programa",
    icon: "◐",
    optional: true,
    hint: "Ceremonia, cóctel, fiesta… cada momento con su hora y lugar.",
    fields: [
      ...sectionHeaderFields("El gran día", "Programa"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      textColor,
    ],
    list: {
      key: "items",
      label: "Momentos",
      itemLabel: "momento",
      min: 1,
      max: 6,
      fields: [
        { key: "icon", label: "Ícono", type: "emoji", placeholder: "⛪" },
        { key: "title", label: "Momento", type: "text", placeholder: "Ceremonia" },
        { key: "kind", label: "Tipo", type: "text", placeholder: "Ceremonia religiosa" },
        { key: "time", label: "Hora", type: "text", placeholder: "12:00 h" },
        { key: "place", label: "Lugar", type: "text", placeholder: "Iglesia de Santa María" },
        { key: "address", label: "Dirección", type: "text", span: 2 },
        { key: "note", label: "Nota", type: "text", span: 2, placeholder: "Duración aproximada: 1 hora" },
        { key: "mapUrl", label: "Link al mapa", type: "url", span: 2 },
      ],
      defaultItem: {
        icon: "🥂",
        kind: "Fiesta",
        title: "Celebración",
        time: "20:00 h",
        place: "Salón de eventos",
        address: "",
        note: "",
        mapUrl: "",
      },
    },
  },

  {
    key: "confirm",
    label: "Confirmación (RSVP)",
    icon: "✓",
    optional: true,
    fields: [
      ...sectionHeaderFields("¿Vendrás?", "Confirma tu asistencia"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      { key: "deadlineText", label: "Fecha límite", type: "text", placeholder: "1 de Noviembre de 2025" },
      { key: "note", label: "Nota de cierre", type: "text", placeholder: "¡Tu presencia es el mejor regalo!" },
      {
        key: "mode",
        label: "Cómo confirman",
        type: "select",
        options: [
          { value: "form", label: "Formulario en la invitación" },
          { value: "whatsapp", label: "Abrir WhatsApp" },
        ],
        span: 2,
        help: "El formulario es el mismo en todos los diseños y toma los colores de cada uno. Si le agregas ?invitado=Nombre a la dirección, saluda por ese nombre y esconde el campo; con varios nombres separados por coma, aparece una casilla por persona.",
      },
      {
        key: "greeting",
        label: "Saludo cuando el link trae el nombre",
        type: "text",
        span: 2,
        placeholder: "Hola, {nombre}",
        help: "Usa {nombre} donde quieras que aparezca el nombre del invitado.",
      },
      { key: "buttonText", label: "Texto del botón", type: "text", placeholder: "Confirmar asistencia" },
      { key: "declineText", label: "Botón de \"no puedo\"", type: "text", placeholder: "No podré ir" },
      {
        key: "whatsapp",
        label: "WhatsApp",
        type: "tel",
        span: 2,
        placeholder: "573001234567",
        help: "Con indicativo de país, sin + ni espacios. Sólo si elegiste WhatsApp.",
      },
      textColor,
    ],
  },

  {
    key: "gallery",
    label: "Galería",
    icon: "▣",
    optional: true,
    hint: "Sin foto, cada casilla conserva el marcador del diseño original.",
    fields: [
      ...sectionHeaderFields("Nuestra historia", "Momentos juntos"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      textColor,
    ],
    list: {
      key: "items",
      label: "Fotos",
      itemLabel: "foto",
      min: 0,
      max: 12,
      fields: [{ key: "url", label: "URL de la foto", type: "image", span: 2 }],
      defaultItem: { url: "" },
    },
  },

  {
    key: "features",
    label: "Información útil",
    icon: "☰",
    optional: true,
    hint: "Dresscode, transporte, alojamiento, qué llevar…",
    fields: [...sectionHeaderFields("Información útil", "Todo lo que necesitas saber"), textColor],
    list: {
      key: "items",
      label: "Tarjetas",
      itemLabel: "tarjeta",
      min: 1,
      max: 8,
      fields: [
        { key: "icon", label: "Ícono", type: "emoji", placeholder: "👗" },
        { key: "title", label: "Título", type: "text", placeholder: "Dresscode" },
        { key: "text", label: "Texto", type: "textarea", span: 2 },
      ],
      defaultItem: { icon: "✨", title: "Nuevo detalle", text: "Describe aquí la información." },
    },
  },

  {
    key: "gifts",
    label: "Mesa de regalos",
    icon: "❁",
    optional: true,
    fields: [
      ...sectionHeaderFields("Con mucho cariño", "Mesa de regalos"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      { key: "bankLabel", label: "Etiqueta de la cuenta", type: "text", placeholder: "Transferencia bancaria" },
      { key: "account", label: "Número de cuenta", type: "text", placeholder: "Bancolombia · 123-456789-00" },
      { key: "note", label: "Nota", type: "text", span: 2, placeholder: "Concepto: tu nombre" },
      { key: "url", label: "Link externo", type: "url", span: 2, help: "Amazon, Falabella, etc." },
      textColor,
    ],
    list: {
      key: "items",
      label: "Opciones de regalo",
      itemLabel: "opción",
      min: 0,
      max: 6,
      fields: [
        { key: "icon", label: "Ícono", type: "emoji", placeholder: "🎁" },
        { key: "title", label: "Título", type: "text" },
        { key: "text", label: "Descripción", type: "textarea", span: 2 },
        { key: "url", label: "Link", type: "url", span: 2 },
      ],
      defaultItem: { icon: "🎁", title: "Regalo", text: "", url: "" },
    },
  },

  {
    key: "social",
    label: "Redes y hashtag",
    icon: "#",
    optional: true,
    hint: "Sólo algunos diseños tienen esta sección.",
    fields: [
      ...sectionHeaderFields("Compártelo", "Nuestro hashtag"),
      { key: "text", label: "Mensaje", type: "textarea", span: 2 },
      { key: "hashtag", label: "Hashtag", type: "text", placeholder: "#JuanYMaria2025" },
      { key: "instagram", label: "Instagram", type: "text", placeholder: "@juanymaria" },
      textColor,
    ],
  },

  {
    key: "footer",
    label: "Pie de página",
    icon: "—",
    optional: false,
    fields: [
      { key: "dateLine", label: "Línea de fecha", type: "text", span: 2, placeholder: "15 · Noviembre · 2025 · Sevilla" },
      { key: "note", label: "Nota final", type: "text", span: 2, placeholder: "Diseñado con amor" },
      textColor,
    ],
  },
];

/*
 * El fondo y los adornos se añaden aquí, sobre las secciones ya declaradas, y
 * no campo por campo en cada una: son doce secciones y bastaría olvidarse en
 * una para que el organizador no entienda por qué ahí no puede poner fondo.
 *
 * `event` queda fuera porque no es una sección que se dibuje —son los datos
 * del evento—, y la portada queda fuera del fondo porque ese sitio ya lo
 * ocupa su foto.
 */
for (const spec of SECTIONS) {
  if (spec.key === "event") continue;
  spec.adornos = true;
  if (spec.key !== "hero") {
    spec.fondo = true;
    spec.fields = [...spec.fields, ...fondoFields];
  }
}

export const SECTION_BY_KEY: Record<string, SectionSpec> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s])
);

/* ────────────────────────────────────────────────────────────────
   Datos
   ──────────────────────────────────────────────────────────────── */

export type SectionData = Record<string, unknown> & {
  enabled?: boolean;
  items?: Record<string, string>[];
  /** Tipografía elegida por campo: { title: "playfair", … }. */
  fonts?: Record<string, string>;
};

/**
 * Los datos de una invitación. Además de una entrada por sección, lleva una
 * entrada especial `layout` con el orden y la variante de cada bloque (ver
 * `readLayout` en `blocks.ts`).
 */
export type InvitationData = Record<string, SectionData>;

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** "2025-11-15T12:00" → "15 · Noviembre · 2025" */
export function formatDateLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return "";
  return `${Number(m[3])} · ${MESES[Number(m[2]) - 1]} · ${m[1]}`;
}

/** "2025-11-15T12:00" → "sábado 15 de noviembre de 2025" */
export function formatDateLong(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return "";
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1].toLowerCase()} de ${m[1]}`;
}

export function coupleName(data: InvitationData): string {
  const ev = data.event || {};
  const a = String(ev.name1 || "").trim();
  const b = String(ev.name2 || "").trim();
  return b ? `${a} & ${b}` : a;
}

export function resolvedDateLabel(data: InvitationData): string {
  const ev = data.event || {};
  const custom = String(ev.dateLabel || "").trim();
  return custom || formatDateLabel(String(ev.date || ""));
}

/** Datos iniciales de una invitación nueva. */
export function defaultData(): InvitationData {
  return {
    layout: {
      blocks: [
        "countdown", "guests", "events", "confirm",
        "gallery", "features", "gifts", "social",
      ].map((type) => ({ id: `${type}-0`, type, variant: "" })),
    },
    event: {
      type: "boda",
      name1: "Juan",
      name2: "María",
      date: "2026-11-15T12:00",
      dateLabel: "",
      city: "Bogotá",
      quote: "El amor no se mira, se vive juntos mirando en la misma dirección.",
    },
    splash: {
      enabled: true,
      textColor: "",
      label: "Te invitamos a celebrar",
      subtitle: "Nuestra Boda",
      ctaPrimary: "Abrir invitación",
      ctaSecondary: "Confirmar asistencia",
      musicUrl: "",
    },
    hero: {
      enabled: true,
      textColor: "",
      label: "Te invitamos a nuestra",
      subtitle: "Nuestra Boda",
      cta: "Descubrir más",
      // Vacío = se respeta la opacidad que trae el diseño.
      panelOpacity: "",
      backgroundUrl: "",
    },
    countdown: {
      enabled: true,
      textColor: "",
      label: "La cuenta atrás",
      title: "¡Faltan solo…!",
      text: "Cada momento nos acerca más a este día tan esperado.",
    },
    guests: {
      enabled: true,
      textColor: "",
      label: "Con todo nuestro amor",
      title: "Queridos invitados",
      text: "Queremos compartir con ustedes el día más especial de nuestras vidas. Su presencia lo hará inolvidable.",
      textSecondary: "Los esperamos con los brazos abiertos.",
      address: "",
      items: [],
    },
    events: {
      enabled: true,
      textColor: "",
      label: "El gran día",
      title: "Programa",
      text: "",
      items: [
        {
          icon: "⛪",
          kind: "Ceremonia religiosa",
          title: "Ceremonia",
          time: "12:00 h",
          place: "Iglesia de Santa María",
          address: "Plaza de la Catedral s/n",
          note: "Duración aproximada: 1 hora",
          mapUrl: "",
        },
        {
          icon: "🥂",
          kind: "Fiesta",
          title: "Celebración",
          time: "14:30 h",
          place: "Hacienda El Cortijo",
          address: "Carretera de Carmona km 8",
          note: "Aperitivo · Cena · Baile",
          mapUrl: "",
        },
      ],
    },
    confirm: {
      enabled: true,
      textColor: "",
      label: "¿Vendrás?",
      title: "Confirma tu asistencia",
      text: "Por favor confirma tu asistencia. Esto nos ayudará a planear el mejor día posible para todos.",
      deadlineText: "",
      note: "¡Tu presencia es el mejor regalo!",
      mode: "form",
      greeting: "Hola, {nombre}",
      buttonText: "Confirmar asistencia",
      declineText: "No podré ir",
      whatsapp: "",
    },
    gallery: {
      enabled: true,
      textColor: "",
      label: "Nuestra historia",
      title: "Momentos juntos",
      text: "",
      items: [],
    },
    features: {
      enabled: true,
      textColor: "",
      label: "Información útil",
      title: "Todo lo que necesitas saber",
      items: [
        { icon: "corbatin", title: "Dresscode", text: "Formal elegante." },
        { icon: "🚗", title: "Transporte", text: "Habrá parqueadero disponible en el lugar." },
        { icon: "📸", title: "Fotografías", text: "Compartiremos un álbum con todos los invitados." },
      ],
    },
    gifts: {
      enabled: true,
      textColor: "",
      label: "Con mucho cariño",
      title: "Mesa de regalos",
      text: "Su presencia es nuestro mejor regalo. Si desean acompañarnos con un detalle, aquí dejamos los datos.",
      bankLabel: "Transferencia bancaria",
      account: "",
      note: "",
      url: "",
      items: [],
    },
    social: {
      enabled: true,
      textColor: "",
      label: "Compártelo",
      title: "Nuestro hashtag",
      text: "",
      hashtag: "",
      instagram: "",
    },
    footer: {
      enabled: true,
      textColor: "",
      dateLine: "",
      note: "",
    },
  };
}
