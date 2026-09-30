import { NextResponse } from "next/server";
import { readEventPhoto } from "@/lib/storage";
import { sesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { configFotos } from "@/lib/fotosEvento";
import type { InvitationData } from "@/lib/schema";

/**
 * Sirve una foto de evento. A diferencia de `/api/media/...`, ésta es
 * privada por defecto: una foto que subió un invitado es del organizador
 * (y de quien organiza con él), no arte para publicar.
 *
 * Tres llaves abren la puerta:
 * · La sesión de quien inició sesión en el editor.
 * · El `manageToken` de esa misma invitación por `?t=` — el mismo que ya
 *   abre `/g/[token]`, para quien organiza pero no tiene cuenta.
 * · El álbum en "propias" o "público" (`configFotos`, en el bloque
 *   `fotos`): ahí cualquiera puede pedir una foto por su ruta —que ya es un
 *   nombre al azar, no una lista que se pueda adivinar—; lo que decide cada
 *   nivel es qué tan fácil es *enterarse* de esa ruta (ver `/fotos/mias` y
 *   `Galeria.tsx`), no si el archivo en sí se sirve.
 *
 * La ruta siempre empieza por "eventos" y luego el id de la invitación (así
 * se guarda en disco, ver `saveEventPhoto`), así que un token o un álbum
 * público sólo abren las fotos de su propia invitación.
 */
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const rel = params.path.join("/");
  const invitationId = params.path[1] || "";

  let autorizado = !!(await sesionActual());
  if (!autorizado && invitationId) {
    const inv = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { manageToken: true, published: true, data: true },
    });
    const token = new URL(request.url).searchParams.get("t") || "";
    if (token && inv?.manageToken && inv.manageToken === token) {
      autorizado = true;
    } else if (inv?.published) {
      const { visibilidad } = configFotos(JSON.parse(inv.data) as InvitationData);
      autorizado = visibilidad !== "privado";
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
