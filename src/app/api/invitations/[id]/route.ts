import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { normalizeSlug, slugError } from "@/lib/slug";
import { noAutorizado } from "@/lib/auth";
import { ESTADOS, esEstado } from "@/lib/tablero";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body.title === "string") update.title = body.title.trim().slice(0, 120);
  if (body.data && typeof body.data === "object") update.data = JSON.stringify(body.data);

  if (typeof body.templateId === "string") {
    if (!TEMPLATE_BY_ID[body.templateId]) {
      return NextResponse.json({ error: "Diseño desconocido." }, { status: 400 });
    }
    update.templateId = body.templateId;
  }

  if (typeof body.slug === "string") {
    const slug = normalizeSlug(body.slug);
    const error = slugError(slug);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const taken = await prisma.invitation.findUnique({ where: { slug } });
    if (taken && taken.id !== params.id) {
      return NextResponse.json(
        { error: `Ya existe una invitación en /${slug}.` },
        { status: 409 }
      );
    }
    update.slug = slug;
  }

  if (typeof body.published === "boolean") update.published = body.published;

  /* El estado del tablero. Se valida contra la lista y no se acepta lo que
     llegue: un estado inventado deja la invitación en una columna que no
     existe, es decir, invisible. `estadoDe` la rescataría al pintarla, pero
     el rescate es para lo viejo, no para lo que entra hoy. */
  if (typeof body.estado === "string") {
    if (!esEstado(body.estado)) {
      return NextResponse.json(
        { error: `"${body.estado}" no es un estado. Los que hay: ${ESTADOS.map((e) => e.id).join(", ")}.` },
        { status: 400 }
      );
    }
    update.estado = body.estado;
  }

  if (typeof body.pagada === "boolean") update.pagada = body.pagada;

  /* El contacto y las notas del tablero. Se recortan porque son campos
     libres que se rellenan a mano y nadie quiere una nota de un megabyte en
     una tarjeta; vacío se guarda como nulo para que «sin teléfono» sea una
     sola cosa y no dos —cadena vacía y nulo— que hay que comprobar por
     separado en cada sitio que las lea. */
  if (typeof body.telefono === "string") {
    update.telefono = body.telefono.trim().slice(0, 40) || null;
  }
  if (typeof body.notas === "string") {
    update.notas = body.notas.trim().slice(0, 2000) || null;
  }

  try {
    const invitation = await prisma.invitation.update({
      where: { id: params.id },
      data: update,
    });
    return NextResponse.json({
      id: invitation.id,
      slug: invitation.slug,
      published: invitation.published,
      estado: invitation.estado,
      pagada: invitation.pagada,
      telefono: invitation.telefono,
      notas: invitation.notas,
      updatedAt: invitation.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "No encontramos la invitación." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  await prisma.invitation.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
