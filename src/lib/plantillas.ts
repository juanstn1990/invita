/**
 * Mejorar una plantilla guardada sin miedo a estropearla.
 *
 * Hasta ahora una plantilla sólo se podía crear, listar y borrar: para
 * «mejorarla» había que borrarla y volver a guardarla, y un segundo guardado
 * con el mismo nombre daba un duplicado. Aquí están las dos maneras de
 * actualizarla —desde una invitación, o con un parche de campos— y la de
 * volver atrás.
 *
 * Lo usan el editor (`/api/mis-plantillas`) y el servidor MCP, y por eso vive
 * aquí y no en ninguno de los dos: dos copias de «guardar la versión anterior
 * y luego sobrescribir» acaban divergiendo justo en el paso que protege.
 *
 * ── Lo que NO hace, a propósito ──────────────────────────────────
 *
 * Actualizar una plantilla no toca las invitaciones que ya salieron de ella.
 * Son copias, no enlaces, y así tiene que ser: mejorar «boda estelar» no
 * puede cambiarle la invitación a una pareja que ya la repartió.
 */

import { urlsUsables } from "./subir";
import { prisma } from "./prisma";
import { TEMPLATE_BY_ID } from "./templates";
import { fusionar } from "./mcp";

/** Cuántas versiones anteriores se guardan por plantilla. */
export const VERSIONES_MAX = 10;

export type ResultadoPlantilla =
  | { ok: true; versiones: number; escritos?: string[] }
  | { ok: false; error: string };

/**
 * Guarda lo que hay y escribe lo nuevo, todo o nada.
 *
 * En una transacción porque son dos escrituras que sólo tienen sentido
 * juntas: una versión guardada sin la actualización es ruido, y una
 * actualización sin su versión es exactamente la pérdida que esto evita.
 */
async function reemplazar(
  plantillaId: string,
  nuevo: { templateId: string; data: string }
): Promise<ResultadoPlantilla> {
  const p = await prisma.plantilla.findUnique({ where: { id: plantillaId } });
  if (!p) return { ok: false, error: "No existe esa plantilla." };
  if (!TEMPLATE_BY_ID[nuevo.templateId]) {
    return { ok: false, error: "Ese diseño ya no existe; no se puede guardar en la plantilla." };
  }
  if (p.data === nuevo.data && p.templateId === nuevo.templateId) {
    return { ok: false, error: "La plantilla ya está exactamente así: no hay nada que actualizar." };
  }

  await prisma.$transaction([
    prisma.plantillaVersion.create({
      data: { plantillaId: p.id, templateId: p.templateId, data: p.data },
    }),
    prisma.plantilla.update({
      where: { id: p.id },
      data: { templateId: nuevo.templateId, data: nuevo.data, actualizadaAt: new Date() },
    }),
  ]);

  /* Las más viejas fuera. Se hace después y aparte: si falla, sobra alguna
     versión, que no rompe nada. */
  const todas = await prisma.plantillaVersion.findMany({
    where: { plantillaId: p.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const sobran = todas.slice(VERSIONES_MAX).map((v) => v.id);
  if (sobran.length) {
    await prisma.plantillaVersion.deleteMany({ where: { id: { in: sobran } } });
  }
  return { ok: true, versiones: Math.min(todas.length, VERSIONES_MAX) };
}

/**
 * La plantilla pasa a ser lo que hoy es esta invitación.
 *
 * Es el camino del editor: se mejora la invitación «maestra» como cualquier
 * otra —fotos, colores, textos— y luego se vuelca en la plantilla. Se copia
 * `data` y el diseño; el slug, las confirmaciones y los enlaces de invitado
 * no, porque son de esa invitación y no del punto de partida.
 */
export async function actualizarDesdeInvitacion(
  plantillaId: string,
  invitationId: string
): Promise<ResultadoPlantilla> {
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { templateId: true, data: true },
  });
  if (!inv) return { ok: false, error: "No existe esa invitación." };
  return reemplazar(plantillaId, { templateId: inv.templateId, data: inv.data });
}

/**
 * Cambia campos sueltos de la plantilla, con la misma validación que
 * `escribir` del MCP: un campo que no existe se rechaza y no se escribe nada.
 *
 * Es el camino de claude.ai: «en boda estelar cambia la frase por…», sin
 * tener que abrir una invitación maestra.
 */
export async function actualizarConParche(
  plantillaId: string,
  parche: Record<string, Record<string, unknown>>
): Promise<ResultadoPlantilla> {
  const p = await prisma.plantilla.findUnique({ where: { id: plantillaId } });
  if (!p) return { ok: false, error: "No existe esa plantilla." };

  const r = fusionar(p.templateId, JSON.parse(p.data), parche, await urlsUsables(p.data));
  if (r.errores.length) {
    return { ok: false, error: "No se cambió nada.\n· " + r.errores.join("\n· ") };
  }
  const hecho = await reemplazar(p.id, { templateId: p.templateId, data: JSON.stringify(r.datos) });
  return hecho.ok ? { ...hecho, escritos: r.escritos } : hecho;
}

/**
 * Vuelve a la versión anterior y la consume.
 *
 * La versión que se restaura desaparece de la lista: deshacer dos veces va
 * dos pasos atrás, que es lo que se espera de un «deshacer».
 */
export async function deshacer(plantillaId: string): Promise<ResultadoPlantilla> {
  const v = await prisma.plantillaVersion.findFirst({
    where: { plantillaId },
    orderBy: { createdAt: "desc" },
  });
  if (!v) return { ok: false, error: "No hay ninguna versión anterior a la que volver." };

  await prisma.$transaction([
    prisma.plantilla.update({
      where: { id: plantillaId },
      data: { templateId: v.templateId, data: v.data, actualizadaAt: new Date() },
    }),
    prisma.plantillaVersion.delete({ where: { id: v.id } }),
  ]);
  const quedan = await prisma.plantillaVersion.count({ where: { plantillaId } });
  return { ok: true, versiones: quedan };
}
