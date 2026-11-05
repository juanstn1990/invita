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
import { claveDeEleccion, girarRuleta, soltarRegalo, tomarRegalo } from "../src/lib/regalos";

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

  /* ────────────────────────────────────────────────────────────
     La ruleta
     ──────────────────────────────────────────────────────────── */

  /* Invitación aparte, para que el reparto empiece de cero: lo de arriba
     dejó regalos a medio tomar y aquí lo que se mide es el reparto entero. */
  const fiesta = await prisma.invitation.create({
    data: {
      slug: `audit-ruleta-${Date.now()}`,
      templateId: "invitacion-bs-nube",
      title: "Auditoría de la ruleta",
      data: JSON.stringify({}),
    },
  });
  const CUANTAS = 8;
  const invitadas = await Promise.all(
    Array.from({ length: CUANTAS + 1 }, (_, i) =>
      prisma.guestLink.create({
        data: { invitationId: fiesta.id, names: `Invitada ${i + 1}`, code: `rul${Date.now()}${i}` },
      })
    )
  );
  await prisma.regalo.createMany({
    data: Array.from({ length: CUANTAS }, (_, i) => ({
      invitationId: fiesta.id, nombre: `Regalo ${i + 1}`, orden: i,
    })),
  });

  console.log("\n━━ Ocho girando a la vez, ocho regalos");
  /* De golpe y no una detrás de otra: lo que se quiere probar es el
     solapamiento, igual que arriba. Cada giro lee la lista entera para
     sortear sobre ella, así que bajo serialización todos chocan con todos
     — es el caso más duro que esta lista puede vivir. */
  const giros = await Promise.all(
    invitadas.slice(0, CUANTAS).map((x) => girarRuleta(fiesta.id, x.id, x.names))
  );
  const salieron = giros.filter((g) => g.ok).length;
  ok(salieron === CUANTAS, "todas sacan algo, ninguna se queda sin girar", `${salieron}/${CUANTAS}`);

  const tocados = giros.flatMap((g) => (g.ok ? [g.regalo.id] : []));
  ok(
    new Set(tocados).size === tocados.length,
    "y no hay dos a las que les tocara el mismo",
    `${new Set(tocados).size} distintos de ${tocados.length}`
  );
  const repartidos = await prisma.regaloEleccion.count({ where: { invitationId: fiesta.id } });
  ok(repartidos === CUANTAS, "en la base queda una fila por invitada", `filas=${repartidos}`);

  console.log("\n━━ Un giro por familia");
  const otraVez = await girarRuleta(fiesta.id, invitadas[0].id, invitadas[0].names);
  ok(
    !otraVez.ok && otraVez.motivo === "ya-giro",
    "la que ya giró no vuelve a girar",
    otraVez.ok ? "le tocó otro" : otraVez.motivo
  );

  console.log("\n━━ Cuando ya no queda nada");
  const tarde = invitadas[CUANTAS];
  const vacia = await girarRuleta(fiesta.id, tarde.id, tarde.names);
  ok(
    !vacia.ok && vacia.motivo === "vacia",
    "la novena no saca nada, y lo dice",
    vacia.ok ? "le tocó algo" : vacia.motivo
  );

  console.log("\n━━ Lo que salió en la ruleta no se suelta");
  const primera = invitadas[0];
  const suyoEnRuleta = giros[0];
  ok(
    suyoEnRuleta.ok &&
      !(await soltarRegalo(
        fiesta.id, suyoEnRuleta.regalo.id, claveDeEleccion(primera.id, primera.names)
      )),
    "soltar lo que te tocó sería volver a girar, y no se puede"
  );

  console.log("\n━━ El azar reparte distinto cada vez");
  /* No se mide que sea aleatorio —eso no se prueba con una corrida— sino que
     no sea siempre el mismo orden: un sorteo que devolviera siempre el
     primero libre pasaría todo lo de arriba y no sería una ruleta. */
  const ordenes = new Set<string>();
  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const otra = await prisma.invitation.create({
      data: {
        slug: `audit-azar-${Date.now()}-${vuelta}`,
        templateId: "invitacion-bs-nube",
        title: "Auditoría del azar",
        data: JSON.stringify({}),
      },
    });
    await prisma.regalo.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        invitationId: otra.id, nombre: `R${i}`, orden: i,
      })),
    });
    const quien = await prisma.guestLink.create({
      data: { invitationId: otra.id, names: "Una", code: `azar${Date.now()}${vuelta}` },
    });
    const g = await girarRuleta(otra.id, quien.id, quien.names);
    if (g.ok) ordenes.add(g.regalo.nombre);
    await prisma.invitation.delete({ where: { id: otra.id } });
  }
  ok(ordenes.size > 1, "seis giros no dan siempre el mismo regalo", `salieron ${[...ordenes].join(", ")}`);

  await prisma.invitation.delete({ where: { id: fiesta.id } });
  await prisma.invitation.delete({ where: { id: inv.id } });
  console.log(mal ? `\n${mal} mal\n` : "\nNadie se lleva el mismo regalo dos veces\n");
  process.exit(mal ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
