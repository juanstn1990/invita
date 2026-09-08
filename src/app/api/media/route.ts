import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALLOWED_TYPES, MAX_BYTES, saveImage } from "@/lib/storage";

/** Las clases de imagen que distingue la biblioteca. */
const KINDS = new Set(["foto", "adorno"]);

/**
 * Sube una o varias imágenes y las anota en la biblioteca.
 *
 * Devuelve las URLs en el mismo orden en que llegaron, que es de lo que
 * depende la galería para no desordenar lo que el organizador acaba de
 * arrastrar.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Envío inválido." }, { status: 400 });
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "No llegó ninguna imagen." }, { status: 400 });
  }
  if (files.length > 12) {
    return NextResponse.json({ error: "Máximo 12 imágenes a la vez." }, { status: 400 });
  }

  const kindRaw = String(form.get("kind") || "foto");
  const kind = KINDS.has(kindRaw) ? kindRaw : "foto";
  /* Las medidas las mide el navegador antes de subir: aquí no hay decodificador
     de imágenes y no vale la pena traer uno sólo para esto. */
  const medidas = String(form.get("medidas") || "").split(",");

  const urls: string[] = [];
  for (const [i, file] of files.entries()) {
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: `"${file.name}" no es una imagen JPG, PNG, WebP, GIF o AVIF.` },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `"${file.name}" pesa más de 8 MB.` }, { status: 413 });
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
          kind,
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
    select: { id: true, url: true, name: true, width: true, height: true, kind: true },
  });

  const hayMas = items.length > take;
  return NextResponse.json({
    items: hayMas ? items.slice(0, take) : items,
    cursor: hayMas ? items[take - 1].id : null,
  });
}

/** Saca una imagen de la biblioteca. Los bytes se quedan: puede estar en uso. */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await prisma.media.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
