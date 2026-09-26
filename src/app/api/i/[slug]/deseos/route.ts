import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventoLlego } from "@/lib/disponibilidadEvento";
import type { InvitationData } from "@/lib/schema";

/**
 * Techo de deseos por evento. Mismo motivo que `MAX_FOTOS` en fotos: no es
 * para trescientos invitados escribiendo el suyo —eso es lo esperable—, es
 * para que un enlace reenviado sin querer no llene la tabla de nadie más.
 */
const MAX_DESEOS = 2000;

/**
 * Recibe un deseo firmado, sin registro ni sesión: quien tiene el enlace
 * público puede escribir el suyo. Igual que las fotos: la invitación tiene
 * que existir, estar publicada, y ya debe haber llegado el día del evento.
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

  const data = JSON.parse(invitation.data) as InvitationData;
  const fecha = String((data.event as Record<string, unknown>)?.date || "");
  if (!eventoLlego(fecha)) {
    return NextResponse.json(
      { error: "Todavía no. Esto se abre el día del evento." },
      { status: 403 }
    );
  }

  const total = await prisma.wish.count({ where: { invitationId: invitation.id } });
  if (total >= MAX_DESEOS) {
    return NextResponse.json(
      { error: "Este libro ya llegó al máximo de deseos que se pueden guardar." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  /* Las dos son obligatorias a propósito: un deseo sin firma no es un
     deseo —es una nota anónima—, y una firma sin deseo no es nada. */
  const nombre = String(body.nombre || "").trim().slice(0, 60);
  const texto = String(body.texto || "").trim().slice(0, 600);
  if (!nombre) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  if (!texto) return NextResponse.json({ error: "Escribe tu deseo." }, { status: 400 });

  await prisma.wish.create({ data: { invitationId: invitation.id, nombre, texto } });

  return NextResponse.json({ ok: true });
}
