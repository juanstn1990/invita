/**
 * Colapsa las confirmaciones repetidas que ya están en la base.
 *
 *   npm run rsvp:limpiar -- --seco     # dice qué haría, sin tocar nada
 *   npm run rsvp:limpiar
 *
 * Hasta ahora cada envío del formulario añadía una fila, así que quien
 * recargaba la página y volvía a confirmar aparecía dos veces y el recuento
 * de cabezas del panel sumaba las dos. Eso ya está arreglado en la ruta, pero
 * las filas de antes siguen ahí, y el contador que ve el organizador es la
 * suma de todas.
 *
 * **Se queda la más reciente de cada persona.** No es una elección estética:
 * si alguien puso «no puedo» y después «sí voy», la que vale es la segunda.
 * Con la vieja se quedaría fuera de la boda alguien que sí va.
 *
 * Quién es «la misma persona» lo decide `claveDeRespuesta` —el nombre
 * normalizado más el link por el que entró—, la misma función que usa la
 * ruta. Es a propósito que sea la misma y no una copia en SQL: si la
 * normalización de aquí y la de allá se separaran, la limpieza uniría filas
 * que la app volvería a separar, y nadie se daría cuenta.
 *
 * Es idempotente: correrlo dos veces no cambia nada la segunda.
 */
import { PrismaClient } from "@prisma/client";
import { claveDeRespuesta } from "../src/lib/rsvp";

const seco = process.argv.includes("--seco");
const prisma = new PrismaClient();

(async () => {
  const filas = await prisma.rsvp.findMany({
    select: {
      id: true, invitationId: true, guestLinkId: true, name: true,
      status: true, partySize: true, clave: true, createdAt: true,
      invitation: { select: { slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  /** Agrupadas por invitación + persona. */
  const grupos = new Map<string, typeof filas>();
  for (const f of filas) {
    const k = `${f.invitationId}::${claveDeRespuesta(f.guestLinkId, f.name)}`;
    const g = grupos.get(k);
    if (g) g.push(f);
    else grupos.set(k, [f]);
  }

  let borradas = 0;
  let marcadas = 0;
  const afectadas = new Set<string>();

  for (const [k, grupo] of grupos) {
    const clave = k.slice(k.indexOf("::") + 2);
    /* La última que contestó. `createdAt` ya viene ordenado; el id desempata
       por si dos cayeron en el mismo milisegundo. */
    const gana = grupo[grupo.length - 1];
    const pierden = grupo.slice(0, -1);

    if (pierden.length) {
      afectadas.add(gana.invitation.slug);
      const cambio = pierden.some((p) => p.status !== gana.status);
      console.log(
        `  ${seco ? "·" : "✓"} ${gana.invitation.slug} · ${gana.name}: ` +
          `${grupo.length} respuestas → 1 (${gana.status}${cambio ? ", cambió de idea" : ""})`
      );
      /* Primero se borran las que pierden y después se marca la que gana: al
         revés, la clave de la ganadora chocaría con la restricción mientras
         las otras todavía existen. */
      if (!seco) {
        await prisma.rsvp.deleteMany({ where: { id: { in: pierden.map((p) => p.id) } } });
      }
      borradas += pierden.length;
    }

    if (gana.clave !== clave) {
      if (!seco) {
        await prisma.rsvp.update({ where: { id: gana.id }, data: { clave } });
      }
      marcadas++;
    }
  }

  console.log(
    `\n${filas.length} respuestas · ${grupos.size} personas · ` +
      `${borradas} repetidas ${seco ? "por borrar" : "borradas"}` +
      (marcadas ? ` · ${marcadas} ${seco ? "por marcar" : "marcadas"}` : "") +
      (afectadas.size ? `\nInvitaciones afectadas: ${[...afectadas].join(", ")}` : "")
  );
  await prisma.$disconnect();
})();
