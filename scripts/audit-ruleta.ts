/**
 * La ruleta de regalos, girando en un navegador de verdad.
 *
 *   npm run dev                                   (o next start)
 *   BASE=http://localhost:3000 npm run audit:ruleta
 *
 * Necesita la app levantada, como `audit:regalos-web`, y además Chromium:
 * lo que se prueba aquí no se puede ver desde el servidor. La pregunta es
 * una sola y es la que hace que una ruleta parezca de verdad o parezca un
 * dibujo: **¿la aguja para sobre el regalo que anuncia la tarjeta?**
 *
 * El reparto en sí —que no se repita, que cada familia gire una vez— lo
 * prueba `audit:regalos` sin navegador, que es donde está el riesgo. Esto
 * prueba lo otro: que lo que se ve coincida con lo que pasó.
 *
 * Cómo se lee dónde paró: del `transform` de la rueda sale el ángulo, del
 * ángulo sale qué gajo quedó arriba, y ése se compara con el nombre de la
 * tarjeta. Mirar la captura no serviría —habría que leer la imagen— y
 * preguntarle a la propia página qué cree que salió tampoco, porque es
 * justo lo que está bajo sospecha.
 */
import fs from "fs";
import os from "os";
import path from "path";

/* El navegador de Playwright necesita unas bibliotecas que esta máquina no
   trae en el sitio de siempre. Va antes de cargar Playwright, que lee el
   entorno al arrancar. */
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
if (fs.existsSync(CONDA)) {
  const libs = fs
    .readdirSync(CONDA)
    .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d))
    .map((d) => path.join(CONDA, d, "lib"))
    .filter((d) => fs.existsSync(d));
  process.env.LD_LIBRARY_PATH = [...libs, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
}

import { prisma } from "../src/lib/prisma";
import { defaultData } from "../src/lib/schema";
import { defaultLayout } from "../src/lib/blocks";
import type { Page } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const REGALOS = [
  "Pijama de seda", "Set de copas", "Bata de novia", "Perfume",
  "Spa para dos", "Lencería", "Zapatillas de casa", "Álbum de fotos",
];

let mal = 0;
const ok = (b: boolean, texto: string, extra = "") => {
  if (!b) mal++;
  console.log(`  ${b ? "✓" : "✗"} ${texto}${extra ? ` · ${extra}` : ""}`);
};

/** Qué gajo quedó bajo la aguja, leído del ángulo en que paró la rueda. */
function bajoLaAguja(pagina: Page): Promise<string> {
  return pagina.evaluate(() => {
    const rueda = document.querySelector("svg")?.parentElement;
    if (!rueda) return "";
    const m = new DOMMatrix(getComputedStyle(rueda).transform);
    const giro = (Math.atan2(m.b, m.a) * 180) / Math.PI;
    const gajos = Array.from(document.querySelectorAll("svg text")).map(
      (t) => t.textContent || ""
    );
    if (!gajos.length) return "";
    const paso = 360 / gajos.length;
    const vuelto = (((-giro % 360) + 360) % 360) - paso / 2;
    const i = ((Math.round(vuelto / paso) % gajos.length) + gajos.length) % gajos.length;
    return gajos[i];
  });
}

/** Lo que dice la tarjeta del premio, si está. */
function loQueDiceLaTarjeta(pagina: Page): Promise<string> {
  return pagina.evaluate(() => {
    const titulo = Array.from(document.querySelectorAll("p")).find(
      (x) => x.textContent?.trim() === "Te tocó"
    );
    return titulo?.parentElement?.querySelectorAll("p")[1]?.textContent?.trim() || "";
  });
}

