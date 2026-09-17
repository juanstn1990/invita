/** Renderiza los 14 diseños con los datos por defecto y revisa lo básico. */
import fs from "fs";
import path from "path";
import { parseHTML } from "linkedom";
import { mapFor } from "../src/lib/bindings";
import { renderInvitation } from "../src/lib/render";
import { defaultData } from "../src/lib/schema";
import { TEMPLATES, readTemplate } from "../src/lib/templates";
import { BLOCKS } from "../src/lib/blocks";
import { SECTION_BY_KEY } from "../src/lib/schema";

const out = path.join(process.cwd(), ".preview");
fs.mkdirSync(out, { recursive: true });

const data = defaultData();
(data.event as any).name1 = "Andrés";
(data.event as any).name2 = "Valentina";
(data.event as any).date = "2027-04-17T16:30";
(data.event as any).city = "Cartagena";
(data.guests as any).items = [
  { name: "Lucía Restrepo", role: "Madrina" },
  { name: "Felipe Ortiz", role: "Padrino" },
];
(data.gallery as any).items = [{ url: "https://picsum.photos/seed/a/600/600" }];
// Con foto de portada: en los diseños sin capa `.hero-bg` propia el candidato
// es la sección entera, y una versión anterior le borraba el contenido.
(data.hero as any).backgroundUrl = "https://picsum.photos/seed/b/900/1400";
// Los datos de prueba no deben contener nombres de los templates, para que
// cualquier resto delate un campo sin mapear.
(data.events as any).items = [
  { icon: "\u26ea", kind: "Ceremonia religiosa", title: "Ceremonia", time: "16:30", place: "Capilla del Mar", address: "Calle 39 #4-21", note: "Llegar 15 min antes", mapUrl: "https://maps.google.com/?q=capilla" },
  { icon: "\ud83e\udd42", kind: "Fiesta", title: "Recepci\u00f3n", time: "19:00", place: "Casa Bohemia", address: "Getseman\u00ed", note: "", mapUrl: "" },
];

const RESIDUE = ["Juan", "María", "Florencia", "Martina", "Mateo", "Emilia", "Martín", "2025", "2026", "Sevilla"];

let bad = 0;
for (const tpl of TEMPLATES) {
  try {
    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id),
      templateId: tpl.id,
      data,
      slug: "demo",
    });
    fs.writeFileSync(path.join(out, `${tpl.id}.html`), html);

    const body = html.slice(html.indexOf("<body"));
    const visible = body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    const left = RESIDUE.filter((r) => visible.includes(r));
    const ok = visible.includes("Andrés") && visible.includes("Valentina");
    const target = /new Date\('2027-04-17T16:30:00'\)/.test(html);

    // La portada debe seguir teniendo su texto después de ponerle la foto.
    const { document } = parseHTML(html);
    const heroSel = mapFor(tpl.id).sections.hero;
    const hero = heroSel.map((sel) => document.querySelector(sel)).find(Boolean);
    const heroOk = !!hero && (hero.textContent || "").replace(/\s+/g, "").length > 12;

    const flag = ok && target && heroOk && !left.length ? "✓" : "✗";
    if (flag === "✗") bad++;
    console.log(
      `${flag} ${tpl.id.padEnd(28)} ${(html.length / 1024).toFixed(0)}kb` +
        `${ok ? "" : "  SIN NOMBRES"}${target ? "" : "  SIN FECHA"}` +
        `${heroOk ? "" : "  PORTADA VACÍA"}` +
        `${left.length ? "  residuo: " + left.join(",") : ""}`
    );
  } catch (e) {
    bad++;
    console.log(`✗ ${tpl.id.padEnd(28)} ERROR ${(e as Error).message}`);
  }
}
/* ── El botón de la portada, en los casos que lo hacían desaparecer ──
   Dos fallos reales: al vaciar su texto se borraba el elemento (la regla
   general de "un campo vacío no deja hueco", que aquí dejaba la portada sin
   salida), y con la cuenta atrás apagada su `#countdown` apuntaba a una
   sección oculta — vivo pero sin llevar a ningún sitio. */
const CASOS: [string, (d: any) => void][] = [
  ["texto vacío", (d) => { d.hero.cta = ""; }],
  ["cuenta atrás apagada", (d) => { d.countdown.enabled = false; }],
  ["las dos cosas", (d) => { d.hero.cta = ""; d.countdown.enabled = false; }],
];

let botonMal = 0;
for (const [nombre, tocar] of CASOS) {
  const sin: string[] = [];
  const muerta: string[] = [];
  for (const tpl of TEMPLATES) {
    const d: any = defaultData();
    tocar(d);
    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
    });
    const { document } = parseHTML(html);
    const b = document.querySelector(".hero-btn") as any;
    if (!b) { sin.push(tpl.id); continue; }
    const href = b.getAttribute("href") || "";
    if (href.startsWith("#")) {
      const destino = document.querySelector(href) as any;
      if (!destino || destino.getAttribute("hidden") !== null) muerta.push(tpl.id);
    }
  }
  const ok = !sin.length && !muerta.length;
  if (!ok) botonMal++;
  console.log(
    `${ok ? "✓" : "✗"} botón de portada · ${nombre.padEnd(22)}` +
      `${sin.length ? `  ${sin.length} sin botón` : ""}` +
      `${muerta.length ? `  ${muerta.length} con ancla muerta` : ""}`
  );
}



