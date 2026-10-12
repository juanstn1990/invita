import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/auth";
import { configRegalos } from "@/lib/regalos";
import type { InvitationData } from "@/lib/schema";
import { Panel } from "./Panel";
import styles from "./regalos.module.css";

export const dynamic = "force-dynamic";

/** La lista de regalos: cargarla, ver quién se lleva qué y repartirla. */
export default async function RegalosEventoPage({ params }: { params: { id: string } }) {
  await requiereSesion();

  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, slug: true, published: true, data: true },
  });
  if (!invitation) notFound();

  const data = JSON.parse(invitation.data) as InvitationData;
  const cfg = configRegalos(data);
  const enlace = `/${invitation.slug}/regalos`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{invitation.title}</p>
          <h1 className={styles.title}>Lista de regalos</h1>
        </div>
        <div className={styles.headerAcciones}>
          <Link href={`/editor/${invitation.id}`} className="btn btn-ghost btn-sm">
            ← Volver al editor
          </Link>
        </div>
      </header>

      {!invitation.published ? (
        <p className={styles.aviso}>
          Publica la invitación para que este enlace funcione. El botón «Ver la
          lista» sólo sirve cuando alguien más puede abrir <code>{enlace}</code>.
        </p>
      ) : (
        <p className={styles.aviso}>
          {cfg.modo === "asignado" ? (
            <>
              Está en <b>«yo asigno»</b>: cada invitado abre <code>{enlace}</code> desde
              su enlace y ve sólo el regalo que le pusiste aquí. No ve la lista ni lo
              que llevan los demás.
            </>
          ) : (
            <>
              Está en <b>«eligen ellos»</b>: cada invitado abre <code>{enlace}</code> desde
              su enlace, ve lo que queda libre y toma el suyo. Dos no pueden llevarse
              el mismo.
            </>
          )}{" "}
          Se cambia en el editor, en el bloque «Lista de regalos».
        </p>
      )}

      <p className={styles.aviso}>
        Para elegir, el invitado tiene que entrar por <b>su</b> enlace personal —el de
        «Invitados»—, no por la dirección pelada: es lo que dice quién es sin pedirle
        que escriba su nombre. Quien entre por la dirección a secas ve la lista pero no
        puede apartar nada.
      </p>

      <Panel id={invitation.id} modo={cfg.modo} />
    </main>
  );
}
