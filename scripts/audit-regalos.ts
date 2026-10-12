/**
 * La lista de regalos: que no se repita ninguno, pase lo que pase.
 *
 *   npm run audit:regalos
 *
 * Lo que de verdad hay que probar aquí es la carrera: dos invitados tocando
 * el mismo botón en el mismo instante. Un test que los pruebe uno detrás de
 * otro pasa siempre y no demuestra nada — el fallo que se quiere evitar
 * vive justo en el solapamiento. Así que se lanzan de golpe, con
 * `Promise.all`, y se cuenta cuántos ganaron.
 */
import { prisma } from "../src/lib/prisma";
import { claveDeEleccion, soltarRegalo, tomarRegalo } from "../src/lib/regalos";

let mal = 0;
const ok = (b: boolean, texto: string, extra = "") => {
  if (!b) mal++;
  console.log(`  ${b ? "✓" : "✗"} ${texto}${extra ? ` · ${extra}` : ""}`);
};

async function main() {
  /* Una invitación de usar y tirar, con tres familias. */
  const inv = await prisma.invitation.create({
    data: {
      slug: `audit-regalos-${Date.now()}`,
      templateId: "invitacion-bs-nube",
      title: "Auditoría de regalos",
      data: JSON.stringify({}),
    },
  });
  const familias = await Promise.all(
    ["Familia Uno", "Familia Dos", "Familia Tres"].map((names, i) =>
      prisma.guestLink.create({
        data: { invitationId: inv.id, names, code: `aud${Date.now()}${i}` },
      })
    )
  );

  const unico = await prisma.regalo.create({
    data: { invitationId: inv.id, nombre: "Cochecito", cupo: 1, orden: 0 },
  });
  const varios = await prisma.regalo.create({
    data: { invitationId: inv.id, nombre: "Pañales", cupo: 2, orden: 1 },
  });

  console.log("\n━━ Dos a la vez por el mismo regalo");
  const simultaneos = await Promise.all(
    familias.map((f) => tomarRegalo(inv.id, unico.id, f.id, f.names, 0))
  );
  const ganaron = simultaneos.filter((r) => r.ok).length;
  ok(ganaron === 1, "de tres simultáneos, gana exactamente uno", `ganaron ${ganaron}`);
  const filas = await prisma.regaloEleccion.count({ where: { regaloId: unico.id } });
  ok(filas === 1, "y en la base queda una sola fila", `filas=${filas}`);

  console.log("\n━━ El cupo se respeta");
  const cupo = await Promise.all(
    familias.map((f) => tomarRegalo(inv.id, varios.id, f.id, f.names, 0))
  );
  const conCupo = cupo.filter((r) => r.ok).length;
  ok(conCupo === 2, "con cupo 2 y tres a la vez, entran dos", `entraron ${conCupo}`);

  console.log("\n━━ La misma familia no lo toma dos veces");
  const otra = await prisma.regalo.create({
    data: { invitationId: inv.id, nombre: "Bañera", cupo: 5, orden: 2 },
  });
  const f = familias[0];
  await tomarRegalo(inv.id, otra.id, f.id, f.names, 0);
  const repe = await tomarRegalo(inv.id, otra.id, f.id, f.names, 0);
  ok(!repe.ok && repe.motivo === "repetido", "el segundo intento se rechaza", repe.ok ? "" : repe.motivo);

  console.log("\n━━ El tope por familia");
  const r1 = await prisma.regalo.create({ data: { invitationId: inv.id, nombre: "Uno", orden: 3 } });
  const r2 = await prisma.regalo.create({ data: { invitationId: inv.id, nombre: "Dos", orden: 4 } });
  const g = familias[2];
  /* Esta familia ya lleva 1 ó 2 de lo de arriba; se cuenta lo que tiene. */
  const tiene = await prisma.regaloEleccion.count({
    where: { invitationId: inv.id, clave: claveDeEleccion(g.id, g.names) },
  });
  const dentro = await tomarRegalo(inv.id, r1.id, g.id, g.names, tiene + 1);
  const fuera = await tomarRegalo(inv.id, r2.id, g.id, g.names, tiene + 1);
  ok(dentro.ok, "el que cabe en el tope entra");
  ok(!fuera.ok && fuera.motivo === "tope", "el siguiente se rechaza por tope", fuera.ok ? "" : fuera.motivo);

  console.log("\n━━ Soltar");
  const dueno = familias.find((_, i) => cupo[i]?.ok)!;
  const clave = claveDeEleccion(dueno.id, dueno.names);
  ok(await soltarRegalo(inv.id, varios.id, clave), "quien lo tomó lo puede soltar");
  /* El ajeno tiene que ser alguien que **no** tenga el cochecito, y quién lo
     tiene lo decidió una carrera: no se puede suponer, hay que preguntarlo.
     Suponerlo fue lo que hizo fallar esta línea la primera vez. */
  const suyo = await prisma.regaloEleccion.findFirst({
    where: { regaloId: unico.id }, select: { guestLinkId: true },
  });
  const ajeno = familias.find((x) => x.id !== suyo?.guestLinkId)!;
  ok(
    !(await soltarRegalo(inv.id, unico.id, claveDeEleccion(ajeno.id, ajeno.names))),
    "nadie suelta el regalo de otro"
  );

  console.log("\n━━ Lo asignado no lo suelta el invitado");
  const puesto = await prisma.regalo.create({ data: { invitationId: inv.id, nombre: "Puesto", orden: 5 } });
  const h = familias[1];
  await prisma.regaloEleccion.create({
    data: {
      regaloId: puesto.id, invitationId: inv.id, guestLinkId: h.id,
      nombre: h.names, clave: claveDeEleccion(h.id, h.names), asignado: true,
    },
  });
  ok(
    !(await soltarRegalo(inv.id, puesto.id, claveDeEleccion(h.id, h.names))),
    "un regalo asignado no se suelta desde la invitación"
  );

  await prisma.invitation.delete({ where: { id: inv.id } });
  console.log(mal ? `\n${mal} mal\n` : "\nNadie se lleva el mismo regalo dos veces\n");
  process.exit(mal ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
