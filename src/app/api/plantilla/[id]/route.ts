import { NextResponse } from "next/server";
import { renderInvitation } from "@/lib/render";
import { presetFor } from "@/lib/presets";
import { TEMPLATE_BY_ID, readTemplate } from "@/lib/templates";
import { noAutorizado } from "@/lib/auth";

/** Vista previa de un diseño con contenido de ejemplo, para el selector. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const template = TEMPLATE_BY_ID[params.id];
  if (!template) return new NextResponse("No existe", { status: 404 });

  const data = presetFor(template);

  const html = renderInvitation({
    templateHtml: readTemplate(params.id),
    templateId: params.id,
    data,
    preview: true,
  });
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
