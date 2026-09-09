import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_TYPES,
  ALLOWED_VIDEO,
  MAX_BYTES,
  MAX_VIDEO_BYTES,
  saveImage,
} from "@/lib/storage";
import { noAutorizado } from "@/lib/auth";

/** Las clases de archivo que distingue la biblioteca. */
const KINDS = new Set(["foto", "adorno", "video"]);

/**
 * Sube una o varias imágenes y las anota en la biblioteca.
 *
 * Devuelve las URLs en el mismo orden en que llegaron, que es de lo que
 * depende la galería para no desordenar lo que el organizador acaba de
 * arrastrar.
 */
export async function POST(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Envío inválido." }, { status: 400 });
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "No llegó ningún archivo." }, { status: 400 });
  }
  if (files.length > 12) {
    return NextResponse.json({ error: "Máximo 12 archivos a la vez." }, { status: 400 });
  }

  const kindRaw = String(form.get("kind") || "foto");
  const kind = KINDS.has(kindRaw) ? kindRaw : "foto";
  /* Las medidas las mide el navegador antes de subir: aquí no hay decodificador
     de imágenes y no vale la pena traer uno sólo para esto. */
  const medidas = String(form.get("medidas") || "").split(",");

  const urls: string[] = [];
  for (const [i, file] of files.entries()) {
    const video = Boolean(ALLOWED_VIDEO[file.type]);
    if (!video && !ALLOWED_TYPES[file.type]) {
      /* Se nombra el archivo porque casi siempre es uno de varios, y sin el
         nombre no se sabe cuál quitar. El caso típico es un MOV del iPhone. */
      return NextResponse.json(
        {
          error:
            `"${file.name}" no es un formato que los navegadores reproduzcan: ` +
            `imágenes JPG, PNG, WebP, GIF o AVIF, y vídeo MP4 o WebM.`,
        },
        { status: 415 }
      );
    }

    const techo = video ? MAX_VIDEO_BYTES : MAX_BYTES;
    if (file.size > techo) {
      return NextResponse.json(
        { error: `"${file.name}" pesa más de ${video ? "64 MB" : "8 MB"}.` },
        { status: 413 }
      );
    }

    const url = await saveImage(Buffer.from(await file.arrayBuffer()), file.type);
    urls.push(url);

    const [w, h] = (medidas[i] || "").split("x").map((n) => Number(n) || 0);
    /* Que falle el catálogo no puede tumbar la subida: los bytes ya están en
       disco y la invitación ya puede usar la URL. */
    await prisma.media
      .create({
        data: {
          url,
          name: file.name.slice(0, 200),
          mime: file.type,
          bytes: file.size,
          width: w || null,
          height: h || null,
          /* Un vídeo va siempre al estante de vídeo, aunque se haya subido
             desde el campo de una foto: es lo que hace que la biblioteca
             pueda filtrarlo después. */
          kind: video ? "video" : kind,
        },
      })
      .catch(() => null);
  }

  return NextResponse.json({ urls });
}

/**
 * La biblioteca: lo que ya se subió, para reutilizarlo.
 *
 * Es lo que evita tener que volver a buscar en el disco un marco floral que
 * ya se usó en otra invitación.
 */
export async function GET(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const q = (url.searchParams.get("q") || "").trim();
  const take = Math.min(120, Math.max(1, Number(url.searchParams.get("take")) || 60));
  const cursor = url.searchParams.get("cursor");

  const items = await prisma.media.findMany({
    where: {
      ...(kind && KINDS.has(kind) ? { kind } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, url: true, name: true, width: true, height: true, kind: true, mime: true },
  });

  const hayMas = items.length > take;
  return NextResponse.json({
    items: hayMas ? items.slice(0, take) : items,
    cursor: hayMas ? items[take - 1].id : null,
  });
}

/** Saca una imagen de la biblioteca. Los bytes se quedan: puede estar en uso. */
export async function DELETE(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await prisma.media.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
