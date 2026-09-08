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
console.log(bad ? `\n${bad} diseños con problemas` : "\nTodos los diseños renderizan limpio");
