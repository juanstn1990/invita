import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { nuevoTokenPanel } from "@/lib/invitados";
import { TEMPLATES } from "@/lib/templates";
import { templateSupport } from "@/lib/support";
import type { InvitationData } from "@/lib/schema";
import { requiereSesion } from "@/lib/auth";
import { designOf } from "@/lib/templates";
import { adornosDeclarados, SECCIONES_CON_TITULO } from "@/lib/design/theme";
import { Editor } from "./Editor";

/**
 * Los adornos del diseño, puestos en los datos al abrir el editor.
 *
 * El renderer ya los dibuja cuando la invitación no trae lista —así no se
 * quedaron peladas las de antes—, pero dibujados y nada más no se pueden
 * mover ni quitar: en el editor la lista salía vacía. Sembrarlos al abrir
 * los hace aparecer con su sitio y su tamaño, listos para arrastrar.
 *
 * No se guarda nada aquí: es el estado inicial del editor, y sólo queda
 * escrito cuando quien edita cambia algo y se dispara el autoguardado. Y
 * sólo se siembran las secciones que no traen lista, así que lo que alguien
 * ya colocó —o borró— no se toca.
 */
function conAdornosDelDiseno(data: InvitationData, templateId: string): InvitationData {
  const diseno = designOf(templateId);
  if (!diseno?.adornos?.length) return data;
  const claves = new Set([
    ...SECCIONES_CON_TITULO,
    ...diseno.adornos.map((a) => a.seccion).filter((s) => s !== "*"),
  ]);
  for (const clave of claves) {
    const sec = (data[clave] ||= {} as InvitationData[string]);
    if (Array.isArray(sec.adornos)) continue;
    const declarados = adornosDeclarados(diseno, clave);
    if (!declarados.length) continue;
    sec.adornos = declarados.map(({ seccion, ...campos }) =>
      Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, String(v)]))
    );
  }
  return data;
}

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { panel?: string };
}) {
  await requiereSesion(`/editor/${params.id}`);

  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    include: {
      rsvps: { orderBy: { createdAt: "desc" } },
      aperturas: { select: { veces: true, updatedAt: true } },
    },
  });
  if (!invitation) notFound();

  // La llave del panel que se comparte se crea la primera vez que se abre el
  // editor: así también la tienen las invitaciones de antes.
  let manageToken = invitation.manageToken;
  if (!manageToken) {
    manageToken = await nuevoTokenPanel();
    await prisma.invitation.update({ where: { id: invitation.id }, data: { manageToken } });
  }

  // Qué campos soporta cada diseño, para ocultar los que no se verían y para
  // avisar al usuario antes de cambiar de diseño.
  const supports = Object.fromEntries(
    TEMPLATES.map((t) => [t.id, templateSupport(t.id)])
  );

  return (
    <Editor
      id={invitation.id}
      initialTemplateId={invitation.templateId}
      initialData={conAdornosDelDiseno(
        JSON.parse(invitation.data) as InvitationData,
        invitation.templateId
      )}
      initialSlug={invitation.slug}
      initialPublished={invitation.published}
      manageToken={manageToken}
      templates={TEMPLATES}
      supports={supports}
      rsvps={invitation.rsvps.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        status: r.status,
        partySize: r.partySize,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      }))}
      aperturas={{
        personas: invitation.aperturas.length,
        veces: invitation.aperturas.reduce((n, a) => n + (a.veces || 1), 0),
        ultima:
          invitation.aperturas.length
            ? invitation.aperturas
                .reduce((a, x) => (x.updatedAt > a.updatedAt ? x : a))
                .updatedAt.toISOString()
            : null,
      }}
      openPanel={searchParams.panel === "rsvp" ? "rsvp" : "content"}
    />
  );
}
