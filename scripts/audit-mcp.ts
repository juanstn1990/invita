/**
 * Auditoría del servidor MCP.
 *
 *   npm run audit:mcp
 *
 * Prueba la lógica —catálogo, esquema, fusión— sin levantar el servidor ni
 * tocar la base de datos. Lo que un cliente MCP hace con esto es llamar una
 * función y serializar el resultado; lo que puede estar mal está aquí.
 *
 * Lo que se vigila, y por qué cada cosa:
 *
 * · **Que el esquema no ofrezca lo que no se puede escribir.** Un campo de
 *   foto en la lista sería una invitación a que el modelo escriba una ruta
 *   inventada, y una invitación con la foto rota parece terminada.
 * · **Que un campo desconocido se rechace y se explique.** Es la decisión que
 *   sostiene todo lo demás: al otro lado hay alguien que no ve el resultado.
 * · **Que un parche con un error no escriba nada.** A medias es peor que no.
 * · **Que las opciones de un desplegable se comprueben.** Un valor inventado
 *   ahí se cae al caso por defecto sin dar ningún error: la invitación sale
 *   con la animación que no se pidió y nadie se entera.
 */

import { catalogo, esquemaDe, fusionar } from "../src/lib/mcp";
import { defaultData, SECTIONS } from "../src/lib/schema";
import { TEMPLATES, TEMPLATE_BY_ID } from "../src/lib/templates";

let malos = 0;
const decir = (ok: boolean, nombre: string, detalle = "") => {
  if (!ok) malos++;
  console.log(`${ok ? "✓" : "✗"} ${nombre}${!ok && detalle ? `  ${detalle}` : ""}`);
};

const TPL = "invitacion-15-burdeos";
const base = () => JSON.parse(JSON.stringify(defaultData()));

/* ── El catálogo ─────────────────────────────────────────────── */

{
  const c = catalogo();
  const total = Object.values(c).flat().length;
  decir(total === TEMPLATES.length, `el catálogo trae los ${TEMPLATES.length} diseños`, `trajo ${total}`);
  decir(Object.keys(c).length >= 5, "agrupados por ocasión", `${Object.keys(c).length} grupos`);

  /* El estilo es lo único que ayuda a elegir: «Vintage» no dice nada. */
  const sinEstilo = Object.values(c).flat().filter((d) => !d.estilo?.trim());
  decir(!sinEstilo.length, "cada uno dice su estilo", `${sinEstilo.length} sin él`);
  const sinColor = Object.values(c).flat().filter((d) => d.colores.length !== 3);
  decir(!sinColor.length, "y sus tres colores", `${sinColor.length} sin ellos`);
}

/* ── El esquema ──────────────────────────────────────────────── */

{
  const e = esquemaDe(TPL);
  decir(e.length > 5, "el esquema trae varias secciones", `${e.length}`);

  const hero = e.find((s) => s.seccion === "hero");
  decir(!!hero, "y la portada entre ellas");
  decir(!!hero?.campos.find((c) => c.campo === "label"), "con sus campos de texto");

  /* Ni un campo de archivo, en ninguna sección ni en ninguna lista. */
  const ARCHIVO = new Set(["image", "video", "audio", "medio", "gallery"]);
  const colados = e.flatMap((s) =>
    [...s.campos, ...(s.lista?.campos || [])]
      .filter((c) => ARCHIVO.has(c.tipo))
      .map((c) => `${s.seccion}.${c.campo}`)
  );
  decir(!colados.length, "sin un solo campo de archivo", colados.slice(0, 3).join(", "));

  /* Los desplegables traen sus opciones, o el modelo tiene que adivinarlas. */
  const mudos = e.flatMap((s) =>
    [...s.campos, ...(s.lista?.campos || [])]
      .filter((c) => c.tipo === "select" && !c.opciones?.length)
      .map((c) => `${s.seccion}.${c.campo}`)
  );
  decir(!mudos.length, "y cada desplegable con sus opciones", mudos.slice(0, 3).join(", "));

  /* Por diseño y no en general: si dieran lo mismo, pedirlo por diseño no
     serviría de nada y el modelo escribiría campos que no se dibujan. */
  const campos = (id: string) =>
    new Set(esquemaDe(id).flatMap((s) => s.campos.map((c) => `${s.seccion}.${c.campo}`)));
  const a = campos(TPL);
  const distinto = TEMPLATES.some((t) => {
    const b = campos(t.id);
    return b.size !== a.size || [...b].some((k) => !a.has(k));
  });
  decir(distinto, "el esquema depende del diseño, no es el mismo para todos");

  /* Los 50 tienen que poder responder sin reventar. */
  let rotos = 0;
  for (const t of TEMPLATES) {
    try { if (!esquemaDe(t.id).length) rotos++; } catch { rotos++; }
  }
  decir(!rotos, `los ${TEMPLATES.length} diseños devuelven esquema`, `${rotos} rotos`);

  try {
    esquemaDe("invitacion-que-no-existe");
    decir(false, "un diseño inventado da error");
  } catch {
    decir(true, "un diseño inventado da error");
  }
}