/* ── El botón del mapa en el velo de bienvenida ──────────────────
   Antes era un segundo "Confirmar asistencia" que hacía lo mismo que el
   primero: entrar. Ahora abre la ubicación, y sin link no tiene nada que
   abrir. */
{
  const casos: [string, string, boolean][] = [
    ["con link", "https://maps.app.goo.gl/abc123", true],
    ["sin link", "", false],
    ["basura en el campo", "no es un link", false],
  ];
  for (const [nombre, link, debeVerse] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.splash.mapUrl = link;
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const b = document.querySelector(".splash-btn-mapa") as any;
      const visible = Boolean(b) && b.getAttribute("hidden") === null;
      if (visible !== debeVerse) mal.push(tpl.id);
      /* Visible tiene que llevar el href puesto: un botón que se ve y no
         lleva a ningún sitio es el fallo que ya se arregló en la portada. */
      if (debeVerse && visible && (b.getAttribute("href") || "") !== link) {
        mal.push(`${tpl.id} (href)`);
      }
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} botón del mapa · ${nombre.padEnd(22)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 3).join(", ")}` : "")
    );
  }
}

/* ── El bloque de vídeo ──────────────────────────────────────────
   El marcado trae los dos reproductores y el render borra el que no toca.
   Si se quedaran los dos, la invitación mostraría el vídeo dos veces; si se
   borraran los dos, un rectángulo negro. */
{
  const casos: [string, Record<string, string>, "yt" | "propio" | "nada", string?][] = [
    ["youtube watch", { fuente: "youtube", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, "yt", "dQw4w9WgXcQ"],
    ["youtu.be con ?si=", { fuente: "youtube", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ?si=xY7" }, "yt", "dQw4w9WgXcQ"],
    ["shorts", { fuente: "youtube", youtubeUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ" }, "yt", "dQw4w9WgXcQ"],
    ["con minuto de inicio", { fuente: "youtube", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ?t=1m30s" }, "yt", "start=90"],
    ["archivo subido", { fuente: "subido", url: "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4" }, "propio"],
    ["fuente youtube pero sólo hay archivo", { fuente: "youtube", url: "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4" }, "propio"],
    ["link que no es de youtube", { fuente: "youtube", youtubeUrl: "https://vimeo.com/12345" }, "nada"],
    ["sin nada", { fuente: "youtube" }, "nada"],
  ];

  for (const [nombre, datos, espera, contiene] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.layout = {
        blocks: [{ id: "v1", type: "video", variant: "marco", data: { enabled: true, ...datos } }],
      };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const bloque = document.querySelector(".inv-video") as any;
      const marco = document.querySelector(".inv-video-frame") as any;
      const propio = document.querySelector(".inv-video-propio") as any;
      const oculto = (el: any) =>
        !el || (el.closest?.("[hidden]") ?? null) !== null || el.getAttribute("hidden") !== null;

      if (espera === "nada") {
        if (bloque && !oculto(bloque)) mal.push(`${tpl.id} (debía esconderse)`);
        continue;
      }
      if (espera === "yt") {
        if (!marco) mal.push(`${tpl.id} (sin iframe)`);
        else if (propio) mal.push(`${tpl.id} (quedaron los dos)`);
        else {
          const src = marco.getAttribute("src") || "";
          if (!src.includes("youtube-nocookie.com/embed/")) mal.push(`${tpl.id} (src: ${src})`);
          if (contiene && !src.includes(contiene)) mal.push(`${tpl.id} (falta ${contiene})`);
        }
      } else {
        if (!propio) mal.push(`${tpl.id} (sin <video>)`);
        else if (marco) mal.push(`${tpl.id} (quedaron los dos)`);
        else if (!(propio.getAttribute("src") || "").endsWith(".mp4")) {
          mal.push(`${tpl.id} (src: ${propio.getAttribute("src")})`);
        }
      }
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} vídeo · ${nombre.padEnd(34)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }
}


/* ── El fondo de una sección ─────────────────────────────────────
   El mismo campo acepta una foto y un vídeo, y lo que decide es la extensión
   de la URL. Equivocarse ahí no se ve a medias: una foto emitida como
   `<video>` deja la sección en blanco, y un vídeo emitido como
   `background-image` no lo pinta ningún navegador. */
{
  const MP4 = "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4";
  const JPG = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg";

  const casos: [string, Record<string, unknown>, (capa: any, html: string) => boolean][] = [
    [
      "una foto sigue siendo un background",
      { fondoUrl: JPG },
      (capa) =>
        !capa.querySelector("video") &&
        (capa.getAttribute("style") || "").includes("background-image"),
    ],
    [
      "un mp4 sale como <video> que arranca solo",
      { fondoUrl: MP4 },
      (capa) => {
        const v = capa.querySelector("video");
        /* Los cuatro juntos o ninguno: `autoplay` sin `muted` no lo respeta
           ningún navegador y sin `playsinline` iOS se lo lleva a pantalla
           completa encima de la invitación. */
        return Boolean(
          v &&
            v.getAttribute("src") === MP4 &&
            ["autoplay", "muted", "loop", "playsinline"].every(
              (a) => v.getAttribute(a) !== null
            ) &&
            v.getAttribute("controls") === null
        );
      },
    ],
    [
      "un .webm ajeno también",
      { fondoUrl: "https://ajeno.test/clip.webm?v=2" },
      (capa) => Boolean(capa.querySelector("video")),
    ],
    [
      "la opacidad la pone la capa, no el vídeo",
      { fondoUrl: MP4, fondoOpacidad: 40 },
      (capa) =>
        (capa.getAttribute("style") || "").includes("opacity:0.4") &&
        !(capa.querySelector("video")?.getAttribute("style") || "").includes("opacity"),
    ],
    [
      "«contener» llega al vídeo como object-fit",
      { fondoUrl: MP4, fondoAjuste: "contener" },
      (capa) =>
        (capa.querySelector("video")?.getAttribute("style") || "").includes(
          "object-fit:contain"
        ),
    ],
    [
      "«repetir» no intenta un mosaico de vídeo",
      { fondoUrl: MP4, fondoAjuste: "repetir" },
      (capa) =>
        Boolean(capa.querySelector("video")) &&
        !(capa.getAttribute("style") || "").includes("background-repeat"),
    ],
    [
      "quien pidió menos movimiento se lleva el script que lo para",
      { fondoUrl: MP4 },
      (_capa, html) => html.includes("prefers-reduced-motion") && html.includes("inv-fondo-video"),
    ],
  ];

  for (const [nombre, parche, comprueba] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.gallery = { ...(d.gallery || {}), enabled: true, ...parche };
      const html = renderInvitation({
        templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
      });
      const capa = parseHTML(html).document.querySelector(".inv-fondo") as any;
      if (!capa) mal.push(`${tpl.id} (sin capa)`);
      else if (!comprueba(capa, html)) mal.push(tpl.id);
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} fondo · ${nombre.padEnd(52)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }
}

/* ── Cómo se abre el velo ────────────────────────────────────────
   Es una clase y nada más, pero si no llega no hay forma de notarlo mirando
   la invitación quieta: el velo cerrado se ve igual con apertura y sin ella,
   y la diferencia sólo existe en el segundo en que se sale. */
{
  const casos: [string, string, string | null][] = [
    ["sin elegir nada, el velo de siempre", "", null],
    ["el sobre", "sobre", "inv-velo-sobre"],
    ["un valor inventado se ignora", "cortinas-doradas", null],
  ];

  for (const [nombre, valor, clase] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.splash.apertura = valor;
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const velo = document.querySelector("#splash") as any;
      if (!velo) { mal.push(`${tpl.id} (sin velo)`); continue; }
      const clases = String(velo.getAttribute("class") || "");
      const tiene = /\binv-velo-/.test(clases);
      if (clase ? !clases.includes(clase) : tiene) mal.push(`${tpl.id} ("${clases}")`);
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} apertura · ${nombre.padEnd(36)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }
}

/* ── El fondo de toda la invitación ──────────────────────────────
   Una sola imagen detrás de todas las secciones. Lo que hay que vigilar no es
   que se vea: es **quién se vuelve transparente**. La lista de secciones que
   la llevan se calcula de las que el renderer resolvió de verdad, así que un
   bloque agregado después tiene que entrar solo — y las tres excepciones no,
   pase lo que pase con el orden. */
{
  const IMG = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg";
  const MP4 = "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4";

  /** Los selectores que el renderer declaró transparentes. */
  const transparentes = (html: string): string[] => {
    const m = html.match(/([^{}]+)\{background:transparent\}/);
    return m ? m[1].split(",").map((x) => x.trim()) : [];
  };

  const hayCapa = (html: string) =>
    Boolean(parseHTML(html).document.querySelector(".inv-fondo-global"));

  const render = (fondoGlobal: Record<string, unknown>, extra?: (d: any) => void) => {
    const d: any = defaultData();
    d.fondoGlobal = { ...d.fondoGlobal, ...fondoGlobal };
    extra?.(d);
    return renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
  };

  const casos: [string, () => boolean][] = [
    /* Se mira el marcado y no el texto crudo: el CSS de la capa se inyecta
       siempre, así que buscar la clase en el HTML la encuentra igual. */
    ["sin imagen no hay capa", () => !hayCapa(render({ enabled: true, url: "" }))],
    ["apagado tampoco", () => !hayCapa(render({ enabled: false, url: IMG }))],
    [
      "con imagen hay capa y velo",
      () => {
        const doc = parseHTML(render({ enabled: true, url: IMG, velo: "45" })).document;
        return Boolean(doc.querySelector(".inv-fondo-global")) &&
          Boolean(doc.querySelector(".inv-fg-velo"));
      },
    ],
    [
      "con el velo a cero no hay velo",
      () => !parseHTML(render({ enabled: true, url: IMG, velo: "0" })).document
        .querySelector(".inv-fg-velo"),
    ],
    [
      "acepta vídeo",
      () => Boolean(parseHTML(render({ enabled: true, url: MP4 })).document.querySelector(".inv-fg-medio video")),
    ],
    /* Las tres que se quedan con lo suyo. Y el velo: va encima de todo y con
       su propio fondo, así que tampoco. */
    [
      "la portada, las redes y el pie se quedan fuera",
      () => {
        const sels = transparentes(render({ enabled: true, url: IMG })).join(" ");
        return !/hero|social|splash|footer/.test(sels);
      },
    ],
    [
      "las demás secciones entran",
      () => {
        const sels = transparentes(render({ enabled: true, url: IMG }));
        /* Por atributo y no por id: así se resuelven las secciones del
           esqueleto. Los bloques sintetizados sí llevan id propio. */
        return sels.includes('[data-inv-section="countdown"]') &&
          sels.includes('[data-inv-section="gallery"]');
      },
    ],
    /* Lo que se pidió explícitamente: una sección nueva la forma también. */
    [
      "un bloque agregado después entra solo",
      () => {
        const h = render({ enabled: true, url: IMG }, (d) => {
          d.layout = {
            blocks: [{ id: "p9", type: "paragraph", variant: "simple", data: { enabled: true, text: "Hola." } }],
          };
        });
        return transparentes(h).includes("#inv-p9");
      },
    ],
  ];

  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} fondo global · ${nombre}`);
  }
}

