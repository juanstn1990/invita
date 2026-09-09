/**
 * Cambia el texto del botón secundario del velo en las invitaciones que ya
 * existen.
 *
 *   npm run db:migrar-splash
 *   npm run db:migrar-splash -- --seco     # sólo dice qué haría
 *
 * El botón decía "Confirmar asistencia" y entraba a la invitación, igual que
 * el botón principal. Ahora abre la ubicación en Google Maps. El texto por
 * defecto del esquema ya cambió, pero eso sólo afecta a las invitaciones
 * nuevas: en las guardadas, el texto está escrito dentro de su JSON.
 *
 * Y dejarlo así no es cosmético: en cuanto se le ponga el link, un botón que
 * dice "Confirmar asistencia" abriría un mapa.
 *
 * Sólo se toca el texto exacto que ponía el esquema. Quien lo haya cambiado a
 * mano —"Ver los detalles", "Más información"— se queda con el suyo: eso es
 * una decisión de quien edita y no le corresponde a una migración.
 */
import { PrismaClient } from "@prisma/client";

const VIEJO = "Confirmar asistencia";
const NUEVO = "Cómo llegar";

const seco = process.argv.includes("--seco");
const prisma = new PrismaClient();

(async () => {
  const todas = await prisma.invitation.findMany({ select: { id: true, slug: true, data: true } });

  let tocadas = 0;
  let respetadas = 0;

  for (const inv of todas) {
    let datos: any;
    try {
      datos = JSON.parse(inv.data);
    } catch {
      console.log(`  ! ${inv.slug}: el JSON no se puede leer, se deja como está`);
      continue;
    }
    if (!datos?.splash) continue;

    const actual = String(datos.splash.ctaSecondary ?? "");
    if (actual.trim() !== VIEJO) {
      if (actual.trim()) respetadas++;
      continue;
    }

    datos.splash.ctaSecondary = NUEVO;
    /* El campo del link es nuevo: sin él, el botón se esconde, que es el
       comportamiento correcto hasta que alguien lo llene. Se deja explícito
       para que aparezca en el editor. */
    if (datos.splash.mapUrl === undefined) datos.splash.mapUrl = "";

    tocadas++;
    console.log(`  ${seco ? "·" : "✓"} ${inv.slug}: "${VIEJO}" → "${NUEVO}"`);
    if (!seco) {
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { data: JSON.stringify(datos) },
      });
    }
  }

  console.log(
    `\n${todas.length} invitaciones · ${tocadas} ${seco ? "por cambiar" : "cambiadas"}` +
      (respetadas ? ` · ${respetadas} con texto propio, intactas` : "")
  );
  await prisma.$disconnect();
})();
