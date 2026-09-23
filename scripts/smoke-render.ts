/** Renderiza los 14 diseños con los datos por defecto y revisa lo básico. */
import fs from "fs";
import path from "path";
import { parseHTML } from "linkedom";
import { mapFor } from "../src/lib/bindings";
import { renderInvitation } from "../src/lib/render";
import { defaultData } from "../src/lib/schema";
import { TEMPLATES, readTemplate } from "../src/lib/templates";
import { BLOCKS } from "../src/lib/blocks";
import { SECTION_BY_KEY, SECTIONS } from "../src/lib/schema";

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

/* ── La capa detrás del texto ────────────────────────────────────
   Sobre un fondo cargado no hay color de letra que funcione en toda la
   superficie: lo que en una zona se lee, en la de al lado se pierde. La capa
   es lo que separa el texto de lo que pasa debajo. */
{
  const render = (data: Record<string, unknown>) => {
    const d: any = defaultData();
    d.layout = {
      blocks: [{ id: "p1", type: "paragraph", variant: "simple",
        data: { enabled: true, text: "Hola.", ...data } }],
    };
    return renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
  };
  const regla = (html: string) => (html.match(/#inv-p1 \.container\{[^}]*\}/) || [""])[0];

  const casos: [string, () => boolean][] = [
    ["sin color no hay capa", () => !regla(render({}))],
    ["un color inválido tampoco", () => !regla(render({ panelColor: "blanco" }))],
    [
      "con color, la capa lleva su transparencia dentro",
      () => regla(render({ panelColor: "#ffffff", panelOpacidad: "70" }))
        .includes("background:rgba(255,255,255,0.7)"),
    ],
    [
      "sin elegir transparencia, la de por defecto",
      () => regla(render({ panelColor: "#ffffff" })).includes("0.6"),
    ],
    /* Sin aire alrededor la capa se pega a las letras y se lee como un
       subrayado, no como un panel. */
    [
      "y trae aire y esquinas del diseño",
      () => {
        const r = regla(render({ panelColor: "#ffffff" }));
        return r.includes("padding:clamp(") && r.includes("border-radius:var(--radius)");
      },
    ],
    /* Va al contenedor: lo que hay que separar del fondo es el bloque entero
       —antetítulo, título y párrafo— y no cada renglón por su cuenta. */
    [
      "se aplica al contenedor, no a un renglón",
      () => regla(render({ panelColor: "#ffffff" })).startsWith("#inv-p1 .container{"),
    ],
  ];

  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} capa · ${nombre}`);
  }
}

/* ── Y la capa en TODAS las secciones, de TODOS los diseños ──────
   La capa nació en el bloque de párrafo, que es donde se vio el problema,
   y se quedó ahí. El error de eso: un fondo cargado no distingue entre
   secciones —lo pone quien lo pone en la invitación entera— así que la
   sección donde el texto no se leía podía ser justo la que no tenía el
   control.

   Lo que esta prueba vigila no es que la regla salga —eso ya lo mira el
   bloque de arriba— sino las dos formas de quedarse corto al repartirla:

   · **Que el esquema la ofrezca.** Los campos se añaden en un bucle, así
     que una sección nueva que caiga en la lista de excluidas se quedaría
     sin ellos y nadie se enteraría hasta que alguien la buscara.
   · **Que el selector encuentre a alguien.** Casi todas las secciones
     envuelven su texto en `.container`, pero el velo y la portada no. Con
     un `.container` a secas la regla se escribe igual, no da ningún error
     y no pinta nada — y son las dos secciones que más falta hacen, porque
     son las que llevan foto de fondo. */
{
  const mal: string[] = [];
  const conCapa = new Set(
    SECTIONS.filter((s) => s.fields.some((f) => f.key === "panelColor")).map((s) => s.key)
  );

  /* Las que no la llevan a propósito: no dibujan nada en la página. */
  const SIN_MARCADO = new Set([
    "event", "compartir", "marca", "particulas", "fondoGlobal",
  ]);
  for (const spec of SECTIONS) {
    if (SIN_MARCADO.has(spec.key) === conCapa.has(spec.key)) {
      mal.push(`el esquema: ${spec.key}`);
    }
  }

  for (const tpl of TEMPLATES) {
    const d: any = defaultData();
    for (const clave of conCapa) {
      d[clave] = { ...d[clave], panelColor: "#ffffff", panelOpacidad: "70" };
    }
    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo",
    });
    const doc = parseHTML(html).document;

    for (const clave of conCapa) {
      /* Una sección apagada o que este diseño no trae no tiene que pintar
         nada: lo que se persigue es la que está y se queda sin capa.

         Puede estar en dos sitios: en el marcado del diseño, o en la
         sección que sintetiza un bloque con variante propia —la que el
         diseño trae de fábrica, por ejemplo—. En ese caso la original
         queda oculta y la capa se escribe contra el id del bloque. */
      const original: any = doc.querySelector(`[data-inv-section="${clave}"]`);
      const bloque: any = doc.querySelector(`.inv-block-${clave}`);
      const oculta = original && original.getAttribute("hidden") !== null;
      const sec: any = oculta && bloque ? bloque : original;
      if (!sec) continue;
      const ambito = oculta && bloque ? `#${bloque.getAttribute("id")}` : `[data-inv-section="${clave}"]`;

      const regla = html
        .split("}")
        .find((b) => b.includes(ambito) &&
                     b.includes("background:rgba(255,255,255,0.7)"));
      if (!regla) { mal.push(`${tpl.id}/${clave}: sin regla`); continue; }

      const selector = regla.slice(0, regla.indexOf("{"));
      const dentro = selector.slice(selector.indexOf(" ") + 1).trim();
      if (!sec.querySelector(dentro)) {
        mal.push(`${tpl.id}/${clave}: ${dentro} no existe ahí`);
      }
    }
  }

  if (mal.length) botonMal++;
  console.log(
    `${mal.length ? "✗" : "✓"} capa · en todas las secciones de los ${TEMPLATES.length} diseños` +
      (mal.length
        ? `  ${mal.slice(0, 4).join(" · ")}` +
          (mal.length > 4 ? ` · y ${mal.length - 4} más` : "")
        : "")
  );
}

/* ── Ningún texto de muestra se queda puesto ─────────────────────
   El marcado de las variantes trae palabras de relleno —«Mensaje», «Texto»,
   «Título»— para que se vea la forma al elegirlas. Cuando el campo va vacío,
   el renderer tiene que quitar ese elemento.

   Se escapaba en silencio: la galería escribe su texto en `.section-body` en
   unas variantes y en `.gallery-text` en otras, y sólo la primera clase
   estaba apuntada en el mapa. Las demás no se tocaban nunca, así que la
   invitación se publicaba diciendo «Mensaje» como si lo hubiera escrito el
   organizador. No daba ningún error y no lo vio nadie hasta que un cliente
   lo leyó en su propia invitación.

   Se mira el bloque **construido**, no la sección original del diseño: una
   variante con marcado propio monta su elemento aparte y deja escondida la
   del template, que sigue teniendo sus textos de ejemplo. */
{
  const RELLENO = /^(Mensaje|Mensaje de cierre|Texto|Título|Antetítulo|Momento|Tipo|Hora|Lugar|Dirección|Nota)$/;
  const mal: string[] = [];

  for (const bloque of BLOCKS) {
    for (const v of bloque.variants) {
      const d: any = defaultData();
      /* Todos los textos de la sección, vacíos: es cuando el relleno se ve. */
      const clave = bloque.section || bloque.type;
      const spec = SECTION_BY_KEY[clave];
      if (spec) {
        const vacios: Record<string, unknown> = { enabled: true };
        for (const f of spec.fields) {
          if (f.type === "text" || f.type === "textarea") vacios[f.key] = "";
        }
        d[clave] = { ...d[clave], ...vacios };
      }
      /* Los bloques que sin contenido se esconden enteros —vídeo, foto,
         HTML— hay que darles el suyo: escondidos no enseñan su relleno, y
         probarlos vacíos daba por buenos justo los que fallaban. El bloque
         de HTML tenía «Antetítulo» y «Título» sin enlazar y así se publicó. */
      const conContenido: Record<string, Record<string, unknown>> = {
        html: { codigo: "<p>hola</p>" },
        video: { fuente: "subido", url: "https://ejemplo.test/v.mp4" },
        photo: { url: "https://ejemplo.test/f.jpg" },
        ubicacion: { mapa: "https://maps.example/x" },
      };
      d.layout = {
        blocks: [
          {
            id: "bl", type: bloque.type, variant: v.id,
            data: { enabled: true, ...(conContenido[bloque.type] || {}) },
          },
        ],
      };

      const html = renderInvitation({
        templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
        data: d, slug: "demo",
      });
      const doc = parseHTML(html).document;
      const caja: any =
        doc.querySelector("#inv-bl") || doc.querySelector(`[data-inv-section="${clave}"]`);
      if (!caja) continue;

      /* Oculto cuenta también si lo está un padre: un bloque de vídeo sin
         vídeo se esconde entero y sus textos de muestra no los ve nadie.
         Mirando sólo el elemento salían cuatro falsos positivos. */
      const escondido = (e: any): boolean => {
        for (let n = e; n && n !== caja.parentNode; n = n.parentNode) {
          if (n.hasAttribute?.("hidden")) return true;
          if (/display:\s*none/.test(n.getAttribute?.("style") || "")) return true;
        }
        return false;
      };
      const quedan = (Array.from(caja.querySelectorAll("*")) as any[]).filter(
        (e) => !e.children.length && !escondido(e) && RELLENO.test((e.textContent || "").trim())
      );
      if (quedan.length) {
        mal.push(`${bloque.label}/${v.name || "la del diseño"}: ${quedan
          .map((e) => `"${(e.textContent || "").trim()}"`)
          .slice(0, 2)
          .join(", ")}`);
      }
    }
  }

  if (mal.length) botonMal++;
  console.log(
    `${mal.length ? "✗" : "✓"} relleno · ninguna variante deja texto de muestra` +
      (mal.length
        ? `  ${mal.slice(0, 3).join(" · ")}` + (mal.length > 3 ? ` · y ${mal.length - 3} más` : "")
        : "")
  );
}