/* ── La capa de partículas ───────────────────────────────────────
   Cubre la pantalla entera, así que lo que hay que vigilar no es que se vea
   bonita: es que no se coma los clics. Sin `pointer-events:none` la
   invitación deja de responder y no se puede ni entrar por el velo — el mismo
   fallo que ya tuvo la marca de agua. */
{
  const casos: [string, Record<string, unknown>, (c: any, doc: any) => boolean][] = [
    ["sin elegir tipo no hay capa", { enabled: true, tipo: "" }, (_c, doc) => !doc.querySelector(".inv-particulas")],
    ["apagada tampoco", { enabled: false, tipo: "petalos" }, (_c, doc) => !doc.querySelector(".inv-particulas")],
    ["un tipo inventado se ignora", { enabled: true, tipo: "dragones" }, (_c, doc) => !doc.querySelector(".inv-particulas")],
    [
      "los pétalos caen",
      { enabled: true, tipo: "petalos", cantidad: "20" },
      (c) => String(c.getAttribute("class")).includes("inv-pt-cae") && c.children.length === 20,
    ],
    [
      "las burbujas suben",
      { enabled: true, tipo: "burbujas" },
      (c) => String(c.getAttribute("class")).includes("inv-pt-sube"),
    ],
    [
      "las mariposas flotan, y con sus alas",
      { enabled: true, tipo: "mariposas" },
      (c) => String(c.getAttribute("class")).includes("inv-pt-flota") &&
        c.querySelectorAll(".inv-pt-ala").length > 0,
    ],
    [
      "la cantidad se recorta a lo razonable",
      { enabled: true, tipo: "nieve", cantidad: "900" },
      (c) => c.children.length === 60,
    ],
    /* Cada pieza con su propio retardo y duración: sin eso las sesenta caen
       en formación, que se lee como una persiana y no como una nevada. */
    [
      "cada pieza cae a su aire",
      { enabled: true, tipo: "nieve", cantidad: "12" },
      (c) => {
        const estilos = Array.from(c.children).map((i: any) => i.getAttribute("style"));
        return new Set(estilos).size === estilos.length;
      },
    ],
    /* Y el mismo dato tiene que dar siempre el mismo marcado: si no, cada
       tecla en el editor movería todos los pétalos de sitio. */
    [
      "el mismo dato da siempre el mismo dibujo",
      { enabled: true, tipo: "hojas", cantidad: "15" },
      (c) => String(c.children[0].getAttribute("style")).includes("left:"),
    ],
  ];

  for (const [nombre, particulas, comprueba] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.particulas = { ...d.particulas, ...particulas };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const c = document.querySelector(".inv-particulas") as any;
      try {
        if (!comprueba(c, document)) mal.push(tpl.id);
      } catch {
        mal.push(`${tpl.id} (excepción)`);
      }
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} partículas · ${nombre.padEnd(42)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }

  /* Estable entre renders: el mismo dato, dos veces, el mismo HTML. */
  {
    const uno = (n: number) => {
      const d: any = defaultData();
      d.particulas = { enabled: true, tipo: "petalos", cantidad: String(n) };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
          data: d, slug: "demo",
        })
      );
      return (document.querySelector(".inv-particulas") as any).innerHTML;
    };
    const ok = uno(14) === uno(14);
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} partículas · dos renders del mismo dato salen idénticos`);
  }
}

/* ── La portada acepta fondo y párrafo ───────────────────────────
   La portada estuvo fuera del fondo mientras el argumento fue "ese sitio ya
   lo ocupa su foto". Con el fondo aceptando vídeo dejó de valer, y lo que hay
   que comprobar es que las dos capas convivan en el orden correcto: el fondo
   detrás, la foto encima, y el texto sobre las dos. */
{
  const MP4 = "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4";
  const JPG = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg";

  const casos: [string, Record<string, unknown>, (hero: any) => boolean][] = [
    [
      "sin fondo la portada no cambia",
      {},
      (h) => !h.querySelector(".inv-fondo"),
    ],
    [
      "acepta fondo de foto",
      { fondoUrl: JPG },
      (h) => Boolean(h.querySelector(".inv-fondo")) && !h.querySelector(".inv-fondo video"),
    ],
    [
      "y fondo de vídeo",
      { fondoUrl: MP4 },
      (h) => Boolean(h.querySelector(".inv-fondo video")),
    ],
    /* El orden es lo único que decide cuál se ve: la capa del fondo va antes
       que la foto en el DOM, así que la foto manda cuando la hay. */
    [
      "el fondo va detrás de la foto de portada",
      { fondoUrl: MP4, backgroundUrl: JPG },
      (h) => {
        const fondo = h.querySelector(".inv-fondo");
        const foto = h.querySelector(".hero-bg");
        if (!fondo || !foto) return false;
        const hijos = Array.from(h.children) as any[];
        return hijos.indexOf(fondo) < hijos.indexOf(foto);
      },
    ],
    [
      "el párrafo conserva sus saltos de línea",
      { parrafo: "Una línea.\nY otra." },
      (h) => (h.querySelector(".hero-parrafo")?.textContent || "").includes("\n"),
    ],
    [
      "sin párrafo no queda un hueco",
      {},
      (h) => !h.querySelector(".hero-parrafo"),
    ],
  ];

  for (const [nombre, hero, comprueba] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.hero = { ...d.hero, ...hero };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const h = document.querySelector("#hero") as any;
      if (!h) mal.push(`${tpl.id} (sin portada)`);
      else if (!comprueba(h)) mal.push(tpl.id);
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} portada · ${nombre.padEnd(44)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }
}

/* ── Animación por texto ─────────────────────────────────────────
   Dos de las familias reparten el texto en trozos, y ahí hay un fallo que el
   marcado no delata a simple vista: si se reparte **antes** de escribir el
   campo, lo que se parte es el texto de ejemplo del diseño. Queda un marcado
   perfectamente válido diciendo otra cosa. Por eso se comprueba contra lo que
   se escribió, no contra que haya trozos. */
{
  const TITULO = "Momentos de los dos";

  const casos: [string, Record<string, string>, (t: any, doc: any) => boolean][] = [
    [
      "sin elegir nada no se marca nada",
      {},
      (_t, doc) => !doc.querySelector("[data-inv-anim]"),
    ],
    [
      "una entrada simple sólo marca",
      { title: "sube" },
      (t) => t?.getAttribute("data-inv-anim") === "sube" &&
        !t.querySelector(".inv-anim-parte"),
    ],
    [
      "letra a letra parte lo escrito, no el ejemplo del diseño",
      { title: "letras" },
      (t) => {
        const partes = Array.from(t?.querySelectorAll(".inv-anim-parte") || []) as any[];
        const letras = TITULO.replace(/\s/g, "");
        return partes.length === letras.length &&
          partes.map((p) => p.textContent).join("") === letras;
      },
    ],
    [
      "palabra a palabra son las palabras que hay",
      { title: "palabras" },
      (t) => (t?.querySelectorAll(".inv-anim-parte") || []).length === TITULO.split(/\s+/).length,
    ],
    /* Sin esto un lector de pantalla leería la frase letra por letra, que es
       exactamente lo contrario de lo que se quería. */
    [
      "el texto entero queda legible para un lector de pantalla",
      { title: "letras" },
      (t) => t?.getAttribute("aria-label") === TITULO &&
        Array.from(t.querySelectorAll(".inv-anim-parte")).every(
          (p: any) => p.getAttribute("aria-hidden") === "true"
        ),
    ],
    [
      "un valor inventado se ignora",
      { title: "explota" },
      (_t, doc) => !doc.querySelector("#gallery [data-inv-anim]"),
    ],
    /* El turno es lo que hace que dos textos animados entren uno detrás de
       otro en vez de a la vez. */
    /* Se mira el **segundo** marcado, no el primero: el turno cero no escribe
       nada, que es justo lo que hace que la regla por defecto valga. */
    [
      "el segundo texto animado espera su turno",
      { label: "aparece", title: "sube" },
      (_t, doc) => {
        const todos = Array.from(doc.querySelectorAll("#gallery [data-inv-anim]")) as any[];
        return todos.length === 2 &&
          !String(todos[0].getAttribute("style") || "").includes("--inv-anim-turno") &&
          String(todos[1].getAttribute("style") || "").includes("--inv-anim-turno:1");
      },
    ],
  ];

  for (const [nombre, anim, comprueba] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.gallery = { ...d.gallery, enabled: true, label: "Recuerdos", title: TITULO, anim };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const t = document.querySelector("#gallery [data-inv-anim]") as any;
      try {
        if (!comprueba(t, document)) mal.push(tpl.id);
      } catch {
        mal.push(`${tpl.id} (excepción)`);
      }
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} anim · ${nombre.padEnd(52)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }
}

/* ── Adornos con sitio libre ─────────────────────────────────────
   El sitio libre se apoya en dos variables CSS. Que lleguen bien no se ve
   mirando la invitación: un adorno colocado mal sigue siendo un adorno. */
{
  const base = { url: "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.png", tamano: "30" };

  const casos: [string, Record<string, string>, (a: any) => boolean][] = [
    [
      "un anclado no cambia",
      { ...base, sitio: "abajo-der" },
      (a) => {
        const c = String(a.getAttribute("class") || "");
        return c.includes("inv-ad-abajo-der") && !String(a.getAttribute("style")).includes("--inv-ad-x");
      },
    ],
    [
      "libre lleva sus dos coordenadas",
      { ...base, sitio: "libre", x: "20", y: "80" },
      (a) => {
        const st = String(a.getAttribute("style") || "");
        return String(a.getAttribute("class")).includes("inv-ad-libre") &&
          st.includes("--inv-ad-x:20%") && st.includes("--inv-ad-y:80%");
      },
    ],
    [
      "sin coordenadas cae al centro",
      { ...base, sitio: "libre" },
      (a) => String(a.getAttribute("style")).includes("--inv-ad-x:50%"),
    ],
    [
      "una coordenada fuera de rango se recorta",
      { ...base, sitio: "libre", x: "-40", y: "900" },
      (a) => {
        const st = String(a.getAttribute("style") || "");
        return st.includes("--inv-ad-x:0%") && st.includes("--inv-ad-y:100%");
      },
    ],
    /* El borde del que entra se deduce del sitio, y en libre de los números:
       puesto arriba a la izquierda tiene que entrar desde arriba y desde la
       izquierda, no caer al "sube" del centro. */
    /* Un adorno puede ser un clip. El destello se recorta con la silueta del
       adorno —una máscara CSS— y un vídeo no puede serla, así que ahí el
       efecto se salta en vez de dibujar una barra de luz sobre un
       rectángulo, que es el flash barato que ese efecto evita. */
    [
      "un vídeo sale como <video> mudo y en bucle",
      { ...base, url: "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4" },
      (a) => {
        const v = a.querySelector("video");
        return Boolean(v) && !a.querySelector("img") &&
          ["autoplay", "muted", "loop", "playsinline"].every((x) => v.getAttribute(x) !== null);
      },
    ],
    [
      "y con destello no dibuja la barra de luz",
      { ...base, url: "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4", movimiento: "destello" },
      (a) => !a.querySelector(".inv-ad-luz"),
    ],
    [
      "una imagen con destello sí la dibuja",
      { ...base, movimiento: "destello" },
      (a) => Boolean(a.querySelector(".inv-ad-luz")),
    ],
    [
      "«desliza» deduce el borde de las coordenadas",
      { ...base, sitio: "libre", x: "10", y: "10", entrada: "desliza" },
      (a) => String(a.getAttribute("style")).includes("--inv-ad-desde:translate(-30px, -30px)"),
    ],
    [
      "y en el centro no hay borde del que venir",
      { ...base, sitio: "libre", x: "50", y: "50", entrada: "desliza" },
      (a) => String(a.getAttribute("style")).includes("--inv-ad-desde:translateY(24px)"),
    ],
  ];

  for (const [nombre, adorno, comprueba] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.gallery = { ...d.gallery, adornos: [adorno] };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const a = document.querySelector(".inv-adorno") as any;
      if (!a) mal.push(`${tpl.id} (sin adorno)`);
      else if (!comprueba(a)) mal.push(tpl.id);
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} adorno · ${nombre.padEnd(44)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }
}

/* ── La cortina de apertura ──────────────────────────────────────
   Que se vaya siempre lo prueba `audit:cortina` en el navegador, que es donde
   se puede. Aquí se mira lo otro: que se monte cuando toca, que no se monte
   cuando no, y que lo que se eligió llegue al marcado. */
{
  const INTRO = "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.mp4";

  const casos: [string, any, boolean, (c: any) => boolean][] = [
    ["sin vídeo no hay cortina", {}, false, () => true],
    [
      "con vídeo se monta escondida, con su botón de saltar",
      { introUrl: INTRO }, true,
      (c) =>
        c.hasAttribute("hidden") &&
        c.querySelector("video")?.getAttribute("src") === INTRO &&
        Boolean(c.querySelector(".inv-cortina-saltar")),
    ],
    [
      "en silencio por defecto",
      { introUrl: INTRO }, true,
      (c) => c.querySelector("video")?.getAttribute("muted") !== null,
    ],
    [
      "con sonido se le quita el muted",
      { introUrl: INTRO, introSonido: "con" }, true,
      (c) => c.querySelector("video")?.getAttribute("muted") === null,
    ],
    [
      "«entero» llega como clase",
      { introUrl: INTRO, introAjuste: "contener" }, true,
      (c) => String(c.getAttribute("class") || "").includes("inv-cortina-contener"),
    ],
    [
      "sin elegir salida, el fundido",
      { introUrl: INTRO }, true,
      (c) => String(c.getAttribute("class") || "").includes("inv-cortina-s-fundido"),
    ],
    [
      "la salida elegida llega como clase",
      { introUrl: INTRO, introSalida: "circulo" }, true,
      (c) => String(c.getAttribute("class") || "").includes("inv-cortina-s-circulo"),
    ],
    /* Más vale la salida de siempre que una cortina que no se sabe ir. */
    [
      "una salida inventada cae en el fundido",
      { introUrl: INTRO, introSalida: "explota" }, true,
      (c) => String(c.getAttribute("class") || "").includes("inv-cortina-s-fundido"),
    ],
    /* Sin velo no hay botón que pulsar, y sin gesto no hay vídeo que pueda
       sonar: una cortina ahí sería una capa negra sin forma de quitarla. */
    ["sin velo tampoco hay cortina", { introUrl: INTRO, enabled: false }, false, () => true],
  ];

  for (const [nombre, parche, esperada, comprueba] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      d.splash = { ...d.splash, ...parche };
      const { document } = parseHTML(
        renderInvitation({
          templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
        })
      );
      const c = document.querySelector(".inv-cortina") as any;
      if (!esperada) { if (c) mal.push(`${tpl.id} (sobra)`); continue; }
      if (!c) mal.push(`${tpl.id} (falta)`);
      else if (!comprueba(c)) mal.push(tpl.id);
    }
    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} cortina · ${nombre.padEnd(44)}` +
        (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : "")
    );
  }

  /* En el editor se vuelve a renderizar a cada tecla: una cortina que arranca
     de cero cada 900 ms taparía justo lo que se está escribiendo. */
  {
    const d: any = defaultData();
    d.splash.introUrl = INTRO;
    const html = renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo", preview: true,
    });
    /* Se mira el marcado y no el texto: el CSS de la cortina se inyecta
       siempre, así que buscar la clase en crudo la encuentra igual. */
    const ok = !parseHTML(html).document.querySelector(".inv-cortina");
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} cortina · en la vista previa del editor no se monta`);
  }
}

/* ── Los metadatos del enlace compartido ─────────────────────────
   Un `og:` roto no se ve en la invitación ni en el navegador: se ve cuando
   alguien pega el enlace en WhatsApp, y entonces ya se compartió mal. */
{
  const meta = (doc: any, prop: string) =>
    doc.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") || "";

  const render = (toca: (d: any) => void) => {
    const d: any = defaultData();
    d.event.name1 = "Andrés";
    d.event.name2 = "Valentina";
    d.event.city = "Cartagena";
    toca(d);
    return parseHTML(
      renderInvitation({
        templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
        data: d, slug: "demo", origin: "https://invita.test",
      })
    ).document;
  };

  const casos: [string, (d: any) => void, (doc: any) => boolean][] = [
    [
      "sin tocar nada, como antes",
      () => {},
      (doc) =>
        meta(doc, "og:title") === "Andrés & Valentina" &&
        meta(doc, "og:description").includes("Cartagena"),
    ],
    [
      "título propio",
      (d) => { d.compartir.titulo = "Nos casamos"; },
      (doc) => meta(doc, "og:title") === "Nos casamos",
    ],
    [
      "el alt de la foto sigue al título",
      (d) => {
        d.compartir.titulo = "Nos casamos";
        d.hero.backgroundUrl = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg";
      },
      (doc) => meta(doc, "og:image:alt") === "Nos casamos",
    ],
    [
      "texto propio",
      (d) => { d.compartir.texto = "Te esperamos en la hacienda"; },
      (doc) => meta(doc, "og:description") === "Te esperamos en la hacienda",
    ],
    [
      "foto propia, tal cual se subió",
      (d) => {
        d.hero.backgroundUrl = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg";
        d.compartir.imagen = "/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.jpg";
      },
      (doc) =>
        meta(doc, "og:image") ===
        "https://invita.test/api/media/2026/09/aaaaaaaaaaaaaaaaaaaaaaaa.jpg",
    ],
    [
      "sin foto propia cae en la portada",
      (d) => { d.hero.backgroundUrl = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg"; },
      (doc) => meta(doc, "og:image").includes("bbbb"),
    ],
    [
      "la dirección absoluta, que los rastreadores no resuelven relativas",
      () => {},
      (doc) => meta(doc, "og:url") === "https://invita.test/demo",
    ],
    [
      "los ángulos no se cuelan en un atributo",
      (d) => { d.compartir.titulo = 'Ana <script>alert(1)</script>'; },
      (doc) => !meta(doc, "og:title").includes("<"),
    ],
  ];

  for (const [nombre, toca, comprueba] of casos) {
    let ok = false;
    try {
      ok = comprueba(render(toca));
    } catch {
      ok = false;
    }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} al compartir · ${nombre}`);
  }
}