async function main() {
  const data = defaultData() as Record<string, unknown>;
  data.layout = {
    blocks: [
      ...defaultLayout(),
      {
        id: "regalos-0", type: "regalos", variant: "simple",
        data: {
          enabled: true, title: "La ruleta de regalos",
          texto: "Gira una vez y la ruleta te dice qué le llevas.",
          boton: "Girar la ruleta", modo: "ruleta",
        },
      },
    ],
  };
  const slug = `t-ruleta-${Date.now()}`;
  const inv = await prisma.invitation.create({
    data: {
      slug, templateId: "invitacion-bs-nube", title: "Prueba ruleta",
      data: JSON.stringify(data), published: true,
    },
  });
  const fam = await Promise.all(
    [1, 2].map((n) =>
      prisma.guestLink.create({
        data: { invitationId: inv.id, names: `Familia ${n}`, code: `tr${Date.now()}${n}` },
      })
    )
  );
  await prisma.regalo.createMany({
    data: REGALOS.map((nombre, i) => ({ invitationId: inv.id, nombre, orden: i })),
  });

  const { chromium } = await import("playwright");
  const nav = await chromium.launch();
  const abrir = async (codigo?: string) => {
    const p = await nav.newPage({ viewport: { width: 390, height: 860 } });
    await p.goto(`${BASE}/${slug}/regalos${codigo ? `?g=${codigo}` : ""}`, {
      waitUntil: "networkidle",
    });
    await p.waitForTimeout(900);
    return p;
  };

  console.log("\n━━ La rueda se dibuja");
  const p1 = await abrir(fam[0].code);
  const gajos = await p1.locator("svg path").count();
  const nombres = await p1.locator("svg text").allTextContents();
  ok(gajos === REGALOS.length, "un gajo por regalo libre", `${gajos}`);
  ok(nombres.length === REGALOS.length, "y el nombre escrito en cada uno", nombres.join(" · "));
  ok(
    nombres.every((n) => REGALOS.some((r) => r.startsWith(n.replace("…", "")))),
    "sin nombres inventados ni cortados a mitad de otro"
  );

  console.log("\n━━ Girar");
  ok(((await p1.locator("button").first().textContent()) || "").trim() === "GIRAR", "el botón invita a girar");
  await p1.locator("button").first().click();
  /* Lo que dura el giro más un respiro. Si esto se queda corto, lo que falla
     es la espera y no la ruleta. */
  await p1.waitForTimeout(6400);

  const tarjeta = await loQueDiceLaTarjeta(p1);
  ok(!!tarjeta, "sale la tarjeta con el regalo", tarjeta);
  ok((await bajoLaAguja(p1)) === tarjeta, "la aguja paró sobre lo que anuncia la tarjeta", `aguja «${await bajoLaAguja(p1)}»`);
  ok(
    ((await p1.locator("button").first().textContent()) || "").trim() === "YA ESTÁ",
    "y el botón ya no deja girar otra vez"
  );
  const enBase = await prisma.regaloEleccion.findFirst({
    where: { invitationId: inv.id, guestLinkId: fam[0].id },
    include: { regalo: { select: { nombre: true } } },
  });
  ok(
    enBase?.regalo.nombre === tarjeta,
    "y en la base está apartado ése y no otro",
    enBase?.regalo.nombre || "nada"
  );

  console.log("\n━━ Mientras una mira, otra gira");
  /* La rueda de quien no ha girado tiene que ir perdiendo gajos: si no, se
     giraría sobre una lista vieja y el servidor devolvería algo que no está
     dibujado. */
  const p2 = await abrir(fam[1].code);
  const antes = await p2.locator("svg path").count();
  await fetch(`${BASE}/api/i/${slug}/regalos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "girar", g: fam[0].code }),
  }).catch(() => undefined);
  /* La familia 1 ya había girado, así que eso no cambia nada: lo que mueve
     la rueda de la 2 es lo que la 1 se llevó antes. */
  ok(antes === REGALOS.length - 1, "la que entra después ve un gajo menos", `${antes}`);

  console.log("\n━━ Volver a entrar");
  const p3 = await abrir(fam[0].code);
  ok((await loQueDiceLaTarjeta(p3)) === tarjeta, "quien ya giró ve su regalo", await loQueDiceLaTarjeta(p3));
  ok((await bajoLaAguja(p3)) === tarjeta, "y la rueda aparece parada en él, sin volver a girar");

  console.log("\n━━ Sin enlace");
  const p4 = await abrir();
  ok(await p4.locator("button").first().isDisabled(), "quien entra por la dirección pelada no puede girar");
  ok((await p4.locator("svg path").count()) > 0, "pero la rueda se ve: es parte de la invitación");

  await nav.close();
  await prisma.invitation.delete({ where: { id: inv.id } });
  console.log(mal ? `\n${mal} mal\n` : "\nLa ruleta para donde dice que para\n");
  process.exit(mal ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
