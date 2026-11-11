/**
 * Escribe en la invitación los cambios que una persona aprobó.
 *
 * Todo o nada, como `escribir` en el MCP: si uno no encaja no se escribe
 * ninguno y se dice cuál, para que la invitación no quede a medias.
 */

import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { BASE, CAMPOS_FICHA, entero, fallo, ficha, sinLlaveChatwoot } from "@/lib/chatwoot";
import { fusionar } from "@/lib/mcp";
import { parcheDe } from "@/lib/extraer";
import { slugActualizado } from "@/lib/slugAuto";
import { urlsUsables } from "@/lib/subir";
import { estadoDe } from "@/lib/tablero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const body = await req.json().catch(() => ({}));
  const inv = await prisma.invitation.findUnique({ where: { id: params.id } });
  if (!inv) return fallo("Esa invitación ya no existe.", 404);
  if (!TEMPLATE_BY_ID[inv.templateId]) {
    return fallo(`"${inv.title}" es de una versión anterior y ya no se puede editar.`, 409);
  }

  /* La misma frontera que el MCP: una entregada está en manos del cliente.
     Pasarla a «En curso» es una decisión, así que se pide a propósito. */
  let estado = inv.estado;
  if (estadoDe(inv.estado) === "entregada") {
    if (!body.reabrir) {
      return Response.json(
        { error: `"${inv.title}" está entregada. Hay que pasarla a «En curso» para cambiarla.`, entregada: true },
        { status: 409 }
      );
    }
    estado = "curso";
  }

  const cambios = (Array.isArray(body.cambios) ? body.cambios : [])
    .map((c: Record<string, unknown>) => ({
      seccion: String(c.seccion || ""),
      campo: String(c.campo || ""),
      valor: c.valor,
    }))
    .filter((c: { seccion: string; campo: string }) => c.seccion && c.campo);

  const datos = JSON.parse(inv.data);
  let nuevos = datos;
  let escritos: string[] = [];
  if (cambios.length) {
    const r = fusionar(inv.templateId, datos, parcheDe(datos, cambios), await urlsUsables(inv.data));
    if (r.errores.length) {
      return Response.json(
        { error: `No se escribió nada. ${r.errores.join(" ")}`, errores: r.errores },
        { status: 422 }
      );
    }
    nuevos = r.datos;
    escritos = r.escritos;
  }

  /* `hasta` avanza aunque no haya cambios: revisar y no encontrar nada
     también es haber revisado. Y nunca retrocede. */
  const hasta = entero(body.hasta);
  const slugNuevo = cambios.length ? await slugActualizado(inv, nuevos) : null;
  const fila = await prisma.invitation.update({
    where: { id: inv.id },
    data: {
      ...(cambios.length ? { data: JSON.stringify(nuevos) } : {}),
      ...(slugNuevo ? { slug: slugNuevo } : {}),
      ...(estado !== inv.estado ? { estado } : {}),
      ...(hasta && hasta > (inv.chatwootHasta || 0) ? { chatwootHasta: hasta } : {}),
    },
    select: CAMPOS_FICHA,
  });

  return Response.json({
    invitacion: ficha(fila),
    escritos,
    ver: fila.published ? `${BASE}/${fila.slug}` : `${BASE}/editor/${fila.id}`,
  });
}
