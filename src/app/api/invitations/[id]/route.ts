import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { normalizeSlug, slugError } from "@/lib/slug";
import { noAutorizado } from "@/lib/auth";
import { ESTADOS, esEstado, esPago, esResponsable, PAGOS } from "@/lib/tablero";
import { deleteEventFolder } from "@/lib/storage";

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

  /* Igual que el estado: no se acepta lo que llegue, porque un valor
     inventado dejaría la tarjeta con un sello que ningún botón sabe
     interpretar ni volver a cambiar. */
  if (typeof body.pago === "string") {
    if (!esPago(body.pago)) {
      return NextResponse.json(
        { error: `"${body.pago}" no es un pago. Los que hay: ${PAGOS.map((p) => p.id).join(", ")}.` },
        { status: 400 }
      );
    }
    update.pago = body.pago;
  }

  /* Quién la lleva: vacío para «sin asignar», que es distinto de no mandar
     el campo —ahí no se toca lo que ya había—. */
  if (typeof body.responsable === "string") {
    if (body.responsable && !esResponsable(body.responsable)) {
      return NextResponse.json(
        { error: `"${body.responsable}" no es quien la lleva. Los que hay: valentina, juan.` },
        { status: 400 }
      );
    }
    update.responsable = body.responsable || null;
  }

  if (typeof body.archivada === "boolean") update.archivada = body.archivada;

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
      pago: invitation.pago,
      responsable: invitation.responsable,
      archivada: invitation.archivada,
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
  /* Las fotos de evento no son de nadie más —a diferencia de la biblioteca de
     diseño, que se reutiliza a propósito— así que aquí sí se borran los
     bytes, no sólo la fila. Después del borrado en la base: si la carpeta se
     fuera primero y el borrado de la fila fallara, quedarían filas
     apuntando a nada. */
  await deleteEventFolder(params.id);
  return NextResponse.json({ ok: true });
}
