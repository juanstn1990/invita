/**
 * Pasa el sello de cobro viejo (`pagada`, sí/no) al nuevo (`pago`, con
 * "parcial" de por medio).
 *
 *   npm run db:migrar-pago
 *   npm run db:migrar-pago -- --seco     # sólo dice qué haría
 *
 * `db push` ya deja `pago` en "no" para toda fila que no la tuviera —es su
 * valor por defecto—, así que lo único que falta es traer las que ya estaban
 * marcadas como `pagada: true`: esas pasan a "completo". No hay forma de
 * saber si alguna de ellas era en realidad un anticipo —el booleano viejo no
 * distinguía eso—, así que "completo" es lo correcto: es lo que decía la
 * fila hasta ahora.
 *
 * Sólo toca filas que sigan en su valor por defecto ("no"): si alguien ya
 * puso el pago a mano después de que existiera el campo nuevo, esa decisión
 * es más reciente que el booleano viejo y no se pisa.
 */
import { PrismaClient } from "@prisma/client";

const seco = process.argv.includes("--seco");
const prisma = new PrismaClient();

(async () => {
  const candidatas = await prisma.invitation.findMany({
    where: { pagada: true, pago: "no" },
    select: { id: true, slug: true },
  });

  for (const inv of candidatas) {
    console.log(`  ${seco ? "·" : "✓"} ${inv.slug}: pagada → pago "completo"`);
    if (!seco) {
      await prisma.invitation.update({ where: { id: inv.id }, data: { pago: "completo" } });
    }
  }

  console.log(
    `\n${candidatas.length} invitación(es) ${seco ? "por migrar" : "migradas"}`
  );
  await prisma.$disconnect();
})();
