import { NextResponse } from "next/server";
import { renderBloque, withAbsoluteMedia } from "@/lib/render";
import { BLOCK_BY_TYPE, type BlockSpec } from "@/lib/blocks";
import { HERO_DISPOSICIONES } from "@/lib/schema";

import { TEMPLATE_BY_ID, readTemplate } from "@/lib/templates";

/**
 * La portada no es un bloque —no se reordena ni se quita— pero sus formas se
 * eligen igual que las de los demás, así que se le arma un spec al vuelo.
 */
const PORTADA: BlockSpec = {
  type: "hero",
  label: "Portada",
  icon: "❖",
  section: "hero",
  repeatable: false,
  variants: HERO_DISPOSICIONES.map((d) => ({ id: d.id, name: d.name, hint: d.hint })),
};

/**
 * Las opciones de un bloque, cada una ya dibujada.
 *
 * El editor no puede enseñar una lista de nombres y esperar que el organizador
 * imagine cómo queda «Medallón» en su diseño: lo que necesita es verlas. Aquí
 * se devuelve, por cada variante, la sección suelta lista para meter en un
 * iframe, con los colores y la tipografía de su invitación y sus propios
 * textos.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const templateId = String(body.templateId || "");
  const tipo = String(body.tipo || "");
  const blockId = String(body.blockId || "");

  const spec = tipo === "hero" ? PORTADA : BLOCK_BY_TYPE[tipo];
  if (!TEMPLATE_BY_ID[templateId] || !spec) {
    return NextResponse.json({ error: "Bloque o diseño desconocido." }, { status: 400 });
  }

  const opts = {
    templateHtml: readTemplate(templateId),
    templateId,
    data: withAbsoluteMedia(body.data || {}, new URL(request.url).origin),
    preview: true,
  };

  const opciones = spec.variants
    .filter((v) => v.id !== "" || body.enDiseno || tipo === "hero")
    .map((v) => {
      try {
        return { id: v.id, name: v.name, hint: v.hint, html: renderBloque(opts, tipo, v.id, blockId) };
      } catch {
        // Que falle una variante no puede dejar sin biblioteca a las demás.
        return { id: v.id, name: v.name, hint: v.hint, html: "" };
      }
    })
    .filter((o) => o.html);

  return NextResponse.json({ opciones });
}
