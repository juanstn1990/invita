import { NextResponse } from "next/server";
import { readEventPhoto } from "@/lib/storage";
import { sesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Sirve una foto de evento. A diferencia de `/api/media/...`, ésta es
 * privada: una foto que subió un invitado es del organizador (y de quien
 * organiza con él), no arte para publicar.
 *
 * Dos llaves abren la puerta, no una: la sesión de quien inició sesión en el
 * editor, o el `manageToken` de esa misma invitación por `?t=` — el mismo
 * que ya abre `/g/[token]`, para quien organiza pero no tiene cuenta. La
 * ruta siempre empieza por el id de la invitación (así se guarda en disco),
 * así que un token sólo abre las fotos de su propia invitación.
 */
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const rel = params.path.join("/");
  const invitationId = params.path[0] || "";

  let autorizado = !!(await sesionActual());
  if (!autorizado) {
    const token = new URL(request.url).searchParams.get("t") || "";
    if (token && invitationId) {
      const inv = await prisma.invitation.findUnique({
        where: { id: invitationId },
        select: { manageToken: true },
      });
      autorizado = !!inv?.manageToken && inv.manageToken === token;
    }
  }
  if (!autorizado) {
    return new NextResponse(JSON.stringify({ error: "Entra para hacer esto." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const file = await readEventPhoto(rel);
  if (!file) return new NextResponse("No encontrada", { status: 404 });

  return new NextResponse(file.bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.bytes.length),
      "X-Content-Type-Options": "nosniff",
      /* Privada: que no quede en una caché compartida ni en el disco de un
         proxy por el camino. */
      "Cache-Control": "private, no-store",
    },
  });
}
