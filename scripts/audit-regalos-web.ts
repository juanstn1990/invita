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
        /* `boton` hace falta aunque parezca de adorno: el renderer quita lo
           que no tiene texto, así que sin esto el botón no llega al HTML y
           «¿sigue estando el botón?» se contestaría solo. */
        data: { enabled: true, title: "Lista de regalos", texto: "Elige el tuyo.",
          boton: "Ver la lista", modo: "elige", tope: "2" } },
    ],
  };
  const slug = `t-regalos-${Date.now()}`;
  const inv = await prisma.invitation.create({
    data: {
      slug, templateId: "invitacion-bs-nube", title: "Prueba regalos",
      data: JSON.stringify(data), published: true,
      /* El panel de quien invita se abre con este token y sin sesión. */
      manageToken: `t-panel-${Date.now()}`,
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

  /* ── El panel de quien invita ─────────────────────────────────
     Quien reparte los regalos no es quien hace la invitación: es la mamá,
     que entra por el panel compartido y no tiene cuenta. Por eso el regalo
     se escribe donde se crea el enlace de cada familia —es un dato suyo,
     como sus pases— y no cargando una lista en otra pantalla. */
  console.log("\n━━ El regalo, donde se crean los invitados");
  {
    const panel = async (metodo: string, cuerpo: unknown) => {
      const r = await fetch(`${BASE}/api/g/${inv.manageToken}`, {
        method: metodo, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    };
    const traeDe = async (linkId: string) => {
      const e = await prisma.regaloEleccion.findFirst({
        where: { invitationId: inv.id, guestLinkId: linkId },
        include: { regalo: { select: { nombre: true } } },
      });
      return e?.regalo.nombre ?? null;
    };

    const nueva = await panel("POST", { names: "Jhon, Edith", pases: 2, regalo: "Cuna" });
    ok(nueva.status === 200 && nueva.body.regalo === "Cuna", "se crea el enlace con su regalo de una vez", JSON.stringify(nueva.body));
    const idJhon = nueva.body.id;
    ok((await traeDe(idJhon)) === "Cuna", "y queda asignado a esa familia");

    const cambio = await panel("PATCH", { link: idJhon, regalo: "Coche" });
    ok(cambio.status === 200 && (await traeDe(idJhon)) === "Coche", "cambiarlo reemplaza, no suma", JSON.stringify(cambio.body));
    const cuantos = await prisma.regaloEleccion.count({ where: { invitationId: inv.id, guestLinkId: idJhon } });
    ok(cuantos === 1, "cada familia lleva uno y sólo uno", `${cuantos}`);

    /* La cuna quedó libre al corregir. Escribirla para otra familia tiene
       que reaprovecharla en vez de dejar dos filas con el mismo nombre. */
    const otra = await panel("POST", { names: "Marisol", regalo: "Cuna" });
    const cunas = await prisma.regalo.count({ where: { invitationId: inv.id, nombre: "Cuna" } });
    ok(cunas === 1, "reescribir un regalo liberado no duplica la fila", `${cunas} filas «Cuna»`);
    ok((await traeDe(otra.body.id)) === "Cuna", "y se la queda la nueva familia");

    const vacio = await panel("PATCH", { link: idJhon, regalo: "" });
    ok(vacio.status === 200 && (await traeDe(idJhon)) === null, "vacío lo deja sin regalo");

    const ajeno = await panel("PATCH", { link: "no-existe", regalo: "Cuna" });
    ok(ajeno.status === 404, "no se le pone regalo a un invitado de otra invitación", `HTTP ${ajeno.status}`);

    await prisma.guestLink.deleteMany({ where: { id: { in: [idJhon, otra.body.id] } } });
  }

  /* ── En la invitación, no en otra página ──────────────────────
     Con «yo asigno» no hay nada que elegir, así que la tarjeta sale dentro
     de la propia invitación y el botón sobra. Eso sólo ocurre en el
     navegador —el HTML se renderiza una vez y lo abren todas las familias—,
     y por eso esto es lo único de este archivo que necesita Chromium. */
  console.log("\n━━ La tarjeta dentro de la invitación");
  {
    const { chromium } = await import("playwright");
    const nav = await chromium.launch();
    const abrir = async (g?: string) => {
      const p = await nav.newPage({ viewport: { width: 430, height: 900 } });
      await p.goto(`${BASE}/${slug}${g ? `?invitado=Familia&g=${g}` : ""}`, { waitUntil: "networkidle" });
      /* La tarjeta la pone un `fetch`, así que hay que darle su turno. */
      await p.waitForTimeout(1200);
      const caja = p.locator("[data-inv-regalos-mio]");
      const estado = {
        tarjeta: (await caja.locator(".regalos-ficha").count()) > 0 && !(await caja.isHidden()),
        texto: (await caja.textContent())?.trim() || "",
        boton: !(await p.locator("[data-inv-regalos-btn]").first().isHidden()),
      };
      await p.close();
      return estado;
    };

    const conRegalo = await abrir(fam[1].code);
    ok(conRegalo.tarjeta, "quien tiene regalo asignado ve la tarjeta", JSON.stringify(conRegalo));
    ok(/Pañales/.test(conRegalo.texto), "y dice cuál es", conRegalo.texto);
    ok(!conRegalo.boton, "el botón desaparece: llevaba justo a eso");

    const sinRegalo = await abrir(fam[0].code);
    ok(!sinRegalo.tarjeta && sinRegalo.boton, "a quien no le han asignado nada le queda el botón", JSON.stringify(sinRegalo));

    const anonimo = await abrir();
    ok(!anonimo.tarjeta && anonimo.boton, "y sin código, también", JSON.stringify(anonimo));

    await nav.close();
  }

  console.log("\n━━ La página");
  const pagina = await fetch(`${BASE}/${slug}/regalos?g=${fam[0].code}`);
  ok(pagina.status === 200, "/{slug}/regalos responde", `HTTP ${pagina.status}`);

  await prisma.invitation.delete({ where: { id: inv.id } });
  console.log(mal ? `\n${mal} mal\n` : "\nLa lista funciona de punta a punta\n");
  process.exit(mal ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
