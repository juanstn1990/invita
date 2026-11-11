/**
 * Lee la conversación y propone qué cambiar en la invitación. No escribe.
 *
 * Los mensajes vienen en la petición: Chatwoot los tiene y es quien llama.
 */

import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { fallo, sinLlaveChatwoot } from "@/lib/chatwoot";
import { datosDeOrigen } from "@/lib/partida";
import { ErrorDeExtraccion, proponer, type Mensaje } from "@/lib/extraer";
import { urlsUsables } from "@/lib/subir";
import { estadoDe } from "@/lib/tablero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* El modelo tarda lo suyo con una conversación larga. */
export const maxDuration = 150;

const DE = new Set(["cliente", "agente", "nota"]);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const body = await req.json().catch(() => ({}));
  const inv = await prisma.invitation.findUnique({ where: { id: params.id } });
  if (!inv) return fallo("Esa invitación ya no existe.", 404);
  if (!TEMPLATE_BY_ID[inv.templateId]) {
    return fallo(`"${inv.title}" es de una versión anterior y ya no se puede editar.`, 409);
  }

  const mensajes: Mensaje[] = (Array.isArray(body.mensajes) ? body.mensajes : [])
    .map((m: Record<string, unknown>) => ({
      id: Number(m.id),
      de: DE.has(String(m.de)) ? (m.de as Mensaje["de"]) : "cliente",
      fecha: String(m.fecha || ""),
      texto: String(m.texto || ""),
      adjuntos: Array.isArray(m.adjuntos)
        ? m.adjuntos.map((a: Record<string, unknown>) => ({ tipo: String(a.tipo || "archivo") }))
        : [],
    }))
    .filter((m: Mensaje) => Number.isInteger(m.id))
    .sort((a: Mensaje, b: Mensaje) => a.id - b.id);

  try {
    const propuesta = await proponer({
      templateId: inv.templateId,
      datos: JSON.parse(inv.data),
      origen: (await datosDeOrigen(inv)) as Record<string, Record<string, unknown>> | null,
      mensajes,
      hasta: inv.chatwootHasta,
      todo: !!body.todo,
      nota: String(body.nota || ""),
      biblioteca: await urlsUsables(inv.data),
    });
    return Response.json({
      ...propuesta,
      /* Se dice aquí y no al aplicar: mejor saberlo antes de revisar diez
         cambios que no se van a poder escribir. */
      ...(estadoDe(inv.estado) === "entregada"
        ? { aviso: "Está marcada como entregada. Para aplicar cambios hay que pasarla a «En curso»." }
        : {}),
    });
  } catch (e) {
    if (e instanceof ErrorDeExtraccion) return fallo(e.message, e.status);
    throw e;
  }
}
