/**
 * El tema de un diseño: **todo declarado, nada muestreado**.
 *
 * Antes los tokens visuales salían de abrir los 27 templates en Chromium y
 * leer los estilos calculados (`tokens.generated.ts`). De ahí venía una clase
 * entera de bugs: en Blanco Oro el acento muestreado era casi blanco y los
 * números de la cuenta atrás desaparecían; en Burdeos la tinta sobre el acento
 * salía crema sobre oro. Se muestreaba lo que el CSS hubiera definido por
 * casualidad, no lo que el diseño quería decir.
 *
 * Ahora cada diseño **declara** su paleta, su escala tipográfica y sus formas,
 * y `contraste.ts` verifica los pares críticos en el build. Un diseño con
 * texto ilegible rompe `npm run templates:build`, no la invitación publicada.
 */

/** Los infantiles vienen en dos versiones; el resto tiene una sola. */
export type Variant = "nina" | "nino" | "unico";

export type Occasion =
  | "boda"
  | "quince"
  | "comunion"
  | "primer-ano"
  | "baby-shower";

/* ────────────────────────────────────────────────────────────────
   Paleta
   ──────────────────────────────────────────────────────────────── */

export interface Palette {
  /** Identificador estable. Es lo que se guarda en la invitación. */
  id: string;
  /** Cómo se llama en el selector: "Crema y salvia", "Vino y oro". */
  nombre: string;
  /** Fondo de la página. */
  bg: string;
  /** Fondo de las secciones que alternan. Debe contrastar poco con `bg`. */
  bgAlt: string;
  /** Superficie de tarjetas y campos. */
  card: string;
  /** Texto principal. Contra `bg`, `bgAlt` y `card`. */
  ink: string;
  /** Texto secundario. Contra los mismos tres. */
  muted: string;
  /** Trazos, bordes y filetes. No lleva texto encima. */
  line: string;
  /**
   * Color de marca: antetítulos, ornamentos, números de la cuenta atrás.
   * Lleva texto pequeño encima de `bg`, así que tiene que contrastar.
   */
  brand: string;
  /** Segundo color de marca, para degradados y adornos. Sin texto. */
  brand2: string;
  /** Color de acción: botones rellenos y enlaces. */
  accent: string;
  /** Texto sobre `accent`. El par se verifica en el build. */
  onAccent: string;
  /** Pie de página. */
  footerBg: string;
  footerInk: string;

  /* ── El tratamiento de la portada ──
     Vive en la paleta y no en el diseño porque es color: un degradado escrito
     con los hex de otra paleta es exactamente lo que impedía cambiarla. */

  /** Color del panel de la portada, como "R,G,B". Por defecto, el de `card`. */
  panelRgb?: string;
  /** Opacidad de ese panel. El organizador la puede cambiar. */
  panelAlpha?: number;
  /** Fondo de la portada cuando no hay foto. CSS completo. */
  heroBg?: string;
  /** Fondo de la pantalla de bienvenida. */
  splashBg?: string;
  /**
   * La tinta de la portada **cuando no hay foto**.
   *
   * Con foto puesta el texto va siempre en claro sobre el velo, que es
   * seguro. Sin foto se ve el `heroBg`, y ahí depende: sobre un degradado
   * claro hace falta la tinta normal, sobre un verde selva hace falta claro.
   * Declararlo evita el caso que rompía: texto blanco sobre fondo claro,
   * invisible hasta que alguien sube una foto.
   */
  heroInk?: "auto" | "light";
  /** El color de marca dentro de la portada, si el del diseño no sirve ahí. */
  heroBrand?: string;
  /** Igual para el acento: es el fondo del botón de la portada. */
  heroAccent?: string;
  /** Texto sobre `heroAccent`. */
  heroOnAccent?: string;
  /**
   * Un color sólido que represente el `heroBg` para el verificador.
   *
   * `heroBg` es un degradado, así que no se puede comprobar como un color. La
   * paleta declara aquí su tramo **más adverso** —el más claro si el texto de
   * la portada es claro, el más oscuro si es oscuro— y con eso el build
   * verifica los pares de la portada igual que los demás.
   */
  heroBase?: string;
}

/* ────────────────────────────────────────────────────────────────
   Tipografía
   ──────────────────────────────────────────────────────────────── */

