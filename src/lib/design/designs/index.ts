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
 * El id del template de un diseño.
 *
 * Antes llevaba la variante pegada (`invitacion-1-globos-nina`) porque niña y
 * niño eran dos archivos. Con la paleta elegible al editar hay un template
 * por diseño y la paleta se guarda en la invitación.
 */
export const templateId = (slug: string): string => `invitacion-${slug}`;

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
