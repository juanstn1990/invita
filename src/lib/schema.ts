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
  /** Un vídeo subido. Se guarda igual que una imagen; cambia el que lo pinta. */
  | "video"
  /** Una canción subida. Igual que el vídeo, con un reproductor de audio. */
  | "audio"
  /**
   * Una foto **o** un vídeo, a elección de quien edita.
   *
   * Lo pide el fondo de sección: un clip de cuatro segundos en bucle detrás
   * del texto es el mismo sitio que una foto, y obligar a elegir el tipo
   * antes de elegir el archivo sería un campo más para decir lo que el
   * archivo ya dice.
   */
  | "medio"
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
  /**
   * Muéstralo sólo si otro campo de la misma sección vale esto.
   *
   * Lo pide el bloque de vídeo: con la fuente en YouTube, el campo de subir
   * archivo y el de la portada no tienen nada que hacer ahí, y un formulario
   * con la mitad de los campos sin sentido es un formulario en el que se
   * llena el equivocado.
   */
  showIf?: { key: string; value: string | string[] };
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
 * El fondo propio de una ficha: una tarjeta del programa, una de información.
 *
 * Imagen y no vídeo a propósito. Un programa puede tener ocho fichas, y ocho
 * vídeos reproduciéndose a la vez en un teléfono no es una invitación bonita,
 * es un teléfono caliente. Donde sí cabe un vídeo es en el fondo de la
 * sección entera, que es uno.
 *
 * El velo va del color de la propia tarjeta, no de un gris: sobre una foto
 * cualquiera la tinta deja de leerse, y aquí el texto es lo único que la
 * ficha tiene que decir.
 */
const fichaFondoFields: FieldSpec[] = [
  {
    key: "fondo",
    label: "Fondo de la ficha",
    type: "image",
    span: 2,
    help: "Opcional. Cada ficha puede llevar el suyo.",
  },
  {
    key: "fondoVelo",
    label: "Velo sobre el fondo",
    type: "range",
    min: 0,
    max: 90,
    step: 5,
    unit: "%",
    fallback: 45,
    span: 2,
    help: "Súbelo hasta que el texto se lea cómodo.",
  },
];

/**
 * Un archivo que se reproduce en vez de mostrarse.
 *
 * Se decide por la extensión y no por el `mime`, porque aquí sólo hay la URL:
 * lo que se guarda en la invitación es una cadena, y el catálogo con el tipo
 * real vive en otra tabla. No es una pérdida: las URLs las emite `saveImage`
 * con la extensión que corresponde al tipo que aceptó, y una ajena que
 * termine en `.mp4` es un `.mp4`.
 *
 * Vive aquí y no en `storage.ts` —que es quien manda en los formatos— porque
 * eso abre `fs` y el editor es código de navegador.
 */
