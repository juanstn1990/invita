import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/auth";
import { qrSvgDataUrl } from "@/lib/qr";
import { nuevoTokenPanel } from "@/lib/invitados";
import { EnlaceCliente } from "../EnlaceCliente";
import { Galeria } from "./Galeria";
import styles from "./galeria.module.css";

export const dynamic = "force-dynamic";

/**
 * Las fotos que dejaron los invitados: privadas, sólo aquí.
 *
 * Página propia y no un panel más del editor —como el de invitados— porque
 * lo que hay que ver es una cuadrícula de miniaturas, y eso pide su propio
 * ancho: metida en la columna angosta del panel se habría visto como una
 * fila de sellos de correo.
 */
export default async function FotosEventoPage({ params }: { params: { id: string } }) {
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

  const enlace = `/${invitation.slug}/fotos`;
  const enlaceCliente = `${enlace}?t=${manageToken}`;
  const qr = invitation.published ? await qrSvgDataUrl(`${process.env.INVITA_URL || ""}${enlace}`) : null;

  const fotos = await prisma.eventPhoto.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{invitation.title}</p>
          <h1 className={styles.title}>Fotos del evento</h1>
        </div>
        <Link href={`/editor/${invitation.id}`} className="btn btn-ghost btn-sm">
          ← Volver al editor
        </Link>
      </header>

      {!invitation.published ? (
        <p className={styles.aviso}>
          Publica la invitación para que este enlace funcione. El botón «Comparte tus
          fotos» y el QR sólo sirven cuando alguien más puede abrir <code>{enlace}</code>.
        </p>
      ) : (
        <div className={styles.compartir}>
          {qr && <img src={qr} alt="" className={styles.qr} />}
          <div>
            <p className={styles.compartirTitulo}>El enlace para tomar fotos</p>
            <code className={`mono ${styles.compartirUrl}`}>{enlace}</code>
            <p className={styles.compartirTexto}>
              Es el mismo que el botón «Comparte tus fotos» de la invitación. El QR
              sirve para imprimirlo en una mesa o en un cartel — cualquiera que lo
              escanee llega a la misma página, sin instalar nada.
            </p>
            {qr && (
              <a href={qr} download={`qr-fotos-${invitation.slug}.svg`} className="btn btn-ghost btn-sm">
                Descargar QR
              </a>
            )}
          </div>
        </div>
      )}

      <div className={styles.aviso}>
        <p className={styles.compartirTitulo}>El álbum, para quien organiza sin cuenta</p>
        <p className={styles.compartirTexto}>
          Mismo álbum que ves aquí —con la cámara y todas las fotos, para mirar y
          descargar— pero sin pedir usuario ni contraseña. Pásaselo a quien no tiene
          acceso al editor.
        </p>
        <EnlaceCliente ruta={enlaceCliente} texto={enlace} />
      </div>

      <Galeria
        invitationId={invitation.id}
        inicial={fotos.map((f) => ({
          id: f.id,
          url: `/api/fotos-evento/${f.url}`,
          autor: f.autor,
          kb: Math.round(f.bytes / 1024),
        }))}
      />
    </main>
  );
}