/* ── Que cada variante reciba de verdad lo que se escribió ───────
   Un fallo que estuvo callado: el marcado de una **variante** de bloque lo
   construimos nosotros y no lleva `data-inv-list` —ese atributo sólo existe
   en el esqueleto—, así que `applyList` no encontraba el contenedor y salía
   sin escribir nada. Las diez galerías alternas salían con los huecos de
   ejemplo en vez de con las fotos del organizador.

   No lo veía ninguna auditoría porque todas renderizaban con la variante del
   propio diseño, que sí trae los atributos. Así que aquí se prueban **todas**
   las variantes de todos los bloques que tienen lista. */
{
  const MARCA = "/api/media/2026/09/zzzzzzzzzzzzzzzzzzzzzzzz.jpg";
  const ejemplo: Record<string, Record<string, string>> = {
    gallery: { url: MARCA },
    events: { icon: "⛪", title: "MARCAeventoMARCA", time: "16:30", place: "Sitio", kind: "Tipo" },
    features: { icon: "✦", title: "MARCAdetalleMARCA", text: "Texto" },
    gifts: { title: "MARCAregaloMARCA", text: "Texto" },
    guests: { name: "MARCAinvitadoMARCA", role: "Madrina" },
  };

  for (const spec of BLOCKS) {
    const lista = spec.list || (spec.section ? SECTION_BY_KEY[spec.section]?.list : undefined);
    if (!lista) continue;
    const clave = spec.section || spec.type;
    const item = ejemplo[clave];
    /* Los invitados se vacían siempre a propósito: el nombre lo pone el
       enlace de cada familia, no el organizador. */
    if (!item || clave === "guests") continue;

    /* La clase con la que el marcado sintetizado declara su contenedor, tal
       como la conoce el mapa de bindings: así la regla no se desincroniza si
       un día cambia allí. */
    const contenedor = (mapFor(TEMPLATES[0].id).lists[clave]?.container || [])
      .find((c) => c.startsWith("."));

    const malas: string[] = [];
    const probadas: string[] = [];
    for (const v of spec.variants) {
      if (!v.build) continue;
      /* Una variante puede no dibujar la lista a propósito —"Sólo el mensaje"
         de la mesa de regalos es texto y un botón— y entonces no hay nada que
         exigirle. Lo que se comprueba es lo otro: que la que sí la dibuja no
         se quede con los huecos de ejemplo. */
      if (contenedor && !v.build().includes(contenedor.slice(1))) continue;
      probadas.push(v.id || "(la del diseño)");
      const d: any = defaultData();
      const items = [item, item, item];
      if (d[clave]) d[clave].items = items;
      d.layout = {
        blocks: [{ id: "x1", type: spec.type, variant: v.id, data: { enabled: true, items } }],
      };
      /* `preview` apaga las etiquetas Open Graph, y eso importa: sin él, la
         foto de la galería aparecía igual en `og:image` —cae en la primera
         foto de la galería cuando no hay portada— y la comprobación pasaba
         aunque la galería saliera vacía. */
      const html = renderInvitation({
        templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
        data: d, slug: "demo", preview: true,
      });
      const aguja = clave === "gallery" ? "zzzzzzzzzzzzzzzzzzzzzzzz" : "MARCA";
      if (!html.includes(aguja)) malas.push(v.id || "(la del diseño)");
    }
    if (malas.length) botonMal++;
    console.log(
      `${malas.length ? "✗" : "✓"} datos en las variantes · ${spec.label.padEnd(18)}` +
        (malas.length ? `  vacías: ${malas.join(", ")}` : `  ${probadas.length} con lista`)
    );
  }
}

console.log(
  bad || botonMal
    ? `\n${bad} diseños y ${botonMal} casos con problemas`
    : "\nTodos los diseños renderizan limpio"
);
if (bad || botonMal) process.exit(1);
