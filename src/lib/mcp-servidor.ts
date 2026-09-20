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
import { actualizarConParche, deshacer } from "./plantillas";

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
        "y `plantillas` para ver de qué se puede partir —un diseño es marcado en " +
        "blanco, una plantilla guardada ya trae contenido y ajustes—, 2) " +
        "**preguntarle a la persona de cuál quiere partir**: es lo único que no " +
        "se deduce de los datos, así que nunca se elige por ella. Si nombra algo " +
        "que no está en `disenos`, míralo en `plantillas` antes de decirle que " +
        "no existe. Luego 3) `crear`, 4) `esquema` para saber qué campos admite, " +
        "5) `escribir` los datos, 6) `ver` para mirar el resultado y corregir. " +
        "Se puede editar mientras no esté marcada como «entregada» en el " +
        "tablero; publicarla o no no cambia eso, porque aquí publicar es cómo " +
        "se previsualiza y cómo se le enseña al cliente.",
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

  /* ── 2 · Las plantillas propias ──────────────────────────────── */

  server.registerTool(
    "plantillas",
    {
      title: "Ver las plantillas guardadas",
      description:
        "Las plantillas propias: invitaciones que alguien dejó guardadas para " +
        "partir de ellas, con su contenido y sus ajustes ya puestos. Son " +
        "**distintas de los diseños**: un diseño es marcado en blanco, una " +
        "plantilla es una invitación concreta que se copia. Si la persona " +
        "nombra algo que no está en `disenos`, búscalo aquí antes de decirle " +
        "que no existe.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const todas = await prisma.plantilla.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { versiones: true } } },
      });
      if (!todas.length) {
        return json({ plantillas: [], nota: "No hay ninguna guardada todavía." });
      }
      return json(
        todas.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          disenoBase: p.templateId,
          disenoNombre: TEMPLATE_BY_ID[p.templateId]?.name || "(de una versión anterior)",
          usable: !!TEMPLATE_BY_ID[p.templateId],
          creada: p.createdAt.toISOString().slice(0, 10),
          ...(p.actualizadaAt ? { actualizada: p.actualizadaAt.toISOString().slice(0, 10) } : {}),
          versionesAnteriores: p._count.versiones,
        }))
      );
    }
  );

  /* ── Mejorar una plantilla ───────────────────────────────────── */

  server.registerTool(
    "actualizar_plantilla",
    {
      title: "Mejorar una plantilla guardada",
      description:
        "Cambia campos de una plantilla guardada, con el mismo parche que " +
        "`escribir`: { seccion: { campo: valor } }. Antes de cambiar nada se " +
        "guarda la versión anterior, así que `deshacer_plantilla` la devuelve " +
        "como estaba. Lo que no cambia: las invitaciones que ya salieron de la " +
        "plantilla, que son copias. Para saber qué campos admite, pide " +
        "`esquema` con su diseño base.",
      inputSchema: {
        plantilla: z.string().describe("El id de la plantilla, de `plantillas`."),
        datos: z
          .record(z.string(), z.record(z.string(), z.any()))
          .describe("Parche { seccion: { campo: valor } }."),
      },
    },
    async ({ plantilla, datos }) => {
      const r = await actualizarConParche(plantilla, datos as any);
      if (!r.ok) return error(r.error);
      return json({
        escritos: r.escritos,
        versionesAnteriores: r.versiones,
        nota:
          "Actualizada. Las invitaciones que ya salieron de ella no cambian; " +
          "las que se creen desde ahora salen con esto.",
      });
    }
  );

  server.registerTool(
    "deshacer_plantilla",
    {
      title: "Volver a la versión anterior de una plantilla",
      description:
        "Deja la plantilla como estaba antes de su última actualización. " +
        "Cada llamada va un paso más atrás; se guardan las diez últimas.",
      inputSchema: {
        plantilla: z.string().describe("El id de la plantilla, de `plantillas`."),
      },
    },
    async ({ plantilla }) => {
      const r = await deshacer(plantilla);
      return r.ok
        ? json({ hecho: "Vuelta a la versión anterior.", versionesAnterioresQuedan: r.versiones })
        : error(r.error);
    }
  );

  /* ── 3 · Crear, siempre desde algo elegido ───────────────────── */

  server.registerTool(
    "crear",
    {
      title: "Crear una invitación",
      description:
        "Crea una invitación en borrador, o desde un diseño en blanco " +
        "(`diseno`) o copiando una plantilla guardada (`plantilla`). Uno de " +
        "los dos, nunca los dos ni ninguno, y **no hay valor por defecto**: " +
        "pregúntaselo a la persona antes de llamar a esto.",
      inputSchema: {
        diseno: z
          .string()
          .optional()
          .describe("El id de un diseño de `disenos`, p.ej. invitacion-15-burdeos."),
        plantilla: z
          .string()
          .optional()
          .describe("El id de una plantilla guardada de `plantillas`."),
        titulo: z.string().optional().describe("Nombre interno, sólo para el listado."),
      },
    },
    async ({ diseno, plantilla, titulo }) => {
      /* Ni lo uno ni lo otro: se devuelven las dos listas, para que la
         pregunta se pueda hacer en este mismo turno en vez de gastar uno en
         decir «falta un parámetro». */
      if (!diseno && !plantilla) {
        const guardadas = await prisma.plantilla.findMany({ orderBy: { createdAt: "desc" } });
        return error(
          "Hace falta elegir de dónde parte. Enséñale esto a la persona y vuelve:\n\n" +
            JSON.stringify(
              {
                disenos: catalogo(),
                plantillas: guardadas.map((p) => ({ id: p.id, nombre: p.nombre })),
              },
              null,
              2
            )
        );
      }
      if (diseno && plantilla) {
        return error(
          "Uno de los dos, no los dos: un diseño es marcado en blanco y una " +
            "plantilla ya trae contenido. Con ambos no está claro cuál manda."
        );
      }

      /* De una plantilla: se copia su `data` tal cual, como hace el botón del
         editor. Lo que no está ahí —el enlace público, las confirmaciones,
         los enlaces de invitado— nace vacío, que es lo correcto: son de la
         invitación de la que salió la plantilla, no del punto de partida. */
      let templateId: string;
      let datos: Record<string, unknown>;
      let deDonde: string;

      if (plantilla) {
        const p = await prisma.plantilla.findUnique({ where: { id: plantilla } });
        if (!p) {
          const guardadas = await prisma.plantilla.findMany({ orderBy: { createdAt: "desc" } });
          return error(
            `No hay ninguna plantilla con id "${plantilla}". Las que hay:\n\n` +
              JSON.stringify(guardadas.map((x) => ({ id: x.id, nombre: x.nombre })), null, 2)
          );
        }
        if (!TEMPLATE_BY_ID[p.templateId]) {
          return error(
            `La plantilla "${p.nombre}" sale del diseño "${p.templateId}", que ya no ` +
              `existe. No hay con qué dibujarla.`
          );
        }
        templateId = p.templateId;
        datos = JSON.parse(p.data);
        deDonde = `plantilla "${p.nombre}"`;
      } else {
        const tpl = TEMPLATE_BY_ID[diseno!];
        if (!tpl) {
          return error(
            `"${diseno}" no es un diseño. Si es una plantilla guardada, mírala en ` +
              `\`plantillas\`. Los diseños son:\n\n` +
              JSON.stringify(catalogo(), null, 2)
          );
        }
        templateId = diseno!;
        datos = presetFor(tpl) as unknown as Record<string, unknown>;
        deDonde = `diseño "${tpl.name}"`;
      }

      /* La raíz del slug, que **no** es la dirección base.
         Se llamaba `base` igual que el parámetro con la dirección de la app, y
         lo tapaba: el enlace del editor salía como «juan/editor/…» en vez de
         con el dominio. Un fallo que sólo se ve leyendo la respuesta, porque
         la invitación se crea perfectamente. */
      const raiz = normalizeSlug(
        String((datos.event as Record<string, unknown>)?.name1 || "invitacion")
      );
      let slug = raiz;
      for (let i = 2; await prisma.invitation.findUnique({ where: { slug } }); i++) {
        slug = `${raiz}-${i}`;
      }

      const inv = await prisma.invitation.create({
        data: {
          slug,
          templateId,
          title: titulo || `${TEMPLATE_BY_ID[templateId].name} · ${slug}`,
          data: JSON.stringify(datos),
          published: false,
          ...(plantilla ? { plantillaId: plantilla } : {}),
        },
      });

      return json({
        id: inv.id,
        slug: inv.slug,
        diseno: templateId,
        parteDe: deDonde,
        editor: `${base}/editor/${inv.id}`,
        siguiente: "Pide `esquema` con este diseño para saber qué campos admite.",
        aviso: plantilla
          ? "Copia la plantilla entera. Lo que no se sobreescriba se queda como estaba en ella."
          : "Nace con contenido de ejemplo. Lo que no se sobreescriba se queda así.",
      });
    }
  );

  /* ── 4 · Qué admite ese diseño ───────────────────────────────── */

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

  /* ── 5 · Leer lo que hay ─────────────────────────────────────── */

  server.registerTool(
    "leer",
    {
      title: "Ver los datos de una invitación",
      description:
        "Lo que hay escrito ahora mismo en cada sección. Hace falta más de lo " +
        "que parece: al partir de una plantilla se copia contenido que nadie " +
        "ha mirado, y sin poder leerlo se escribe a ciegas encima. Marca " +
        "aparte los campos que traen etiquetas HTML, que es de donde salen los " +
        "rastros raros —un resaltado amarillo, una negrita suelta— que se " +
        "pegan al copiar de un documento.",
      inputSchema: {
        id: z.string().describe("El id de la invitación."),
        seccion: z.string().optional().describe("Sólo una sección, p.ej. hero."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id, seccion }) => {
      const inv = await prisma.invitation.findUnique({ where: { id } });
      if (!inv) return error(`No hay ninguna invitación con id "${id}".`);

      const datos = JSON.parse(inv.data) as Record<string, Record<string, unknown>>;
      /* El contacto y las notas del tablero. No son contenido de la
         invitación —no se publican— pero son justo lo que hace falta cuando
         se pide «pon el número para confirmar» y nadie recuerda cuál era. */
      const ficha = {
        ...(inv.telefono ? { telefono: inv.telefono } : {}),
        ...(inv.notas ? { notas: inv.notas } : {}),
      };
      const conMarcado: string[] = [];

      /* Se devuelve sólo lo que tiene valor. Un volcado con los ciento y pico
         campos vacíos entierra los cuatro que importan, y quien lee esto
         tiene un presupuesto de atención tan limitado como el de cualquiera. */
      const limpio: Record<string, unknown> = {};
      for (const [clave, campos] of Object.entries(datos)) {
        if (seccion && clave !== seccion) continue;
        if (!campos || typeof campos !== "object") continue;
        const dentro: Record<string, unknown> = {};
        for (const [campo, valor] of Object.entries(campos)) {
          if (valor === "" || valor === null || valor === undefined) continue;
          if (Array.isArray(valor) && !valor.length) continue;
          dentro[campo] = valor;
          if (/<[a-z][^>]*>/i.test(JSON.stringify(valor))) {
            conMarcado.push(`${clave}.${campo}`);
          }
        }
        if (Object.keys(dentro).length) limpio[clave] = dentro;
      }

      return json({
        titulo: inv.title,
        diseno: inv.templateId,
        publicada: inv.published,
        ...(Object.keys(ficha).length ? { ficha } : {}),
        ...(conMarcado.length
          ? {
              ojo:
                "Estos campos traen etiquetas HTML dentro, que casi nunca es lo " +
                "que se quería: " + conMarcado.join(", "),
            }
          : {}),
        datos: limpio,
      });
    }
  );

  /* ── 6 · Escribir ────────────────────────────────────────────── */

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
      /* La frontera es «entregada», no «publicada».
       *
       * Empezó mirando `published` y era la lectura equivocada del oficio.
       * Aquí publicar no significa entregar: es cómo se previsualiza y cómo
       * se le enseña al cliente, y por eso catorce de diecinueve invitaciones
       * estaban publicadas y en borrador a la vez. Con esa regla el servidor
       * se negaba a editar casi todo lo que hay, justo mientras alguien
       * trabajaba en ello: pasó cuatro veces en un día, y siempre con una
       * corrección que el cliente acababa de pedir.
       *
       * Lo que sí quiere decir «ya no se toca» es el estado del tablero:
       * entregada es que está en manos del cliente. Esa línea ahora existe y
       * se declara a propósito, en vez de deducirse de un interruptor que
       * significa otra cosa.
       */
      if (estadoDe(inv.estado) === "entregada") {
        return error(
          `"${inv.title}" está marcada como **entregada**, y este servidor no toca ` +
            `entregadas: cambiarla es cambiársela a quien ya la tiene. Si hay que ` +
            `corregirla, muévela a «En curso» en el tablero (${base}/tablero) y vuelve. ` +
            `Publicarla o no publicarla no cambia esto.`
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

  /* ── 7 · Verla ───────────────────────────────────────────────── */

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

  /* ── 8 · Listar los borradores ───────────────────────────────── */

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
          editable: estadoDe(i.estado) !== "entregada" && !!TEMPLATE_BY_ID[i.templateId],
          editor: `${base}/editor/${i.id}`,
        }))
      );
    }
  );

  
  return server;
}
