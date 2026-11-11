/**
 * Lo que hace el cliente desde su enlace de multimedia: ver, subir y quitar
 * sus fotos. La llave es el token de la dirección; todas las consultas van
 * filtradas por la invitación de ese token.
 */

import { prisma } from "@/lib/prisma";
import { guardarEnBiblioteca } from "@/lib/subir";
import { esPapel, fotosDe, MAX_FOTOS } from "@/lib/multimedia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fallo = (error: string, status = 400) => Response.json({ error }, { status });

const invitacionDe = (token: string) =>
  prisma.invitation.findUnique({ where: { manageToken: token }, select: { id: true } });

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const inv = await invitacionDe(params.token);
  if (!inv) return fallo("Este enlace no existe.", 404);
  return Response.json({ fotos: await fotosDe(inv.id) });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const inv = await invitacionDe(params.token);
  if (!inv) return fallo("Este enlace no existe.", 404);

  const form = await req.formData().catch(() => null);
  const archivo = form?.get("archivo");
  const papel = form?.get("papel");
  if (!(archivo instanceof File)) return fallo("No llegó ninguna foto.");
  if (!esPapel(papel)) return fallo("Falta decir si es la portada o una foto más.");

  if (papel === "foto") {
    const cuantas = await prisma.media.count({ where: { invitationId: inv.id, papel: "foto" } });
    if (cuantas >= MAX_FOTOS) {
      return fallo(`Ya hay ${MAX_FOTOS} fotos. Quita alguna para subir otra.`, 409);
    }
  }

  let subida;
  try {
    subida = await guardarEnBiblioteca(Buffer.from(await archivo.arrayBuffer()), archivo.name, "foto");
  } catch (e) {
    return fallo((e as Error).message, 422);
  }

  /* La portada es una sola: la anterior se suelta. No se borra —puede estar
     ya puesta en la invitación—, sólo deja de salir en este enlace. */
  if (papel === "portada") {
    await prisma.media.updateMany({
      where: { invitationId: inv.id, papel: "portada" },
      data: { invitationId: null, papel: null },
    });
  }
  /* Por URL: `guardarEnBiblioteca` ya creó la fila. Si la misma foto ya
     estaba en la biblioteca, la URL es la misma y simplemente se anota. */
  await prisma.media.updateMany({
    where: { url: subida.url },
    data: { invitationId: inv.id, papel },
  });

  return Response.json({ fotos: await fotosDe(inv.id) }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { token: string } }) {
  const inv = await invitacionDe(params.token);
  if (!inv) return fallo("Este enlace no existe.", 404);

  const id = new URL(req.url).searchParams.get("id") || "";
  /* Se suelta, no se borra: si ya está puesta en la invitación, borrar el
     archivo la dejaría con un hueco. */
  await prisma.media.updateMany({
    where: { id, invitationId: inv.id },
    data: { invitationId: null, papel: null },
  });
  return Response.json({ fotos: await fotosDe(inv.id) });
}
