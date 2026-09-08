import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUSES = new Set(["confirmado", "rechazado", "quiza"]);

interface Respuesta {
  name: string;
  status: string;
  partySize?: number;
}

/** Un link puede traer varios invitados; cada uno responde por separado. */
function normalizar(body: Record<string, unknown>): Respuesta[] {
  const lista = Array.isArray(body.guests) ? body.guests : [body];
  return lista
    .slice(0, 20)
    .map((g) => {
      const fila = (g || {}) as Record<string, unknown>;
      return {
        name: String(fila.name || "").trim().slice(0, 120),
        status: STATUSES.has(String(fila.status)) ? String(fila.status) : "confirmado",
        partySize: Math.min(Math.max(1, Math.floor(Number(fila.partySize) || 1)), 20),
      };
    })
    .filter((g) => g.name);
}

/** Confirmación de asistencia desde una invitación publicada. Sin registro. */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({}));
  const respuestas = normalizar(body);
  if (!respuestas.length) {
    return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { slug: params.slug },
    select: { id: true, published: true },
  });
  if (!invitation || !invitation.published) {
    return NextResponse.json({ error: "Esta invitación no está disponible." }, { status: 404 });
  }

  const phone = String(body.phone || "").trim().slice(0, 40) || null;
  const note = String(body.note || "").trim().slice(0, 500) || null;

  // De qué link personalizado viene, si viene de uno. Se comprueba que sea de
  // esta invitación: el código va en la dirección y podría venir cambiado.
  const codigo = String(body.code || "").trim().slice(0, 40);
  const link = codigo
    ? await prisma.guestLink.findFirst({
        where: { code: codigo, invitationId: invitation.id },
        select: { id: true },
      })
    : null;

  await prisma.rsvp.createMany({
    data: respuestas.map((r) => ({
      invitationId: invitation.id,
      guestLinkId: link?.id ?? null,
      name: r.name,
      phone,
      status: r.status,
      partySize: r.status === "confirmado" ? r.partySize ?? 1 : 1,
      note,
    })),
  });

  const asisten = respuestas.filter((r) => r.status === "confirmado").length;
  return NextResponse.json({
    ok: true,
    // "mixto" cuando en el mismo link unos vienen y otros no.
    status: asisten === respuestas.length ? "confirmado" : asisten ? "mixto" : "rechazado",
    total: respuestas.length,
    asisten,
  });
}
