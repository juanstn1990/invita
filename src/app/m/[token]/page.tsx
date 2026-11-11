import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { coupleName, type InvitationData } from "@/lib/schema";
import { fotosDe, MAX_FOTOS } from "@/lib/multimedia";
import { SubirFotos } from "./SubirFotos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tus fotos", robots: { index: false } };

/**
 * El enlace de multimedia: donde el cliente deja sus fotos.
 *
 * Se abre desde WhatsApp, en un móvil, por alguien que no tiene cuenta. La
 * llave es el token de la dirección y la página no enseña nada más que el
 * nombre de su propia invitación y lo que él mismo ha subido.
 */
export default async function MultimediaPage({ params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({
    where: { manageToken: params.token },
    select: { id: true, data: true },
  });
  if (!invitation) notFound();

  const data = JSON.parse(invitation.data) as InvitationData;
  return (
    <SubirFotos
      token={params.token}
      nombres={coupleName(data)}
      iniciales={await fotosDe(invitation.id)}
      maximo={MAX_FOTOS}
    />
  );
}