export interface Typography {
  /** Familia de los títulos, con su pila de reserva. */
  display: string;
  /** Familia del cuerpo y de la interfaz. */
  body: string;
  /** Peso de los títulos. */
  displayWeight: number;
  /**
   * Razón de la escala. 1.18 es sobrio y editorial; 1.34 es dramático.
   * De aquí salen todos los tamaños: no hay números sueltos en el CSS.
   */
  scale: number;
  /** Tamaño del cuerpo en px. */
  base: number;
  /** Interlínea de los títulos. Los displays grandes piden menos. */
  displayLeading: number;
  /** `letter-spacing` de los títulos. Negativo aprieta, y a 60px hace falta. */
  displayTracking: string;
  /** `letter-spacing` de los antetítulos en versalitas. */
  tracking: string;
  /** Los antetítulos en mayúsculas o tal cual. */
  caps: "uppercase" | "none";
  /** Cursiva en las frases de autor. Algunos diseños no la quieren. */
  quoteStyle: "italic" | "normal";
}

/* ────────────────────────────────────────────────────────────────
   Forma y ritmo
   ──────────────────────────────────────────────────────────────── */

export interface Shape {
  /** Radio de tarjetas en px. 0 deja las esquinas rectas. */
  radius: number;
  /** Radio de campos y piezas pequeñas. */
  radiusSm: number;
  /** Radio de los botones. `pill` es 999px. */
  btnRadius: number | "pill";
  /** Grosor de los trazos. */
  border: number;
  /** La sombra de las tarjetas. `none` obliga a que el borde haga el trabajo. */
  shadow: "soft" | "lifted" | "none";
}

/** Cuánto aire hay entre secciones. Multiplica el ritmo base. */
export type Density = "compact" | "normal" | "airy";

/* ────────────────────────────────────────────────────────────────
   El tema completo
   ──────────────────────────────────────────────────────────────── */

/**
 * El tema **compuesto**: un diseño con una paleta concreta puesta.
 *
 * No se declara, se calcula con `piel()`. Es lo que reciben la hoja de estilo,
 * los adornos y el esqueleto, y por eso conserva la forma que tenía cuando el
 * color y la tipografía vivían juntos: así cambiar de sitio la paleta no
 * obligó a reescribir `css.ts` ni `deco.ts`.
 */
export interface Theme {
  palette: Palette;
  type: Typography;
  shape: Shape;
  density: Density;
  /* Copiados de la paleta, ya con sus valores por defecto resueltos. */
  panelRgb: string;
  panelAlpha: number;
  heroBg?: string;
  splashBg?: string;
  heroInk?: "auto" | "light";
  heroBrand?: string;
  heroAccent?: string;
  heroOnAccent?: string;
  heroBase?: string;
}

/* ────────────────────────────────────────────────────────────────
   Slots de layout
   ──────────────────────────────────────────────────────────────── */

/**
 * Lo que hace que dos diseños no se parezcan **de estructura** y no sólo de
 * color. Cada valor es un bloque de CSS en `css/base.ts` sobre el **mismo
 * marcado**: nada de aquí cambia el DOM, así que los bindings, el reordenado
 * de bloques y las variantes siguen funcionando igual en los 27.
 */
export interface Layout {
  /** Dónde y cómo se apoya el bloque de los nombres sobre la portada. */
  hero:
    | "panel" /** Tarjeta translúcida centrada. El clásico. */
    | "editorial" /** Bloque sólido abajo a la izquierda, esquinas rectas. */
    | "minimal" /** Sin panel: el texto directo sobre la foto, con velo. */
    | "band" /** Banda de lado a lado a media altura. */
    | "split" /** Foto arriba, texto abajo sobre el fondo del diseño. */
    | "frame"; /** Doble marco de hilos, texto centrado dentro. */
  /** El antetítulo y el título de cada sección. */
  head:
    | "center" /** Centrado, antetítulo en versalitas encima. */
    | "left" /** Alineado a la izquierda, con el antetítulo al lado. */
    | "rule" /** Centrado con un filete que lo cruza. */
    | "stacked"; /** Número de sección grande detrás del título. */
  /** Las tarjetas de programa, información, regalos e invitados. */
  cards:
    | "elevated" /** Superficie con sombra. */
    | "outline" /** Sólo borde, sin relleno. */
    | "flat" /** Relleno sin borde ni sombra. */
    | "rule"; /** Sin caja: separadas por un filete. */
  /** La cuenta atrás que trae el diseño. */
  countdown:
    | "tiles" /** Cuatro placas. */
    | "circles" /** Cuatro círculos con el contorno del acento. */
    | "type" /** Números grandes sin caja, separados por filetes. */
    | "line"; /** Todo en un renglón. */
  /** La galería. */
  gallery:
    | "grid" /** Cuadrícula 3×2. */
    | "mosaic" /** La primera de cada seis ocupa el doble. */
    | "stack"; /** Una columna ancha, para fotos verticales. */
  /** El filo entre la portada y el resto. */
  divider: "none" | "rule" | "wave" | "torn" | "arc";
}

