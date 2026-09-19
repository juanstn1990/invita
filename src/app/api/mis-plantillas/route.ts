import { NextResponse } from "next/server";
import { noAutorizado } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { actualizarDesdeInvitacion, deshacer } from "@/lib/plantillas";

/**
 * Las plantillas propias: invitaciones guardadas para volver a empezar desde
 * ellas.
 *
 * Se llaman `mis-plantillas` y no `plantillas` a secas porque `/api/plantilla`
 * ya existe y renderiza uno de los 42 diseños del catálogo. Son dos cosas
 * distintas y confundirlas en la dirección sería confundirlas en la cabeza de
 * quien lea esto en seis meses.
 */

/** Guarda una invitación como plantilla. */
export async function POST(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const body = await request.json().catch(() => ({}));
  const invitationId = String(body.invitationId || "");
  const nombre = String(body.nombre || "").trim().slice(0, 80);
  if (!nombre) {
    return NextResponse.json({ error: "Ponle un nombre a la plantilla." }, { status: 400 });
  }

  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, templateId: true, data: true },
  });
  if (!inv) {
    return NextResponse.json({ error: "No existe esa invitación." }, { status: 404 });
  }
  if (!TEMPLATE_BY_ID[inv.templateId]) {
    return NextResponse.json(
      { error: "Esa invitación usa un diseño retirado y no se puede guardar." },
      { status: 400 }
    );
  }

  /* Copia, no referencia: si mañana se edita la invitación, la plantilla se
     queda como estaba. Y no se copia nada de fuera de `data` —el slug, las
     confirmaciones, los enlaces de invitado— porque eso es de esa invitación
     concreta y no del punto de partida. */
  const p = await prisma.plantilla.create({
    data: { nombre, templateId: inv.templateId, data: inv.data, origenId: inv.id },
  });

  return NextResponse.json({ id: p.id, nombre: p.nombre });
}

/** Las que ya hay, para el selector de diseño. */
export async function GET(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const items = await prisma.plantilla.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, nombre: true, templateId: true, createdAt: true,
      origenId: true, actualizadaAt: true,
      _count: { select: { versiones: true } },
    },
  });
  return NextResponse.json({
    items: items.map(({ _count, ...p }) => ({ ...p, versiones: _count.versiones })),
  });
}

/**
 * Actualiza una plantilla, o la devuelve a su versión anterior.
 *
 *   { id, invitationId }   la plantilla pasa a ser lo que hoy es esa invitación
 *   { id, deshacer: true } vuelve a la versión de antes de la última actualización
 *
 * Antes de sobrescribir siempre se guarda lo que había: ver `lib/plantillas`.
 */
export async function PATCH(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Falta la plantilla." }, { status: 400 });

  const r = body.deshacer
    ? await deshacer(id)
    : await actualizarDesdeInvitacion(id, String(body.invitationId || ""));

  return r.ok
    ? NextResponse.json(r)
    : NextResponse.json({ error: r.error }, { status: 400 });
}

/** Borra una. No toca la invitación de la que salió. */
export async function DELETE(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  await prisma.plantilla.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
