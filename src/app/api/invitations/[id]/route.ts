import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { normalizeSlug, slugError } from "@/lib/slug";
import { noAutorizado } from "@/lib/auth";

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

  try {
    const invitation = await prisma.invitation.update({
      where: { id: params.id },
      data: update,
    });
    return NextResponse.json({
      id: invitation.id,
      slug: invitation.slug,
      published: invitation.published,
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
