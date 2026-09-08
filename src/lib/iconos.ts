/**
 * Iconos dibujados, en vez de emojis.
 *
 * Un emoji lo pinta el sistema operativo: cambia de un teléfono a otro, no se
 * puede teñir del color del diseño y en varios de los nuestros desentona —un
 * 🎂 de colores planos en medio de una invitación en oro y negro—. Estos
 * heredan el color con `currentColor` y se ven igual en todas partes.
 *
 * El dibujo lo pone Phosphor Icons (MIT), en dos pesos:
 *
 * - **light** para bodas, quince y comunión: fino, va con las serifas.
 * - **duotone** para los infantiles: la misma forma con una capa de relleno
 *   al 20%, que da algo de calor sin salirse de la paleta.
 *
 * Antes estaban dibujados a mano, path por path. Se notaba y no era el
 * oficio: la cámara soltaba rayos raros, la flor parecía una piruleta. Con
 * ello se fueron las veinte clases de animación por pieza (`i-late`,
 * `i-traza`…) que vivían dentro de cada dibujo; el arte de Phosphor son
 * formas rellenas y no trazos, así que el movimiento va ahora en el `<svg>`
 * entero, declarado en la tabla.
 *
 * Lo guardado son emojis, así que cada icono declara cuál sustituye y las
 * invitaciones de antes se dibujan solas.
 */

import { ARTE } from "./iconos.arte";
import { ICONOS, ORNAMENTOS, type IconoDato, type Peso } from "./iconos.datos";

export type { Peso };
export { ICONOS };

export const ICONO_POR_CLAVE: Record<string, IconoDato> = Object.fromEntries(
  ICONOS.map((i) => [i.clave, i])
);

/** Lo guardado son emojis: cada uno lleva al icono que lo sustituye. */
export const ICONO_POR_EMOJI: Record<string, IconoDato> = Object.fromEntries(
  ICONOS.filter((i) => i.emoji).map((i) => [i.emoji as string, i])
);

/** Emojis que no tienen dibujo propio pero se parecen a uno que sí. */
const PARECIDOS: Record<string, string> = {
  "🍽": "brindis", "🥂": "brindis", "🍾": "brindis",
  "🎵": "musica", "🎼": "musica", "🎤": "musica",
  "💒": "iglesia", "⛪️": "iglesia",
  "💍": "anillos", "💐": "rosa", "🌸": "rosa", "🌺": "rosa", "🌷": "rosa",
  "🌿": "hoja", "🍃": "hoja",
  "📷": "camara", "🖼️": "camara", "🖼": "camara",
  "🚗": "coche", "🚌": "coche", "🅿️": "coche",
  "📍": "ubicacion", "🗺️": "ubicacion", "🕐": "reloj", "⏰": "reloj", "📅": "reloj",
  "❤️": "corazon", "💕": "corazon", "💖": "corazon", "♥️": "corazon",
  "⭐": "estrella", "🌟": "estrella", "☁️": "nube",
  "👔": "corbatin", "👠": "vestido",
  "🍬": "cupcake", "🍭": "cupcake", "🍪": "tarta",
  "🐻": "osito", "🧩": "libros", "✏️": "libros",
  "🕊": "paloma", "🎊": "brillo", "🎉": "brillo", "💫": "brillo",
};

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** El envoltorio, igual para iconos y ornamentos. */
const svg = (clase: string, etiqueta: string | null, cuerpo: string): string =>
  `<svg class="${clase}" viewBox="0 0 256 256" fill="currentColor" ` +
  (etiqueta ? `role="img" aria-label="${escapar(etiqueta)}"` : `aria-hidden="true"`) +
  `>${cuerpo}</svg>`;

/**
 * El dibujo que corresponde a un valor guardado.
 *
 * Acepta la clave del icono (`camara`), el emoji que sustituye (`📸`) o uno
 * parecido. Si no reconoce nada devuelve el texto tal cual, escapado: más
 * vale un emoji suelto que un hueco, y nunca se cuela marcado ajeno.
 */
export function iconoHtml(valor: string, peso: Peso = "light"): string {
  const v = String(valor || "").trim();
  if (!v) return "";

  const sinVariacion = v.replace(/️/g, "");
  const icono =
    ICONO_POR_CLAVE[v] ||
    ICONO_POR_EMOJI[v] ||
    ICONO_POR_CLAVE[PARECIDOS[v] || ""] ||
    // Algunos emojis llegan con el selector de variación pegado.
    ICONO_POR_EMOJI[sinVariacion] ||
    ICONO_POR_CLAVE[PARECIDOS[sinVariacion] || ""];

  if (!icono) return escapar(v);

  const cuerpo = ARTE[peso]?.[icono.fosforo] ?? ARTE.light[icono.fosforo];
  if (!cuerpo) return escapar(v);

  const clases = [
    "inv-ico",
    `inv-ico-${icono.clave}`,
    icono.movimiento ? `inv-ico-${icono.movimiento}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return svg(clases, icono.nombre, cuerpo);
}

/**
 * Una pieza de ornamento, por su nombre corto (`hoja`, `flor`, `rombo`…).
 * La usan los adornos de `design/deco.ts`.
 */
export function ornamentoHtml(nombre: string, peso: Peso = "light"): string {
  const fosforo = ORNAMENTOS[nombre];
  if (!fosforo) return "";
  const cuerpo = ARTE[peso]?.[fosforo] ?? ARTE.light[fosforo];
  return cuerpo ? svg("inv-orn", null, cuerpo) : "";
}
