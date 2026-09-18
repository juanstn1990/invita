/**
 * Servidor MCP: armar invitaciones desde un asistente.
 *
 *   npx tsx scripts/mcp.ts
 *
 * Habla por la entrada estándar, así que se configura en el cliente (Claude
 * Code, Claude Desktop) como un comando, no como una URL. Ver el README.
 *
 * ── Por qué el diseño se pregunta siempre ────────────────────────
 *
 * `crear` exige un `diseno` y no tiene valor por defecto. No es rigidez: de
 * todo lo que lleva una invitación, el diseño es **lo único que no se puede
 * deducir de los datos**. Los nombres, la fecha y el lugar vienen dados; que
 * la boda sea de campo o de salón, que la quinceañera quiera burdeos o
 * lavanda, eso lo sabe la persona. Un valor por defecto aquí significa que
 * el asistente elige por ella y que ella descubre la elección al final, ya
 * hecha — que es el momento más caro para cambiarla.
 *
 * Por eso, además, `crear` sin diseño no devuelve «falta un parámetro»:
 * devuelve **el catálogo entero**, para que la respuesta sea inmediatamente
 * útil y la pregunta se pueda hacer en ese mismo turno.
 *
 * ── Por qué sólo escribe borradores ──────────────────────────────
 *
 * Nada de lo que hace este servidor toca una invitación publicada. Una
 * publicada tiene el enlace repartido: reescribirla es cambiarle la fecha a
 * gente que ya la leyó. Publicar sigue siendo un botón que aprieta una
 * persona, y eso no es una limitación técnica que quede por resolver — es la
 * frontera correcta entre lo que conviene automatizar y lo que no.
 */

import fs from "fs";
import os from "os";
import path from "path";

/* Chromium para las capturas necesita nss, nspr y alsa-lib; en esta máquina
   no hay sudo, así que se toman de los paquetes que ya trae conda. Igual que
   en `shots.ts` y en las auditorías de navegador. */
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
if (fs.existsSync(CONDA)) {
  process.env.LD_LIBRARY_PATH = fs
    .readdirSync(CONDA)
    .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d))
    .map((d) => path.join(CONDA, d, "lib"))
    .join(":");
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { prisma } from "../src/lib/prisma";
import { presetFor } from "../src/lib/presets";
import { TEMPLATE_BY_ID, readTemplate } from "../src/lib/templates";
import { renderInvitation } from "../src/lib/render";
import { normalizeSlug } from "../src/lib/slug";
import { catalogo, esquemaDe, fusionar } from "../src/lib/mcp";

/** Dónde vive la app, para armar los enlaces que se devuelven. */
const BASE = process.env.INVITA_URL || "http://localhost:3000";

const texto = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const json = (v: unknown) => texto(JSON.stringify(v, null, 2));
const error = (s: string) => ({ ...texto(s), isError: true });

const server = new McpServer(
  { name: "invitaciones", version: "1.0.0" },
  {
    instructions:
      "Arma invitaciones digitales. El orden es siempre el mismo: 1) `disenos` " +
      "para ver el catálogo, 2) **preguntarle a la persona cuál quiere** —el " +
      "diseño es lo único que no se deduce de los datos, así que nunca se " +
      "elige por ella—, 3) `crear` con ese diseño, 4) `esquema` para saber qué " +
      "campos admite, 5) `escribir` los datos, 6) `ver` para mirar el " +
      "resultado y corregir. Todo queda en borrador: publicar lo hace una " +
      "persona desde el editor.",
  }
);

/* ── 1 · El catálogo ─────────────────────────────────────────── */

