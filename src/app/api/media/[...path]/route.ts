import { NextResponse } from "next/server";
import sharp from "sharp";
import { ANCHOS, esVideo, readImage, readStream, statFile, tramo } from "@/lib/storage";

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
 *
 * El vídeo sigue otro camino entero: por tramos y sin tocar los bytes. Ver
 * `videoPorTramos`.
 */
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const rel = params.path.join("/");

  /* El vídeo no se lee entero a memoria ni se redimensiona: se sirve por
     tramos, que es lo que hace que se pueda adelantar y que iOS lo
     reproduzca. Va antes que todo lo demás para no leer 60 MB por error. */
  const stat = await statFile(rel);
  if (stat && esVideo(stat.mime)) return videoPorTramos(request, rel, stat);

  const file = await readImage(rel);
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

/**
 * Sirve un vídeo por tramos.
 *
 * Sin esto el vídeo se veía en Chrome de escritorio y no en iPhone, que es
 * justo donde se abren las invitaciones: Safari pide los primeros bytes con
 * `Range` para leer la cabecera del MP4 y, si el servidor responde `200` con
 * el archivo entero en lugar de `206`, se rinde y muestra un recuadro negro.
 * Adelantar el vídeo depende de lo mismo.
 */
function videoPorTramos(
  request: Request,
  rel: string,
  stat: { size: number; mime: string }
) {
  const base = {
    "Content-Type": stat.mime,
    /* Anunciarlo es lo que hace que el navegador se atreva a pedir tramos. */
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  const cabecera = request.headers.get("range");
  const t = tramo(cabecera, stat.size);

  /* Un `Range` que no se entiende se responde con el archivo completo; uno que
     pide más allá del final es un 416, que es lo que el reproductor espera
     para dejar de insistir. */
  if (!t) {
    if (cabecera && /^bytes=\d+-/.test(cabecera.trim())) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...base, "Content-Range": `bytes */${stat.size}` },
      });
    }
    return new NextResponse(
      readStream(rel, 0, stat.size - 1) as unknown as BodyInit,
      { headers: { ...base, "Content-Length": String(stat.size) } }
    );
  }

  return new NextResponse(
    readStream(rel, t.desde, t.hasta) as unknown as BodyInit,
    {
      status: 206,
      headers: {
        ...base,
        "Content-Range": `bytes ${t.desde}-${t.hasta}/${stat.size}`,
        "Content-Length": String(t.hasta - t.desde + 1),
      },
    }
  );
}