/* ── El itinerario ───────────────────────────────────────────────
   La variante nueva del programa: medallón con el icono, hilo vertical y a
   la derecha título, descripción y hora.

   Lo que se vigila es que el marcado que necesita el CSS esté en los 50 y
   que el orden de lectura lo ponga el CSS y no el marcado — la ficha viene
   con tipo, título, hora, lugar, nota y botón en ese orden, y un itinerario
   se lee título, descripción, hora. Si algún día alguien "ordena" el marcado
   creyendo que ayuda, esto lo dice. */
{
  const ITEMS = [
    { icon: "💍", title: "Ceremonia", note: "Comienzo de la ceremonia.", time: "4:00 p.m." },
    { icon: "🥂", title: "Recepción", note: "Bienvenida y cóctel.", time: "5:00 p.m." },
  ];
  const render = (tpl: string, items = ITEMS) => {
    const d: any = defaultData();
    d.events = { ...d.events, enabled: true, title: "Itinerario", items };
    d.layout = { blocks: [{ id: "ev", type: "events", variant: "itinerario" }] };
    return renderInvitation({
      templateHtml: readTemplate(tpl), templateId: tpl, data: d, slug: "demo",
    });
  };

  const mal: string[] = [];
  for (const tpl of TEMPLATES) {
    const doc = parseHTML(render(tpl.id)).document;
    const caja: any = doc.querySelector(".inv-ev-itinerario");
    if (!caja) { mal.push(`${tpl.id}: sin itinerario`); continue; }
    const fichas = caja.querySelectorAll(".event-card");
    if (fichas.length !== ITEMS.length) {
      mal.push(`${tpl.id}: ${fichas.length} fichas de ${ITEMS.length}`); continue;
    }
    for (const clase of ["event-icon", "event-title", "event-note", "event-time"]) {
      if (!fichas[0].querySelector("." + clase)) mal.push(`${tpl.id}: sin ${clase}`);
    }
    /* El icono llega como dibujo, no como el emoji escrito: un emoji suelto
       dentro de un medallón de 60px se ve de 26px y descentrado. */
    if (!fichas[0].querySelector(".event-icon svg")) mal.push(`${tpl.id}: el icono no es dibujo`);
  }

  if (mal.length) botonMal++;
  console.log(
    `${mal.length ? "✗" : "✓"} itinerario · el marcado está en los ${TEMPLATES.length} diseños` +
      (mal.length ? `  ${mal.slice(0, 3).join(" · ")}` +
        (mal.length > 3 ? ` · y ${mal.length - 3} más` : "") : "")
  );

  /* El documento entero y no «el primer <style>»: los templates traen sus
     propias hojas y el CSS inyectado va en otra, más abajo. Recortar por el
     primer cierre dejaba fuera justo lo que se quería mirar, y las tres
     comprobaciones fallaban por eso y no por el CSS. */
  const hoja = (html: string) => html;
  const casos: [string, () => boolean][] = [
    /* El orden lo pone el CSS. Sin esto se lee tipo, título, hora, lugar,
       nota — que es el orden de una ficha, no el de un itinerario. */
    ["el orden de lectura lo pone el CSS, no el marcado", () => {
      const css = hoja(render(TEMPLATES[0].id));
      return ["event-title{order:1", "event-note{order:2", "event-time{order:3"]
        .every((r) => css.includes(".inv-ev-itinerario .".concat(r)));
    }],
    ["un momento sin icono no deja un disco vacío",
      () => hoja(render(TEMPLATES[0].id)).includes(".inv-ev-itinerario .event-icon:empty{display:none}")],
    /* El medallón se tiñe con el acento, así que sigue a la paleta de cada
       diseño en vez de traer un verde escrito a mano que chocaría en 49. */
    ["el medallón se tiñe con el acento del diseño", () => {
      const css = hoja(render(TEMPLATES[0].id));
      const bloque = css.slice(css.indexOf(".inv-ev-itinerario .event-icon{"));
      return bloque.slice(0, bloque.indexOf("}")).includes("var(--inv-accent)");
    }],
  ];
  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} itinerario · ${nombre}`);
  }
}

/* ── La forma de los botones ─────────────────────────────────────
   Uno solo para los seis. Lo que se vigila es que de verdad los alcance a
   todos: la promesa del control es «todos a la vez», y un botón que se
   quedara cuadrado entre cinco redondos es peor que no tener el control,
   porque parece un fallo del diseño y no una casilla sin marcar. */
{
  const render = (btnForma: string) => {
    const d: any = defaultData();
    d.event = { ...d.event, btnForma };
    return renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
  };
  /* Todos los valores de la variable, en orden. Mirar «si aparece» no vale:
     el propio diseño ya la define en su `:root`, así que aparece siempre. Lo
     que decide es el último, que es el que gana en CSS — y contar cuántos hay
     es lo que distingue «no tocamos nada» de «escribimos encima». */
  const radios = (html: string) =>
    [...html.matchAll(/--btn-radius:\s*([^;}]+)/g)].map((m) => m[1].trim());

  const casos: [string, () => boolean][] = [
    ["sin elegir nada, sólo está el del diseño", () => radios(render("")).length === 1],
    ["un valor inventado tampoco añade nada", () => radios(render("ovalados")).length === 1],
    ["«píldora» los redondea del todo", () => {
      const r = radios(render("pildora"));
      return r.length === 2 && r[1] === "999px";
    }],
    /* Y la otra familia de botones.

       Los que inyecta el renderer —confirmar, rechazar, el formulario— leen
       `--inv-btn-radius`, un espejo de la otra para no depender del nombre
       que use cada diseño. Escribiendo sólo una, el botón de confirmar se
       quedaba cuadrado entre cinco redondos, que es peor que no tener el
       control: parece un fallo del diseño y no una casilla sin marcar. Y no
       se veía en la página de prueba, porque el RSVP no estaba encendido. */
    ["y también los que inyecta el renderer", () => {
      const html = render("pildora");
      const r = [...html.matchAll(/--inv-btn-radius:\s*([^;}]+)/g)].map((m) => m[1].trim());
      return r.length === 2 && r[1] === "999px";
    }],
    ["sin elegir nada, ésos tampoco se tocan", () => {
      const html = render("");
      return [...html.matchAll(/--inv-btn-radius:/g)].length === 1;
    }],
    ["«rectos» los deja a cero", () => {
      const r = radios(render("recto"));
      return r.length === 2 && r[1] === "0";
    }],
    ["y «suave» pone su medida", () => {
      const r = radios(render("suave"));
      return r.length === 2 && r[1] === "6px";
    }],
    /* El nuestro va después del de la paleta, o no ganaría.

       Se compara la posición de la primera aparición con la de la segunda, y
       no la del texto «999px» con la de la variable: el diseño de esta prueba
       ya usa píldora, así que buscar el valor encontraba el del diseño y la
       comprobación se creía cierta por el motivo contrario al que buscaba. */
    ["y el nuestro va después del del diseño, que es quien gana",
      () => {
        const html = render("recto");
        const donde = [...html.matchAll(/--btn-radius:/g)].map((m) => m.index!);
        return donde.length === 2 && donde[1] > donde[0];
      }],
    /* La comprobación que da sentido a las otras: que los seis botones del
       CSS lean esa variable. Si un diseño escribiera su radio a mano, la
       variable cambiaría y ese botón no. */
    [
      "los seis botones leen la variable, ninguno su propio radio",
      () => {
        const html = render("pildora");
        const hoja = html.slice(html.indexOf("<style"), html.indexOf("</style>"));
        const botones = [
          ".splash-btn", ".hero-btn", ".confirm-btn",
          ".gifts-btn", ".event-map-btn", ".social-ig",
        ];
        /* Cada bloque de reglas que nombre un botón y fije un radio propio
           —uno que no sea la variable— rompería la promesa. */
        return !hoja.split("}").some((bloque) => {
          const sel = bloque.slice(0, bloque.indexOf("{"));
          if (!botones.some((b) => sel.includes(b))) return false;
          const m = bloque.match(/border-radius:\s*([^;}]+)/);
          return !!m && !m[1].includes("--btn-radius");
        });
      },
    ],
  ];

  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} botones · ${nombre}`);
  }
}

