import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/auth";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { configRegalos, tieneRegalos } from "@/lib/regalos";
import { coupleName, type InvitationData } from "@/lib/schema";
import { Lista } from "./Lista";
import styles from "./regalos.module.css";

export const dynamic = "force-dynamic";

/**
 * La lista de regalos: a donde lleva el botón de la invitación.
 *
 * El código del enlace de invitado llega en `?g=` — lo pega el propio botón
 * de la invitación al pulsarlo, porque el HTML se renderiza una vez y lo
 * abren todas las familias. Sin ese código se puede mirar la lista pero no
 * apartar nada: una elección tiene que quedar colgada de alguien.
 *
 * El contenido lo pide el componente de cliente y no esta página, aunque
 * aquí ya hay base de datos a mano. Es a propósito: la lista cambia mientras
 * se mira —otro invitado toma algo— y lo que se pinte en el servidor nace
 * viejo. Lo que sí sale de aquí es lo que no cambia: el nombre, el texto y
 * el color del diseño.
 */
export default async function RegalosPage({
  params, searchParams,
}: {
  params: { slug: string };
  searchParams: { g?: string };
}) {
  const invitation = await prisma.invitation.findUnique({ where: { slug: params.slug } });
  const esOrganizador = !!(await sesionActual());

  if (!invitation || (!invitation.published && !esOrganizador)) {
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

  const data = JSON.parse(invitation.data) as InvitationData;
  if (!tieneRegalos(data)) {
    return (
      <main className={styles.pageAviso}>
        <p>Esta invitación no tiene lista de regalos.</p>
      </main>
    );
  }

  const tpl = TEMPLATE_BY_ID[invitation.templateId];
  const acento = tpl?.palette?.[1] || "#8a6a2f";
  const cfg = configRegalos(data);
  const nombre = coupleName(data) || invitation.title;

  return (
    <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
      <div className={styles.caja}>
        {esOrganizador && !invitation.published && (
          <p className={styles.avisoOrganizador}>
            Estás viendo el panel completo — tus invitados todavía no ven esto.
          </p>
        )}
        <p className={styles.eyebrow}>{nombre}</p>
        <h1 className={styles.titulo}>{cfg.titulo}</h1>
        {cfg.texto && <p className={styles.texto}>{cfg.texto}</p>}
        <Lista slug={invitation.slug} codigo={String(searchParams?.g || "")} />
      </div>
    </main>
  );
}
