import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noAutorizado } from "@/lib/auth";
import { deleteEventPhoto } from "@/lib/storage";

/** Las fotos de un evento, para el panel del organizador. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const fotos = await prisma.eventPhoto.findMany({
    where: { invitationId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    fotos: fotos.map((f) => ({
      id: f.id,
      url: `/api/fotos-evento/${f.url}`,
      autor: f.autor,
      kb: Math.round(f.bytes / 1024),
      createdAt: f.createdAt,
    })),
  });
}

/** Borra una foto: los bytes y la fila, las dos — no es de nadie más. */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const fotoId = new URL(request.url).searchParams.get("fotoId");
  if (!fotoId) return NextResponse.json({ error: "Falta el id de la foto." }, { status: 400 });

  const foto = await prisma.eventPhoto.findFirst({
    where: { id: fotoId, invitationId: params.id },
  });
  if (!foto) return NextResponse.json({ ok: true });

  await prisma.eventPhoto.delete({ where: { id: foto.id } });
  await deleteEventPhoto(foto.url);

  return NextResponse.json({ ok: true });
}
