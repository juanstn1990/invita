/**
 * La tabla de iconos: qué iconos hay y de dónde sale el dibujo.
 *
 * El dibujo lo pone [Phosphor Icons](https://phosphoricons.com) (MIT). Antes
 * los 29 estaban dibujados a mano aquí mismo, con paths escritos a pulso, y
 * se notaba: la cámara soltaba rayos raros, la flor parecía una piruleta y el
 * osito parecía un cerdo. Dibujar iconos es un oficio y no era el nuestro.
 *
 * Este archivo no importa nada a propósito: lo lee el generador
 * (`scripts/build-iconos.ts`) y también `iconos.ts`, así que tiene que poder
 * cargarse solo.
 */

export interface IconoDato {
  clave: string;
  nombre: string;
  /** El emoji al que reemplaza, para lo que ya está guardado. */
  emoji?: string;
  /** Nombre del icono en Phosphor. */
  fosforo: string;
  /**
   * Cómo se mueve. Va en el `<svg>` entero y no en las piezas de dentro:
   * el arte de Phosphor son formas rellenas, no trazos, así que no hay
   * piezas sueltas que animar. Vacío = quieto.
   */
  movimiento?: "late" | "brilla" | "flota" | "ondea";
}

/**
 * Cuatro no tienen equivalente exacto en Phosphor y llevan un sustituto
 * razonable: los anillos de boda son `infinity`, el lazo es `confetti`, el
 * biberón es un cochecito y el osito un conejo. Son opciones del selector,
 * así que si alguno no convence se cambia una línea.
 */
export const ICONOS: IconoDato[] = [
  { clave: "camara", nombre: "Cámara", emoji: "📸", fosforo: "camera", movimiento: "brilla" },
  { clave: "iglesia", nombre: "Iglesia", emoji: "⛪", fosforo: "church" },
  { clave: "anillos", nombre: "Anillos", fosforo: "infinity" },
  { clave: "brindis", nombre: "Brindis", emoji: "🍽️", fosforo: "champagne" },
  { clave: "musica", nombre: "Música", emoji: "🎶", fosforo: "music-notes", movimiento: "ondea" },
  { clave: "corbatin", nombre: "Dresscode", emoji: "👗", fosforo: "coat-hanger" },
  { clave: "vestido", nombre: "Vestido", fosforo: "dress" },
  { clave: "pastel", nombre: "Pastel", emoji: "🎂", fosforo: "cake" },
  { clave: "cupcake", nombre: "Magdalena", emoji: "🧁", fosforo: "cookie" },
  { clave: "tarta", nombre: "Porción de tarta", emoji: "🍰", fosforo: "cake" },
  { clave: "globo", nombre: "Globo", emoji: "🎈", fosforo: "balloon", movimiento: "flota" },
  { clave: "regalo", nombre: "Regalo", emoji: "🎁", fosforo: "gift" },
  { clave: "lazo", nombre: "Lazo", emoji: "🎀", fosforo: "confetti", movimiento: "flota" },
  { clave: "osito", nombre: "Osito", emoji: "🧸", fosforo: "rabbit" },
  { clave: "bebe", nombre: "Bebé", emoji: "👶", fosforo: "baby" },
  { clave: "biberon", nombre: "Biberón", emoji: "🍼", fosforo: "baby-carriage" },
  { clave: "rosa", nombre: "Flor", emoji: "🌹", fosforo: "flower", movimiento: "ondea" },
  { clave: "paloma", nombre: "Aves", emoji: "🕊️", fosforo: "bird", movimiento: "flota" },
  { clave: "sobre", nombre: "Sobre", emoji: "💌", fosforo: "envelope" },
  { clave: "libros", nombre: "Libros", emoji: "📚", fosforo: "books" },
  { clave: "paleta", nombre: "Paleta", emoji: "🎨", fosforo: "palette" },
  { clave: "corazon", nombre: "Corazón", fosforo: "heart", movimiento: "late" },
  { clave: "estrella", nombre: "Estrella", fosforo: "star", movimiento: "brilla" },
  { clave: "ubicacion", nombre: "Ubicación", fosforo: "map-pin" },
  { clave: "reloj", nombre: "Reloj", fosforo: "clock" },
  { clave: "coche", nombre: "Coche", fosforo: "car" },
  { clave: "nube", nombre: "Nube", fosforo: "cloud", movimiento: "flota" },
  { clave: "hoja", nombre: "Hoja", fosforo: "leaf", movimiento: "ondea" },
  { clave: "brillo", nombre: "Destello", emoji: "✨", fosforo: "sparkle", movimiento: "brilla" },
];

/**
 * Las piezas que usan los adornos bajo los títulos de sección. No salen en el
 * selector de iconos: las elige el diseño en su `deco`.
 */
export const ORNAMENTOS: Record<string, string> = {
  hoja: "leaf",
  flor: "flower",
  loto: "flower-lotus",
  estrella: "star-four",
  mariposa: "butterfly",
  destello: "sparkle",
  luna: "moon-stars",
  rombo: "diamond",
};

/** Los dos pesos que usa el catálogo. */
export const PESOS = ["light", "duotone"] as const;
export type Peso = (typeof PESOS)[number];
