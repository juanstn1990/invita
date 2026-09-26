import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noAutorizado } from "@/lib/auth";

/** Los deseos de un evento, para el panel del organizador. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const deseos = await prisma.wish.findMany({
    where: { invitationId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ deseos });
}

/** Borra un deseo. */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const deseoId = new URL(request.url).searchParams.get("deseoId");
  if (!deseoId) return NextResponse.json({ error: "Falta el id del deseo." }, { status: 400 });

  await prisma.wish.deleteMany({ where: { id: deseoId, invitationId: params.id } });
  return NextResponse.json({ ok: true });
}
