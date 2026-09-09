import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_VISITA,
  DIAS_VISITA,
  claveDeApertura,
  esRastreador,
  nuevoVisitante,
} from "@/lib/aperturas";
import { COOKIE as COOKIE_SESION } from "@/lib/sesion";
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

  /* El contador crudo, que cuenta todo: rastreadores, recargas y al propio
     organizador. No se muestra en ningún sitio; lo que se muestra sale de
     `Apertura`, unas líneas más abajo. */
  prisma.invitation
    .update({ where: { id: invitation.id }, data: { views: { increment: 1 } } })
    .catch(() => null);

  if (!TEMPLATE_BY_ID[invitation.templateId]) {
    return new NextResponse(NOT_FOUND, { status: 404, headers: html });
  }

  /* ── ¿Quién abrió esto, y desde qué enlace? ──────────────────
     Ver `src/lib/aperturas.ts` para por qué no vale contar peticiones. */
  const ua = request.headers.get("user-agent");
  const galletas = cookies();
  /* Al organizador no se le cuenta. Basta con que la cookie esté: quien abre
     una invitación por WhatsApp no la tiene, y comprobar que la sesión sea
     válida costaría una consulta más en cada visita. */
  const esOrganizador = Boolean(galletas.get(COOKIE_SESION));

  let visitante = galletas.get(COOKIE_VISITA)?.value || "";
  const nuevo = !visitante;
  if (nuevo) visitante = nuevoVisitante();

  const contar = !esRastreador(ua) && !esOrganizador;
  if (contar) {
    const codigo = (new URL(request.url).searchParams.get("g") || "").trim().slice(0, 40);
    /* Se comprueba que el código sea de esta invitación: viaja en la
       dirección y podría venir cambiado. */
    const link = codigo
      ? await prisma.guestLink
          .findFirst({
            where: { code: codigo, invitationId: invitation.id },
            select: { id: true },
          })
          .catch(() => null)
      : null;

    const clave = claveDeApertura(link?.id ?? null, visitante);
    /* Que fallar aquí no impida ver la invitación: esto es un dato para el
       organizador, no parte de lo que el invitado vino a leer. */
    await prisma.apertura
      .upsert({
        where: { invitationId_clave: { invitationId: invitation.id, clave } },
        create: {
          invitationId: invitation.id,
          guestLinkId: link?.id ?? null,
          clave,
        },
        update: { veces: { increment: 1 } },
      })
      .catch(() => null);
  }

  const rendered = renderInvitation({
    templateHtml: readTemplate(invitation.templateId),
    templateId: invitation.templateId,
    data: JSON.parse(invitation.data) as InvitationData,
    slug: invitation.slug,
    // Para las etiquetas Open Graph: WhatsApp no resuelve rutas relativas.
    origin: origenDe(request),
  });

  const res = new NextResponse(rendered, { headers: html });

  /* El identificador del visitante: un número aleatorio, nada de la persona.
     Sólo sirve para no contar cuatro veces a quien recarga cuatro veces. No
     se le pone a un rastreador —no vuelve— ni al organizador. */
  if (nuevo && contar) {
    res.cookies.set(COOKIE_VISITA, visitante, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: DIAS_VISITA * 24 * 60 * 60,
    });
  }

  return res;
}
