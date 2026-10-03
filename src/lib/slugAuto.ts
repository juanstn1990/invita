import { prisma } from "./prisma";
import { slugDeNombres, slugCoincide } from "./slug";

/** Los nombres del evento tal como salen en la dirección: «Ana & Luis». */
export function nombresDe(data: unknown): string {
  const ev = ((data as Record<string, unknown>)?.event || {}) as Record<string, unknown>;
  return [ev.name1, ev.name2].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
}

/** Una dirección con los nombres y un id que nadie más tiene. */
export async function slugLibre(nombres: string): Promise<string> {
  for (;;) {
    const slug = slugDeNombres(nombres);
    if (!(await prisma.invitation.findUnique({ where: { slug } }))) return slug;
  }
}

/**
 * La dirección nueva, si hace falta una.
 *
 * Sólo se mueve la que armó el sistema y todavía no se publicó: una que
 * alguien escogió, o una que ya está repartida, no se toca nunca. Y no se
 * mueve si ya parte de los nombres actuales —cada tecla del editor llega
 * hasta aquí, y una dirección que cambiara en cada guardado no serviría—.
 */
export async function slugActualizado(
  inv: { slug: string; slugAuto: boolean; published: boolean },
  data: unknown
): Promise<string | null> {
  if (!inv.slugAuto || inv.published) return null;
  const nombres = nombresDe(data);
  return slugCoincide(inv.slug, nombres) ? null : slugLibre(nombres);
}
