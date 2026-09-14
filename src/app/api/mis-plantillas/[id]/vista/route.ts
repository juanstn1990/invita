import { NextResponse } from "next/server";
import { noAutorizado } from "@/lib/auth";
import { origenDe } from "@/lib/origen";
import { prisma } from "@/lib/prisma";
import { renderInvitation } from "@/lib/render";
import { TEMPLATE_BY_ID, readTemplate } from "@/lib/templates";
import type { InvitationData } from "@/lib/schema";

/**
 * La vista previa de una plantilla propia, para la tarjeta del selector.
 *
 * Es el equivalente de `/api/plantilla/[id]` —que enseña uno de los 42 con
 * contenido de ejemplo— pero con los datos que se guardaron: de eso se trata,
 * de ver cómo quedó tu trabajo antes de volver a empezar desde él.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const p = await prisma.plantilla.findUnique({ where: { id: params.id } });
  if (!p || !TEMPLATE_BY_ID[p.templateId]) {
    return new NextResponse("No existe", { status: 404 });
  }

  const html = renderInvitation({
    templateHtml: readTemplate(p.templateId),
    templateId: p.templateId,
    data: JSON.parse(p.data) as InvitationData,
    /* `preview` quita el velo de bienvenida: en una tarjeta de 300px lo único
       que se vería sería el velo. */
    preview: true,
    origin: origenDe(request),
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