/* ── Cómo entran las fichas ──────────────────────────────────────
   Lo de la sección y no de cada ficha: un programa tiene cinco tarjetas y
   nadie elige cinco veces lo mismo. Lo que se vigila aquí es el reparto —qué
   lado y qué turno le toca a cada una— y el orden con el que se hace, que es
   donde está el fallo fácil: `applyList` clona el prototipo del diseño para
   llegar al número de fichas, así que marcar antes de escribir marcaría el
   prototipo y cada clon se llevaría el atributo copiado. */
{
  const render = (animFichas: string, cuantas = 4, extra: any = {}) => {
    const d: any = defaultData();
    d.events = {
      ...d.events, enabled: true, animFichas, ...extra,
      items: Array.from({ length: cuantas }, (_, i) => ({
        time: `${i + 1}:00`, title: `Acto ${i + 1}`, text: "x",
      })),
    };
    const html = renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
    const sec: any = parseHTML(html).document.querySelector('[data-inv-section="events"]');
    const fichas = Array.from(sec.querySelectorAll("[data-inv-anim]")) as any[];
    return {
      html,
      lados: fichas.map((e) => e.getAttribute("data-inv-anim")),
      turnos: fichas.map((e) =>
        Number((e.getAttribute("style") || "").match(/--inv-anim-turno:(\d+)/)?.[1] ?? 0)
      ),
      marcadas: fichas.filter((e) => (e.getAttribute("class") || "").includes("inv-ficha-anim")).length,
    };
  };

  const casos: [string, () => boolean][] = [
    ["sin elegir nada, ninguna ficha se marca", () => render("").lados.length === 0],
    ["un valor inventado tampoco marca", () => render("volteretas").lados.length === 0],
    [
      "alternan derecha e izquierda, una por una",
      () => render("alterna").lados.join(",") === "derecha,izquierda,derecha,izquierda",
    ],
    /* Con una sola ficha entra por la derecha, que es lo mismo que haría
       "derecha": la alternancia no necesita un caso especial para el uno. */
    ["con una sola ficha, entra por la derecha", () => render("alterna", 1).lados.join(",") === "derecha"],
    ["si se elige un lado, van todas por él", () => render("izquierda").lados.join(",") === "izquierda,izquierda,izquierda,izquierda"],
    /* El turno va en ciclo de tres: el observador dispara cada ficha cuando
       ella entra en pantalla, y un turno creciente haría esperar a la séptima
       casi un segundo estando ya a la vista. */
    ["el turno va en ciclo de tres, no creciendo", () => render("alterna", 7).turnos.join(",") === "0,1,2,0,1,2,0"],
    ["cada ficha se marca para recorrer más que un renglón", () => render("alterna").marcadas === 4],
    /* Marcar antes de escribir marcaría el prototipo del diseño, y los clones
       saldrían todos con el lado y el turno de la primera. */
    ["se marcan las fichas ya clonadas, no el molde", () => {
      const r = render("alterna", 6);
      return r.lados.length === 6 && new Set(r.lados).size === 2;
    }],
    /* Se busca la consulta que sólo hace este guion, y no "IntersectionObserver"
       a secas: el guion de la cuenta atrás que traen los diseños también usa
       uno, así que las dos comprobaciones —viaja y no viaja— pasaban por el
       motivo equivocado y la segunda ni siquiera podía pasar. */
    ["y viaja el guion que las hace entrar",
      () => render("alterna").html.includes("querySelectorAll('[data-inv-anim]')")],
    /* El CSS de las entradas viaja siempre —es parte de la hoja inyectada—
       así que lo que dice si algo se anima o no es el guion, que sólo se
       añade cuando hay un elemento marcado. */
    ["sin nada animado, el guion no viaja",
      () => !render("").html.includes("querySelectorAll('[data-inv-anim]')")],
  ];

  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} fichas · ${nombre}`);
  }
}

/* ── Los nombres, sitio por sitio ────────────────────────────────
   `event.names` los escribe en el velo, la portada y el pie a la vez. Estos
   tres campos se superponen, y lo que hay que vigilar es lo de siempre con un
   campo que se superpone: que **vacío no borre**. La regla general del
   renderer es que un campo sin valor quita su elemento, y aquí eso dejaría la
   invitación sin nombres en cuanto alguien abriera el campo y no escribiera. */
{
  const sitios: [string, string, string][] = [
    ["velo", "splash", ".splash-name"],
    ["portada", "hero", ".hero-name"],
    ["pie", "footer", ".footer-names"],
  ];

  const render = (toca: (d: any) => void) => {
    const d: any = defaultData();
    d.event = { ...d.event, name1: "Ana", name2: "Luis" };
    toca(d);
    return parseHTML(
      renderInvitation({
        templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
        data: d, slug: "demo",
      })
    ).document;
  };
  const texto = (doc: any, sel: string) =>
    (doc.querySelector(sel)?.textContent || "").replace(/\s+/g, " ").trim();

  for (const [nombre, clave, sel] of sitios) {
    const mal: string[] = [];

    /* Sin tocarlo, los del evento. */
    const base = render(() => {});
    if (!texto(base, sel).includes("Ana")) mal.push("no trae los del evento");

    /* Vacío tampoco lo toca — el caso que la regla general rompería. */
    const vacio = render((d) => { d[clave] = { ...d[clave], nombres: "" }; });
    if (!texto(vacio, sel).includes("Ana")) mal.push("vaciarlo borró los nombres");

    /* Con valor, manda el suyo, y sin arrastrar el ampersand de antes. */
    const propio = render((d) => { d[clave] = { ...d[clave], nombres: "Los dos" }; });
    if (texto(propio, sel) !== "Los dos") mal.push(`quedó "${texto(propio, sel)}"`);

    /* Y sólo el suyo: los otros dos siguen con los del evento. */
    for (const [, otraClave, otroSel] of sitios) {
      if (otraClave === clave) continue;
      if (!texto(propio, otroSel).includes("Ana")) mal.push(`también cambió ${otroSel}`);
    }

    /* Aunque se deje vacío, su color tiene que llegar: poder teñir el nombre
       de un sitio sin teñir el de los otros dos es la mitad de por qué el
       campo existe.

       Y llegar no basta — tiene que llegar **acotado**. Que la regla salga en
       el HTML no dice nada sobre a quién alcanza: un selector sin la sección
       delante teñiría los tres nombres a la vez, que es justo la queja que
       trajo aquí ("el mismo color no funciona en todas"). Así que se
       comprueba el selector, no la presencia.

       Sobre los 50 y no sobre el primero: el reparto del marcado es de cada
       diseño, y un diseño que sacara el pie de su sección rompería el
       acotado sin que el primero se enterara. */
    for (const tpl of TEMPLATES) {
      const conColor: any = defaultData();
      conColor[clave] = { ...conColor[clave], colors: { nombres: "#00aa44" } };
      const html = renderInvitation({
        templateHtml: readTemplate(tpl.id), templateId: tpl.id,
        data: conColor, slug: "demo",
      });

      const regla = html
        .split(/[}\n]/)
        .find((l) => l.includes("color:#00aa44"));
      if (!regla) { mal.push(`${tpl.id}: el color no llega`); continue; }

      const selector = regla.slice(0, regla.indexOf("{"));
      if (!selector.includes(`[data-inv-section="${clave}"]`)) {
        mal.push(`${tpl.id}: sin acotar (${selector.trim()})`);
      }
      for (const [, otraClave, otroSel] of sitios) {
        if (otraClave === clave) continue;
        if (selector.includes(otroSel)) mal.push(`${tpl.id}: alcanza ${otroSel}`);
      }

      /* Y el elemento vive de verdad dentro de esa sección: un selector
         acotado sobre marcado mal repartido no pinta nada. */
      const doc = parseHTML(html).document;
      const el: any = doc.querySelector(sel);
      if (!el) mal.push(`${tpl.id}: no existe ${sel}`);
      else if (!el.closest(`[data-inv-section="${clave}"]`)) {
        mal.push(`${tpl.id}: ${sel} está fuera de ${clave}`);
      }
    }

    if (mal.length) botonMal++;
    /* Un fallo de reparto lo tienen los 50 a la vez —el marcado sale del
       mismo esqueleto—, así que listarlos entero tapa el resto del informe.
       Tres ejemplos dicen lo mismo y caben en la pantalla. */
    console.log(
      `${mal.length ? "✗" : "✓"} nombres · ${nombre.padEnd(10)}` +
        (mal.length
          ? `  ${mal.slice(0, 3).join(" · ")}` +
            (mal.length > 3 ? ` · y ${mal.length - 3} más` : "")
          : "")
    );
  }
}

/* ── Que lo que el renderer entiende se pueda elegir ──────────────
   Esta comprobación existe por un fallo real: el color sólido de sección
   funcionaba en el renderer, tenía sus pruebas en verde y **no aparecía en el
   editor**, porque los campos nunca llegaron al esquema. Las pruebas pasaban
   porque escriben el dato a mano, que es justo el camino que no existe para
   quien usa la aplicación.

   Así que se mira lo otro: que el esquema declare el campo. Un renderer que
   entiende algo que nadie puede elegir es código muerto con pruebas. */
{
  const declara = (seccion: string, clave: string) =>
    (SECTION_BY_KEY[seccion]?.fields || []).some((f) => f.key === clave);
  const declaraFicha = (seccion: string, clave: string) =>
    (SECTION_BY_KEY[seccion]?.list?.fields || []).some((f) => f.key === clave);

  const casos: [string, boolean][] = [
    ["el color de fondo de una sección se puede elegir", declara("gallery", "fondoColor")],
    ["y en todas las que aceptan fondo", SECTIONS.filter((s) => s.fondo)
      .every((s) => s.fields.some((f) => f.key === "fondoColor"))],
    ["el color de una ficha del programa", declaraFicha("events", "fondoColor")],
    ["su transparencia", declaraFicha("events", "fondoOpacidad")],
    ["y lo mismo en información útil", declaraFicha("features", "fondoColor")],
    ["el color de los botones", declara("event", "btnColor")],
    ["y el de su texto", declara("event", "btnInk")],
  ];

  for (const [nombre, ok] of casos) {
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} elegible · ${nombre}`);
  }
}

