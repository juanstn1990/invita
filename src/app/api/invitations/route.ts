import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { presetFor } from "@/lib/presets";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { normalizeSlug } from "@/lib/slug";
import { defaultData } from "@/lib/schema";

/** Crea una invitación a partir de un diseño, con contenido de ejemplo. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const templateId = String(body.templateId || "");
  const template = TEMPLATE_BY_ID[templateId];
  if (!template) {
    return NextResponse.json({ error: "Diseño desconocido." }, { status: 400 });
  }

  const data = presetFor(template);

  // Slug provisional único; el organizador lo cambia al publicar.
  const base = normalizeSlug(String(data.event.name1 || "invitacion"));
  let slug = base;
  for (let i = 2; await prisma.invitation.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const invitation = await prisma.invitation.create({
    data: {
      slug,
      templateId,
      title: `${template.name} · ${data.event.name1}`,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ id: invitation.id, slug: invitation.slug });
}
