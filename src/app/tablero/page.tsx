import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID, KIND_LABEL } from "@/lib/templates";
import { coupleName, resolvedDateLabel, type InvitationData } from "@/lib/schema";
import { requiereSesion } from "@/lib/auth";
import { estadoDe, pagoDe, esResponsable } from "@/lib/tablero";
import { Tablero, type Tarjeta } from "./Tablero";
import styles from "../home.module.css";
import propio from "./tablero.module.css";

export const dynamic = "force-dynamic";

/**
 * El tablero: en qué punto está cada invitación.
 *
 * El listado de la portada sigue existiendo y responde a otra pregunta —«¿qué
 * toqué hace poco?»—, que es la que se hace al volver a trabajar. Ésta
 * responde «¿cómo voy?», que es la que se hace al empezar el día, y con
 * quince invitaciones una lista ordenada por fecha de cambio no la contesta.
 */
export default async function TableroPage() {
  await requiereSesion();

  const todas = await prisma.invitation.findMany({ orderBy: { updatedAt: "desc" } });

  /* Las del constructor visual, que se retiró: no hay con qué abrirlas, así
     que no pueden ser tarjetas. Pero **se cuentan**, y el tablero lo dice.

     En el listado de la portada esconderlas sin más es defendible: ahí se
     viene a abrir algo concreto. Aquí no. Un tablero cuyo trabajo es «saber
     qué tengo» que enseña seis de quince y calla las otras nueve no está
     ordenando nada: está dando una cifra falsa con aspecto de completa. */
  const ocultas = todas.filter((i) => !TEMPLATE_BY_ID[i.templateId]).length;

  const tarjetas: Tarjeta[] = todas
    .filter((i) => TEMPLATE_BY_ID[i.templateId])
    .map((i) => {
      const data = JSON.parse(i.data) as InvitationData;
      const tpl = TEMPLATE_BY_ID[i.templateId];
      return {
        id: i.id,
        titulo: coupleName(data) || i.title,
        slug: i.slug,
        publicada: i.published,
        tipo: tpl.kind,
        tipoLabel: KIND_LABEL[tpl.kind],
        estado: estadoDe(i.estado),
        pago: pagoDe(i.pago),
        responsable: esResponsable(i.responsable) ? i.responsable : null,
        archivada: i.archivada,
        fecha: String((data.event as Record<string, unknown>)?.date || ""),
        fechaTexto: resolvedDateLabel(data),
        diseno: tpl.name,
        paleta: tpl.palette,
        /* Nulo y cadena vacía se juntan aquí: al componente le llega una
           sola forma de «no hay nada», y así ni el render ni la comparación
           al guardar tienen que distinguir dos vacíos. */
        telefono: i.telefono || "",
        notas: i.notas || "",
      };
    });

  return (
    <main className={`${styles.page} ${propio.ancho}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Invita</p>
          <h1 className={styles.title}>Tablero</h1>
        </div>
        <div className={styles.headerAcciones}>
          <Link href="/" className="btn btn-ghost btn-sm">Ver como lista</Link>
          <Link href="/nueva" className="btn btn-primary">+ Nueva invitación</Link>
        </div>
      </header>

      {tarjetas.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Todavía no tienes ninguna</p>
          <Link href="/nueva" className="btn btn-primary">Elegir un diseño</Link>
        </div>
      ) : (
        <Tablero inicial={tarjetas} ocultas={ocultas} />
      )}
    </main>
  );
}
