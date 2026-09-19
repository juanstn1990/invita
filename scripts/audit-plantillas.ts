/**
 * Auditoría de la actualización de plantillas.
 *
 *   npm run audit:plantillas
 *
 * Contra la base de verdad, con una plantilla y una invitación de usar y
 * tirar que se borran al acabar. Lo que se vigila es lo que haría daño:
 *
 * · **Que actualizar guarde antes lo que había.** Es la promesa del botón.
 * · **Que deshacer devuelva exactamente lo de antes**, y que dos deshacer
 *   vayan dos pasos atrás.
 * · **Que un parche con un campo inventado no toque nada**, ni guarde una
 *   versión vacía.
 * · **Que las invitaciones que salieron de la plantilla no cambien.** Son
 *   copias; mejorar la plantilla no puede tocar una invitación ya repartida.
 * · **Que no se acumulen más de diez versiones.**
 */

import { prisma } from "../src/lib/prisma";
import { presetFor } from "../src/lib/presets";
import { TEMPLATE_BY_ID } from "../src/lib/templates";
import {
  actualizarDesdeInvitacion, actualizarConParche, deshacer, VERSIONES_MAX,
} from "../src/lib/plantillas";

const TPL = "invitacion-15-burdeos";
const MARCA = "__audit_plantillas__";

let malos = 0;
const decir = (ok: boolean, nombre: string, detalle = "") => {
  if (!ok) malos++;
  console.log(`${ok ? "✓" : "✗"} ${nombre}${!ok && detalle ? `  ${detalle}` : ""}`);
};

const datosCon = (nombre: string) => {
  const d: any = presetFor(TEMPLATE_BY_ID[TPL]);
  d.event.name1 = nombre;
  return JSON.stringify(d);
};
const nombreDe = (data: string) => JSON.parse(data).event.name1;

async function limpiar() {
  await prisma.plantilla.deleteMany({ where: { nombre: MARCA } });
  await prisma.invitation.deleteMany({ where: { title: MARCA } });
}

(async () => {
  await limpiar();

  const maestra = await prisma.invitation.create({
    data: { slug: `audit-pl-${Date.now()}`, templateId: TPL, title: MARCA, data: datosCon("Uno") },
  });
  const p = await prisma.plantilla.create({
    data: { nombre: MARCA, templateId: TPL, data: datosCon("Uno"), origenId: maestra.id },
  });
  /* Una invitación que ya había salido de la plantilla. */
  const hija = await prisma.invitation.create({
    data: {
      slug: `audit-hija-${Date.now()}`, templateId: TPL, title: MARCA,
      data: p.data, plantillaId: p.id,
    },
  });

  try {
    /* ── Actualizar desde la invitación ── */
    const igual = await actualizarDesdeInvitacion(p.id, maestra.id);
    decir(!igual.ok, "si no hay cambios, lo dice y no guarda una versión de balde");

    await prisma.invitation.update({ where: { id: maestra.id }, data: { data: datosCon("Dos") } });
    const r1 = await actualizarDesdeInvitacion(p.id, maestra.id);
    const tras1 = await prisma.plantilla.findUnique({ where: { id: p.id } });
    decir(r1.ok && nombreDe(tras1!.data) === "Dos", "la plantilla pasa a ser la invitación");
    decir(!!tras1!.actualizadaAt, "y queda apuntado cuándo se actualizó");

    const v1 = await prisma.plantillaVersion.findMany({ where: { plantillaId: p.id } });
    decir(v1.length === 1 && nombreDe(v1[0].data) === "Uno", "antes guardó la versión anterior",
      `${v1.length} versiones`);

    /* ── La hija no se entera ── */
    const h = await prisma.invitation.findUnique({ where: { id: hija.id } });
    decir(nombreDe(h!.data) === "Uno",
      "la invitación que ya había salido de la plantilla no cambia");

    /* ── Parche ── */
    const malo = await actualizarConParche(p.id, { hero: { campoInventado: "x" } });
    const trasMalo = await prisma.plantillaVersion.count({ where: { plantillaId: p.id } });
    decir(!malo.ok && trasMalo === 1,
      "un parche con un campo inventado no toca nada ni guarda versión");

    const bueno = await actualizarConParche(p.id, { event: { name1: "Tres" } });
    const tras3 = await prisma.plantilla.findUnique({ where: { id: p.id } });
    decir(bueno.ok && nombreDe(tras3!.data) === "Tres", "un parche bueno se escribe");
    decir(bueno.ok && (bueno.escritos || []).includes("event.name1"), "y dice qué escribió");

    /* ── Deshacer, dos veces ── */
    const d1 = await deshacer(p.id);
    const trasD1 = await prisma.plantilla.findUnique({ where: { id: p.id } });
    decir(d1.ok && nombreDe(trasD1!.data) === "Dos", "deshacer vuelve a la anterior");
    const d2 = await deshacer(p.id);
    const trasD2 = await prisma.plantilla.findUnique({ where: { id: p.id } });
    decir(d2.ok && nombreDe(trasD2!.data) === "Uno", "y otro deshacer va un paso más atrás");
    const d3 = await deshacer(p.id);
    decir(!d3.ok, "sin versiones, deshacer lo dice en vez de hacer algo raro");

    /* ── Tope de versiones ── */
    for (let i = 0; i < VERSIONES_MAX + 4; i++) {
      await actualizarConParche(p.id, { event: { name1: `N${i}` } });
    }
    const cuantas = await prisma.plantillaVersion.count({ where: { plantillaId: p.id } });
    decir(cuantas === VERSIONES_MAX, `no se guardan más de ${VERSIONES_MAX} versiones`, `${cuantas}`);

    /* ── Borrar la plantilla se lleva sus versiones ── */
    await prisma.plantilla.delete({ where: { id: p.id } });
    const huerfanas = await prisma.plantillaVersion.count({ where: { plantillaId: p.id } });
    decir(huerfanas === 0, "borrar la plantilla se lleva sus versiones");
  } finally {
    await limpiar();
    await prisma.$disconnect();
  }

  console.log(malos ? `\n${malos} comprobación(es) con problemas`
    : "\nActualizar y deshacer plantillas hace lo que promete");
  process.exit(malos ? 1 : 0);
})();
