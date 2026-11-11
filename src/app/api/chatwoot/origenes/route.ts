/**
 * De qué se puede partir al crear una invitación desde Chatwoot: las muestras
 * del catálogo, las plantillas guardadas y los diseños en blanco.
 */

import { prisma } from "@/lib/prisma";
import { catalogo } from "@/lib/mcp";
import { TEMPLATE_BY_ID, KIND_LABEL } from "@/lib/templates";
import { BASE, sinLlaveChatwoot } from "@/lib/chatwoot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limpiar = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export async function GET(req: Request) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const buscar = limpiar(new URL(req.url).searchParams.get("buscar") || "");
  const palabras = buscar.split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 3);
  const puntos = (texto: string) => {
    const t = limpiar(texto);
    return palabras.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  };
  const filtrar = <T extends { puntos: number }>(xs: T[]) =>
    (palabras.length ? xs.filter((x) => x.puntos > 0) : xs).sort((a, b) => b.puntos - a.puntos);

  const [filas, guardadas] = await Promise.all([
    prisma.invitation.findMany({
      where: { estado: "catalogo", archivada: false },
      select: { id: true, slug: true, title: true, templateId: true, published: true, descripcion: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.plantilla.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const muestras = filtrar(
    filas
      .filter((f) => TEMPLATE_BY_ID[f.templateId])
      .map((f) => {
        const tpl = TEMPLATE_BY_ID[f.templateId];
        return {
          tipo: "invitacion" as const,
          id: f.id,
          titulo: f.title,
          detalle: [KIND_LABEL[tpl.kind], tpl.name].join(" · "),
          descripcion: f.descripcion || null,
          enlace: f.published ? `${BASE}/${f.slug}` : null,
          /* La descripción pesa el doble, como en `muestras` del MCP. */
          puntos: 2 * puntos(f.descripcion || "") + puntos(`${f.title} ${tpl.name} ${KIND_LABEL[tpl.kind]}`),
        };
      })
  );

  const plantillas = filtrar(
    guardadas
      .filter((p) => TEMPLATE_BY_ID[p.templateId])
      .map((p) => ({
        tipo: "plantilla" as const,
        id: p.id,
        titulo: p.nombre,
        detalle: TEMPLATE_BY_ID[p.templateId].name,
        descripcion: null,
        enlace: null,
        puntos: puntos(`${p.nombre} ${TEMPLATE_BY_ID[p.templateId].name}`),
      }))
  );

  const disenos = filtrar(
    Object.entries(catalogo()).flatMap(([familia, lista]) =>
      lista.map((d) => ({
        tipo: "diseno" as const,
        id: d.id,
        titulo: d.nombre,
        detalle: familia,
        descripcion: d.estilo || null,
        enlace: null,
        puntos: puntos(`${d.nombre} ${familia} ${d.estilo}`),
      }))
    )
  );

  const sinPuntos = <T extends { puntos: number }>({ puntos: _p, ...resto }: T) => resto;
  return Response.json({
    muestras: muestras.map(sinPuntos),
    plantillas: plantillas.map(sinPuntos),
    disenos: disenos.map(sinPuntos),
  });
}
