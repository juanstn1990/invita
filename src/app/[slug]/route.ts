import { NextResponse } from "next/server";
import { origenDe } from "@/lib/origen";
import { prisma } from "@/lib/prisma";
import { renderInvitation } from "@/lib/render";
import { TEMPLATE_BY_ID, readTemplate } from "@/lib/templates";
import { coupleName, type InvitationData } from "@/lib/schema";

/**
 * La invitación publicada.
 *
 * Es un route handler y no una página porque el HTML del diseño es un
 * documento completo — con su propio <head>, fuentes, estilos y scripts — y
 * debe servirse tal cual, sin el layout de la app alrededor.
 */

const NOT_FOUND = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invitación no encontrada</title>
<style>
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:10px;text-align:center;padding:2rem;background:#f7f4ef;color:#2e2a26;
    font-family:ui-sans-serif,system-ui,sans-serif}
  h1{font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0}
  p{margin:0;color:#7d746a;max-width:34ch}
</style></head>
<body><h1>No encontramos esta invitación</h1>
<p>Puede que el link esté mal escrito.</p></body></html>`;

/**
 * Existe, pero sigue en borrador.
 *
 * Antes esto daba el mismo "no encontramos" que un link mal escrito, y quien
 * había repartido enlaces desde el panel se quedaba sin saber qué pasaba: el
 * enlace estaba bien, sólo faltaba publicar.
 */
const SIN_PUBLICAR = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invitación todavía no publicada</title>
<style>
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:10px;text-align:center;padding:2rem;background:#f7f4ef;color:#2e2a26;
    font-family:ui-sans-serif,system-ui,sans-serif}
  h1{font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0}
  p{margin:0;color:#7d746a;max-width:36ch;line-height:1.6}
</style></head>
<body><h1>Todavía no está publicada</h1>
<p>El enlace es correcto. Quien organiza la invitación tiene que publicarla
para que se pueda abrir.</p></body></html>`;

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const html = { "Content-Type": "text/html; charset=utf-8" };

  const invitation = await prisma.invitation.findUnique({
    where: { slug: params.slug },
  });

  if (!invitation) {
    return new NextResponse(NOT_FOUND, { status: 404, headers: html });
  }
  if (!invitation.published) {
    return new NextResponse(SIN_PUBLICAR, { status: 404, headers: html });
  }

  // Contar la visita sin hacer esperar a quien abre la invitación.
  prisma.invitation
    .update({ where: { id: invitation.id }, data: { views: { increment: 1 } } })
    .catch(() => null);

  if (!TEMPLATE_BY_ID[invitation.templateId]) {
    return new NextResponse(NOT_FOUND, { status: 404, headers: html });
  }

  const rendered = renderInvitation({
    templateHtml: readTemplate(invitation.templateId),
    templateId: invitation.templateId,
    data: JSON.parse(invitation.data) as InvitationData,
    slug: invitation.slug,
    // Para las etiquetas Open Graph: WhatsApp no resuelve rutas relativas.
    origin: origenDe(request),
  });

  return new NextResponse(rendered, { headers: html });
}
