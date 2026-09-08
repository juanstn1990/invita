import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { coupleName, resolvedDateLabel, type InvitationData } from "@/lib/schema";
import styles from "./home.module.css";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const todas = await prisma.invitation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { rsvps: true } } },
  });
  // Quedaron en la base invitaciones del constructor visual, que se retiró.
  // No se borran —son del organizador— pero ya no hay con qué abrirlas, así
  // que no se listan.
  const invitations = todas.filter((i) => TEMPLATE_BY_ID[i.templateId]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Invita</p>
          <h1 className={styles.title}>Mis invitaciones</h1>
        </div>
        <Link href="/nueva" className="btn btn-primary">
          + Nueva invitación
        </Link>
      </header>

      {invitations.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Todavía no tienes ninguna</p>
          <p className={styles.emptyText}>
            Elige uno de los 14 diseños, cámbiale los textos, prende o apaga las
            secciones que quieras y publícalo en la dirección que tú definas.
          </p>
          <Link href="/nueva" className="btn btn-primary">
            Elegir un diseño
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {invitations.map((inv) => {
            const data = JSON.parse(inv.data) as InvitationData;
            const template = TEMPLATE_BY_ID[inv.templateId];
            return (
              <li key={inv.id} className={styles.card}>
                <Link href={`/editor/${inv.id}`} className={styles.cardMain}>
                  <span
                    className={styles.swatch}
                    style={{
                      background: template
                        ? `linear-gradient(135deg, ${template.palette[0]} 0 34%, ${template.palette[1]} 34% 67%, ${template.palette[2]} 67%)`
                        : "var(--surface-2)",
                    }}
                    aria-hidden
                  />
                  <span className={styles.cardBody}>
                    <span className={styles.cardTitle}>
                      {coupleName(data) || inv.title}
                    </span>
                    <span className={styles.cardMeta}>
                      {template?.name ?? inv.templateId}
                      {resolvedDateLabel(data) ? ` · ${resolvedDateLabel(data)}` : ""}
                    </span>
                  </span>
                </Link>

                <div className={styles.cardSide}>
                  {inv.published ? (
                    <a
                      href={`/${inv.slug}`}
                      target="_blank"
                      rel="noopener"
                      className={`${styles.slug} mono`}
                    >
                      /{inv.slug} ↗
                    </a>
                  ) : (
                    <span className="tag tag-draft">Borrador</span>
                  )}
                  {inv._count.rsvps > 0 && (
                    <Link href={`/editor/${inv.id}?panel=rsvp`} className={styles.rsvps}>
                      {inv._count.rsvps}{" "}
                      {inv._count.rsvps === 1 ? "confirmación" : "confirmaciones"}
                    </Link>
                  )}
                  <DeleteButton id={inv.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