/* ── Colores sólidos ─────────────────────────────────────────────
   Tres sitios donde se puede pintar sin subir nada: el fondo de una sección,
   el de una ficha y los botones. El de los botones es el que más podía
   fallar: no se persigue clase por clase, se reescriben las variables de las
   que salen todos. */
{
  const render = (toca: (d: any) => void) => {
    const d: any = defaultData();
    d.events.items = [{ icon: "⛪", title: "Uno" }, { icon: "🥂", title: "Dos" }];
    toca(d);
    const html = renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
    return { html, doc: parseHTML(html).document };
  };

  const casos: [string, (d: any) => void, (r: any) => boolean][] = [
    [
      "una sección con sólo color, sin imagen",
      (d) => { d.gallery = { ...d.gallery, fondoColor: "#00aa44" }; },
      ({ doc }) => {
        const capa = doc.querySelector("#gallery > .inv-fondo") as any;
        const st = String(capa?.getAttribute("style") || "");
        return st.includes("background:#00aa44") && !st.includes("background-image");
      },
    ],
    [
      "y con imagen, el color queda debajo",
      (d) => {
        d.gallery = {
          ...d.gallery, fondoColor: "#00aa44",
          fondoUrl: "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg",
        };
      },
      ({ doc }) => {
        const st = String((doc.querySelector("#gallery > .inv-fondo") as any)?.getAttribute("style") || "");
        /* `background-color` y `background-image` en la misma capa: el
           navegador pinta el color debajo. */
        return st.includes("background-color:#00aa44") && st.includes("background-image");
      },
    ],
    [
      "un color inválido no pinta nada",
      (d) => { d.gallery = { ...d.gallery, fondoColor: "verde" }; },
      ({ doc }) => !doc.querySelector("#gallery > .inv-fondo"),
    ],
    /* La transparencia va dentro del color y no en un `opacity` sobre la
       caja, que se llevaría también el texto de la ficha. */
    [
      "la ficha lleva su color con la transparencia dentro",
      (d) => { d.events.items[0] = { ...d.events.items[0], fondoColor: "#aa0066", fondoOpacidad: "50" }; },
      ({ doc }) => {
        const st = String((doc.querySelector(".inv-ficha-fondo") as any)?.getAttribute("style") || "");
        return st.includes("--inv-ff-color:rgba(170,0,102,0.5)") && !st.includes("opacity:");
      },
    ],
    [
      "y sin imagen se apaga el velo, para que el color se vea tal cual",
      (d) => { d.events.items[0] = { ...d.events.items[0], fondoColor: "#aa0066" }; },
      ({ doc }) => String((doc.querySelector(".inv-ficha-fondo") as any)?.getAttribute("style")).includes("--inv-ff-velo:0"),
    ],
    [
      "sólo la ficha que lo tiene",
      (d) => { d.events.items[0] = { ...d.events.items[0], fondoColor: "#aa0066" }; },
      ({ doc }) => doc.querySelectorAll(".event-card.inv-ficha-fondo").length === 1,
    ],
    /* Los botones salen todos de `--accent`: se reescribe esa y no sus clases. */
    [
      "el color de los botones reescribe el acento",
      (d) => { d.event = { ...d.event, btnColor: "#0055ff", btnInk: "#ffee00" }; },
      ({ html }) => /:root\{[^}]*--accent:#0055ff/.test(html) &&
        /--on-accent:#ffee00/.test(html),
    ],
    [
      "y sin elegirlo no se toca la paleta",
      () => {},
      ({ html }) => !/:root\{--accent:#/.test(html.replace(/--accent:[^;]*;--hero/g, "")),
    ],
  ];

  for (const [nombre, toca, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(render(toca)); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} sólido · ${nombre}`);
  }
}

/* ── El fondo propio de cada ficha ───────────────────────────────
   Es por ficha y no por sección, así que lo que hay que comprobar es que una
   con fondo no se lo pegue a sus vecinas — que es lo que pasaría si esto se
   resolviera con una regla de CSS sobre la lista. */
{
  const IMG = "/api/media/2026/09/bbbbbbbbbbbbbbbbbbbbbbbb.jpg";

  const render = (toca: (d: any) => void) => {
    const d: any = defaultData();
    d.events.items = [
      { icon: "⛪", title: "Ceremonia", time: "16:30" },
      { icon: "🥂", title: "Fiesta", time: "19:00" },
    ];
    d.features.items = [{ icon: "✨", title: "Uno", text: "a" }, { icon: "✨", title: "Dos", text: "b" }];
    toca(d);
    return parseHTML(
      renderInvitation({
        templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
        data: d, slug: "demo",
      })
    ).document;
  };

  const casos: [string, (d: any) => void, (doc: any) => boolean][] = [
    ["sin fondo ninguna ficha lo lleva", () => {}, (doc) => !doc.querySelector(".inv-ficha-fondo")],
    [
      "sólo la ficha que lo tiene",
      (d) => { d.events.items[0].fondo = IMG; },
      (doc) => doc.querySelectorAll(".event-card.inv-ficha-fondo").length === 1 &&
        doc.querySelectorAll(".event-card").length === 2,
    ],
    [
      "la imagen y el velo viajan en variables",
      (d) => { d.events.items[0].fondo = IMG; d.events.items[0].fondoVelo = "30"; },
      (doc) => {
        const st = String(doc.querySelector(".inv-ficha-fondo")?.getAttribute("style") || "");
        return st.includes("--inv-ff-img:url(") && st.includes("--inv-ff-velo:0.3");
      },
    ],
    [
      "sin velo elegido, el de por defecto",
      (d) => { d.events.items[0].fondo = IMG; },
      (doc) => String(doc.querySelector(".inv-ficha-fondo")?.getAttribute("style")).includes("--inv-ff-velo:0.45"),
    ],
    [
      "las de información útil también",
      (d) => { d.features.items[1].fondo = IMG; },
      (doc) => doc.querySelectorAll(".feature-card.inv-ficha-fondo").length === 1,
    ],
    /* Las dos listas son independientes: poner fondo en el programa no puede
       pintar las de información. */
    [
      "una lista no contagia a la otra",
      (d) => { d.events.items[0].fondo = IMG; },
      (doc) => doc.querySelectorAll(".feature-card.inv-ficha-fondo").length === 0,
    ],
  ];

  for (const [nombre, toca, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(render(toca)); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} ficha · ${nombre}`);
  }
}

