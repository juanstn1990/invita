import Link from "next/link";
import { TEMPLATES, KIND_LABEL, FAMILIES } from "@/lib/templates";
import { TemplateCard } from "./TemplateCard";
import { MisPlantillas } from "./MisPlantillas";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/auth";
import styles from "./nueva.module.css";

export const dynamic = "force-dynamic";

export default async function NuevaPage() {
  await requiereSesion("/nueva");

  /* Las propias van primero: quien guardó una es porque quiere empezar desde
     ahí, y ponerlas debajo de cuarenta y dos tarjetas sería esconderlas. */
  const mias = await prisma.plantilla.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true, templateId: true },
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Mis invitaciones
        </Link>
        <h1 className={styles.title}>Elige un diseño</h1>
        <p className={styles.sub}>
          Cada uno es una invitación completa: portada, cuenta atrás, programa,
          confirmación, galería y regalos. Los infantiles vienen en versión
          niña y niño. Después puedes cambiar cualquier
          texto, apagar las secciones que no uses — y cambiar de diseño sin
          perder nada de lo que hayas escrito.
        </p>
      </header>

      <MisPlantillas inicial={mias} />

      {FAMILIES.map((family) => (
        <div key={family.label || "principal"}>
          {family.label && <h2 className={styles.familyTitle}>{family.label}</h2>}
          {family.kinds.map((kind) => (
            <section key={kind} className={styles.group}>
              <h3 className={styles.groupTitle}>{KIND_LABEL[kind]}</h3>
              <div className={styles.grid}>
                {TEMPLATES.filter((t) => t.kind === kind).map((t) => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ))}
    </main>
  );
}
