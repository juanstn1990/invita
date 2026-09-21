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

import { descargar, esPrivada } from "../src/lib/subir";
import { catalogo, esquemaDe, fusionar } from "../src/lib/mcp";
import { defaultData, SECTIONS } from "../src/lib/schema";
import { TEMPLATES, TEMPLATE_BY_ID } from "../src/lib/templates";

let malos = 0;
/* Una biblioteca de mentira: lo que `urlsUsables` devolvería de la base. */
const BIB = new Set(["/api/media/2026/09/a.jpg", "/api/media/2026/09/sol.png"]);
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

  /* Los de archivo salen, pero avisando de dónde sale la URL: sin el aviso
     el modelo se inventa una ruta y la invitación queda rota con aspecto de
     terminada. La galería sigue fuera: tiene su propio editor. */
  const ARCHIVO = new Set(["image", "video", "audio", "medio"]);
  const mudosArchivo = e.flatMap((s) =>
    [...s.campos, ...(s.lista?.campos || [])]
      .filter((c) => ARCHIVO.has(c.tipo) && !c.ayuda?.includes("biblioteca"))
      .map((c) => `${s.seccion}.${c.campo}`)
  );
  decir(!mudosArchivo.length, "cada campo de archivo dice que la URL sale de la biblioteca",
    mudosArchivo.slice(0, 3).join(", "));
  decir(!e.some((s) => [...s.campos, ...(s.lista?.campos || [])].some((c) => c.tipo === "gallery")),
    "y la galería no sale");
  decir(!!hero?.adornos && hero.adornos.campos.some((c) => c.campo === "url"),
    "la portada ofrece sus adornos");

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
      "sin la biblioteca a mano, un archivo se rechaza",
      () => fusionar(TPL, base(), { hero: { backgroundUrl: "/api/media/2026/09/a.jpg" } }).errores.length === 1,
    ],
    [
      "una URL que no está en la biblioteca se rechaza, y dice qué hacer",
      () => {
        const r = fusionar(TPL, base(), { hero: { backgroundUrl: "/inventada.jpg" } }, BIB);
        return r.errores.length === 1 && r.errores[0].includes("subir");
      },
    ],
    [
      "una de la biblioteca pasa, y entera se guarda como ruta",
      () => {
        const r = fusionar(TPL, base(), {
          hero: { backgroundUrl: "https://tuinvitacion.simpplee.com/api/media/2026/09/a.jpg" },
        }, BIB);
        return !r.errores.length && (r.datos as any).hero.backgroundUrl === "/api/media/2026/09/a.jpg";
      },
    ],
    [
      "vaciar un archivo siempre se puede",
      () => !fusionar(TPL, base(), { hero: { backgroundUrl: "" } }).errores.length,
    ],
    [
      "los adornos se escriben completos, con los valores del editor",
      () => {
        const r = fusionar(TPL, base(), {
          hero: { adornos: [{ url: "/api/media/2026/09/sol.png", movimiento: "gira", tamano: "30" }] },
        }, BIB);
        const a = (r.datos as any).hero?.adornos?.[0];
        return !r.errores.length && a.movimiento === "gira" && a.tamano === "30" && a.sitio === "arriba-izq";
      },
    ],
    [
      "un adorno sin imagen, con un movimiento inventado o de más se rechaza",
      () =>
        fusionar(TPL, base(), { hero: { adornos: [{ sitio: "arriba" }] } }, BIB).errores.length === 1 &&
        fusionar(TPL, base(), { hero: { adornos: [{ url: "/api/media/2026/09/sol.png", movimiento: "baila" }] } }, BIB).errores.length === 1 &&
        fusionar(TPL, base(), { hero: { adornos: Array(40).fill({ url: "/api/media/2026/09/sol.png" }) } }, BIB).errores.length === 1,
    ],
    [
      "los farolillos: partículas con una imagen de la biblioteca",
      () => {
        const r = fusionar(TPL, base(), {
          particulas: { enabled: true, tipo: "imagen", pieza: "/api/media/2026/09/sol.png", rumbo: "sube" },
        }, BIB);
        return !r.errores.length && (r.datos as any).particulas.pieza === "/api/media/2026/09/sol.png";
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
    /* Los ajustes por texto: color, letra, alineación, tamaño, animación.
       Hicieron falta el día que una plantilla trajo el título en negro sobre
       fondo oscuro —invisible— y el MCP no podía ni mirarlo ni arreglarlo. */
    [
      "se puede teñir un texto suelto",
      () => {
        const r = fusionar(TPL, base(), { events: { colors: { title: "#ffffff" } } });
        return !r.errores.length && (r.datos.events as any).colors.title === "#ffffff";
      },
    ],
    [
      "y vaciarlo lo devuelve al color del diseño",
      () => !fusionar(TPL, base(), { events: { colors: { title: "" } } }).errores.length,
    ],
    [
      "un color que no es color se rechaza",
      () => fusionar(TPL, base(), { events: { colors: { title: "negro" } } }).errores.length === 1,
    ],
    [
      "teñir un texto que esa sección no tiene se rechaza",
      () => {
        const r = fusionar(TPL, base(), { events: { colors: { inventado: "#ffffff" } } });
        return r.errores.length === 1 && r.errores[0].includes("inventado");
      },
    ],
    [
      "una tipografía del catálogo pasa, una inventada no",
      () =>
        !fusionar(TPL, base(), { events: { fonts: { title: "playfair" } } }).errores.length &&
        fusionar(TPL, base(), { events: { fonts: { title: "comicsans" } } }).errores.length === 1,
    ],
    [
      "una animación inventada se rechaza",
      () => fusionar(TPL, base(), { events: { anim: { title: "voltereta" } } }).errores.length === 1,
    ],
    [
      "un tamaño fuera de rango se rechaza",
      () => fusionar(TPL, base(), { events: { size: { title: "900" } } }).errores.length === 1,
    ],
    [
      "y los ajustes no borran los que ya había",
      () => {
        const d = base();
        d.events = { ...d.events, colors: { label: "#111111" } };
        const r = fusionar(TPL, d, { events: { colors: { title: "#ffffff" } } });
        const c = (r.datos.events as any).colors;
        return c.label === "#111111" && c.title === "#ffffff";
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

/* ── Descargar sin abrir la red de dentro ─────────────────────── */

{
  const internas = ["127.0.0.1", "10.0.0.5", "172.20.1.1", "192.168.1.1", "169.254.169.254",
    "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "no-es-ip"];
  const fuera = internas.filter((ip) => !esPrivada(ip));
  decir(!fuera.length, "las direcciones internas se reconocen", fuera.join(", "));
  const publicas = ["8.8.8.8", "104.18.2.3", "172.32.0.1", "2606:4700::1111"];
  const dentro = publicas.filter(esPrivada);
  decir(!dentro.length, "y las públicas no", dentro.join(", "));
}

void (async () => {
  const casos: [string, string][] = [
    ["un enlace http se rechaza", "http://example.com/a.png"],
    ["uno a localhost también", "https://localhost/a.png"],
    ["uno a los metadatos de la nube también", "https://169.254.169.254/latest/meta-data"],
    ["uno con usuario y contraseña también", "https://a:b@example.com/a.png"],
    ["y lo que no es un enlace", "farolillo.png"],
  ];
  for (const [nombre, enlace] of casos) {
    const r = await descargar(enlace).then(() => "", (e) => (e as Error).message);
    decir(!!r, `subir · ${nombre}`, "se descargó");
  }
  console.log(
    malos
      ? `\n${malos} comprobación(es) con problemas`
      : "\nEl servidor MCP responde lo que debe y rechaza lo que debe"
  );
  process.exit(malos ? 1 : 0);
})();
