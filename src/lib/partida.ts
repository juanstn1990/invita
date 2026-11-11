/**
 * De dónde parte una invitación nueva.
 *
 * Tres orígenes y el mismo resultado —un diseño y unos datos—: un diseño en
 * blanco, una plantilla guardada, u **otra invitación**, que es como se parte
 * de una muestra del catálogo cuando el cliente dice «la quiero como esa».
 *
 * Vive aparte porque lo usan dos puertas —la herramienta `crear` del MCP y el
 * panel de Chatwoot— y una regla copiada en dos sitios acaba distinta en el
 * que importaba.
 */

import { prisma } from "./prisma";
import { presetFor } from "./presets";
import { TEMPLATE_BY_ID } from "./templates";
import { slugLibre, nombresDe } from "./slugAuto";

export interface Origen {
  diseno?: string;
  plantilla?: string;
  invitacion?: string;
}

export interface Partida {
  templateId: string;
  datos: Record<string, unknown>;
  /** Para decirlo: «diseño "Burdeos"», «plantilla "Quince lila"»… */
  deDonde: string;
  plantillaId?: string;
  basadaEn?: string;
}

/** Cuántos orígenes vienen dados; tiene que ser exactamente uno. */
export const cuantosOrigenes = (o: Origen) =>
  [o.diseno, o.plantilla, o.invitacion].filter(Boolean).length;

/** El punto de partida, o el motivo por el que no se puede partir de ahí. */
export async function partidaDe(o: Origen): Promise<Partida | { error: string }> {
  if (o.invitacion) {
    const de = await prisma.invitation.findUnique({ where: { id: o.invitacion } });
    if (!de) return { error: `No hay ninguna invitación con id "${o.invitacion}".` };
    if (!TEMPLATE_BY_ID[de.templateId]) {
      return {
        error:
          `"${de.title}" es de una versión anterior (diseño "${de.templateId}") ` +
          `y ya no hay con qué dibujarla, así que no sirve de punto de partida.`,
      };
    }
    /* Se copia el contenido y nada más. El enlace público, los invitados,
       las confirmaciones, los regalos, el teléfono y las notas son de la
       invitación de la que se parte, no del punto de partida. */
    return {
      templateId: de.templateId,
      datos: JSON.parse(de.data),
      deDonde: `invitación "${de.title}"`,
      basadaEn: de.id,
      ...(de.plantillaId ? { plantillaId: de.plantillaId } : {}),
    };
  }

  if (o.plantilla) {
    const p = await prisma.plantilla.findUnique({ where: { id: o.plantilla } });
    if (!p) return { error: `No hay ninguna plantilla con id "${o.plantilla}".` };
    if (!TEMPLATE_BY_ID[p.templateId]) {
      return {
        error:
          `La plantilla "${p.nombre}" sale del diseño "${p.templateId}", que ya no ` +
          `existe. No hay con qué dibujarla.`,
      };
    }
    return {
      templateId: p.templateId,
      datos: JSON.parse(p.data),
      deDonde: `plantilla "${p.nombre}"`,
      plantillaId: p.id,
    };
  }

  const tpl = TEMPLATE_BY_ID[o.diseno || ""];
  if (!tpl) return { error: `"${o.diseno}" no es un diseño.` };
  return {
    templateId: o.diseno!,
    datos: presetFor(tpl) as unknown as Record<string, unknown>,
    deDonde: `diseño "${tpl.name}"`,
  };
}

/** Crea el borrador a partir de un punto de partida ya resuelto. */
export async function crearDesde(
  p: Partida,
  titulo?: string,
  extra: {
    telefono?: string;
    chatwootCuenta?: number;
    chatwootConversacion?: number;
    chatwootContacto?: number;
  } = {}
) {
  const slug = await slugLibre(nombresDe(p.datos));
  return prisma.invitation.create({
    data: {
      slug,
      slugAuto: true,
      templateId: p.templateId,
      title: titulo?.trim() || `${TEMPLATE_BY_ID[p.templateId].name} · ${slug}`,
      data: JSON.stringify(p.datos),
      published: false,
      ...(p.plantillaId ? { plantillaId: p.plantillaId } : {}),
      ...(p.basadaEn ? { basadaEn: p.basadaEn } : {}),
      ...extra,
    },
  });
}

/**
 * Los datos de los que partió una invitación, para saber qué sigue igual.
 *
 * Una muestra copiada trae los nombres y la fecha de otra fiesta. Comparando
 * con el origen se distingue «esto lo dijo el cliente» de «esto venía en la
 * muestra y nadie lo ha tocado», que a la vista son lo mismo.
 */
export async function datosDeOrigen(inv: {
  templateId: string;
  basadaEn: string | null;
  plantillaId: string | null;
}): Promise<Record<string, unknown> | null> {
  if (inv.basadaEn) {
    const de = await prisma.invitation.findUnique({
      where: { id: inv.basadaEn }, select: { data: true },
    });
    if (de) return JSON.parse(de.data);
  }
  if (inv.plantillaId) {
    const p = await prisma.plantilla.findUnique({
      where: { id: inv.plantillaId }, select: { data: true },
    });
    if (p) return JSON.parse(p.data);
  }
  const tpl = TEMPLATE_BY_ID[inv.templateId];
  return tpl ? (presetFor(tpl) as unknown as Record<string, unknown>) : null;
}