/* ────────────────────────────────────────────────────────────────
   El diseño
   ──────────────────────────────────────────────────────────────── */

export interface Deco {
  splash?: (t: Theme) => string;
  hero?: (t: Theme) => string;
  /** Adorno pequeño bajo cada título de sección. */
  ornament?: (t: Theme) => string;
  footer?: (t: Theme) => string;
}

export interface Design {
  slug: string;
  name: string;
  occasion: Occasion;
  /** Una línea para el selector de diseños. */
  mood: string;
  /** URL de Google Fonts con exactamente los pesos que usa. */
  fontUrl: string;
  layout: Layout;
  /**
   * Tipografía, forma y ritmo. Son del **diseño**, no de la paleta: cambiar
   * de paleta cambia el color, no la escala ni las esquinas.
   */
  /** Sólo hay que declarar las familias; el resto tiene valor por defecto. */
  type: Partial<Typography> & Pick<Typography, "display" | "body">;
  shape?: Partial<Shape>;
  density?: Density;
  /**
   * Las paletas entre las que puede elegir quien edita. La primera es la de
   * por defecto y la que se hornea en el template generado.
   *
   * Estar aquí y no en templates aparte es lo que evita que el catálogo
   * pase de 42 archivos a 168: la paleta son variables CSS, así que el
   * renderer la sustituye sin volver a generar nada.
   */
  palettes: Palette[];
  /** El peso de los iconos. Por defecto sale de la ocasión. */
  iconos?: "light" | "duotone";
  /** CSS propio, corto: lo que el sistema de slots no cubre. */
  css?: (t: Theme) => string;
  deco?: Deco;
}

/* ────────────────────────────────────────────────────────────────
   Ayudas
   ──────────────────────────────────────────────────────────────── */

/** Un color hex con transparencia, para velos y marcas de agua. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** "#c9a84c" → "201,168,76", que es como lo quiere `--panel-rgb`. */
export function rgbTriple(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** La URL de Google Fonts con `display=swap`, que es la única que usamos. */
export const gfont = (query: string): string =>
  `https://fonts.googleapis.com/css2?${query}&display=swap`;

/**
 * El tema de un diseño con una paleta puesta.
 *
 * `paletaId` vacío o desconocido cae en la primera paleta, que es la de por
 * defecto: así una invitación guardada antes de que existieran las paletas
 * sigue viéndose igual.
 */
export function piel(d: Design, paletaId?: string): Theme {
  const palette =
    d.palettes.find((p) => p.id === paletaId) || d.palettes[0];

  return {
    palette,
    type: {
      displayWeight: 400,
      scale: 1.24,
      base: 16,
      displayLeading: 1.1,
      displayTracking: "-0.01em",
      tracking: "0.2em",
      caps: "uppercase",
      quoteStyle: "italic",
      ...d.type,
    },
    shape: {
      radius: 18,
      radiusSm: 12,
      btnRadius: "pill",
      border: 1,
      shadow: "soft",
      ...d.shape,
    },
    density: d.density ?? "normal",
    panelRgb: palette.panelRgb ?? rgbTriple(palette.card),
    panelAlpha: palette.panelAlpha ?? 0.86,
    heroBg: palette.heroBg,
    splashBg: palette.splashBg,
    heroInk: palette.heroInk ?? "auto",
    heroBrand: palette.heroBrand,
    heroAccent: palette.heroAccent,
    heroOnAccent: palette.heroOnAccent,
    heroBase: palette.heroBase,
  };
}

/** La paleta por defecto de un diseño. */
export const paletaPorDefecto = (d: Design): Palette => d.palettes[0];
