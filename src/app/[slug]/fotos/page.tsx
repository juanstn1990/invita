import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { coupleName, type InvitationData } from "@/lib/schema";
import { Camara } from "./Camara";
import styles from "./fotos.module.css";

export const dynamic = "force-dynamic";

/**
 * La página de la cámara: a donde lleva el botón «Comparte tus fotos» de la
 * invitación, y el QR que se enseña impreso en el evento.
 *
 * Página propia y no un modal dentro de la invitación: en el celular de un
 * invitado, entrar aquí desde el QR de una mesa tiene que funcionar igual que
 * entrar desde el botón — y un modal no tiene dirección propia que un QR
 * pueda apuntar.
 */
export default async function FotosPage({ params }: { params: { slug: string } }) {
  const invitation = await prisma.invitation.findUnique({ where: { slug: params.slug } });

  if (!invitation || !invitation.published) {
    return (
      <main className={styles.pageAviso}>
        <p>
          {invitation
            ? "Esta invitación todavía no está publicada."
            : "No encontramos esta invitación."}
        </p>
      </main>
    );
  }

  const tpl = TEMPLATE_BY_ID[invitation.templateId];
  const data = JSON.parse(invitation.data) as InvitationData;
  const nombre = coupleName(data) || invitation.title;
  const acento = tpl?.palette?.[1] || "#8a6a2f";

  return (
    <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
      <div className={styles.tarjeta}>
        <p className={styles.eyebrow}>{nombre}</p>
        <h1 className={styles.titulo}>Comparte tus fotos</h1>
        <p className={styles.texto}>
          Ayúdanos a guardar cada momento del día: toma una foto y déjanosla aquí.
        </p>
        <Camara slug={invitation.slug} />
      </div>
    </main>
  );
}
