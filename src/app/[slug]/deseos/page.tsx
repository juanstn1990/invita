import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { coupleName, resolvedDateLabel, type InvitationData } from "@/lib/schema";
import { eventoLlego } from "@/lib/disponibilidadEvento";
import { Formulario } from "./Formulario";
import styles from "./deseos.module.css";

export const dynamic = "force-dynamic";

/**
 * El libro de deseos: a donde lleva el botón «Firma nuestro libro» de la
 * invitación, y el QR que se enseña impreso en el evento.
 *
 * Página propia por la misma razón que las fotos: el QR de una mesa tiene
 * que abrir exactamente lo mismo que el botón, y un modal no tiene
 * dirección propia que un QR pueda apuntar.
 */
export default async function DeseosPage({ params }: { params: { slug: string } }) {
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
  const fecha = String((data.event as Record<string, unknown>)?.date || "");

  if (!eventoLlego(fecha)) {
    return (
      <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
        <div className={styles.tarjeta}>
          <p className={styles.eyebrow}>{nombre}</p>
          <h1 className={styles.titulo}>Todavía no</h1>
          <p className={styles.texto}>
            El libro se abre el día del evento{resolvedDateLabel(data) ? `, el ${resolvedDateLabel(data)}` : ""}.
            Vuelve entonces para dejar tu firma.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
      <div className={styles.tarjeta}>
        <p className={styles.eyebrow}>{nombre}</p>
        <h1 className={styles.titulo}>Firma nuestro libro de deseos</h1>
        <p className={styles.texto}>
          Escríbenos un deseo, un consejo, o lo que quieras decirnos de este día — y fírmalo.
        </p>
        <Formulario slug={invitation.slug} />
      </div>
    </main>
  );
}
