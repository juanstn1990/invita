import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * "Mis fotos": las que el propio navegador de quien subió recuerda, por su
 * id, en `localStorage` (ver `Camara.tsx`). No hay cuenta ni contraseña que
 * distinga a un invitado de otro, así que no hay manera de que el servidor
 * sepa "cuáles son tuyas" — lo único que puede hacer es devolver exactamente
 * las que se le piden por id, nunca la lista entera de la invitación. Es la
 * diferencia con el álbum "público" (`Galeria.tsx`, que sí lista todo): aquí
 * jamás se entrega una foto cuyo id no llegó ya en la pregunta.
 */
const MAX_IDS = 300;

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug: params.slug },
    select: { id: true, published: true },
  });
  if (!invitation || !invitation.published) {
    return NextResponse.json({ fotos: [] });
  }

  const crudo = new URL(request.url).searchParams.get("ids") || "";
  const ids = crudo.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_IDS);
  if (!ids.length) return NextResponse.json({ fotos: [] });

  const fotos = await prisma.eventPhoto.findMany({
    where: { invitationId: invitation.id, id: { in: ids } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    fotos: fotos.map((f) => ({
      id: f.id,
      url: `/api/fotos-evento/${f.url}`,
      autor: f.autor,
      kb: Math.round(f.bytes / 1024),
    })),
  });
}