/* ── La fusión ───────────────────────────────────────────────── */

{
  const casos: [string, () => boolean][] = [
    [
      "un parche bueno se escribe",
      () => {
        const r = fusionar(TPL, base(), { event: { name1: "Valentina" } });
        return !r.errores.length &&
          (r.datos.event as any).name1 === "Valentina" &&
          r.escritos.includes("event.name1");
      },
    ],
    [
      "y no toca lo que no se le pasó",
      () => {
        const antes = base();
        const r = fusionar(TPL, antes, { event: { name1: "Valentina" } });
        return (r.datos.hero as any)?.label === (antes.hero as any)?.label;
      },
    ],
    [
      "no muta los datos que recibe",
      () => {
        const antes = base();
        fusionar(TPL, antes, { event: { name1: "Otra" } });
        return (antes.event as any).name1 !== "Otra";
      },
    ],
    [
      "un campo que no existe se rechaza",
      () => fusionar(TPL, base(), { hero: { titulo: "x" } }).errores.length === 1,
    ],
    /* El campo se saca del esquema y no se escribe a mano: la portada no
       tiene "title" —tiene "label", "subtitle", "cta"— y la primera versión
       de esta prueba lo daba por hecho y fallaba por el motivo equivocado. */
    [
      "y sugiere el que se quiso escribir",
      () => {
        const real = esquemaDe(TPL).find((s) => s.seccion === "hero")!.campos[0].campo;
        const roto = real.slice(0, -1);
        const r = fusionar(TPL, base(), { hero: { [roto]: "x" } });
        return r.errores[0].includes(`"${real}"`);
      },
    ],
    [
      "una sección que no existe se rechaza",
      () => fusionar(TPL, base(), { portada: { label: "x" } }).errores.length === 1,
    ],
    /* La que sostiene todo lo demás: a medias es peor que nada, porque el
       modelo no ve el resultado y creería que quedó puesto. */
    [
      "con un error no se escribe NADA, ni lo bueno",
      () => {
        const r = fusionar(TPL, base(), {
          event: { name1: "Valentina" },
          hero: { inventado: "x" },
        });
        return r.errores.length === 1 &&
          !r.escritos.length &&
          (r.datos.event as any).name1 !== "Valentina";
      },
    ],
    [
      "un valor que no es opción del desplegable se rechaza",
      () => {
        const r = fusionar(TPL, base(), { events: { animFichas: "volteretas" } });
        return r.errores.length === 1 && r.errores[0].includes("alterna");
      },
    ],
    [
      "y el que sí lo es pasa",
      () => !fusionar(TPL, base(), { events: { animFichas: "alterna" } }).errores.length,
    ],
    [
      "un color que no es hexadecimal se rechaza",
      () => fusionar(TPL, base(), { hero: { textColor: "rojo" } }).errores.length === 1,
    ],
    [
      "y el que sí lo es pasa",
      () => !fusionar(TPL, base(), { hero: { textColor: "#8a7248" } }).errores.length,
    ],
    [
      "un campo de archivo se rechaza, y dice por qué",
      () => {
        const r = fusionar(TPL, base(), { hero: { backgroundUrl: "/inventada.jpg" } });
        return r.errores.length === 1 && r.errores[0].includes("persona");
      },
    ],
    [
      "una sección obligatoria no se puede apagar",
      () => fusionar(TPL, base(), { hero: { enabled: false } }).errores.length === 1,
    ],
    [
      "una opcional sí",
      () => !fusionar(TPL, base(), { gifts: { enabled: false } }).errores.length,
    ],
    [
      "una lista se escribe entera",
      () => {
        const r = fusionar(TPL, base(), {
          events: { items: [{ title: "Ceremonia" }, { title: "Fiesta" }] },
        });
        return !r.errores.length && (r.datos.events as any).items.length === 2;
      },
    ],
    [
      "con un campo malo dentro, se rechaza la lista",
      () =>
        fusionar(TPL, base(), { events: { items: [{ inventado: "x" }] } }).errores.length === 1,
    ],
    [
      "y pasarse del máximo también",
      () => {
        const spec = SECTIONS.find((s) => s.key === "events")!;
        const muchos = Array.from({ length: spec.list!.max + 1 }, () => ({ title: "x" }));
        return fusionar(TPL, base(), { events: { items: muchos } }).errores.length === 1;
      },
    ],
    /* La paleta es el caso raro: su lista de opciones nace vacía en el
       esquema porque depende del diseño. Sin rellenarla, la comprobación de
       opciones rechazaba **cualquier** paleta, incluida una buena — el campo
       no quedaba invisible, quedaba imposible de escribir. */
    [
      "la paleta del diseño se puede escribir",
      () => {
        const paletas = TEMPLATE_BY_ID[TPL].palettes;
        const r = fusionar(TPL, base(), { event: { paleta: paletas[1].id } });
        return !r.errores.length && (r.datos.event as any).paleta === paletas[1].id;
      },
    ],
    [
      "y una paleta que ese diseño no tiene, no",
      () => fusionar(TPL, base(), { event: { paleta: "turquesa-inventado" } }).errores.length === 1,
    ],
    [
      "el esquema dice qué paletas hay",
      () => {
        const ev = esquemaDe(TPL).find((s) => s.seccion === "event")!;
        const campo = ev.campos.find((c) => c.campo === "paleta")!;
        return (campo.opciones?.length || 0) === TEMPLATE_BY_ID[TPL].palettes.length + 1;
      },
    ],
    [
      "un diseño inventado se rechaza sin escribir",
      () => {
        const r = fusionar("no-existe", base(), { event: { name1: "x" } });
        return r.errores.length === 1 && !r.escritos.length;
      },
    ],
    /* Un campo que el diseño no dibuja: escribirlo no se vería, así que
       decirlo ahorra un turno y una invitación con un hueco. */
    [
      "un campo que este diseño no dibuja se rechaza",
      () => {
        const todos = esquemaDe(TPL);
        const hero = todos.find((s) => s.seccion === "hero")!;
        const ausente = SECTIONS.find((s) => s.key === "hero")!.fields.find(
          (f) => !hero.campos.some((c) => c.campo === f.key) &&
            !["image", "video", "audio", "medio", "gallery"].includes(f.type)
        );
        /* Si este diseño los dibuja todos, la comprobación no aplica. */
        if (!ausente) return true;
        return fusionar(TPL, base(), { hero: { [ausente.key]: "x" } }).errores.length === 1;
      },
    ],
  ];

  for (const [nombre, comprueba] of casos) {
    let ok = false;
    let detalle = "";
    try { ok = comprueba(); } catch (e) { detalle = (e as Error).message; }
    decir(ok, nombre, detalle);
  }
}

console.log(
  malos
    ? `\n${malos} comprobación(es) con problemas`
    : "\nEl servidor MCP responde lo que debe y rechaza lo que debe"
);
process.exit(malos ? 1 : 0);
