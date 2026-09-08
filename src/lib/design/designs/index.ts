/** El catálogo: 27 invitaciones de 18 diseños. */

import type { Design } from "../theme";
import { BODAS } from "./bodas";
import { COMUNION } from "./comunion";
import { INFANTILES } from "./infantiles";
import { QUINCE } from "./quince";

export const DESIGNS: Design[] = [...BODAS, ...QUINCE, ...COMUNION, ...INFANTILES];

export const DESIGN_BY_SLUG: Record<string, Design> = Object.fromEntries(
  DESIGNS.map((d) => [d.slug, d])
);

/**
 * El id del template que sale de un diseño y una variante.
 * `invitacion-1-globos-nina`, `invitacion-vintage`.
 */
export const templateId = (slug: string, variant: string): string =>
  `invitacion-${slug}${variant === "unico" ? "" : `-${variant}`}`;

/**
 * El peso de los iconos de un diseño.
 *
 * Los infantiles llevan `duotone` —la misma forma con una capa de relleno al
 * 20%, que da calor sin salirse de la paleta— y el resto `light`, que es lo
 * que va con las serifas finas de bodas, quince y comunión.
 */
export const pesoIconos = (d?: Design): "light" | "duotone" =>
  d?.iconos ??
  (d?.occasion === "primer-ano" || d?.occasion === "baby-shower" ? "duotone" : "light");
