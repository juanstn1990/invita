import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { coupleName, resolvedDateLabel, type InvitationData } from "@/lib/schema";
import { eventoLlego } from "@/lib/disponibilidadEvento";
import { configLibro } from "@/lib/libroDeseos";
import { sesionActual } from "@/lib/auth";
import { Formulario } from "./Formulario";
import { Libro } from "./Libro";
import styles from "./deseos.module.css";

export const dynamic = "force-dynamic";

/**
 * El libro de deseos: a donde lleva el botón «Firma nuestro libro» de la
 * invitación, y el QR que se enseña impreso en el evento.
 *
 * Quien tiene sesión —el organizador— ve esto aunque la invitación no esté
 * publicada o el evento no haya llegado, con un aviso arriba: es lo que
 * hace posible probarlo desde la vista previa del editor antes de repartir
 * nada.
 */
export default async function DeseosPage({ params }: { params: { slug: string } }) {
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

  const tpl = TEMPLATE_BY_ID[invitation.templateId];
  const data = JSON.parse(invitation.data) as InvitationData;
  const nombre = coupleName(data) || invitation.title;
  const acento = tpl?.palette?.[1] || "#8a6a2f";
  const fecha = String((data.event as Record<string, unknown>)?.date || "");
  const cfg = configLibro(data);

  if (!eventoLlego(fecha) && !esOrganizador) {
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

  const avisoOrganizador = esOrganizador && (!invitation.published || !eventoLlego(fecha));
  /* Ver el libro no es lo mismo que verlo público: si sigue en privado, lo
     que tú ves aquí —el libro entero, para hojear— no es lo que ve un
     invitado con el mismo link —sólo el formulario para escribir el suyo—.
     Sin este aviso, "yo lo veo bien" sería la prueba equivocada. */
  const avisoPrivado = esOrganizador && cfg.visibilidad !== "publico";
  const aviso = (avisoOrganizador || avisoPrivado) && (
    <p className={styles.avisoOrganizador}>
      {avisoOrganizador && "Lo estás viendo como organizador — los invitados todavía no ven esto. "}
      {avisoPrivado && "El libro está en privado: un invitado con este link sólo ve el formulario para escribir, no puede hojear los deseos como tú."}
    </p>
  );

  /* El organizador ve siempre el libro entero, aunque lo haya dejado
     privado para los invitados: "privado" decide quién más lo lee, no si
     tú puedes leerlo. */
  if (cfg.visibilidad === "publico" || esOrganizador) {
    const deseos = await prisma.wish.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "asc" },
    });
    return (
      <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
        <div className={styles.tarjetaAncha}>
          {aviso}
          <p className={styles.eyebrow}>{nombre}</p>
          <Libro
            slug={invitation.slug}
            nombreEvento={nombre}
            portada={cfg.portada}
            colorHoja={cfg.colorHoja}
            colorLetra={cfg.colorLetra}
            deseos={deseos.map((d) => ({ id: d.id, nombre: d.nombre, texto: d.texto }))}
          />
          <details className={styles.escribir}>
            <summary>Escribir mi deseo</summary>
            <Formulario slug={invitation.slug} />
          </details>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
      <div className={styles.tarjeta}>
        {aviso}
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
