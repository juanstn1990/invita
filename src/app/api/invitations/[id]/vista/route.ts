import { NextResponse } from "next/server";
import { noAutorizado } from "@/lib/auth";
import { origenDe } from "@/lib/origen";
import { prisma } from "@/lib/prisma";
import { renderInvitation } from "@/lib/render";
import { TEMPLATE_BY_ID, readTemplate } from "@/lib/templates";
import type { InvitationData } from "@/lib/schema";

/**
 * La vista previa de una invitación, para la tarjeta del catálogo.
 *
 * Es el mismo oficio que `/api/mis-plantillas/[id]/vista` pero sobre una
 * invitación: las muestras del catálogo **son** invitaciones, no plantillas
 * guardadas, y el catálogo del tablero no tenía con qué dibujarlas. Enseñaba
 * el nombre y la descripción, y elegir una muestra por su nombre es
 * exactamente lo que no se hace cuando lo que se vende es cómo se ve.
 *
 * Detrás de sesión: una muestra sin publicar no tiene dirección pública, y
 * ésta es la única forma de verla.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const inv = await prisma.invitation.findUnique({ where: { id: params.id } });
  if (!inv || !TEMPLATE_BY_ID[inv.templateId]) {
    return new NextResponse("No existe", { status: 404 });
  }

  const html = renderInvitation({
    templateHtml: readTemplate(inv.templateId),
    templateId: inv.templateId,
    data: JSON.parse(inv.data) as InvitationData,
    /* `preview` quita el velo de bienvenida: en una tarjeta de 300 px lo
       único que se vería sería el velo. */
    preview: true,
    origin: origenDe(_request),
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
