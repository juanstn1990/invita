/**
 * Que el contador de aperturas cuente personas y nada más.
 *
 *   npm run audit:vistas                 # contra http://localhost:3000
 *   BASE=http://localhost:3100 npm run audit:vistas
 *
 * Como `audit:rsvp`, **necesita el servidor corriendo y la base**: lo que se
 * comprueba es el comportamiento de la ruta publicada, y la mitad interesante
 * son las cookies y el user-agent, que no existen fuera de una petición de
 * verdad. `audit:aperturas` cubre aparte la clasificación de user-agents, que
 * sí es lógica pura.
 *
 * El caso que da sentido a todo esto es el primero: el rastreador de WhatsApp
 * pide la página en el momento de pegar el enlace. Si contara, toda invitación
 * aparecería vista justo al compartirla.
 *
 * Crea una invitación de prueba con dos enlaces de familia y la borra al
 * final aunque algo falle.
 */
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const B = process.env.BASE || "http://localhost:3000";
const prisma = new PrismaClient();
const UA_PERSONA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";

let mal = 0;
const di = (n: string, ok: boolean, extra = "") => {
  if (!ok) mal++;
  console.log(`  ${ok ? "✓" : "✗"} ${n}${extra ? " · " + extra : ""}`);
};

/** Una visita, con su propio "navegador" (tarro de cookies aparte). */
const abrir = (url: string, ua: string, tarro?: string, cookieExtra?: string) => {
  const c = tarro ? `-c ${tarro} -b ${tarro}` : "";
  const extra = cookieExtra ? `-H "Cookie: ${cookieExtra}"` : "";
  execSync(`curl -s -o /dev/null ${c} ${extra} -A ${JSON.stringify(ua)} ${JSON.stringify(url)}`);
};

(async () => {
  const inv = await prisma.invitation.create({
    data: {
      slug: `vistas-${Date.now().toString(36)}`, templateId: "invitacion-marsala",
      title: "Vistas", data: "{}", published: true,
    },
  });
  const l1 = await prisma.guestLink.create({
    data: { invitationId: inv.id, code: `fa${Date.now().toString(36)}`, names: "Familia Gómez" },
  });
  const l2 = await prisma.guestLink.create({
    data: { invitationId: inv.id, code: `fb${Date.now().toString(36)}`, names: "Familia Ruiz" },
  });

  const cuenta = () => prisma.apertura.findMany({ where: { invitationId: inv.id } });
  const D = "/tmp/claude-1000/-home-juanstn-git-invitaciones/8cc58586-b454-4774-ab06-c0f1dd610e02/scratchpad";

  try {
    /* 1 · El rastreador de WhatsApp, que es lo que pasa al pegar el enlace. */
    abrir(`${B}/${inv.slug}`, "WhatsApp/2.23.20.0 i");
    abrir(`${B}/${inv.slug}`, "facebookexternalhit/1.1");
    di("WhatsApp y Facebook al compartir no cuentan", (await cuenta()).length === 0,
      `${(await cuenta()).length} aperturas`);

    /* 2 · Una persona abriendo el enlace de la familia Gómez. */
    const t1 = `${D}/v1.txt`; execSync(`rm -f ${t1}`);
    abrir(`${B}/${inv.slug}?invitado=Familia%20G%C3%B3mez&g=${l1.code}`, UA_PERSONA, t1);
    let f = await cuenta();
    di("una persona sí cuenta", f.length === 1, `${f.length}`);
    di("y queda colgada de su enlace", f[0]?.guestLinkId === l1.id);

    /* 3 · La misma persona recargando tres veces. */
    abrir(`${B}/${inv.slug}?g=${l1.code}`, UA_PERSONA, t1);
    abrir(`${B}/${inv.slug}?g=${l1.code}`, UA_PERSONA, t1);
    f = await cuenta();
    di("recargar no la convierte en más personas", f.length === 1, `${f.length} personas`);
    di("pero sí suma aperturas", f[0]?.veces === 3, `veces=${f[0]?.veces}`);

    /* 4 · Otra persona, otro enlace. */
    const t2 = `${D}/v2.txt`; execSync(`rm -f ${t2}`);
    abrir(`${B}/${inv.slug}?g=${l2.code}`, UA_PERSONA, t2);
    f = await cuenta();
    di("otra familia es otra fila", f.length === 2, `${f.length}`);
    di("cada una con su enlace",
      new Set(f.map((x) => x.guestLinkId)).size === 2);

    /* 5 · El organizador revisando la suya. */
    const antes = (await cuenta()).length;
    const t3 = `${D}/v3.txt`; execSync(`rm -f ${t3}`);
    abrir(`${B}/${inv.slug}`, UA_PERSONA, t3, "invita_sesion=cualquiera");
    di("el organizador no se cuenta a sí mismo", (await cuenta()).length === antes,
      `${(await cuenta()).length}`);

    /* 6 · Un código de otra invitación no engancha nada. */
    const otra = await prisma.invitation.create({
      data: { slug: `otra-${Date.now().toString(36)}`, templateId: "invitacion-marsala",
              title: "Otra", data: "{}", published: true },
    });
    const ajeno = await prisma.guestLink.create({
      data: { invitationId: otra.id, code: `zz${Date.now().toString(36)}`, names: "Ajena" },
    });
    const t4 = `${D}/v4.txt`; execSync(`rm -f ${t4}`);
    abrir(`${B}/${inv.slug}?g=${ajeno.code}`, UA_PERSONA, t4);
    f = await cuenta();
    di("un código de otra invitación no se cuelga de ella",
      f.every((x) => x.guestLinkId !== ajeno.id) && f.length === 3, `${f.length}`);
    await prisma.invitation.delete({ where: { id: otra.id } });

    /* 7 · El contador crudo sí lo cuenta todo, como está documentado. */
    const crudo = await prisma.invitation.findUnique({
      where: { id: inv.id }, select: { views: true },
    });
    di("el contador crudo cuenta también los rastreadores",
      (crudo?.views || 0) > f.length, `views=${crudo?.views} vs ${f.length} personas`);
  } finally {
    await prisma.invitation.delete({ where: { id: inv.id } });
    await prisma.$disconnect();
  }

  console.log(mal ? `\n${mal} mal` : "\nSólo cuenta a las personas");
  process.exit(mal ? 1 : 0);
})();
