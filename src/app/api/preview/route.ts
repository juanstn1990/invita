import { NextResponse } from "next/server";
import { renderInvitation, withAbsoluteMedia } from "@/lib/render";
import { TEMPLATE_BY_ID, readTemplate } from "@/lib/templates";
import { origenDe } from "@/lib/origen";

/** Render en vivo para el editor: no toca la base de datos. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const templateId = String(body.templateId || "");
  if (!TEMPLATE_BY_ID[templateId]) {
    return new NextResponse("Diseño desconocido", { status: 400 });
  }
  try {
    const html = renderInvitation({
      templateHtml: readTemplate(templateId),
      templateId,
      // El iframe del editor usa srcdoc: sin origen, /api/media/… no carga.
      // El origen sale de las cabeceras y no de request.url, que en un
      // contenedor da el hostname interno de Docker.
      data: withAbsoluteMedia(body.data || {}, origenDe(request)),
      preview: true,
    });
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return new NextResponse(`Error al renderizar: ${(e as Error).message}`, { status: 500 });
  }
}
