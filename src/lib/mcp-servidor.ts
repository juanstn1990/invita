/**
 * El servidor MCP.
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
import { TEMPLATE_BY_ID, KIND_LABEL, readTemplate } from "./templates";
import { renderInvitation } from "./render";
import { slugLibre, nombresDe, slugActualizado } from "./slugAuto";
import { catalogo, catalogoDeAjustes, esquemaDe, esquemaDeBloque, fusionar } from "./mcp";
import {
  ADDABLE, BLOCK_BY_TYPE, blockDefaults, newBlockId, readLayout, type Block,
} from "./blocks";
import { ESTADO_POR_ID, estadoDe, PAGO_POR_ID, pagoDe } from "./tablero";
import { actualizarConParche, deshacer } from "./plantillas";
import { descargar, guardarEnBiblioteca, TIPOS_BIBLIOTECA, urlsUsables } from "./subir";
import { limpiarNombres, limpiarPases, nuevoCodigo, resumirLink, urlDeLink } from "./invitados";

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
        "Las imágenes (fondos, adornos, partículas con imagen) sólo pueden ser " +
        "URLs de `biblioteca`; si la persona da un enlace nuevo, primero `subir`. " +
        "Se puede editar mientras no esté marcada como «entregada» en el " +
        "tablero; publicarla o no no cambia eso, porque aquí publicar es cómo " +
        "se previsualiza y cómo se le enseña al cliente. " +
        "Cuando ya esté lista, `crear_invitados` arma un enlace por familia con " +
        "sus pases —cuántas personas caben— y `invitados` dice quién abrió y " +
        "quién confirmó.",
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

      const slug = await slugLibre(nombresDe(datos));

      const inv = await prisma.invitation.create({
        data: {
          slug,
          slugAuto: true,
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
        bloque: z
          .string()
          .optional()
          .describe("El **tipo** de un bloque opcional: paragraph, html, gallery…"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ diseno, seccion, bloque }) => {
      if (!TEMPLATE_BY_ID[diseno]) return error(`"${diseno}" no es un diseño. Mira \`disenos\`.`);

      /* Los bloques opcionales no son secciones del esquema: su marcado lo
         pone la app, así que sus campos no dependen del diseño y hay que
         pedirlos aparte. Van por tipo y no por id porque lo normal es
         mirarlos **antes** de agregar uno. */
      if (bloque) {
        const uno = esquemaDeBloque(bloque, diseno);
        return uno
          ? json(uno)
          : error(
              `"${bloque}" no es un bloque con campos propios. Los que hay:\n\n` +
                JSON.stringify(
                  ADDABLE.map((b) => ({ tipo: b.type, nombre: b.label })), null, 2
                )
            );
      }

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

  server.registerTool(
    "letras",
    {
      title: "Las tipografías y los demás ajustes de un texto",
      description:
        "Qué se le puede elegir a un texto además de lo que dice: la " +
        "tipografía (más de cincuenta, por familias), el color, la " +
        "alineación, el tamaño y la animación de entrada. Hacía falta porque " +
        "el catálogo sólo asomaba dentro de los mensajes de error, y de seis " +
        "en seis. Qué campos admiten estos ajustes lo dice `esquema`, en " +
        "`ajustes` de cada campo; aquí están los valores que aceptan.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => json(catalogoDeAjustes())
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
        "nada y se explica qué: corrige y vuelve a llamar. " +
        "También acepta el **id de un bloque opcional** en vez de una sección " +
        '—{ "paragraph-l2k4x1": { "title": "Nuestra historia" } }—: los que ' +
        "se agregan con `bloques` se llenan por aquí, igual que una sección.",
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

      const r = fusionar(
        inv.templateId, JSON.parse(inv.data), datos as any, await urlsUsables(inv.data)
      );
      if (r.errores.length) {
        return error(
          `No se escribió nada. ${r.errores.length} problema(s):\n· ` + r.errores.join("\n· ")
        );
      }

      const slugNuevo = await slugActualizado(inv, r.datos);
      await prisma.invitation.update({
        where: { id },
        data: { data: JSON.stringify(r.datos), ...(slugNuevo ? { slug: slugNuevo } : {}) },
      });
      return json({
        escritos: r.escritos,
        ...(slugNuevo ? { direccion: `/${slugNuevo}` } : {}),
        siguiente: "Pide `ver` para mirar cómo quedó.",
      });
    }
  );

  /* ── 6 bis · Los bloques opcionales ──────────────────────────── */

  server.registerTool(
    "bloques",
    {
      title: "Ver y agregar los bloques de una invitación",
      description:
        "El orden de la invitación y qué piezas la componen. Las once " +
        "secciones del esquema vienen de serie, pero además se pueden agregar " +
        "**bloques opcionales** —un párrafo, un HTML propio, una segunda " +
        "galería, una foto, un vídeo, una ubicación— tantos como haga falta. " +
        "Sin acción, enumera los que hay y los que se pueden agregar. Con " +
        "`accion: \"agregar\"` crea uno y devuelve su id, y con ese id se " +
        "escribe en él usando `escribir`, igual que en una sección.",
      inputSchema: {
        id: z.string().describe("El id de la invitación."),
        accion: z
          .enum(["agregar", "quitar", "mover"])
          .optional()
          .describe("Sin esto, sólo enumera."),
        tipo: z.string().optional().describe("Qué agregar: paragraph, html, gallery…"),
        bloque: z.string().optional().describe("El id del bloque, para quitar o mover."),
        posicion: z
          .number()
          .int()
          .optional()
          .describe("Dónde ponerlo, empezando en 0. Al final si no se dice."),
      },
    },
    async ({ id, accion, tipo, bloque, posicion }) => {
      const inv = await prisma.invitation.findUnique({ where: { id } });
      if (!inv) return error(`No hay ninguna invitación con id "${id}".`);
      const viejo = sinDiseno(inv);
      if (viejo) return error(viejo);

      const datos = JSON.parse(inv.data) as Record<string, any>;
      const lista = readLayout(datos);

      /**
       * Cómo se enumera un bloque: lo que hace falta para decidir.
       *
       * Recibe el array al que pertenece y no lo busca en el de fuera: al
       * insertar uno en medio, los índices de los de abajo se corren, y
       * comparando contra la lista vieja todos ellos dejaban de reconocerse
       * como «el primero de su tipo». El resultado era que, después de
       * agregar, media invitación decía que se escribía en su id —donde el
       * renderer no lee nada— en vez de en su sección.
       */
      const retratoDe = (arr: Block[]) => (b: Block, i: number) => {
        const spec = BLOCK_BY_TYPE[b.type];
        /* El primero de cada tipo con sección propia edita esa sección, no
           sus propios datos. Decirlo aquí evita el viaje de escribir en el
           id y recibir un error. */
        const primero = arr.findIndex((x) => x.type === b.type) === i;
        const enSeccion = primero && spec?.section ? spec.section : null;
        return {
          posicion: i,
          bloque: b.id,
          tipo: b.type,
          nombre: spec?.label || b.type,
          ...(enSeccion
            ? { seEscribeEn: enSeccion, nota: "Su contenido vive en esa sección del esquema." }
            : { seEscribeEn: b.id }),
          ...(b.variant ? { variante: b.variant } : {}),
        };
      };

      if (!accion) {
        return json({
          bloques: lista.map(retratoDe(lista)),
          sePuedenAgregar: ADDABLE.map((b) => ({
            tipo: b.type, nombre: b.label, que: b.hint,
          })),
          siguiente:
            "Para agregar: `bloques` con accion \"agregar\" y el `tipo`. Después " +
            "`escribir` con el id que devuelva, como si fuera una sección.",
        });
      }

      /* La misma frontera que `escribir`: entregada es que está en manos del
         cliente, y añadirle un bloque es cambiársela a quien ya la tiene. */
      if (estadoDe(inv.estado) === "entregada") {
        return error(
          `"${inv.title}" está marcada como **entregada**, y este servidor no toca ` +
            `entregadas. Muévela a «En curso» en el tablero (${base}/tablero) y vuelve.`
        );
      }

      let nuevos = [...lista];
      let creado = "";

      if (accion === "agregar") {
        const spec = ADDABLE.find((b) => b.type === tipo);
        if (!spec) {
          return error(
            `"${tipo}" no se puede agregar. Los que sí:\n\n` +
              JSON.stringify(
                ADDABLE.map((b) => ({ tipo: b.type, nombre: b.label, que: b.hint })),
                null, 2
              )
          );
        }
        /* La variante propia y no la del diseño: un bloque agregado no existe
           en el marcado del template, así que «la del diseño» no dibujaría
           nada. Es la misma elección que hace el editor al agregarlo. */
        creado = newBlockId(spec.type);
        const nuevo: Block = {
          id: creado,
          type: spec.type,
          variant: spec.variants.find((v) => v.id)?.id || "",
          data: blockDefaults(spec),
        };
        const donde = typeof posicion === "number"
          ? Math.max(0, Math.min(nuevos.length, posicion))
          : nuevos.length;
        nuevos.splice(donde, 0, nuevo);
      } else {
        const i = nuevos.findIndex((b) => b.id === bloque);
        if (i < 0) {
          return error(
            `No hay ningún bloque "${bloque}" en esta invitación. Pide \`bloques\` sin acción para verlos.`
          );
        }
        if (accion === "quitar") {
          const spec = BLOCK_BY_TYPE[nuevos[i].type];
          const primero = nuevos.findIndex((x) => x.type === nuevos[i].type) === i;
          if (primero && spec?.section) {
            return error(
              `"${spec.label}" es una sección del esquema, no un bloque agregado: ` +
                `quitarla aquí la sacaría del orden y su contenido se quedaría ` +
                `huérfano. Apágala con \`escribir\`: { "${spec.section}": { "enabled": false } }.`
            );
          }
          nuevos.splice(i, 1);
        } else {
          if (typeof posicion !== "number") {
            return error("Para mover hace falta `posicion` (empieza en 0).");
          }
          const [fila] = nuevos.splice(i, 1);
          nuevos.splice(Math.max(0, Math.min(nuevos.length, posicion)), 0, fila);
        }
      }

      datos.layout = { ...(datos.layout || {}), blocks: nuevos };
      await prisma.invitation.update({
        where: { id },
        data: { data: JSON.stringify(datos) },
      });

      return json({
        hecho: accion,
        ...(creado ? { bloque: creado } : {}),
        bloques: nuevos.map(retratoDe(nuevos)),
        siguiente: creado
          ? `Escribe en él: \`escribir\` con { "${creado}": { … } }. Pide \`esquema\` ` +
            `con \`bloque\` para saber qué campos admite.`
          : "Pide `ver` para mirar cómo quedó.",
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
        "publicadas, si están cobradas, quién la lleva y si está archivada.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const todas = await prisma.invitation.findMany({
        select: { id: true, slug: true, title: true, templateId: true, published: true,
          estado: true, pago: true, responsable: true, archivada: true, updatedAt: true },
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
          pago: PAGO_POR_ID[pagoDe(i.pago)].label,
          responsable: i.responsable || null,
          archivada: i.archivada,
          ...(TEMPLATE_BY_ID[i.templateId] ? {} : { aviso: "de una versión anterior, no se puede abrir" }),
          editable: estadoDe(i.estado) !== "entregada" && !!TEMPLATE_BY_ID[i.templateId],
          editor: `${base}/editor/${i.id}`,
        }))
      );
    }
  );

  /* ── Las muestras del catálogo ───────────────────────────────── */

  server.registerTool(
    "muestras",
    {
      title: "Buscar entre las muestras del catálogo",
      description:
        "Las invitaciones que están en la columna «Catálogo» del tablero: " +
        "muestras para enseñar, cada una con su descripción (temas, " +
        "personajes, colores, ambiente). Úsala cuando alguien pida algo por " +
        "tema o por gusto —«Rapunzel», «en lila», «algo de flores»— antes de " +
        "recurrir a `disenos`: aquí está lo que de verdad se ha hecho. Con " +
        "`buscar` devuelve primero las que comparten palabras con la " +
        "descripción; pero la coincidencia literal es sólo una pista: lee " +
        "las descripciones y razona por sentido (Rapunzel → torre, cabello " +
        "largo, flores, lila, cuento) para proponer las que mejor encajan, " +
        "no sólo las que repiten la palabra. Enséñale a la persona las " +
        "opciones con su enlace; no elijas por ella.",
      inputSchema: {
        buscar: z
          .string()
          .optional()
          .describe("Lo que pide la persona, en sus palabras: «rapunzel lila»."),
        ocasion: z
          .string()
          .optional()
          .describe("Filtra por ocasión: boda, quince, comunion, grado, bautizo, babyshower…"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ buscar, ocasion }) => {
      const limpiar = (x: string) =>
        x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const palabras = Array.from(
        new Set(
          limpiar(buscar || "")
            .split(/[^a-z0-9ñ]+/)
            .filter((w) => w.length >= 3 && !["una", "uno", "con", "los", "las", "del", "que", "para", "algo", "como", "tipo"].includes(w))
        )
      );

      const filas = await prisma.invitation.findMany({
        where: { estado: "catalogo", archivada: false },
        select: { id: true, slug: true, title: true, templateId: true, published: true, descripcion: true },
        orderBy: { updatedAt: "desc" },
      });

      const oc = ocasion ? limpiar(ocasion) : "";
      const muestras = filas
        .filter((f) => TEMPLATE_BY_ID[f.templateId])
        .map((f) => {
          const tpl = TEMPLATE_BY_ID[f.templateId];
          const desc = limpiar(f.descripcion || "");
          const resto = limpiar(`${f.title} ${tpl.name} ${KIND_LABEL[tpl.kind]}`);
          /* La descripción pesa el doble: es lo que alguien escribió a
             propósito para esto; el título sólo es lo que quedó. */
          const puntos = palabras.reduce(
            (n, w) => n + (desc.includes(w) ? 2 : 0) + (resto.includes(w) ? 1 : 0),
            0
          );
          return { f, tpl, puntos };
        })
        .filter(({ tpl }) => !oc || limpiar(`${tpl.kind} ${KIND_LABEL[tpl.kind]}`).includes(oc))
        .sort((a, b) => b.puntos - a.puntos);

      if (!muestras.length) {
        return error(
          "No hay muestras en el catálogo" + (ocasion ? ` de «${ocasion}»` : "") +
            ". Mira `disenos` para partir de un diseño en blanco."
        );
      }

      const sinDescripcion = muestras.filter(({ f }) => !f.descripcion?.trim()).length;
      return json({
        ...(palabras.length ? { buscado: palabras } : {}),
        muestras: muestras.slice(0, 30).map(({ f, tpl, puntos }) => ({
          id: f.id,
          titulo: f.title,
          ocasion: KIND_LABEL[tpl.kind],
          diseno: tpl.name,
          disenoId: f.templateId,
          descripcion: f.descripcion || null,
          ...(palabras.length ? { coincide: puntos > 0 } : {}),
          enlace: f.published ? `${base}/${f.slug}` : null,
        })),
        ...(sinDescripcion
          ? {
              aviso:
                `${sinDescripcion} muestra(s) no tienen descripción, así que sólo ` +
                "se pueden elegir por su título. Se escribe en la ficha de la tarjeta, en el tablero.",
            }
          : {}),
        siguiente:
          "Enséñale las que encajan y deja que elija. Para partir de una, `crear` " +
          "con su `disenoId` como diseño.",
      });
    }
  );


  /* ── Los invitados ───────────────────────────────────────────── */

  server.registerTool(
    "crear_invitados",
    {
      title: "Crear los enlaces de los invitados",
      description:
        "Un enlace por familia o por pareja, con sus nombres y sus **pases** " +
        "—cuántas personas caben en ese enlace—. Quien lo abre se ve nombrado, " +
        "la invitación le dice cuántos pases tiene y la confirmación no le deja " +
        "pasar de ahí. Devuelve la dirección de cada uno, lista para mandar por " +
        "WhatsApp. Los pases son opcionales: sin ellos el enlace no tiene tope. " +
        "La invitación tiene que estar publicada para que los enlaces abran.",
      inputSchema: {
        id: z.string().describe("El id de la invitación, de `listar`."),
        invitados: z
          .array(
            z.object({
              nombres: z
                .string()
                .describe("Los nombres que van juntos, separados por coma: «Ana Gómez, Carlos Gómez»."),
              pases: z
                .number()
                .int()
                .min(1)
                .max(50)
                .optional()
                .describe("Cuántas personas caben. Sin esto, no hay tope."),
              nota: z.string().optional().describe("Para acordarse: «familia de la novia»."),
            })
          )
          .min(1)
          .max(200)
          .describe("La lista de enlaces a crear."),
      },
    },
    async ({ id, invitados }) => {
      const inv = await prisma.invitation.findUnique({
        where: { id },
        select: { id: true, slug: true, published: true, title: true },
      });
      if (!inv) return error("No existe una invitación con ese id. Mírala en `listar`.");

      const hechos: { nombres: string; pases: number | null; enlace: string }[] = [];
      const fallos: string[] = [];
      for (const fila of invitados) {
        const nombres = limpiarNombres(fila.nombres);
        if (!nombres.length) {
          fallos.push(`sin nombres: ${JSON.stringify(fila.nombres)}`);
          continue;
        }
        const link = await prisma.guestLink.create({
          data: {
            invitationId: inv.id,
            names: nombres.join(", "),
            code: await nuevoCodigo(),
            note: String(fila.nota || "").trim().slice(0, 120) || null,
            pases: limpiarPases(fila.pases),
          },
        });
        hechos.push({
          nombres: link.names,
          pases: link.pases,
          enlace: urlDeLink(base, inv.slug, link.names, link.code),
        });
      }

      return json({
        creados: hechos.length,
        invitados: hechos,
        ...(fallos.length ? { sinCrear: fallos } : {}),
        ...(inv.published
          ? {}
          : { aviso: "La invitación no está publicada: los enlaces existen pero todavía no abren." }),
        siguiente: "Manda cada `enlace` a su invitado. Con `invitados` ves quién abrió y quién confirmó.",
      });
    }
  );

  server.registerTool(
    "invitados",
    {
      title: "Ver los invitados y sus respuestas",
      description:
        "Los enlaces de una invitación: nombres, pases, si la abrieron, si " +
        "contestaron y cuántas personas confirmaron. Al final, las cuentas que " +
        "se le pasan al salón: pases reservados y personas confirmadas.",
      inputSchema: {
        id: z.string().describe("El id de la invitación, de `listar`."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const inv = await prisma.invitation.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          published: true,
          links: {
            orderBy: { createdAt: "desc" },
            include: {
              rsvps: { select: { name: true, status: true, partySize: true, phone: true, note: true, createdAt: true } },
              aperturas: { select: { veces: true, updatedAt: true } },
            },
          },
        },
      });
      if (!inv) return error("No existe una invitación con ese id. Mírala en `listar`.");
      if (!inv.links.length) {
        return json({
          invitados: [],
          nota: "Esta invitación todavía no tiene enlaces. Créalos con `crear_invitados`.",
        });
      }

      const filas = inv.links.map(resumirLink);
      return json({
        invitados: filas.map((f, i) => ({
          nombres: f.nombres.join(", "),
          pases: f.pases,
          nota: f.note,
          estado: f.estado,
          confirmadas: f.total,
          abierta: f.abrieron > 0,
          abiertaEl: f.abiertoEl?.toISOString() ?? null,
          respondidoEl: f.respondidoEl?.toISOString() ?? null,
          enlace: urlDeLink(base, inv.slug, inv.links[i].names, f.code),
          // El teléfono y el mensaje que dejó cada quien al confirmar, no
          // sólo el recuento: es lo que hace falta para llamar o para leer
          // lo que pidió (una canción, una alergia, con quién se sienta).
          respuestas: f.respuestas.map((r) => ({
            nombre: r.name,
            estado: r.status,
            personas: r.partySize,
            telefono: r.phone,
            mensaje: r.note,
          })),
        })),
        cuentas: {
          enlaces: filas.length,
          /* Con pases cuenta el tope; sin pases, las personas nombradas. Es
             el número que se reserva, no el que confirmó. */
          pasesReservados: filas.reduce((n, f) => n + (f.pases ?? f.nombres.length), 0),
          personasConfirmadas: filas.reduce((n, f) => n + f.total, 0),
          sinResponder: filas.filter((f) => f.estado === "sin respuesta").length,
          vieronYNoContestaron: filas.filter((f) => f.estado === "sin respuesta" && f.abrieron > 0).length,
        },
        ...(inv.published ? {} : { aviso: "La invitación no está publicada: los enlaces no abren todavía." }),
      });
    }
  );


  /* ── Las imágenes ────────────────────────────────────────────── */

  server.registerTool(
    "subir",
    {
      title: "Subir una imagen a la biblioteca",
      description:
        "Descarga una imagen de un enlace público (https) y la guarda en la " +
        "biblioteca. Devuelve la `url` que luego se escribe en un campo de " +
        "imagen, en un adorno (`seccion.adornos`) o en `particulas.pieza`. " +
        "PNG, JPG, WebP, GIF o AVIF, hasta 8 MB. Tiene que ser el enlace a la " +
        "imagen misma, no a la página que la muestra: uno de Google Drive o " +
        "de Instagram devuelve una página y se rechaza.",
      inputSchema: {
        enlace: z.string().describe("https://… directo a la imagen."),
        tipo: z.enum(TIPOS_BIBLIOTECA).describe(
          "«adorno» para decoración (PNG con transparencia), «foto» para las del evento."
        ),
        nombre: z.string().optional().describe("Para encontrarla después, p. ej. «farolillo rapunzel»."),
      },
    },
    async ({ enlace, tipo, nombre }) => {
      try {
        const { bytes, nombre: delEnlace } = await descargar(enlace);
        const s = await guardarEnBiblioteca(bytes, nombre || delEnlace, tipo);
        return json({ ...s, siguiente: "Escribe esta `url` donde vaya, con `escribir`." });
      } catch (e) {
        return error(`No se subió: ${(e as Error).message}`);
      }
    }
  );

  server.registerTool(
    "biblioteca",
    {
      title: "Ver las imágenes subidas",
      description:
        "Lo que hay en la biblioteca, lo más nuevo primero: adornos y fotos " +
        "con su `url`, su nombre y sus medidas. Son las únicas URLs que " +
        "aceptan los campos de imagen y los adornos.",
      inputSchema: {
        tipo: z.enum(["adorno", "foto", "video", "audio"]).optional(),
        buscar: z.string().optional().describe("Parte del nombre."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ tipo, buscar }) => {
      const filas = await prisma.media.findMany({
        where: {
          ...(tipo ? { kind: tipo } : {}),
          ...(buscar?.trim() ? { name: { contains: buscar.trim(), mode: "insensitive" as const } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: { url: true, name: true, kind: true, width: true, height: true, createdAt: true },
      });
      if (!filas.length) return json({ imagenes: [], nota: "No hay nada con ese filtro." });
      return json(
        filas.map((f) => ({
          url: f.url, nombre: f.name, tipo: f.kind,
          ...(f.width && f.height ? { medidas: `${f.width}×${f.height}` } : {}),
          subida: f.createdAt.toISOString().slice(0, 10),
          ver: `${base}${f.url}`,
        }))
      );
    }
  );

  return server;
}
