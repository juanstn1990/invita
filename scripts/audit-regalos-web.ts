/**
 * La lista de regalos por HTTP, como la usa un invitado de verdad.
 *
 *   npm run build && npx next start -p 3100
 *   BASE=http://localhost:3100 npm run audit:regalos-web
 *
 * Necesita la app levantada, a diferencia del resto de las auditorías: lo
 * que se prueba aquí son las **rutas** —quién puede tomar, qué códigos
 * devuelven, qué datos viajan a cada quien— y eso no se puede comprobar
 * llamando a las funciones del dominio. `audit:regalos` prueba lo otro: que
 * dos a la vez no se lleven el mismo, que es donde está el riesgo de
 * verdad y no necesita servidor.
 */
import { prisma } from "../src/lib/prisma";
import { defaultData } from "../src/lib/schema";
import { defaultLayout } from "../src/lib/blocks";

const BASE = process.env.BASE || "http://localhost:3000";

async function main() {
  const data: any = defaultData();
  data.layout = {
    blocks: [
      ...defaultLayout(),
      { id: "regalos-0", type: "regalos", variant: "simple",
        data: { enabled: true, title: "Lista de regalos", texto: "Elige el tuyo.", modo: "elige", tope: "2" } },
    ],
  };
  const slug = `t-regalos-${Date.now()}`;
  const inv = await prisma.invitation.create({
    data: {
      slug, templateId: "invitacion-bs-nube", title: "Prueba regalos",
      data: JSON.stringify(data), published: true,
    },
  });
  const fam = await Promise.all([1, 2].map((n) =>
    prisma.guestLink.create({
      data: { invitationId: inv.id, names: `Familia ${n}`, code: `t${Date.now()}${n}` },
    })
  ));
  await prisma.regalo.createMany({
    data: [
      { invitationId: inv.id, nombre: "Cochecito", nota: "gris", orden: 0 },
      { invitationId: inv.id, nombre: "Bañera", orden: 1 },
      { invitationId: inv.id, nombre: "Pañales", cupo: 2, orden: 2 },
    ],
  });
  const regalos = await prisma.regalo.findMany({ where: { invitationId: inv.id }, orderBy: { orden: "asc" } });

  let mal = 0;
  const ok = (b: boolean, t: string, e = "") => { if (!b) mal++; console.log(`  ${b ? "✓" : "✗"} ${t}${e ? ` · ${e}` : ""}`); };

  const get = async (g?: string) =>
    (await fetch(`${BASE}/api/i/${slug}/regalos${g ? `?g=${g}` : ""}`)).json();
  const post = async (body: unknown) => {
    const r = await fetch(`${BASE}/api/i/${slug}/regalos`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };

  console.log("\n━━ Mirar la lista");
  const sinEnlace = await get();
  ok(sinEnlace.regalos?.length === 3, "sin enlace se ve la lista entera", `${sinEnlace.regalos?.length}`);
  ok(sinEnlace.sinEnlace === true, "y se avisa de que no puede elegir");
  ok(
    (sinEnlace.regalos || []).every((r: any) => !r.de?.length),
    "un invitado nunca recibe los nombres de quien eligió"
  );

  console.log("\n━━ Elegir");
  const r1 = await post({ regalo: regalos[0].id, accion: "tomar", g: fam[0].code });
  ok(r1.status === 200, "con enlace, se puede tomar", `HTTP ${r1.status}`);
  const r2 = await post({ regalo: regalos[0].id, accion: "tomar", g: fam[1].code });
  ok(r2.status === 409, "otro no puede tomar el mismo", `HTTP ${r2.status} ${r2.body.error || ""}`);
  const sin = await post({ regalo: regalos[1].id, accion: "tomar" });
  ok(sin.status === 403, "sin enlace no se puede tomar", `HTTP ${sin.status}`);

  console.log("\n━━ Lo que ve cada quien");
  const vista = await get(fam[0].code);
  const mio = vista.regalos.find((r: any) => r.id === regalos[0].id);
  ok(mio?.mio === true, "quien lo tomó lo ve como suyo");
  ok(mio?.libres === 0, "y figura sin unidades libres");
  const otra = await get(fam[1].code);
  ok(otra.regalos.find((r: any) => r.id === regalos[0].id)?.mio === false, "el otro no lo ve como suyo");

  console.log("\n━━ El tope");
  await post({ regalo: regalos[1].id, accion: "tomar", g: fam[0].code });
  const tercero = await post({ regalo: regalos[2].id, accion: "tomar", g: fam[0].code });
  ok(tercero.status === 409 && /máximo/.test(tercero.body.error || ""), "el tope de 2 corta el tercero", tercero.body.error || `HTTP ${tercero.status}`);

  console.log("\n━━ Soltar");
  const soltar = await post({ regalo: regalos[0].id, accion: "soltar", g: fam[0].code });
  ok(soltar.status === 200, "se suelta el propio");
  const ajeno = await post({ regalo: regalos[1].id, accion: "soltar", g: fam[1].code });
  ok(ajeno.status === 409, "no se suelta el de otro", `HTTP ${ajeno.status}`);

  console.log("\n━━ Modo «yo asigno»");
  data.layout.blocks.at(-1).data.modo = "asignado";
  await prisma.invitation.update({ where: { id: inv.id }, data: { data: JSON.stringify(data) } });
  await prisma.regaloEleccion.create({
    data: {
      regaloId: regalos[2].id, invitationId: inv.id, guestLinkId: fam[1].id,
      nombre: fam[1].names, clave: fam[1].id, asignado: true,
    },
  });
  const asig = await get(fam[1].code);
  ok(asig.modo === "asignado" && !asig.regalos, "no viaja la lista entera");
  ok(asig.mios?.length === 1 && asig.mios[0].nombre === "Pañales", "ve sólo el suyo", JSON.stringify(asig.mios));
  /* La familia 1 todavía tiene la bañera, que eligió **antes** de que
     cambiaras el modo. Sigue viéndola, y es lo correcto: es suya de verdad,
     y esconderla la dejaría creyendo que no lleva nada. */
  const conservado = await get(fam[0].code);
  ok(
    conservado.mios?.length === 1 && conservado.mios[0].nombre === "Bañera",
    "lo elegido antes de cambiar de modo se conserva",
    JSON.stringify(conservado.mios)
  );
  await prisma.regaloEleccion.deleteMany({ where: { invitationId: inv.id, guestLinkId: fam[0].id } });
  const nada = await get(fam[0].code);
  ok(nada.mios?.length === 0, "quien no tiene nada no ve nada");
  const intento = await post({ regalo: regalos[0].id, accion: "tomar", g: fam[0].code });
  ok(intento.status === 403, "y nadie puede tomar por su cuenta", `HTTP ${intento.status}`);

  console.log("\n━━ La página");
  const pagina = await fetch(`${BASE}/${slug}/regalos?g=${fam[0].code}`);
  ok(pagina.status === 200, "/{slug}/regalos responde", `HTTP ${pagina.status}`);

  await prisma.invitation.delete({ where: { id: inv.id } });
  console.log(mal ? `\n${mal} mal\n` : "\nLa lista funciona de punta a punta\n");
  process.exit(mal ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
