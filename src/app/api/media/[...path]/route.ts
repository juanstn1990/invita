import { NextResponse } from "next/server";
import sharp from "sharp";
import { ANCHOS, readImage } from "@/lib/storage";

/**
 * Sirve una imagen subida, redimensionada al ancho que se pida.
 *
 *     /api/media/2026/09/abc.jpg          el original
 *     /api/media/2026/09/abc.jpg?w=400    reducida a 400px de ancho
 *
 * Antes se servía siempre el original, y eso es el peso de la invitación: las
 * fotos se reducen a 2000px al subir, pero una casilla de galería de 120px
 * descargaba los 2000. Con 465 kB de media por imagen, una galería de seis más
 * la portada eran 3,2 MB en el móvil de quien la abre.
 *
 * Reducir a 400px y pasar a WebP deja esa misma foto en 21 kB. El formato se
 * negocia con el navegador: WebP si lo acepta —lo aceptan todos los que
 * importan— y si no, el original.
 *
 * Se cachea para siempre porque el nombre del archivo es aleatorio y nunca
 * cambia; el ancho va en la URL, así que cada tamaño tiene su propia entrada.
 */
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const file = await readImage(params.path.join("/"));
  if (!file) return new NextResponse("No encontrada", { status: 404 });

  const pedido = Number(new URL(request.url).searchParams.get("w")) || 0;
  /* Sólo los anchos que emitimos: si no, cualquiera puede pedir mil tamaños
     distintos y convertir el servidor en un redimensionador gratuito. */
  const ancho = ANCHOS.includes(pedido) ? pedido : 0;

  const cabeceras = {
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    /* El formato depende del Accept, así que las cachés compartidas tienen
       que guardar una entrada por variante. */
    Vary: "Accept",
  };

  const cuerpo = (bytes: Buffer, mime: string) =>
    new NextResponse(bytes as unknown as BodyInit, {
      headers: { ...cabeceras, "Content-Type": mime, "Content-Length": String(bytes.length) },
    });

  /* Un GIF puede estar animado y redimensionarlo se quedaría con el primer
     fotograma, así que se sirve tal cual. */
  if (!ancho || file.mime === "image/gif") return cuerpo(file.bytes, file.mime);

  const webp = (request.headers.get("accept") || "").includes("image/webp");

  try {
    const img = sharp(file.bytes, { failOn: "none" }).resize({
      width: ancho,
      withoutEnlargement: true,
    });
    const bytes = webp
      ? await img.webp({ quality: 78 }).toBuffer()
      : await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    return cuerpo(bytes, webp ? "image/webp" : "image/jpeg");
  } catch {
    /* Un archivo que sharp no puede leer se sirve como está: más vale la foto
       pesada que ninguna. */
    return cuerpo(file.bytes, file.mime);
  }
}
