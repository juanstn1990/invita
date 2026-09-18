/**
 * El servidor MCP: las seis herramientas y nada más.
 *
 * Es una **fábrica** y no un servidor ya montado porque se sirve de dos
 * maneras que no se parecen: por la entrada estándar desde el proyecto
 * (`scripts/mcp.ts`) y por HTTP desde la app desplegada
 * (`src/app/api/mcp/route.ts`). Lo que cambia entre las dos son dos cosas y
 * las dos entran por parámetro: la dirección con la que se arman los enlaces,
 * y si hay con qué hacer una captura.
 *
 * Todo lo demás —el catálogo, el esquema, la validación, la frontera de no
 * tocar publicadas— es el mismo código en los dos sitios, que es el punto:
 * dos servidores que se parecen acaban divergiendo justo en la regla que
 * importaba.
 *
 * ── Por qué el diseño se pregunta siempre ────────────────────────
 *
 * `crear` exige un `diseno` y no tiene valor por defecto. De todo lo que
 * lleva una invitación, el diseño es **lo único que no se puede deducir de
 * los datos**. Los nombres, la fecha y el lugar vienen dados; que la boda sea
 * de campo o de salón, que la quinceañera quiera burdeos o lavanda, eso lo
 * sabe la persona. Un valor por defecto significa que el asistente elige por
 * ella y que ella descubre la elección al final, ya hecha.
 *
 * Por eso `crear` sin diseño no devuelve «falta un parámetro»: devuelve **el
 * catálogo entero**, para que la pregunta se pueda hacer en ese mismo turno.
 *
 * ── Por qué sólo escribe borradores ──────────────────────────────
 *
 * Nada de lo que hace toca una invitación publicada. Una publicada tiene el
 * enlace repartido: reescribirla es cambiarle la fecha a gente que ya la
 * leyó. Publicar sigue siendo un botón que aprieta una persona, y no es una
 * limitación técnica pendiente — es la frontera correcta.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { prisma } from "./prisma";
import { presetFor } from "./presets";
import { TEMPLATE_BY_ID, readTemplate } from "./templates";
import { renderInvitation } from "./render";
import { normalizeSlug } from "./slug";
import { catalogo, esquemaDe, fusionar } from "./mcp";
import { ESTADO_POR_ID, estadoDe } from "./tablero";

export interface OpcionesMcp {
  /** Con qué dirección se arman los enlaces que se devuelven. */
  base: string;
  /**
   * Cómo se hace una captura de la invitación ya renderizada.
   *
   * Opcional: donde no haya navegador, `ver` devuelve el enlace y lo dice.
   */
  capturar?: (html: string, ancho: number) => Promise<Buffer>;
}

const texto = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const json = (v: unknown) => texto(JSON.stringify(v, null, 2));
const error = (s: string) => ({ ...texto(s), isError: true });

/**
 * Las invitaciones del constructor visual que se retiró.
 *
 * Siguen en la base porque son del organizador, pero ya no hay marcado con
 * qué dibujarlas. Sin esta comprobación, `ver` sobre una de ellas reventaba
 * con «Template desconocido: blanco» —una excepción cruda, no una respuesta—
 * y el modelo no tenía forma de saber que el problema no era suyo ni que el
 * resto de invitaciones sí funciona.
 */
const sinDiseno = (inv: { templateId: string; title: string }) =>
  TEMPLATE_BY_ID[inv.templateId]
    ? ""
    : `"${inv.title}" es de una versión anterior (diseño "${inv.templateId}") y ya no ` +
      `hay con qué dibujarla. No se puede ver ni editar desde aquí. Las que sí se ` +
      `pueden salen en \`listar\` con "editable": true.`;

export function construirServidor({ base, capturar }: OpcionesMcp): McpServer {
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
        editor: `${base}/editor/${inv.id}`,
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
      const viejo = sinDiseno(inv);
      if (viejo) return error(viejo);
      if (inv.published) {
        return error(
          `"${inv.title}" ya está publicada y este servidor no toca publicadas: ` +
            `cambiarla es cambiársela a quien ya la leyó. Despublícala desde el editor ` +
            `(${base}/editor/${inv.id}) si de verdad quieres editarla.`
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
      const viejo = sinDiseno(inv);
      if (viejo) return error(viejo);

      const html = renderInvitation({
        templateHtml: readTemplate(inv.templateId),
        templateId: inv.templateId,
        data: JSON.parse(inv.data),
        slug: inv.slug,
      });

      /* La captura la pone quien construye el servidor.

         Por stdio la hace Playwright, que está en el proyecto. Servido desde la
         app desplegada no: Playwright es una dependencia de desarrollo y el
         contenedor de producción no la trae —ni debería, son cuatrocientos
         megas de navegador para una foto—. Ahí `ver` devuelve el enlace, que es
         menos, pero es verdad: fingir una captura que no se puede hacer sería
         peor que no tenerla. */
      if (!capturar) {
        return json({
          titulo: inv.title,
          editor: `${base}/editor/${inv.id}`,
          publica: inv.published ? `${base}/${inv.slug}` : null,
          nota:
            "Este servidor no hace capturas —corre en el servidor desplegado, " +
            "que no lleva navegador—. Abre el enlace del editor para verla.",
        });
      }

      try {
        const png = await capturar(html, ancho || 390);
        return {
          content: [
            { type: "text" as const, text: `${inv.title} · ${base}/editor/${inv.id}` },
            { type: "image" as const, data: png.toString("base64"), mimeType: "image/png" },
          ],
        };
      } catch (e) {
        return error(`No se pudo capturar: ${(e as Error).message}`);
      }
    }
  );

  /* ── 6 · Listar los borradores ───────────────────────────────── */

  server.registerTool(
    "listar",
    {
      title: "Ver las invitaciones que hay",
      description:
        "Las invitaciones existentes, con su id, su diseño, en qué punto del " +
        "trabajo están (borrador, demo, en curso, entregada), si están " +
        "publicadas y si están cobradas.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const todas = await prisma.invitation.findMany({
        select: { id: true, slug: true, title: true, templateId: true, published: true,
          estado: true, pagada: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
      return json(
        todas.map((i) => ({
          id: i.id, titulo: i.title, diseno: i.templateId,
          /* Dos cosas distintas y por eso van separadas: el estado es en qué
             punto del trabajo está, y `publicada` es si la dirección pública
             responde. Una demo se publica para enseñarla. */
          estado: ESTADO_POR_ID[estadoDe(i.estado)].label,
          publicada: i.published,
          pagada: i.pagada,
          ...(TEMPLATE_BY_ID[i.templateId] ? {} : { aviso: "de una versión anterior, no se puede abrir" }),
          editable: !i.published && !!TEMPLATE_BY_ID[i.templateId],
          editor: `${base}/editor/${i.id}`,
        }))
      );
    }
  );

  
  return server;
}
