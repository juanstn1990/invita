import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limpiarNombres, limpiarPases, nuevoCodigo } from "@/lib/invitados";
import { ponerRegaloA } from "@/lib/regalos";

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
      pases: limpiarPases(body.pases),
    },
  });

  /* El regalo viaja en el mismo formulario que los nombres a propósito: para
     quien invita, «qué trae esta familia» es un dato de la familia, igual que
     sus pases. Partirlo en dos pantallas obligaba a crear veinticinco
     enlaces y después repartir veinticinco regalos emparejándolos a mano. */
  const regalo = String(body.regalo || "").trim();
  if (regalo) await ponerRegaloA(inv.id, link.id, regalo);

  return NextResponse.json({
    id: link.id, code: link.code, names: link.names, pases: link.pases,
    regalo: regalo || null,
  });
}

/** Cambiar —o quitar— el regalo de una familia ya creada. */
export async function PATCH(request: Request, { params }: { params: { token: string } }) {
  const inv = await invitacionDe(params.token);
  if (!inv) return NextResponse.json({ error: "Panel no encontrado." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const link = String(body.link || "");
  if (!link) return NextResponse.json({ error: "Falta el invitado." }, { status: 400 });

  const r = await ponerRegaloA(inv.id, link, String(body.regalo || ""));
  if (!r.ok) return NextResponse.json({ error: "Ese invitado ya no está." }, { status: 404 });
  return NextResponse.json({ ok: true, regalo: r.regalo });
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
