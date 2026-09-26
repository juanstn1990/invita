import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/auth";
import { eventoLlego } from "@/lib/disponibilidadEvento";
import { configLibro } from "@/lib/libroDeseos";
import { readImage } from "@/lib/storage";
import { generarLibroPdf } from "@/lib/libroPdf";
import { coupleName, type InvitationData } from "@/lib/schema";

/**
 * El libro entero, en PDF. La misma regla de siempre —organizador siempre,
 * cualquiera sólo si el libro es público y ya llegó el día— porque este
 * enlace no pasa por la página: alguien podría pedirlo directo.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const invitation = await prisma.invitation.findUnique({ where: { slug: params.slug } });
  if (!invitation) return new NextResponse("No encontrada", { status: 404 });

  const esOrganizador = !!(await sesionActual());
  const data = JSON.parse(invitation.data) as InvitationData;
  const cfg = configLibro(data);
  const fecha = String((data.event as Record<string, unknown>)?.date || "");

  if (!esOrganizador) {
    if (!invitation.published || cfg.visibilidad !== "publico" || !eventoLlego(fecha)) {
      return new NextResponse("No disponible", { status: 403 });
    }
  }

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
