import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { coupleName, resolvedDateLabel, type InvitationData } from "@/lib/schema";
import { resumirLink } from "@/lib/invitados";
import { PanelInvitados } from "./PanelInvitados";

export const dynamic = "force-dynamic";

/**
 * El panel de quien invita.
 *
 * No es una página del organizador: es la que él comparte. La llave es el
 * propio token de la dirección, así que quien la reciba puede crear links de
 * invitado y ver quién ha contestado, sin cuenta ni contraseña. Por eso la
 * página no enseña nada de la invitación que no sea suyo, y nunca deja llegar
 * a otra: todas las consultas van filtradas por el token.
 */
export default async function PanelPage({ params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({
    where: { manageToken: params.token },
    include: {
      links: {
        orderBy: { createdAt: "desc" },
        include: {
          rsvps: { select: { status: true, partySize: true, createdAt: true } },
          aperturas: { select: { veces: true, updatedAt: true } },
        },
      },
    },
  });
  if (!invitation) notFound();

  const data = JSON.parse(invitation.data) as InvitationData;
  const filas = invitation.links.map(resumirLink);

  // El origen real, para que los links que se copian sirvan tal cual.
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");

  return (
    <PanelInvitados
      token={params.token}
      slug={invitation.slug}
      publicada={invitation.published}
      titulo={coupleName(data) || invitation.title}
      fecha={resolvedDateLabel(data)}
      origen={`${proto}://${host}`}
      inicial={filas.map((f) => ({
        ...f,
        respondidoEl: f.respondidoEl?.toISOString() ?? null,
        abiertoEl: f.abiertoEl?.toISOString() ?? null,
      }))}
    />
  );
}
