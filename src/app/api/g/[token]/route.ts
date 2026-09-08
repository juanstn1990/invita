import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limpiarNombres, nuevoCodigo } from "@/lib/invitados";

/**
 * Crear y borrar links de invitado desde el panel compartido.
 *
 * La llave es el propio `token` de la dirección: quien lo tenga puede
 * administrar. Es lo que se quiere —el organizador se lo pasa a quien invita
 * y ya está— pero por eso mismo nunca se devuelve nada que no sea de esa
 * invitación.
 */
async function invitacionDe(token: string) {
  return prisma.invitation.findUnique({
    where: { manageToken: token },
    select: { id: true, slug: true, published: true },
  });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const inv = await invitacionDe(params.token);
  if (!inv) return NextResponse.json({ error: "Panel no encontrado." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const nombres = limpiarNombres(String(body.names || ""));
  if (!nombres.length) {
    return NextResponse.json({ error: "Escribe al menos un nombre." }, { status: 400 });
  }

  const link = await prisma.guestLink.create({
    data: {
      invitationId: inv.id,
      names: nombres.join(", "),
      code: await nuevoCodigo(),
      note: String(body.note || "").trim().slice(0, 120) || null,
    },
  });

  return NextResponse.json({ id: link.id, code: link.code, names: link.names });
}

export async function DELETE(request: Request, { params }: { params: { token: string } }) {
  const inv = await invitacionDe(params.token);
  if (!inv) return NextResponse.json({ error: "Panel no encontrado." }, { status: 404 });

  const id = String(new URL(request.url).searchParams.get("id") || "");
  // El `invitationId` en el where es lo que impide borrar el link de otra
  // invitación conociendo sólo su id.
  await prisma.guestLink.deleteMany({ where: { id, invitationId: inv.id } });
  return NextResponse.json({ ok: true });
}
