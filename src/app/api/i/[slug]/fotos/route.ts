import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { MAX_BYTES, saveEventPhoto } from "@/lib/storage";
import { eventoLlego } from "@/lib/disponibilidadEvento";
import type { InvitationData } from "@/lib/schema";

/** Sólo lo que el navegador de cualquier invitado puede fotografiar y mandar. */
const MIME_POR_FORMATO: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Techo de fotos por evento.
 *
 * No es para una boda de trescientos invitados con dos fotos cada uno —eso
 * son seiscientas, muy por debajo—; es para que un enlace filtrado o
 * reenviado sin querer no convierta el disco del servidor en el problema de
 * otro. 2000 es más de lo que cualquier evento real necesita.
 */
const MAX_FOTOS = 2000;

/**
 * Recibe una foto de un invitado, sin registro ni sesión: quien tiene el
 * enlace público de la invitación puede subir. La invitación tiene que
 * existir y estar publicada — no tiene sentido recibir fotos de un borrador
 * que nadie ha visto todavía.
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug: params.slug },
    select: { id: true, published: true, data: true },
  });
  if (!invitation || !invitation.published) {
    return NextResponse.json({ error: "Esta invitación no está disponible." }, { status: 404 });
  }

  /* Repite la comprobación de la página: quien llegue directo al endpoint
     —sin pasar por la página, que ya lo dice— no puede subir antes de
     tiempo. */
  const data = JSON.parse(invitation.data) as InvitationData;
  const fecha = String((data.event as Record<string, unknown>)?.date || "");
  if (!eventoLlego(fecha)) {
    return NextResponse.json(
      { error: "Todavía no. Esto se abre el día del evento." },
      { status: 403 }
    );
  }

  const total = await prisma.eventPhoto.count({ where: { invitationId: invitation.id } });
  if (total >= MAX_FOTOS) {
    return NextResponse.json(
      { error: "Este evento ya llegó al máximo de fotos que se pueden guardar." },
      { status: 429 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto pesa más de 8 MB." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  /* El tipo sale de abrir el archivo con sharp, no de lo que diga el
     navegador: mismo motivo que en `subir.ts` — un `Content-Type` se falsea
     en diez segundos y esto acaba sirviéndose desde el panel de alguien. */
  const meta = await sharp(bytes).metadata().catch(() => null);
  const mime = meta?.format ? MIME_POR_FORMATO[meta.format] : undefined;
  if (!meta || !mime) {
    return NextResponse.json(
      { error: "Eso no es una foto que se pueda usar: tiene que ser JPG, PNG o WebP." },
      { status: 415 }
    );
  }

  /* Opcional a propósito: pedir el nombre antes de dejar tomar la foto es la
     fricción que hace que nadie la use. */
  const autor = String(form?.get("autor") || "").trim().slice(0, 60) || null;

  const rel = await saveEventPhoto(bytes, mime, invitation.id);
  await prisma.eventPhoto.create({
    data: {
      invitationId: invitation.id,
      url: rel,
      bytes: bytes.length,
      width: meta.width || null,
      height: meta.height || null,
      autor,
    },
  });

  return NextResponse.json({ ok: true });
}
