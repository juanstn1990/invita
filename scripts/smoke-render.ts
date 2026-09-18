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
       campo existe. */
    const conColor: any = defaultData();
    conColor[clave] = { ...conColor[clave], colors: { nombres: "#00aa44" } };
    const html = renderInvitation({
      templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
      data: conColor, slug: "demo",
    });
    if (!html.includes("color:#00aa44")) mal.push("el color no llega");

    if (mal.length) botonMal++;
    console.log(
      `${mal.length ? "✗" : "✓"} nombres · ${nombre.padEnd(10)}` +
        (mal.length ? `  ${mal.join(" · ")}` : "")
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
      /* La del marcado sintetizado, que centra todo, no cuenta: es del
         diseño y está siempre. */
      .filter(([sel]) => !sel.startsWith(".inv-block :is("));

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
