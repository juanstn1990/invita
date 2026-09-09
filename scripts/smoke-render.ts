/** Renderiza los 14 diseños con los datos por defecto y revisa lo básico. */
import fs from "fs";
import path from "path";
import { parseHTML } from "linkedom";
import { mapFor } from "../src/lib/bindings";
import { renderInvitation } from "../src/lib/render";
import { defaultData } from "../src/lib/schema";
import { TEMPLATES, readTemplate } from "../src/lib/templates";

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

console.log(
  bad || botonMal
    ? `\n${bad} diseños y ${botonMal} casos con problemas`
    : "\nTodos los diseños renderizan limpio"
);
if (bad || botonMal) process.exit(1);
