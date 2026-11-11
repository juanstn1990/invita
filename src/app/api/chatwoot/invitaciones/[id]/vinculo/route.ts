/**
 * Enlazar una invitación que ya existe a una conversación, o soltarla.
 */

import { prisma } from "@/lib/prisma";
import { CAMPOS_FICHA, entero, fallo, ficha, sinLlaveChatwoot } from "@/lib/chatwoot";
import { estadoDe } from "@/lib/tablero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const body = await req.json().catch(() => ({}));
  const cuenta = entero(body.cuenta);
  const conversacion = entero(body.conversacion);
  if (!cuenta || !conversacion) return fallo("Hacen falta `cuenta` y `conversacion`.");

  const inv = await prisma.invitation.findUnique({ where: { id: params.id } });
  if (!inv) return fallo("Esa invitación ya no existe.", 404);
  if (estadoDe(inv.estado) === "catalogo") {
    return fallo("Es una muestra del catálogo. Crea una invitación basada en ella en vez de enlazarla.", 409);
  }
  const deOtra =
    inv.chatwootConversacion !== null &&
    (inv.chatwootConversacion !== conversacion || inv.chatwootCuenta !== cuenta);
  if (deOtra && !body.mover) {
    return Response.json(
      {
        error: `"${inv.title}" ya está enlazada a otra conversación (#${inv.chatwootConversacion}).`,
        otraConversacion: inv.chatwootConversacion,
      },
      { status: 409 }
    );
  }

  const telefono = String(body.telefono || "").trim();
  const fila = await prisma.invitation.update({
    where: { id: inv.id },
    data: {
      chatwootCuenta: cuenta,
      chatwootConversacion: conversacion,
      chatwootContacto: entero(body.contacto) ?? null,
      /* Se parte de cero al cambiar de conversación: los ids de mensaje de
         la anterior no dicen nada de ésta. */
      ...(deOtra || inv.chatwootConversacion === null ? { chatwootHasta: null } : {}),
      ...(telefono && !inv.telefono ? { telefono } : {}),
    },
    select: CAMPOS_FICHA,
  });
  return Response.json({ invitacion: ficha(fila) });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const inv = await prisma.invitation.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!inv) return fallo("Esa invitación ya no existe.", 404);
  /* Sólo se suelta el enlace. La invitación y su contenido se quedan. */
  await prisma.invitation.update({
    where: { id: inv.id },
    data: { chatwootCuenta: null, chatwootConversacion: null, chatwootContacto: null, chatwootHasta: null },
  });
  return Response.json({ ok: true });
}
