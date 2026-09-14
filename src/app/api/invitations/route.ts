import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { presetFor } from "@/lib/presets";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { normalizeSlug } from "@/lib/slug";
import { defaultData } from "@/lib/schema";
import { noAutorizado } from "@/lib/auth";

/**
 * Crea una invitación: o desde uno de los 42 diseños, con contenido de
 * ejemplo, o desde una plantilla propia, copiando lo que se guardó.
 */
export async function POST(request: Request) {
  const no = await noAutorizado();
  if (no) return no;

  const body = await request.json().catch(() => ({}));

  /* Desde una plantilla propia: se copia su `data` tal cual. Todo lo que no
     está ahí —el slug, las confirmaciones, los enlaces de invitado, las
     aperturas— nace vacío, que es lo correcto: son de la invitación de la que
     salió la plantilla, no del punto de partida. */
  const plantillaId = String(body.plantillaId || "");
  if (plantillaId) {
    const p = await prisma.plantilla.findUnique({ where: { id: plantillaId } });
    if (!p || !TEMPLATE_BY_ID[p.templateId]) {
      return NextResponse.json({ error: "Esa plantilla ya no existe." }, { status: 404 });
    }
    const datos = JSON.parse(p.data);
    const base = normalizeSlug(String(datos?.event?.name1 || "invitacion"));
    let slug = base;
    for (let i = 2; await prisma.invitation.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }
    const nueva = await prisma.invitation.create({
      data: { slug, templateId: p.templateId, title: p.nombre, data: p.data },
    });
    return NextResponse.json({ id: nueva.id, slug: nueva.slug });
  }

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
