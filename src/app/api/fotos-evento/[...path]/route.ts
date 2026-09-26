import { NextResponse } from "next/server";
import { readEventPhoto } from "@/lib/storage";
import { noAutorizado } from "@/lib/auth";

/**
 * Sirve una foto de evento. A diferencia de `/api/media/...`, ésta pide
 * sesión: una foto que subió un invitado es del organizador, no arte para
 * publicar, y no hay ningún sitio donde deba verse sin haber iniciado
 * sesión primero.
 */
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const rel = params.path.join("/");
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