/* ── Cómo entra la foto en una ficha ─────────────────────────────
   Por defecto cubre, que llena la tarjeta recortando. Con una ilustración
   vertical —un vestido, un ramo— eso corta justo lo que se quería enseñar,
   y desde la imagen no hay arreglo posible: tiene que poder elegirse. */
{
  const conFicha = (extra: Record<string, string>) => {
    const d: any = defaultData();
    d.features = {
      ...d.features, enabled: true,
      items: [{ icon: "★", title: "Uno", text: "x", fondo: "https://x/f.jpg", ...extra }],
    };
    const html = renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
    const el: any = parseHTML(html).document.querySelector(
      '[data-inv-section="features"] .inv-ficha-fondo'
    );
    return el ? el.getAttribute("style") || "" : "";
  };

  const casos: [string, () => boolean][] = [
    ["por defecto la foto cubre la ficha", () => !conFicha({}).includes("--inv-ff-size")],
    ["«entera» la mete sin recortar", () => conFicha({ fondoAjuste: "entera" }).includes("--inv-ff-size:contain")],
    ["un ajuste inventado se ignora y sigue cubriendo",
      () => !conFicha({ fondoAjuste: "de lado" }).includes("--inv-ff-size")],
    ["el alto mínimo le da aire a la foto",
      () => conFicha({ fondoAlto: "260" }).includes("--inv-ff-alto:260px")],
    ["sin alto mínimo la ficha mide lo que pida el texto",
      () => !conFicha({ fondoAlto: "0" }).includes("--inv-ff-alto")],
    /* Un alto disparatado estiraría la tarjeta fuera de la pantalla. */
    ["y un alto disparatado se recorta al tope",
      () => conFicha({ fondoAlto: "9000" }).includes("--inv-ff-alto:360px")],
  ];
  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} ficha · ${nombre}`);
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
      "imagen propia sin imagen no pone capa",
      { enabled: true, tipo: "imagen", pieza: "" },
      (_c, doc) => !doc.querySelector(".inv-particulas"),
    ],
    [
      "los farolillos suben, cada uno con su imagen",
      { enabled: true, tipo: "imagen", pieza: "/api/media/2026/09/farol.png", cantidad: "10" },
      (c) => String(c.getAttribute("class")).includes("inv-pt-sube") &&
        c.querySelectorAll("img").length === 10 &&
        String(c.querySelector("img").getAttribute("src")).endsWith("farol.png?w=400") &&
        !c.querySelector("svg"),
    ],
    [
      "y el rumbo decide hacia dónde",
      { enabled: true, tipo: "imagen", pieza: "https://x.test/a.png", rumbo: "cae" },
      (c) => String(c.getAttribute("class")).includes("inv-pt-cae"),
    ],
    [
      "un rumbo inventado vuelve a subir",
      { enabled: true, tipo: "imagen", pieza: "https://x.test/a.png", rumbo: "de lado" },
      (c) => String(c.getAttribute("class")).includes("inv-pt-sube"),
    ],
    [
      "una imagen propia apenas se ladea, no da vueltas",
      { enabled: true, tipo: "imagen", pieza: "https://x.test/a.png", cantidad: "30" },
      (c) => Array.from(c.children).every((i: any) => {
        const g = Number(/--inv-pt-giro:(-?\d+)deg/.exec(i.getAttribute("style"))?.[1]);
        return Math.abs(g) <= 8;
      }),
    ],
    [
      "por los bordes, el centro queda libre",
      { enabled: true, tipo: "petalos", zona: "bordes", cantidad: "40" },
      (c) => Array.from(c.children).every((i: any) => {
        const x = Number(/left:(-?[\d.]+)%/.exec(i.getAttribute("style"))?.[1]);
        return x < 15 || x > 83;
      }),
    ],
    [
      "unas comillas en la URL no rompen el atributo",
      { enabled: true, tipo: "imagen", pieza: 'https://x.test/a.png" onerror="alert(1)' },
      (c) => !c.querySelector("img").getAttribute("onerror"),
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

/* ── Los componentes interactivos ────────────────────────────────
   Sobre con sello, cuenta atrás de paletas, fichas que se voltean,
   «Agendar» y polvo de oro. Se comprueba en los 52 que el marcado sale y
   que el script que lo mueve va con él: un componente sin su script es un
   sobre que no se abre, que es peor que no tener sobre. */
{
  const conScript = (doc: any, trozo: string) =>
    Array.from(doc.querySelectorAll("script")).some((x: any) => String(x.textContent).includes(trozo));
  /* El cuarto valor, opcional, son los pases del enlace por el que se entró:
     no salen de los datos de la invitación sino del link personalizado. */
  const casos: [string, (d: any) => void, (doc: any) => boolean, number?][] = [
    ["sobre con sello: el sobre, el nombre y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "sello" }; d.event.name1 = "Valentina"; },
      (doc) => !!doc.querySelector("#splash [data-inv-sobre]") &&
        String(doc.querySelector(".inv-sobre-nombre")?.textContent).includes("Valentina") &&
        doc.querySelector(".inv-sobre-sello")?.textContent.trim() === "V" &&
        conScript(doc, "data-inv-sobre") && conScript(doc, "invEstallar")],
    ["sobre con sello y su imagen",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "sello", sello: "/api/media/2026/09/s.png" }; },
      (doc) => String(doc.querySelector(".inv-sobre-sello.con-imagen")?.getAttribute("style")).includes("s.png?w=400")],
    ["sin apertura de sello no hay sobre ni su script",
      () => {},
      (doc) => !doc.querySelector("[data-inv-sobre]") && !conScript(doc, "data-inv-sobre')")],
    ["cuenta atrás de paletas, con sus cuatro números",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "paletas" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-paletas [data-cd]").length === 4],
    ["fichas que se voltean: título delante, texto detrás, y su script",
      (d) => {
        d.layout = { blocks: [{ id: "features-0", type: "features", variant: "voltea" }] };
        d.features = { ...d.features, enabled: true, items: [{ icon: "✦", title: "Ellas", text: "Vestido largo" }] };
      },
      (doc) => doc.querySelector(".inv-fe-voltea .inv-cara-frente .feature-title")?.textContent.trim() === "Ellas" &&
        doc.querySelector(".inv-fe-voltea .inv-cara-dorso .feature-text")?.textContent.trim() === "Vestido largo" &&
        conScript(doc, "inv-fe-voltea")],
    ["ubicación sin texto de calendario: sin botón",
      (d) => { d.layout = { blocks: [{ id: "u-1", type: "ubicacion", variant: "ficha", data: { place: "Salón" } }] }; },
      (doc) => !doc.querySelector("[data-inv-agendar]")],
    ["ubicación con «Agendar»: fecha, título y lugar",
      (d) => {
        d.event.date = "2027-03-14T19:00"; d.event.name1 = "Valentina"; d.splash = { ...d.splash, label: "Mis XV años" };
        d.layout = { blocks: [{ id: "u-1", type: "ubicacion", variant: "ficha",
          data: { place: "Hacienda", address: "Km 5", calendarText: "Agendar" } }] };
      },
      (doc) => {
        const b = doc.querySelector("[data-inv-agendar]");
        return !!b && b.getAttribute("data-inicio") === "2027-03-14T19:00" &&
          String(b.getAttribute("data-titulo")).includes("Valentina") &&
          b.getAttribute("data-lugar") === "Hacienda, Km 5" && conScript(doc, "data-inv-agendar");
      }],
    ["libro de cuentos: tapa, página con el nombre y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "libro" }; d.event.name1 = "Camila"; },
      (doc) => !!doc.querySelector("#splash.inv-velo-libro [data-inv-libro] .inv-libro-tapa") &&
        String(doc.querySelector(".inv-libro-nombre")?.textContent).includes("Camila") &&
        conScript(doc, "data-inv-libro")],
    ["y con su tapa propia",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "libro", sello: "/api/media/2026/09/t.png" }; },
      (doc) => String(doc.querySelector(".inv-libro-tapa")?.getAttribute("style")).includes("t.png?w=800")],
    /* El telón se llamó .inv-cortina un rato, que ya era la cortina de
       vídeo: su script buscaba el vídeo dentro y reventaba, y con todos los
       scripts en un mismo bloque se llevaba por delante a los demás. */
    ["telón: dos cortinas, el galón y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "telon" }; },
      (doc) => doc.querySelectorAll("#splash.inv-velo-telon .inv-telon").length === 2 &&
        !!doc.querySelector("#splash .inv-telon-galon") && conScript(doc, "inv-velo-telon")],
    ["y no lo confunde la cortina de vídeo",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "telon" }; },
      (doc) => !doc.querySelector(".inv-telon.inv-cortina")],
    ["galería en carrusel: las fotos, el sitio de los puntos y su script",
      (d) => {
        d.layout = { blocks: [{ id: "gallery-0", type: "gallery", variant: "carrusel" }] };
        d.gallery = { ...d.gallery, enabled: true, items: [{ url: "/api/media/2026/09/a.jpg" }, { url: "/api/media/2026/09/b.jpg" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ga-carrusel .gallery-item").length === 2 &&
        !!doc.querySelector(".inv-ga-carrusel + .inv-puntos") && conScript(doc, "inv-ga-carrusel")],
    ["nubes: las dos que se abren, la pista y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "nubes" }; },
      (doc) => doc.querySelectorAll("#splash.inv-velo-nubes .inv-nube").length === 2 &&
        !!doc.querySelector("#splash .inv-sobre-pista") && conScript(doc, "inv-velo-nubes")],
    ["abanico: la hoja, el nombre y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "abanico" }; d.event.name1 = "Mariana"; },
      (doc) => !!doc.querySelector("#splash.inv-velo-abanico [data-inv-abanico] .inv-abanico-hoja") &&
        String(doc.querySelector(".inv-abanico-nombre")?.textContent).includes("Mariana") &&
        conScript(doc, "data-inv-abanico")],
    ["programa por capítulos: el número es el ícono, y su script",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "capitulos" }] };
        d.events = { ...d.events, enabled: true, items: [
          { icon: "I", kind: "Recepción", title: "Bienvenida", time: "7:00" },
          { icon: "II", kind: "Vals", title: "El baile", time: "8:00" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ev-capitulos .event-card").length === 2 &&
        doc.querySelector(".inv-ev-capitulos .event-icon")?.textContent.trim() === "I" &&
        conScript(doc, "inv-ev-capitulos")],
    ["pide un deseo: la pista, la estrella fugaz y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "deseo" }; },
      (doc) => !!doc.querySelector("#splash.inv-velo-deseo .inv-deseo-pista") &&
        conScript(doc, "invFugaz") && conScript(doc, "inv-velo-deseo')")],
    ["cielo estrellado: un canvas con muchas estrellas",
      (d) => { d.particulas = { enabled: true, tipo: "cielo", cantidad: "20" }; },
      (doc) => doc.querySelector("div.inv-cielo")?.getAttribute("data-n") === "160" &&
        !doc.querySelector(".inv-particulas") && conScript(doc, "inv-cielo")],
    ["cuenta atrás en órbitas, con su aro que se vacía",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "orbitas" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-orbitas [data-cd-ring] [data-cd]").length === 4],
    ["programa en constelación: una estrella por momento y su script",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "constelacion" }] };
        d.events = { ...d.events, enabled: true, items: [
          { kind: "Recepción", title: "Bienvenida", time: "7:00" },
          { kind: "Vals", title: "El baile", time: "8:00" },
          { kind: "Cena", title: "En familia", time: "9:00" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ev-constelacion .event-card .inv-luz").length === 3 &&
        !!doc.querySelector(".inv-ev-constelacion .inv-traza path") &&
        doc.querySelector(".inv-ev-constelacion .inv-dato .event-type")?.textContent.trim() === "Recepción" &&
        conScript(doc, "inv-ev-constelacion")],
    ["programa en sendero: el camino, la luciérnaga, una parada por momento y su script",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "sendero" }] };
        d.events = { ...d.events, enabled: true, items: [
          { icon: "iglesia", kind: "Misa", title: "Acción de gracias", time: "5:00" },
          { kind: "Vals", title: "El baile", time: "8:00" },
          { kind: "Cena", title: "En familia", time: "9:00" }] };
      },
      /* Tres paradas aunque sólo el primero traiga ícono: sin ícono el
         renderer borra el .event-icon, y la parada no puede depender de él. */
      (doc) => doc.querySelectorAll(".inv-ev-sendero .event-card > .inv-parada").length === 3 &&
        !!doc.querySelector(".inv-ev-sendero .inv-parada .event-icon svg") &&
        doc.querySelectorAll(".inv-ev-sendero .inv-senda path").length === 2 &&
        !!doc.querySelector(".inv-ev-sendero .inv-luciernaga") &&
        doc.querySelector(".inv-ev-sendero .inv-dato .event-type")?.textContent.trim() === "Misa" &&
        conScript(doc, "inv-ev-sendero")],
    ["programa en viaje: el viajero, una parada por momento y su script",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "viaje" }] };
        d.events = { ...d.events, enabled: true, items: [
          { icon: "iglesia", kind: "Misa", title: "Acción de gracias", time: "5:00" },
          { kind: "Vals", title: "El baile", time: "8:00" }, { kind: "Cena", title: "En familia", time: "9:00" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ev-viaje .event-card > .inv-hito").length === 3 &&
        !!doc.querySelector(".inv-ev-viaje > .inv-viajero") &&
        doc.querySelector(".inv-ev-viaje .inv-dato .event-type")?.textContent.trim() === "Misa" &&
        conScript(doc, "inv-ev-viaje")],
    ["ventana: los dos postigos, la pista y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "ventana" }; },
      (doc) => doc.querySelectorAll("#splash.inv-velo-ventana .inv-postigo").length === 2 &&
        conScript(doc, "inv-velo-ventana")],
    ["claqueta: la tabla, el palo y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "claqueta" }; },
      (doc) => !!doc.querySelector("#splash.inv-velo-claqueta .inv-claqueta .inv-claqueta-palo") &&
        conScript(doc, "inv-velo-claqueta")],
    ["cuenta atrás de marquesina, con sus cuatro números",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "marquesina" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-marquesina [data-cd]").length === 4],
    ["programa en cinta: un fotograma por momento y su script",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "cinta" }] };
        d.events = { ...d.events, enabled: true, items: [
          { kind: "Misa", title: "Acción de gracias", time: "5:00" }, { kind: "Vals", title: "El baile", time: "8:00" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ev-cinta .event-card").length === 2 && conScript(doc, "inv-ev-cinta")],
    ["programa en postales: una estampilla por momento, con ícono o sin él",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "postales" }] };
        d.events = { ...d.events, enabled: true, items: [
          { icon: "iglesia", kind: "Misa", title: "Acción de gracias", time: "5:00" },
          { kind: "Vals", title: "El baile", time: "8:00" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ev-postales .event-card > .inv-estampilla").length === 2 &&
        !!doc.querySelector(".inv-estampilla .event-icon svg") && conScript(doc, "inv-ev-postales")],
    ["mariposa: las dos alas, la pista y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "mariposa" }; },
      (doc) => doc.querySelectorAll("#splash.inv-velo-mariposa .inv-mariposa .inv-ala").length === 2 &&
        conScript(doc, "inv-velo-mariposa")],
    ["cuenta atrás con alas, con sus cuatro números",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "alas" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-alas [data-cd]").length === 4],
    ["partículas que revolotean: la clase y su imagen",
      (d) => { d.particulas = { enabled: true, tipo: "imagen", pieza: "/api/media/2026/09/m.png", rumbo: "revolotea", cantidad: "8" }; },
      (doc) => doc.querySelectorAll(".inv-particulas.inv-pt-revolotea i img").length === 8],
    ["escarcha: la capa de hielo, la pista y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "escarcha" }; },
      (doc) => !!doc.querySelector("#splash.inv-velo-escarcha .inv-escarcha") && conScript(doc, "inv-velo-escarcha")],
    ["cuenta atrás de cristales, con sus cuatro números",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "cristales" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-cristales [data-cd]").length === 4],
    ["naipe: las dos esquinas, el dorso y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "naipe" }; },
      /* Las dos esquinas, hermanas y no una dentro de la otra: en producción
         llegó a salir la de abajo anidada en la de arriba. */
      (doc) => doc.querySelectorAll("#splash.inv-velo-naipe .splash-modal > .inv-naipe-esq").length === 2 &&
        !doc.querySelector(".inv-naipe-esq .inv-naipe-esq") &&
        !!doc.querySelector("#splash .inv-naipe-dorso") && conScript(doc, "inv-velo-naipe")],
    ["cuenta atrás de reloj de bolsillo, con sus cuatro manecillas",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "bolsillo" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-bolsillo [data-cd-ring] [data-cd]").length === 4],
    ["programa en naipes: una carta por momento y su script",
      (d) => {
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "naipes" }] };
        d.events = { ...d.events, enabled: true, items: [
          { kind: "Misa", title: "Acción de gracias", time: "5:00" }, { kind: "Vals", title: "El baile", time: "8:00" }] };
      },
      (doc) => doc.querySelectorAll(".inv-ev-naipes .event-card").length === 2 && conScript(doc, "inv-ev-naipes")],
    ["jardín: las dos matas, la mariposa y el script de la mariposa",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "jardin" }; },
      (doc) => doc.querySelectorAll("#splash.inv-velo-jardin .inv-jardin").length === 2 &&
        doc.querySelectorAll("#splash.inv-velo-jardin .inv-mariposa .inv-ala").length === 2 &&
        conScript(doc, "inv-velo-jardin")],
    ["una variante se escribe dentro de la sección del diseño, no al lado",
      (d) => { d.layout = { blocks: [{ id: "events-0", type: "events", variant: "cinta" }] };
        d.events = { ...d.events, enabled: true, items: [{ kind: "Misa", title: "Ceremonia", time: "5:00" }] }; },
      (doc) => {
        /* La sección de siempre sigue ahí, con su id, y ahora lleva dentro el
           marcado de la variante: es lo que deja que el CSS del diseño —que
           estila por #events— siga alcanzándola. */
        const dentro = doc.querySelector("#events .inv-ev-cinta, #events.inv-block-events .inv-ev-cinta");
        const suelta = doc.querySelector("section.inv-block-events:not(#events)");
        return (!!dentro || !!suelta) && !doc.querySelector("#events[hidden]");
      }],
    ["los adornos del diseño nacen en los datos, no en el CSS",
      () => {},
      (doc) => {
        /* Rosalila trae cinco; aquí se comprueba que lleguen al marcado como
           adornos de verdad —con su caja y su sitio—, que es lo que el editor
           arrastra. En los demás diseños no hay ninguno y la prueba se salta
           sola, que es lo correcto: declararlos es opcional. */
        const puestos = doc.querySelectorAll("#splash .inv-adorno, #hero .inv-adorno, footer .inv-adorno");
        return puestos.length === 0 || puestos.length === 5;
      }],
    ["portada sin texto: la tapa se queda, el bloque de texto no",
      (d) => { d.hero = { ...d.hero, enabled: true, contenido: "limpia" }; },
      (doc) => {
        const hero: any = doc.querySelector("#hero");
        return !!hero && /hero-limpia/.test(hero.getAttribute("class") || "") &&
          !!doc.querySelector("#hero .hero-scroll");
      }],
    ["y con la portada de siempre no se marca nada",
      (d) => { d.hero = { ...d.hero, enabled: true }; },
      (doc) => !doc.querySelector("#hero.hero-limpia")],
    ["galería tres y dos: cinco fotos, tres arriba y dos abajo",
      (d) => { d.layout = { blocks: [{ id: "gallery-0", type: "gallery", variant: "tresydos" }] }; },
      (doc) => doc.querySelectorAll(".inv-ga-tresydos .gallery-item").length === 5],
    ["galería en papel rasgado: cuatro fotos, cada una con su máscara",
      (d) => { d.layout = { blocks: [{ id: "gallery-0", type: "gallery", variant: "rasgada" }] }; },
      (doc) => doc.querySelectorAll(".inv-ga-rasgada .gallery-item").length === 4],
    ["foto en papel rasgado: el marco con la máscara",
      (d) => { d.layout = { blocks: [{ id: "photo-1", type: "photo", variant: "rasgada",
        data: { enabled: true, url: "/api/media/2026/09/f.jpg", caption: "Nosotros" } }] }; },
      (doc) => {
        const ph: any = doc.querySelector(".inv-foto-rasgada .gallery-item .gallery-ph");
        return !!ph && /background-image/.test(ph.getAttribute("style") || "");
      }],
    ["cita: la frase en su tarjeta y el antetítulo de firma",
      (d) => { d.layout = { blocks: [{ id: "paragraph-1", type: "paragraph", variant: "cita",
        data: { enabled: true, label: "Mario Benedetti", title: "", text: "Coincidir con gente." } }] }; },
      (doc) => {
        const t: any = doc.querySelector(".inv-pa-cita .inv-cita-texto");
        const f: any = doc.querySelector(".inv-pa-cita .inv-cita-firma");
        return t?.textContent.trim() === "Coincidir con gente." && f?.textContent.trim() === "Mario Benedetti";
      }],
    ["pases: tarjeta con el número y sin preguntar cuántos van",
      (d) => { d.confirm = { ...d.confirm, enabled: true, mode: "form" }; },
      (doc) => {
        const f: any = doc.querySelector(".inv-rsvp");
        const n: any = doc.querySelector(".inv-rsvp [name='partySize']");
        return f?.getAttribute("data-inv-pases") === "4" &&
          n?.getAttribute("type") === "hidden" && n?.getAttribute("value") === "4" &&
          !doc.querySelector("[data-inv-cuantos]") &&
          !!doc.querySelector("[data-inv-pases-texto] .inv-rsvp-pases-n") &&
          conScript(doc, "data-inv-pases");
      }, 4],
    ["y sin pases sigue el contador de siempre",
      (d) => { d.confirm = { ...d.confirm, enabled: true, mode: "form" }; },
      (doc) => {
        const n: any = doc.querySelector(".inv-rsvp [name='partySize']");
        // La tarjeta viene escondida y tiene que quedarse escondida.
        return !doc.querySelector("[data-inv-pases]") && !!doc.querySelector("[data-inv-cuantos]") &&
          doc.querySelector("[data-inv-pases-texto]")?.hasAttribute("hidden") === true &&
          n?.getAttribute("max") === "20" && n?.getAttribute("value") === "1";
      }],
    ["cuenta atrás de luciérnagas, con sus cuatro números",
      (d) => { d.layout = { blocks: [{ id: "countdown-0", type: "countdown", variant: "luciernagas" }] }; },
      (doc) => doc.querySelectorAll(".inv-cd-luciernagas [data-cd]").length === 4],
    ["rasca y descubre: una capa por ficha y su script",
      (d) => {
        d.layout = { blocks: [{ id: "features-0", type: "features", variant: "rasca" }] };
        d.features = { ...d.features, enabled: true, items: [{ title: "A", text: "a" }, { title: "B", text: "b" }] };
      },
      (doc) => doc.querySelectorAll(".inv-fe-rasca .feature-card div.inv-rasca-capa").length === 2 &&
        conScript(doc, "inv-rasca-capa")],
    /* Un <canvas> hecho en el servidor tumba el render entero en el
       contenedor: el de linkedom quiere el paquete «canvas» de Node, que
       no está, y lanza «createCanvas is not a function». Pasó en producción
       con el polvo de oro y el cielo estrellado, y no se vio aquí porque en
       este equipo el sustituto sí resuelve. El lienzo lo crea el navegador. */
    ["ni un solo <canvas> hecho en el servidor",
      (d) => {
        d.particulas = { enabled: true, tipo: "cielo", cantidad: "20" };
        d.layout = { blocks: [{ id: "features-0", type: "features", variant: "rasca" }] };
        d.features = { ...d.features, enabled: true, items: [{ title: "A", text: "a" }] };
      },
      (doc) => !doc.querySelector("canvas")],
    ["anillos: los dos aros, la pista y su script",
      (d) => { d.splash = { ...d.splash, enabled: true, apertura: "anillos" }; },
      (doc) => doc.querySelectorAll("#splash.inv-velo-anillos .inv-aros i").length === 2 &&
        !!doc.querySelector("#splash .inv-sobre-pista") && conScript(doc, "inv-velo-anillos")],
    ["canción: un campo más en el RSVP si se pide",
      (d) => { d.confirm = { ...d.confirm, enabled: true, mode: "form", cancion: "La que no puede faltar" }; },
      (doc) => !!doc.querySelector(".inv-rsvp .inv-rsvp-cancion input[name='cancion']") &&
        String(doc.querySelector(".inv-rsvp")?.textContent).includes("La que no puede faltar") &&
        conScript(doc, "body.cancion")],
    ["y sin pedirla no aparece",
      (d) => { d.confirm = { ...d.confirm, enabled: true, mode: "form", cancion: "" }; },
      (doc) => !doc.querySelector("[name='cancion']")],
    ["polvo de oro: una capa y no piezas de CSS",
      (d) => { d.particulas = { enabled: true, tipo: "polvo", cantidad: "20" }; },
      (doc) => !!doc.querySelector("div.inv-polvo") && !doc.querySelector(".inv-particulas") &&
        doc.querySelector("div.inv-polvo").getAttribute("data-n") === "60" && conScript(doc, "inv-polvo")],
  ];
  for (const [nombre, preparar, comprueba, pases] of casos) {
    const mal: string[] = [];
    for (const tpl of TEMPLATES) {
      const d: any = defaultData();
      preparar(d);
      const { document } = parseHTML(
        renderInvitation({ templateHtml: readTemplate(tpl.id), templateId: tpl.id, data: d, slug: "demo", pases })
      );
      try { if (!comprueba(document)) mal.push(tpl.id); } catch { mal.push(`${tpl.id} (excepción)`); }
    }
    if (mal.length) botonMal++;
    console.log(`${mal.length ? "✗" : "✓"} componente · ${nombre.padEnd(52)}` +
      (mal.length ? `  ${mal.length} mal: ${mal.slice(0, 2).join(", ")}` : ""));
  }
}

/* ── La variante que trae el diseño ──────────────────────────────
   Hay diseños cuya forma **es** la variante: las órbitas y la constelación
   de «Noche Estrellada» no son un adorno que se le añade, son cómo se ve.
   Sin esto salían con el marcado genérico hasta que alguien las elegía a
   mano, y no se parecían a lo que enseña el catálogo. */
{
  const casos: [string, () => boolean][] = [
    [
      "sin elegir nada, el diseño pone la suya",
      () => {
        const d: any = defaultData();
        delete d.layout;
        const { document } = parseHTML(renderInvitation({
          templateHtml: readTemplate("invitacion-15-estrellada"),
          templateId: "invitacion-15-estrellada", data: d, slug: "demo",
        }));
        return !!document.querySelector(".inv-cd-orbitas") && !!document.querySelector(".inv-ev-constelacion");
      },
    ],
    [
      "y lo que se eligió a mano le gana",
      () => {
        const d: any = defaultData();
        d.layout = { blocks: [{ id: "events-0", type: "events", variant: "tarjetas" }] };
        const { document } = parseHTML(renderInvitation({
          templateHtml: readTemplate("invitacion-15-estrellada"),
          templateId: "invitacion-15-estrellada", data: d, slug: "demo",
        }));
        return !!document.querySelector(".inv-ev-tarjetas") && !document.querySelector(".inv-ev-constelacion");
      },
    ],
    [
      "los padres bajan a invitados cuando el diseño lo pide",
      () => {
        const d: any = defaultData();
        d.guests = { ...d.guests, enabled: true };
        d.hero = { ...d.hero, padresA: "Padres de la novia", padresANombres: "Luisa\nJorge" };
        const { document } = parseHTML(renderInvitation({
          templateHtml: readTemplate("invitacion-eterna"),
          templateId: "invitacion-eterna", data: d, slug: "demo",
        }));
        return !!document.querySelector("#guests .inv-padres-invitados") && !document.querySelector("#hero .hero-padres");
      },
    ],
    [
      "y con invitados apagado se quedan en la portada",
      () => {
        const d: any = defaultData();
        d.guests = { ...d.guests, enabled: false };
        d.hero = { ...d.hero, padresA: "Padres de la novia", padresANombres: "Luisa\nJorge" };
        const { document } = parseHTML(renderInvitation({
          templateHtml: readTemplate("invitacion-eterna"),
          templateId: "invitacion-eterna", data: d, slug: "demo",
        }));
        return !!document.querySelector("#hero .hero-padres p");
      },
    ],
    [
      "un diseño que no declara ninguna sigue con su marcado",
      () => {
        const d: any = defaultData();
        delete d.layout;
        const { document } = parseHTML(renderInvitation({
          templateHtml: readTemplate("invitacion-15-white"),
          templateId: "invitacion-15-white", data: d, slug: "demo",
        }));
        return !document.querySelector("[class*='inv-cd-']") && !document.querySelector("[class*='inv-ev-']");
      },
    ],
  ];
  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} variante del diseño · ${nombre}`);
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

