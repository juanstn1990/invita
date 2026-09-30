import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/auth";
import { configLibro } from "@/lib/libroDeseos";
import { readImage } from "@/lib/storage";
import { generarLibroPdf } from "@/lib/libroPdf";
import { coupleName, type InvitationData } from "@/lib/schema";

/**
 * El libro entero, en PDF. Sólo quien organiza —"público" decide quién lee
 * el libro en pantalla, no quién se lo lleva impreso—: es su recuerdo, y un
 * invitado con el link no debería poder descargarlo aunque el libro esté
 * abierto para hojear.
 *
 * Dos llaves abren la puerta, la misma regla que las fotos: la sesión de
 * quien inició sesión en el editor, o el `manageToken` de esta invitación
 * por `?t=`, para quien organiza pero no tiene cuenta.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const invitation = await prisma.invitation.findUnique({ where: { slug: params.slug } });
  if (!invitation) return new NextResponse("No encontrada", { status: 404 });

  let autorizado = !!(await sesionActual());
  if (!autorizado) {
    const token = new URL(request.url).searchParams.get("t") || "";
    autorizado = !!invitation.manageToken && !!token && invitation.manageToken === token;
  }
  if (!autorizado) return new NextResponse("No disponible", { status: 403 });

  const data = JSON.parse(invitation.data) as InvitationData;
  const cfg = configLibro(data);

  const deseos = await prisma.wish.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "asc" },
  });

  let portada: { bytes: Uint8Array; mime: string } | null = null;
  if (cfg.portada.startsWith("/api/media/")) {
    const rel = cfg.portada.slice("/api/media/".length);
    const archivo = await readImage(rel);
    if (archivo) portada = { bytes: archivo.bytes, mime: archivo.mime };
  }

  const pdf = await generarLibroPdf({
    nombreEvento: coupleName(data) || invitation.title,
    deseos: deseos.map((d) => ({ nombre: d.nombre, texto: d.texto })),
    portada,
  });

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="libro-de-deseos.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
