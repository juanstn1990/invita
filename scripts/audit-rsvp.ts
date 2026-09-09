/**
 * Comprueba que una persona no pueda confirmar dos veces.
 *
 *   npm run audit:rsvp                 # contra http://localhost:3000
 *   BASE=http://localhost:3100 npm run audit:rsvp
 *
 * A diferencia de las otras auditorías, ésta necesita **el servidor corriendo
 * y la base**: lo que se comprueba es el comportamiento de la ruta contra una
 * restricción de la base, y ninguna de las dos mitades sirve sola.
 *
 * Existe por un fallo real: la ruta hacía `createMany`, así que cada envío
 * del formulario añadía una fila. Quien recargaba la página y volvía a
 * confirmar aparecía dos veces, y el recuento de cabezas del panel de quien
 * invita sumaba las dos — que es justo el número con el que se encarga la
 * comida.
 *
 * Se crea una invitación de prueba, se le manda de todo, y se borra al final
 * aunque algo falle.
 */
import { PrismaClient } from "@prisma/client";
import { claveDeRespuesta } from "../src/lib/rsvp";

const BASE = process.env.BASE || "http://localhost:3000";
const prisma = new PrismaClient();

let malos = 0;
const di = (n: string, ok: boolean, extra = "") => {
  if (!ok) malos++;
  console.log(`  ${ok ? "✓" : "✗"} ${n}${extra ? " · " + extra : ""}`);
};

const enviar = (slug: string, body: unknown) =>
  fetch(`${BASE}/api/i/${slug}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));

(async () => {
  const slug = `prueba-rsvp-${Date.now().toString(36)}`;
  const inv = await prisma.invitation.create({
    data: {
      slug, templateId: "invitacion-marsala", title: "Prueba RSVP",
      data: "{}", published: true,
    },
  });

  const filas = () =>
    prisma.rsvp.findMany({
      where: { invitationId: inv.id },
      select: { name: true, status: true, partySize: true, clave: true, guestLinkId: true },
      orderBy: { createdAt: "asc" },
    });

  try {
    /* 1 · Confirmar dos veces deja una sola fila. */
    await enviar(slug, { name: "Ana Gómez", status: "confirmado", partySize: 2 });
    const segunda = await enviar(slug, { name: "Ana Gómez", status: "confirmado", partySize: 2 });
    let f = await filas();
    di("confirmar dos veces deja una fila", f.length === 1, `${f.length} fila(s)`);
    di("y lo dice en la respuesta", segunda.json.actualizada === true, JSON.stringify(segunda.json.actualizada));

    /* 2 · Escrito distinto, misma persona. */
    await enviar(slug, { name: "  ana   gomez ", status: "confirmado", partySize: 2 });
    f = await filas();
    di("mayúsculas, tildes y espacios no crean otra", f.length === 1, `${f.length} fila(s)`);

    /* 3 · Cambiar de idea reemplaza, no acumula. */
    await enviar(slug, { name: "Ana Gómez", status: "rechazado" });
    f = await filas();
    di("cambiar de idea deja una sola", f.length === 1, `${f.length} fila(s)`);
    di("y gana la última", f[0]?.status === "rechazado", f[0]?.status || "");

    /* 4 · Otra persona sí es otra fila. */
    await enviar(slug, { name: "Carlos Ruiz", status: "confirmado", partySize: 3 });
    f = await filas();
    di("otra persona sí suma", f.length === 2, `${f.length} fila(s)`);

    /* 5 · Doble clic: dos envíos a la vez.
       Es la rendija que no cierra comprobar-antes-de-escribir, y por eso la
       restricción está en la base y no sólo en el código. */
    const carrera = await Promise.all([
      enviar(slug, { name: "Sofía Díaz", status: "confirmado", partySize: 1 }),
      enviar(slug, { name: "Sofía Díaz", status: "confirmado", partySize: 1 }),
      enviar(slug, { name: "Sofía Díaz", status: "confirmado", partySize: 1 }),
    ]);
    f = await filas();
    const sofias = f.filter((x) => x.clave === claveDeRespuesta(null, "Sofía Díaz"));
    di("tres envíos simultáneos dejan una", sofias.length === 1, `${sofias.length} fila(s)`);
    /* Y ninguno puede contestarle con un error: el invitado hizo doble clic,
       su respuesta quedó, y decirle "no se pudo enviar" le haría volver a
       intentarlo — o pensar que la invitación está rota. */
    di("y ninguno le devuelve error al invitado",
      carrera.every((r) => r.status === 200),
      carrera.map((r) => r.status).join(", "));

    /* 6 · Dos familias con una Ana cada una no se pisan. */
    const l1 = await prisma.guestLink.create({
      data: { invitationId: inv.id, code: `c1${Date.now().toString(36)}`, names: "Ana Gómez" },
    });
    const l2 = await prisma.guestLink.create({
      data: { invitationId: inv.id, code: `c2${Date.now().toString(36)}`, names: "Ana Gómez" },
    });
    await enviar(slug, { name: "Ana Gómez", status: "confirmado", code: l1.code });
    await enviar(slug, { name: "Ana Gómez", status: "confirmado", code: l2.code });
    f = await filas();
    const porLink = f.filter((x) => x.guestLinkId);
    di("una Ana por familia, sin pisarse", porLink.length === 2, `${porLink.length} con link`);

    /* 7 · Volver a contestar no desengancha del link.
       Si entró por su link y después por la dirección pelada, el panel de
       quien invita tiene que seguir viendo su casa como respondida. */
    await enviar(slug, { name: "Ana Gómez", status: "rechazado", code: l1.code });
    f = await filas();
    const deL1 = f.filter((x) => x.guestLinkId === l1.id);
    di("sigue colgada de su link", deL1.length === 1 && deL1[0].status === "rechazado",
      JSON.stringify(deL1.map((x) => x.status)));

    /* 8 · Varios en un envío, como los de un link con dos nombres. */
    await enviar(slug, {
      guests: [
        { name: "Pedro Lara", status: "confirmado" },
        { name: "Marta Lara", status: "rechazado" },
      ],
    });
    const uno = await filas();
    await enviar(slug, {
      guests: [
        { name: "Pedro Lara", status: "confirmado" },
        { name: "Marta Lara", status: "confirmado" },
      ],
    });
    const dos = await filas();
    di("un link con dos nombres no se duplica al reenviar",
      dos.length === uno.length, `${uno.length} → ${dos.length}`);
    di("y el que cambió de idea quedó al día",
      dos.find((x) => x.name === "Marta Lara")?.status === "confirmado");
  } finally {
    await prisma.invitation.delete({ where: { id: inv.id } });
    await prisma.$disconnect();
  }

  console.log(malos ? `\n${malos} comprobación(es) fallaron` : "\nUna respuesta por persona, siempre");
  process.exit(malos ? 1 : 0);
})();