export const esVideoUrl = (url: string) =>
  /\.(mp4|webm)(?:[?#]|$)/i.test(String(url || "").trim());

/**
 * Fondo de una sección: una foto o un vídeo.
 *
 * Es distinto de la decoración: el fondo cubre la sección entera y va detrás
 * de todo, mientras que un adorno es una pieza que se coloca donde se quiera
 * y puede ir encima del texto.
 */
const fondoFields: FieldSpec[] = [
  {
    key: "fondoUrl",
    label: "Fondo de la sección",
    type: "medio",
    span: 2,
    help: "Una foto o un vídeo MP4. Cubre la sección entera, detrás del texto.",
  },
  {
    key: "fondoAjuste",
    label: "Cómo se ajusta",
    type: "select",
    fallback: 0,
    options: [
      { value: "", label: "Cubrir (recorta)" },
      { value: "contener", label: "Contener (entera)" },
      { value: "repetir", label: "Repetir en mosaico (sólo foto)" },
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
  /* Va al final a propósito: los nueve anclajes son la vía rápida para lo
     normal —una esquina, el centro— y bajar a dos números es lo que se elige
     cuando ninguno de los nueve sirve. */
  { value: "libre", label: "Libre: yo pongo dónde" },
];

/**
 * Las partículas que pueden caer sobre toda la invitación.
 *
 * Se dibujan con lo que ya hay —el juego de iconos vendorizado y geometría—
 * y no con una librería: tsParticles y compañía traen el motor, no las
 * mariposas; las formas hay que dárselas igual. Y este proyecto no le pide
 * un archivo a nadie, hay una auditoría que falla si una invitación contacta
 * un dominio externo. Una capa propia son unos pocos kB sobre una invitación
 * que entera pesa cuarenta y cinco.
 *
 * `movimiento` es lo único que necesita el CSS para saber qué animación
 * ponerle: si cae de arriba, si sube desde abajo o si flota en su sitio.
 */
export const TIPOS_PARTICULA: { value: string; label: string; movimiento: "cae" | "sube" | "flota" }[] = [
  { value: "", label: "Ninguna", movimiento: "cae" },
  { value: "petalos", label: "Pétalos", movimiento: "cae" },
  { value: "hojas", label: "Hojas", movimiento: "cae" },
  { value: "nieve", label: "Nieve", movimiento: "cae" },
  { value: "confeti", label: "Confeti", movimiento: "cae" },
  { value: "corazones", label: "Corazones", movimiento: "cae" },
  { value: "notas", label: "Notas musicales", movimiento: "cae" },
  { value: "burbujas", label: "Burbujas", movimiento: "sube" },
  { value: "globos", label: "Globos", movimiento: "sube" },
  { value: "mariposas", label: "Mariposas", movimiento: "flota" },
  { value: "luciernagas", label: "Luciérnagas", movimiento: "flota" },
  { value: "destellos", label: "Destellos", movimiento: "flota" },
  { value: "estrellas", label: "Estrellas", movimiento: "flota" },
];

export const PARTICULA_POR_TIPO = Object.fromEntries(
  TIPOS_PARTICULA.filter((t) => t.value).map((t) => [t.value, t])
);

/**
 * Cómo se alinea un texto suelto.
 *
 * Vacío es "la del diseño", que casi siempre es centrado: eso es lo que hace
 * que el control no cambie nada hasta tocarlo, y que un diseño que alinea a
 * la izquierda a propósito —Editorial— siga haciéndolo.
 */
export const ALINEACIONES: { value: string; label: string; icono: string }[] = [
  { value: "izq", label: "A la izquierda", icono: "⇤" },
  { value: "centro", label: "Centrado", icono: "↔" },
  { value: "der", label: "A la derecha", icono: "⇥" },
  { value: "justificado", label: "Justificado", icono: "≡" },
];

/** Del valor guardado a lo que entiende el CSS. */
export const CSS_ALINEACION: Record<string, string> = {
  izq: "left",
  centro: "center",
  der: "right",
  justificado: "justify",
};

/**
 * Las animaciones que puede llevar **un texto suelto**.
 *
 * Distinto de la aparición de la sección, que ya existía y entra en bloque:
 * esto es por campo, así que el antetítulo puede fundirse mientras el título
 * se escribe letra a letra. Se guarda en `anim` de cada sección, igual que la
 * tipografía se guarda en `fonts` — mismo sitio, misma forma, misma manera de
 * llegar al renderer.
 *
 * Las tres primeras familias son entradas: corren una vez, cuando el texto se
 * asoma. Las últimas son de bucle y hay que usarlas con cuidado — tres cosas
 * latiendo a la vez en una pantalla no es una invitación animada, es una
 * pantalla inquieta.
 */
export const ANIMACIONES: { value: string; label: string }[] = [
  { value: "", label: "Sin animación" },
  { value: "aparece", label: "Se funde" },
  { value: "sube", label: "Sube al aparecer" },
  { value: "baja", label: "Cae al aparecer" },
  { value: "izquierda", label: "Entra por la izquierda" },
  { value: "derecha", label: "Entra por la derecha" },
  { value: "crece", label: "Crece desde pequeño" },
  { value: "gira", label: "Entra girando" },
  { value: "letras", label: "Letra a letra" },
  { value: "palabras", label: "Palabra a palabra" },
  { value: "maquina", label: "Máquina de escribir" },
  { value: "late", label: "Late, en bucle" },
  { value: "flota", label: "Flota, en bucle" },
  { value: "brilla", label: "Brilla, en bucle" },
];

/** Las que reparten el texto en trozos y lo animan uno a uno. */
export const ANIM_POR_PARTES = new Set(["letras", "palabras", "maquina"]);

/** Las que corren sin parar. Las demás entran una vez y se quedan quietas. */
export const ANIM_EN_BUCLE = new Set(["late", "flota", "brilla"]);

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
    {
      key: "url",
      label: "Imagen o vídeo",
      type: "medio",
      span: 2,
      help: "Un PNG con fondo transparente es lo que mejor queda. Un GIF o un WebP animado se ven animados, y un MP4 se reproduce mudo y en bucle.",
    },
    { key: "sitio", label: "Dónde", type: "select", options: SITIOS, fallback: 0 },
    /*
     * Las coordenadas del sitio «libre».
     *
     * En porcentaje de la sección y no en píxeles, y eso no es una
     * preferencia: la sección mide distinto en un iPhone SE que en un
     * escritorio, así que un adorno colocado en píxeles sobre una pantalla
     * aparece en otro sitio en la de quien recibe la invitación. El
     * porcentaje mantiene la proporción.
     *
     * Marcan el **centro** de la pieza, no su esquina, que es como se piensa
     * al colocar algo: "esto va en el medio del borde de arriba" son 50 y 0,
     * y no hay que restar medio adorno de cabeza.
     */
    {
      key: "x",
      label: "Horizontal",
      type: "range",
      min: 0, max: 100, step: 1, unit: "%",
      fallback: 50,
      showIf: { key: "sitio", value: "libre" },
    },
    {
      key: "y",
      label: "Vertical",
      type: "range",
      min: 0, max: 100, step: 1, unit: "%",
      fallback: 50,
      showIf: { key: "sitio", value: "libre" },
    },
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
    {
      key: "entrada",
      label: "Cómo aparece",
      type: "select",
      span: 2,
      options: [
        { value: "", label: "De una, sin efecto" },
        { value: "aparece", label: "Se desvanece hacia dentro" },
        { value: "sube", label: "Sube mientras aparece" },
        { value: "crece", label: "Crece desde pequeño" },
        { value: "gira", label: "Entra girando" },
        { value: "desliza", label: "Entra desde su borde" },
      ],
      help: "Se dispara cuando el adorno entra en pantalla, no al cargar. Si pones varios en una sección, entran uno detrás de otro.",
    },
    {
      key: "movimiento",
      label: "Movimiento",
      type: "select",
      span: 2,
      options: [
        { value: "", label: "Quieto" },
        { value: "flota", label: "Flota suavemente" },
        { value: "balancea", label: "Se balancea" },
        { value: "late", label: "Late" },
        { value: "respira", label: "Respira (aparece y se atenúa)" },
        { value: "destello", label: "Un destello de luz lo recorre" },
      ],
      help: "En bucle, lento y corto: es un adorno, no un reclamo. El destello sigue la silueta del adorno, así que luce en una filigrana dorada y se nota poco en una mancha plana.",
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
  defaultItem: {
    url: "", sitio: "arriba-izq", tamano: "40", capa: "", opacidad: "100",
    entrada: "", movimiento: "", giro: "0", espejo: "",
    /* Al centro, que es de donde se parte al arrastrarlo a otro sitio. */
    x: "50", y: "50",
  },
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
        /*
         * El color de los botones, para toda la invitación.
         *
         * Uno y no uno por sección: un botón que cambia de color según dónde
         * esté no se lee como el mismo botón. Reescribe `--accent` y
         * `--on-accent`, que es de donde salen todos —el de la portada, el de
         * confirmar, el del mapa, los del velo— sin tocar ninguno uno a uno.
         */
        key: "btnColor",
        label: "Color de los botones",
        type: "color",
        help: "Vacío = el acento de la paleta.",
      },
      {
        key: "btnInk",
        label: "Color de su texto",
        type: "color",
        help: "Las letras dentro del botón. Vacío = el que trae la paleta.",
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
      { key: "ctaSecondary", label: "Botón secundario", type: "text", placeholder: "Cómo llegar" },
      {
        key: "mapUrl",
        label: "Link de Google Maps",
        type: "url",
        span: 2,
        placeholder: "https://maps.app.goo.gl/...",
        help: "El botón secundario abre este link en otra pestaña. Sin link, el botón no aparece: uno que no lleva a ningún sitio es peor que ninguno.",
      },
      {
        /* La clave no cambia aunque el campo ya no sea una URL: lo guardado
           en las invitaciones de antes son direcciones, y siguen valiendo —
           el campo conserva el "o usar una URL" de siempre. */
        key: "musicUrl",
        label: "Música de fondo",
        type: "audio",
        span: 2,
        help: "Opcional. Suena al entrar, en bucle y con un botón para silenciarla. Ningún navegador la deja arrancar sola: empieza con el primer toque en la pantalla.",
      },
      {
        key: "introUrl",
        label: "Vídeo de apertura",
        type: "video",
        span: 2,
        help: "Se reproduce a pantalla completa al pulsar el botón y da paso a la invitación. Se corta siempre a los 5 segundos, así que sube el trozo que quieres que se vea: lo que haya después no se llega a ver y sólo pesa.",
      },
      {
        key: "introSonido",
        label: "Sonido del vídeo",
        type: "select",
        fallback: 0,
        options: [
          { value: "", label: "En silencio" },
          { value: "con", label: "Con sonido" },
        ],
        help: "Puede sonar porque ya hubo un toque en la pantalla. Si además hay música de fondo, la música espera a que el vídeo termine.",
      },
      {
        key: "introAjuste",
        label: "Cómo se ve el vídeo",
        type: "select",
        fallback: 0,
        options: [
          { value: "", label: "Llena la pantalla (recorta)" },
          { value: "contener", label: "Entero (con bandas)" },
        ],
      },
      {
        key: "introSalida",
        label: "Cómo da paso a la invitación",
        type: "select",
        span: 2,
        fallback: 0,
        options: [
          { value: "", label: "Fundido" },
          { value: "negro", label: "Funde a negro y luego aparece" },
          { value: "destello", label: "Destello blanco" },
          { value: "acerca", label: "El vídeo se acerca" },
          { value: "aleja", label: "El vídeo se aleja" },
          { value: "sube", label: "Sube como un telón" },
          { value: "baja", label: "Cae" },
          { value: "cortinas", label: "Se abre en dos" },
          { value: "circulo", label: "Se abre un círculo" },
          { value: "barrido", label: "Barrido lateral" },
          { value: "desenfoque", label: "Se desenfoca" },
        ],
      },
      {
        key: "apertura",
        label: "Cómo se abre",
        type: "select",
        span: 2,
        fallback: 0,
        options: [
          { value: "", label: "Se funde (la de siempre)" },
          { value: "sobre", label: "Como un sobre que se abre" },
        ],
        help: "Lo que pasa al pulsar el botón. El velo cerrado se ve igual en los dos casos.",
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

      /* ── La portada de acta ──────────────────────────────────
         Los seis de abajo sólo los dibuja el diseño «Bendición», cuya portada
         es la invitación impresa entera en vez de una foto con los nombres
         encima. En los demás diseños el marcado existe —el esqueleto es uno
         solo— pero los campos van vacíos, y un campo vacío no deja hueco:
         el renderer borra su elemento.

         Se dejan aquí y no en una sección propia porque son la portada: una
         sección «Padres» aparte se ordenaría con las demás y podría quedar
         entre la galería y los regalos, que no es donde va. */
      {
        key: "nombresCompletos",
        label: "Nombres completos",
        type: "text",
        span: 2,
        placeholder: "Jhon Jarles Roa Garzón  †  Dahiana Insuasti Grajales",
        help: "Bajo los nombres grandes. El símbolo del medio se escribe aquí, así que puede ser una cruz, un anillo o lo que se quiera.",
      },
      {
        key: "bendicion",
        label: "Bendición",
        type: "textarea",
        span: 2,
        placeholder: "Con la bendición de Dios\ny nuestros padres",
        help: "Cada salto de línea se respeta.",
      },
      { key: "padresA", label: "Título de la primera columna", type: "text", placeholder: "Padres del novio" },
      { key: "padresANombres", label: "Nombres", type: "textarea", placeholder: "Uno por línea" },
      { key: "padresB", label: "Título de la segunda columna", type: "text", placeholder: "Padres de la novia" },
      { key: "padresBNombres", label: "Nombres", type: "textarea", placeholder: "Uno por línea" },
      {
        key: "cierre",
        label: "Línea de cierre",
        type: "textarea",
        span: 2,
        placeholder: "Queremos compartir con ustedes este día\ntan especial y esperado, nuestra boda.",
      },
      /*
       * Un párrafo libre en la portada.
       *
       * La portada tenía antetítulo, subtítulo y frase, y los tres son
       * renglones: sitios para una línea, no para contar algo. Esto es el
       * hueco para escribir de verdad — y como cualquier texto, puede llevar
       * su propia animación y su propia letra.
       *
       * Respeta los saltos de línea, igual que los campos de la portada de
       * acta, para no obligar a meter HTML por un campo de texto.
       */
      {
        key: "parrafo",
        label: "Párrafo",
        type: "textarea",
        span: 2,
        placeholder: "Opcional. Lo que quieras contar antes de que se baje a los detalles.",
        help: "Cada salto de línea se respeta.",
      },
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
    key: "marca",
    label: "Marca de agua",
    icon: "◈",
    optional: true,
    hint:
      "Tu firma sobre toda la invitación, para que un borrador no se pueda " +
      "usar como si fuera el final. Apágala cuando entregues.",
    fields: [
      {
        key: "texto",
        label: "Texto",
        type: "text",
        span: 2,
        placeholder: "MUESTRA",
        help: "Lo que se repite encima. Si pones un logo abajo, manda el logo.",
      },
      {
        key: "imagen",
        label: "Logo",
        type: "image",
        span: 2,
        help: "Opcional, en vez del texto. Un PNG con fondo transparente es lo que se ve bien.",
      },
      {
        key: "disposicion",
        label: "Cómo se coloca",
        type: "select",
        span: 2,
        options: [
          { value: "repetida", label: "Repetida en diagonal, por todas partes" },
          { value: "centro", label: "Una sola, grande, cruzada en el centro" },
          { value: "esquina", label: "Fija en una esquina, discreta" },
        ],
      },
      {
        key: "tamano",
        label: "Tamaño",
        type: "range",
        min: 40,
        max: 400,
        step: 10,
        unit: "px",
        fallback: 120,
      },
      {
        key: "opacidad",
        label: "Opacidad",
        type: "range",
        min: 3,
        max: 60,
        step: 1,
        unit: "%",
        fallback: 12,
        help: "Lo bastante para que se lea de quién es, no tanto que estorbe para leer la invitación.",
      },
      {
        key: "color",
        label: "Color del texto",
        type: "color",
        span: 2,
        help: "Vacío = el color de las letras del diseño, así encaja en los 42.",
      },
    ],
  },

  {
    key: "fondoGlobal",
    label: "Fondo de toda la invitación",
    icon: "▤",
    optional: true,
    hint:
      "Una sola imagen detrás de todas las secciones, sin cortarse entre " +
      "una y otra. La portada, las redes y el pie se quedan con el suyo.",
    fields: [
      {
        key: "url",
        label: "Imagen o vídeo",
        type: "medio",
        span: 2,
        help: "Se queda quieta mientras la invitación se desplaza por encima, así que se ve entera y continua en vez de repetirse sección a sección.",
      },
      {
        key: "ajuste",
        label: "Cómo se ajusta",
        type: "select",
        fallback: 0,
        options: [
          { value: "", label: "Cubrir (recorta)" },
          { value: "contener", label: "Contener (entera)" },
          { value: "repetir", label: "Repetir en mosaico (sólo foto)" },
        ],
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
      {
        /*
         * Un velo entre la imagen y el texto.
         *
         * No es un adorno: sobre una fotografía cualquiera, la tinta del
         * diseño deja de leerse, y el contraste de las paletas se verifica en
         * el build pero una foto que sube quien edita no se puede verificar.
         * Es el mismo problema que ya costó diez diseños en la portada, y
         * aquí aparece en **todas** las secciones a la vez.
         */
        key: "velo",
        label: "Velo sobre la imagen",
        type: "range",
        min: 0,
        max: 90,
        step: 5,
        unit: "%",
        fallback: 45,
        span: 2,
        help: "Del color de fondo del diseño. Súbelo hasta que el texto se lea cómodo: una foto con detalle pide más velo que una textura.",
      },
    ],
  },

  {
    key: "particulas",
    label: "Partículas",
    icon: "✽",
    optional: true,
    hint:
      "Una capa que cae, sube o flota sobre toda la invitación. Con una basta: " +
      "dos a la vez no es una invitación animada, es una pantalla inquieta.",
    fields: [
      {
        key: "tipo",
        label: "Qué cae",
        type: "select",
        span: 2,
        fallback: 0,
        options: TIPOS_PARTICULA,
      },
      {
        key: "cantidad",
        label: "Cuántas",
        type: "range",
        min: 6,
        max: 60,
        step: 1,
        fallback: 18,
        help: "Más de treinta en un móvil se nota en la batería y tapa el texto.",
      },
      {
        key: "velocidad",
        label: "Ritmo",
        type: "select",
        fallback: 1,
        options: [
          { value: "lento", label: "Lento" },
          { value: "", label: "Normal" },
          { value: "rapido", label: "Rápido" },
        ],
      },
      {
        key: "tamano",
        label: "Tamaño",
        type: "range",
        min: 8,
        max: 48,
        step: 1,
        unit: "px",
        fallback: 20,
      },
      {
        key: "opacidad",
        label: "Opacidad",
        type: "range",
        min: 10,
        max: 100,
        step: 5,
        unit: "%",
        fallback: 70,
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        span: 2,
        help: "Vacío = el color de marca del diseño, así encaja en los 50 sin elegir nada.",
      },
    ],
  },

  {
    key: "compartir",
    label: "Al compartir el enlace",
    icon: "◇",
    optional: false,
    hint:
      "Lo que aparece cuando alguien pega el enlace en WhatsApp: la foto, " +
      "el título y la línea de debajo.",
    fields: [
      {
        key: "imagen",
        label: "Foto de la vista previa",
        type: "image",
        span: 2,
        help: "Si la dejas vacía se usa la foto de la portada, y si tampoco hay, la primera de la galería.",
      },
      {
        key: "titulo",
        label: "Título",
        type: "text",
        span: 2,
        placeholder: "Juan & María",
        help: "Vacío = los nombres.",
      },
      {
        key: "texto",
        label: "Línea de debajo",
        type: "textarea",
        span: 2,
        placeholder: "15 de Noviembre · Bogotá",
        help: "Vacío = la fecha y la ciudad. WhatsApp la corta a unas dos líneas, así que lo importante primero.",
      },
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
 * del evento—, y `compartir` porque tampoco: son las etiquetas Open Graph del
 * `<head>`, y un fondo o un adorno ahí no tendrían dónde pintarse.
 *
 * La portada estuvo fuera del fondo mientras el argumento fue "ese sitio ya
 * lo ocupa su foto". Dejó de valer cuando el fondo pasó a aceptar vídeo: una
 * portada con un clip detrás de los nombres es justo lo que no se podía
 * hacer, y no hay dos fondos peleándose — la capa del fondo va detrás de la
 * foto, así que la foto sigue mandando cuando la hay y el fondo se ve cuando
 * no. El texto queda por encima de las dos: `.hero-content` va posicionado en
 * z-index 3 desde siempre.
 */
/*
 * Las tarjetas del programa y las de información llevan su propio fondo.
 *
 * Aquí y no en la declaración de cada lista por el mismo motivo que el fondo
 * de sección: son dos sitios y bastaría olvidarse en uno para que nadie
 * entienda por qué en esa tarjeta no se puede.
 */
for (const clave of ["events", "features"]) {
  const spec = SECTIONS.find((s) => s.key === clave);
  if (spec?.list) spec.list.fields = [...spec.list.fields, ...fichaFondoFields];
}

for (const spec of SECTIONS) {
  if (
    spec.key === "event" || spec.key === "compartir" ||
    spec.key === "marca" || spec.key === "particulas" ||
    spec.key === "fondoGlobal"
  ) continue;
  spec.adornos = true;
  spec.fondo = true;
  spec.fields = [...spec.fields, ...fondoFields];
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
  /** Animación elegida por campo: { title: "letras", … }. Ver `ANIMACIONES`. */
  anim?: Record<string, string>;
  /** Color elegido por campo: { title: "#8a7248", … }. Gana al de la sección. */
  colors?: Record<string, string>;
  /** Alineación elegida por campo: { title: "izq", … }. Ver `ALINEACIONES`. */
  align?: Record<string, string>;
  /** Tamaño por campo, en % de lo que el diseño le dio: { title: "130" }. */
  size?: Record<string, string>;
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
    marca: {
      /* Apagada: nadie quiere una marca de agua por defecto. Se prende para
         mandar el borrador y se apaga al entregar. */
      enabled: false,
      texto: "",
      imagen: "",
      disposicion: "repetida",
      tamano: "",
      opacidad: "",
      color: "",
    },
    compartir: {
      enabled: true,
      /* Vacíos a propósito: cada uno cae en lo que ya había antes de que esta
         sección existiera —la portada, los nombres, la fecha y la ciudad—, así
         que las invitaciones de antes se comparten igual que siempre y sólo
         cambia lo que se toque aquí. */
      imagen: "",
      titulo: "",
      texto: "",
    },
    fondoGlobal: {
      enabled: true,
      url: "",
      ajuste: "",
      opacidad: "100",
      velo: "45",
    },
    particulas: {
      enabled: true,
      tipo: "",
      cantidad: "18",
      velocidad: "",
      tamano: "20",
      opacidad: "70",
      color: "",
    },
    splash: {
      enabled: true,
      textColor: "",
      label: "Te invitamos a celebrar",
      subtitle: "Nuestra Boda",
      ctaPrimary: "Abrir invitación",
      ctaSecondary: "Cómo llegar",
      mapUrl: "",
      musicUrl: "",
      apertura: "",
      introUrl: "",
      introSonido: "",
      introAjuste: "",
      introSalida: "",
    },
    hero: {
      enabled: true,
      textColor: "",
      /* Vacíos: sólo la portada de acta los dibuja, y sólo si se llenan. */
      nombresCompletos: "",
      bendicion: "",
      padresA: "",
      padresANombres: "",
      padresB: "",
      padresBNombres: "",
      cierre: "",
      parrafo: "",
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
