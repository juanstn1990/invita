import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { nuevoTokenPanel } from "@/lib/invitados";
import { TEMPLATES } from "@/lib/templates";
import { templateSupport } from "@/lib/support";
import type { InvitationData } from "@/lib/schema";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { panel?: string };
}) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    include: { rsvps: { orderBy: { createdAt: "desc" } } },
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
      initialData={JSON.parse(invitation.data) as InvitationData}
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
      openPanel={searchParams.panel === "rsvp" ? "rsvp" : "content"}
    />
  );
}