/* ── Color por campo ─────────────────────────────────────────────
   La sección ya tenía el suyo, que pinta todo lo que hay dentro. Éste es un
   escalón más abajo y tiene que **ganarle**: si no, elegir el color de un
   título no haría nada visible y nadie sabría por qué. */
{
  const render = (gallery: Record<string, unknown>, events?: Record<string, unknown>) => {
    const d: any = defaultData();
    d.gallery = { ...d.gallery, enabled: true, label: "Recuerdos", title: "La galería", ...gallery };
    if (events) d.events = { ...d.events, ...events };
    return renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
  };
  /** Las reglas de alineación que se inyectaron. */
  const alineadas = (html: string) =>
    [...html.matchAll(/([^{}\n]+)\{text-align:([a-z]+) !important\}/g)]
      .map((m) => [m[1].trim(), m[2]] as [string, string])
      /* La del marcado suelto, que centra todo, no cuenta: es del diseño y
         está siempre. (Antes era `.inv-block :is(`; se acotó a la sección
         suelta cuando los bloques pasaron a escribirse dentro de la sección
         del diseño, que trae su propia alineación.) */
      .filter(([sel]) => !sel.startsWith(".inv-block-suelto :is("));

  /** Las reglas de color que se inyectaron, en orden. */
  const reglas = (html: string) =>
    [...html.matchAll(/([^{}\n]+)\{color:(#[0-9a-fA-F]{3,6}) !important\}/g)]
      .map((m) => [m[1].trim(), m[2].toLowerCase()] as [string, string]);

  const casos: [string, () => boolean][] = [
    ["sin color elegido no se inyecta nada", () => reglas(render({})).length === 0],
    [
      "el color de un campo llega",
      () => reglas(render({ colors: { title: "#00aa44" } })).some(([, c]) => c === "#00aa44"),
    ],
    /* El de la sección apunta a `sel *`; el del campo, al selector concreto.
       Más específico, y además se emite después. */
    [
      "y va después del de la sección",
      () => {
        const rs = reglas(render({ textColor: "#ff0000", colors: { title: "#00aa44" } }));
        const sec = rs.findIndex(([, c]) => c === "#ff0000");
        const campo = rs.findIndex(([, c]) => c === "#00aa44");
        return sec > -1 && campo > sec;
      },
    ],
    [
      "un color inválido se ignora",
      () => reglas(render({ colors: { title: "rojo" } })).length === 0,
    ],
    [
      "los campos de una lista comparten el suyo",
      () => reglas(render({}, { colors: { "items.title": "#0055ff" } })).some(([, c]) => c === "#0055ff"),
    ],
    /* Y que no se pise con la tipografía, que viaja por el mismo camino. */
    [
      "convive con la tipografía del mismo campo",
      () => {
        const h = render({ colors: { title: "#00aa44" }, fonts: { title: "playfair" } });
        return reglas(h).some(([, c]) => c === "#00aa44") && h.includes("font-family:");
      },
    ],
  ];

  for (const [nombre, comprueba] of casos) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} color · ${nombre}`);
  }

  /* ── Y la alineación, por el mismo camino ── */
  const conBloque = (align: Record<string, string>) => {
    const d: any = defaultData();
    d.layout = {
      blocks: [{
        id: "p1", type: "paragraph", variant: "simple",
        data: { enabled: true, text: "Un párrafo.", align },
      }],
    };
    return renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: d, slug: "demo",
    });
  };

  const deAlineacion: [string, () => boolean][] = [
    ["sin elegir no se inyecta nada", () => alineadas(render({})).length === 0],
    [
      "izquierda, derecha y justificado llegan",
      () => ["izq", "der", "justificado"].every((v, i) =>
        alineadas(render({ align: { title: v } }))
          .some(([, css]) => css === ["left", "right", "justify"][i])),
    ],
    ["un valor inventado se ignora", () => alineadas(render({ align: { title: "diagonal" } })).length === 0],
    /* Lo que de verdad podía no llegar: el marcado de un bloque agregado
       centra todo con !important. */
    [
      "llega a un bloque agregado, que centra con !important",
      () => alineadas(conBloque({ text: "izq" })).some(
        ([sel, css]) => sel.includes("#inv-p1") && css === "left"
      ),
    ],
    [
      "y la letra y el color también llegan ahí",
      () => {
        const d: any = defaultData();
        d.layout = {
          blocks: [{
            id: "p2", type: "paragraph", variant: "simple",
            data: { enabled: true, text: "Un párrafo.", colors: { text: "#00aa44" }, fonts: { text: "playfair" } },
          }],
        };
        const h = renderInvitation({
          templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
          data: d, slug: "demo",
        });
        return /#inv-p2[^{}]*\{color:#00aa44/.test(h) && /#inv-p2[^{}]*\{font-family:/.test(h);
      },
    ],
  ];

  /* ── El tamaño ── */
  const zooms = (html: string) =>
    [...html.matchAll(/([^{}\n]+)\{zoom:([\d.]+) !important\}/g)].map((m) => Number(m[2]));

  const deTamano: [string, () => boolean][] = [
    ["sin tocarlo no se inyecta nada", () => zooms(render({})).length === 0],
    ["al 100% tampoco", () => zooms(render({ size: { title: "100" } })).length === 0],
    ["al 160% sale como zoom 1.6", () => zooms(render({ size: { title: "160" } }))[0] === 1.6],
    ["al 70% también", () => zooms(render({ size: { title: "70" } }))[0] === 0.7],
    /* Un tamaño absurdo se recorta en vez de romper la maquetación. */
    ["un 9000% se recorta a 300", () => zooms(render({ size: { title: "9000" } }))[0] === 3],
    ["y un valor que no es número se ignora", () => zooms(render({ size: { title: "grande" } })).length === 0],
  ];

  for (const [nombre, comprueba] of deTamano) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} tamaño · ${nombre}`);
  }

  for (const [nombre, comprueba] of deAlineacion) {
    let ok = false;
    try { ok = comprueba(); } catch { ok = false; }
    if (!ok) botonMal++;
    console.log(`${ok ? "✓" : "✗"} alineación · ${nombre}`);
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

  /* Dónde está de verdad la galería: en el marcado del diseño, o en la
     sección que sintetiza un bloque cuando el diseño trae su variante —el
     carrusel de «Jardín de Glicinas»—. Buscar sólo en #gallery daba por
     ausente lo que estaba al lado. */
  const galeria = (doc: any) =>
    (doc.querySelector("#gallery")?.getAttribute("hidden") === null
      ? doc.querySelector("#gallery")
      : doc.querySelector(".inv-block-gallery")) || doc.querySelector("#gallery");

  const casos: [string, Record<string, string>, (t: any, doc: any) => boolean][] = [
    [
      "sin elegir nada no se marca nada",
      {},
      (_t, doc) => !galeria(doc)?.querySelector("[data-inv-anim]"),
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
      (_t, doc) => !galeria(doc)?.querySelector("[data-inv-anim]"),
    ],
    /* El turno es lo que hace que dos textos animados entren uno detrás de
       otro en vez de a la vez. */
    /* Se mira el **segundo** marcado, no el primero: el turno cero no escribe
       nada, que es justo lo que hace que la regla por defecto valga. */
    [
      "el segundo texto animado espera su turno",
      { label: "aparece", title: "sube" },
      (_t, doc) => {
        const todos = Array.from(galeria(doc)?.querySelectorAll("[data-inv-anim]") || []) as any[];
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
      const t = galeria(document)?.querySelector("[data-inv-anim]") as any;
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
      "«gira despacio» se aplica al movimiento y no al giro fijo",
      { ...base, movimiento: "gira", giro: "30" },
      (a) => Boolean(a.querySelector(".inv-ad-mov.inv-ad-m-gira")) &&
        String(a.querySelector(".inv-ad-pieza").getAttribute("style")).includes("rotate(30deg)"),
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