server.registerTool(
  "disenos",
  {
    title: "Ver los diseños",
    description:
      "El catálogo de diseños, agrupado por ocasión, con el estilo de cada " +
      "uno y sus colores. Es el primer paso siempre: hay que enseñárselo a " +
      "la persona y dejar que elija, nunca elegir por ella.",
    inputSchema: {
      ocasion: z
        .string()
        .optional()
        .describe("Filtra por ocasión: boda, quince, comunion, grado, primer-ano, bautizo."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ ocasion }) => {
    const todo = catalogo();
    if (!ocasion) return json(todo);
    const busca = ocasion.toLowerCase();
    const filtrado = Object.fromEntries(
      Object.entries(todo).filter(([g]) => g.toLowerCase().includes(busca))
    );
    return Object.keys(filtrado).length
      ? json(filtrado)
      : error(`No hay diseños de "${ocasion}". Las ocasiones son: ${Object.keys(todo).join(", ")}.`);
  }
);

/* ── 2 · Crear, siempre con diseño elegido ───────────────────── */

server.registerTool(
  "crear",
  {
    title: "Crear una invitación",
    description:
      "Crea una invitación en borrador con el diseño elegido y contenido de " +
      "ejemplo. El diseño es obligatorio y no tiene valor por defecto: " +
      "pregúntaselo a la persona antes de llamar a esto.",
    inputSchema: {
      diseno: z.string().describe("El id de un diseño de `disenos`, p.ej. invitacion-15-burdeos."),
      titulo: z.string().optional().describe("Nombre interno, sólo para el listado."),
    },
  },
  async ({ diseno, titulo }) => {
    const tpl = TEMPLATE_BY_ID[diseno];
    /* Sin diseño válido no se devuelve «falta un parámetro»: se devuelve el
       catálogo, para que la pregunta se pueda hacer en este mismo turno. */
    if (!tpl) {
      return error(
        `"${diseno}" no es un diseño. Elige uno con la persona y vuelve:\n\n` +
          JSON.stringify(catalogo(), null, 2)
      );
    }

    const data = presetFor(tpl);
    const base = normalizeSlug(String(data.event.name1 || "invitacion"));
    let slug = base;
    for (let i = 2; await prisma.invitation.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }

    const inv = await prisma.invitation.create({
      data: {
        slug,
        templateId: diseno,
        title: titulo || `${tpl.name} · ${data.event.name1}`,
        data: JSON.stringify(data),
        published: false,
      },
    });

    return json({
      id: inv.id,
      slug: inv.slug,
      diseno,
      editor: `${BASE}/editor/${inv.id}`,
      siguiente: "Pide `esquema` con este diseño para saber qué campos admite.",
      aviso: "Nace con contenido de ejemplo. Lo que no se sobreescriba se queda así.",
    });
  }
);

/* ── 3 · Qué admite ese diseño ───────────────────────────────── */

server.registerTool(
  "esquema",
  {
    title: "Ver los campos de un diseño",
    description:
      "Las secciones y campos que ese diseño dibuja, con sus tipos y las " +
      "opciones válidas de cada desplegable. No todos los diseños traen el " +
      "mismo marcado, así que hay que pedirlo por diseño. Los campos de " +
      "archivo (fotos, vídeo, música) no aparecen: los sube una persona.",
    inputSchema: {
      diseno: z.string().describe("El id del diseño."),
      seccion: z.string().optional().describe("Sólo una sección, p.ej. hero."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ diseno, seccion }) => {
    if (!TEMPLATE_BY_ID[diseno]) return error(`"${diseno}" no es un diseño. Mira \`disenos\`.`);
    const todo = esquemaDe(diseno);
    if (!seccion) return json(todo);
    const una = todo.find((s) => s.seccion === seccion);
    return una
      ? json(una)
      : error(
          `Este diseño no tiene la sección "${seccion}". Las que tiene: ` +
            todo.map((s) => s.seccion).join(", ") + "."
        );
  }
);

/* ── 4 · Escribir ────────────────────────────────────────────── */

server.registerTool(
  "escribir",
  {
    title: "Escribir datos en las secciones",
    description:
      "Mete datos en las secciones de la invitación. El parche es " +
      '{ seccion: { campo: valor } }, p.ej. { "event": { "name1": "Ana" }, ' +
      '"hero": { "label": "Nos casamos" } }. Si algo no encaja no se escribe ' +
      "nada y se explica qué: corrige y vuelve a llamar.",
    inputSchema: {
      id: z.string().describe("El id que devolvió `crear`."),
      datos: z
        .record(z.string(), z.record(z.string(), z.any()))
        .describe("Parche { seccion: { campo: valor } }."),
    },
  },
  async ({ id, datos }) => {
    const inv = await prisma.invitation.findUnique({ where: { id } });
    if (!inv) return error(`No hay ninguna invitación con id "${id}".`);
    /* La frontera: una publicada tiene el enlace repartido. */
    if (inv.published) {
      return error(
        `"${inv.title}" ya está publicada y este servidor no toca publicadas: ` +
          `cambiarla es cambiársela a quien ya la leyó. Despublícala desde el editor ` +
          `(${BASE}/editor/${inv.id}) si de verdad quieres editarla.`
      );
    }

    const r = fusionar(inv.templateId, JSON.parse(inv.data), datos as any);
    if (r.errores.length) {
      return error(
        `No se escribió nada. ${r.errores.length} problema(s):\n· ` + r.errores.join("\n· ")
      );
    }

    await prisma.invitation.update({
      where: { id },
      data: { data: JSON.stringify(r.datos) },
    });
    return json({
      escritos: r.escritos,
      siguiente: "Pide `ver` para mirar cómo quedó.",
    });
  }
);

/* ── 5 · Verla ───────────────────────────────────────────────── */

server.registerTool(
  "ver",
  {
    title: "Ver cómo quedó",
    description:
      "Renderiza la invitación y devuelve una captura de la página entera. " +
      "Es lo que permite corregir de verdad —que un título no se lea sobre " +
      "una foto no se ve en los datos, sólo mirando.",
    inputSchema: {
      id: z.string().describe("El id de la invitación."),
      ancho: z.number().optional().describe("Ancho en píxeles. Por defecto 390, un móvil."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ id, ancho }) => {
    const inv = await prisma.invitation.findUnique({ where: { id } });
    if (!inv) return error(`No hay ninguna invitación con id "${id}".`);

    const html = renderInvitation({
      templateHtml: readTemplate(inv.templateId),
      templateId: inv.templateId,
      data: JSON.parse(inv.data),
      slug: inv.slug,
    });

    const { chromium } = await import("playwright");
    const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    try {
      const page = await b.newPage({ viewport: { width: ancho || 390, height: 900 } });
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      /* El velo tapa la invitación entera: sin quitarlo la captura es la
         pantalla de bienvenida y nada más, que es justo lo que no hace falta
         revisar. `enterSite` es la puerta que definen los 50 diseños. */
      await page.evaluate(`(() => {
        try { if (typeof enterSite === 'function') enterSite(); } catch (e) {}
        var c = document.querySelector('.inv-cortina'); if (c) c.remove();
        var s = document.getElementById('splash') || document.querySelector('.splash');
        if (s) s.style.display = 'none';
        document.body.style.overflow = '';
        /* Las entradas al asomarse dejarían media página en blanco. */
        [].forEach.call(document.querySelectorAll('[data-inv-anim]'),
          function(e){ e.classList.add('in'); });
      })()`);
      await page.waitForTimeout(900);
      const png = await page.screenshot({ fullPage: true });
      await b.close();

      return {
        content: [
          { type: "text" as const, text: `${inv.title} · ${BASE}/editor/${inv.id}` },
          { type: "image" as const, data: png.toString("base64"), mimeType: "image/png" },
        ],
      };
    } catch (e) {
      await b.close();
      return error(`No se pudo capturar: ${(e as Error).message}`);
    }
  }
);

/* ── 6 · Listar los borradores ───────────────────────────────── */

server.registerTool(
  "listar",
  {
    title: "Ver las invitaciones que hay",
    description: "Las invitaciones existentes, con su id, su diseño y si están publicadas.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    const todas = await prisma.invitation.findMany({
      select: { id: true, slug: true, title: true, templateId: true, published: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return json(
      todas.map((i) => ({
        id: i.id, titulo: i.title, diseno: i.templateId,
        estado: i.published ? "publicada (no se toca)" : "borrador",
        editor: `${BASE}/editor/${i.id}`,
      }))
    );
  }
);

async function main() {
  await server.connect(new StdioServerTransport());
}

main().catch((e) => {
  /* Por la salida de error: la estándar es el canal del protocolo y
     escribir ahí cualquier otra cosa rompe la conversación. */
  console.error("El servidor MCP no arrancó:", e);
  process.exit(1);
});
