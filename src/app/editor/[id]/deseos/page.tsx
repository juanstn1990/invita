import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/auth";
import { qrSvgDataUrl } from "@/lib/qr";
import { Lista } from "./Lista";
import styles from "./libro.module.css";

export const dynamic = "force-dynamic";

/** Los deseos que dejaron los invitados: privados, sólo aquí. */
export default async function DeseosEventoPage({ params }: { params: { id: string } }) {
  await requiereSesion();

  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, slug: true, published: true },
  });
  if (!invitation) notFound();

  const enlace = `/${invitation.slug}/deseos`;
  const qr = invitation.published ? await qrSvgDataUrl(`${process.env.INVITA_URL || ""}${enlace}`) : null;

  const deseos = await prisma.wish.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{invitation.title}</p>
          <h1 className={styles.title}>Libro de deseos</h1>
        </div>
        <Link href={`/editor/${invitation.id}`} className="btn btn-ghost btn-sm">
          ← Volver al editor
        </Link>
      </header>

      {!invitation.published ? (
        <p className={styles.aviso}>
          Publica la invitación para que este enlace funcione. El botón «Firma
          nuestro libro» y el QR sólo sirven cuando alguien más puede abrir <code>{enlace}</code>.
        </p>
      ) : (
        <div className={styles.compartir}>
          {qr && <img src={qr} alt="" className={styles.qr} />}
          <div>
            <p className={styles.compartirTitulo}>El enlace para firmar</p>
            <code className={`mono ${styles.compartirUrl}`}>{enlace}</code>
            <p className={styles.compartirTexto}>
              Se abre el día del evento y no antes — quien entre antes ve un aviso, no el
              formulario. El QR sirve para imprimirlo junto a las fotos.
            </p>
          </div>
        </div>
      )}

      <Lista
        invitationId={invitation.id}
        inicial={deseos.map((d) => ({
          id: d.id,
          nombre: d.nombre,
          texto: d.texto,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
