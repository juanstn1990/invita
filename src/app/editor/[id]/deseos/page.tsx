import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/auth";
import { qrSvgDataUrl } from "@/lib/qr";
import { nuevoTokenPanel } from "@/lib/invitados";
import { EnlaceCliente } from "../EnlaceCliente";
import { Lista } from "./Lista";
import styles from "./libro.module.css";

export const dynamic = "force-dynamic";

/** Los deseos que dejaron los invitados: privados, sólo aquí. */
export default async function DeseosEventoPage({ params }: { params: { id: string } }) {
  await requiereSesion();

  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, slug: true, published: true, manageToken: true },
  });
  if (!invitation) notFound();

  let manageToken = invitation.manageToken;
  if (!manageToken) {
    manageToken = await nuevoTokenPanel();
    await prisma.invitation.update({ where: { id: invitation.id }, data: { manageToken } });
  }

  const enlace = `/${invitation.slug}/deseos`;
  const enlaceCliente = `${enlace}?t=${manageToken}`;
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
        <div className={styles.headerAcciones}>
          <a href={`/api/i/${invitation.slug}/deseos/pdf`} className="btn btn-ghost btn-sm" download>
            Descargar PDF
          </a>
          <Link href={`/editor/${invitation.id}`} className="btn btn-ghost btn-sm">
            ← Volver al editor
          </Link>
        </div>
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
            {qr && (
              <a href={qr} download={`qr-deseos-${invitation.slug}.svg`} className="btn btn-ghost btn-sm">
                Descargar QR
              </a>
            )}
          </div>
        </div>
      )}

      <div className={styles.aviso}>
        <p className={styles.compartirTitulo}>El libro, para quien organiza sin cuenta</p>
        <p className={styles.compartirTexto}>
          El libro entero —para hojear y descargar en PDF, sin importar si lo dejaste
          en público o en privado— pero sin pedir usuario ni contraseña. Pásaselo a
          quien no tiene acceso al editor.
        </p>
        <EnlaceCliente ruta={enlaceCliente} texto={enlace} />
      </div>

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
