/**
 * Genera los archivos de `templates/`, uno por diseño.
 *
 *   npm run templates:build
 *
 * Cada archivo se hornea con la **paleta por defecto** del diseño (la
 * primera). Las otras las aplica el renderer sustituyendo variables CSS, así
 * que 42 diseños × 4 paletas siguen siendo 42 archivos y no 168.
 *
 * El build **valida antes de escribir**: si una paleta de un diseño tiene un
 * par de colores ilegible, falla y dice cuál. Se comprueban las 168, no sólo
 * las que se hornean, porque cualquiera se puede elegir al editar.
 */

import fs from "fs";
import path from "path";
import { contenido } from "../src/lib/design/content";
import { explicar, revisar } from "../src/lib/design/contraste";
import { DESIGNS, templateId } from "../src/lib/design/designs";
import { page } from "../src/lib/design/skeleton";
import { piel } from "../src/lib/design/theme";

const OUT = path.join(process.cwd(), "templates");

/* ── Validar las 168 combinaciones ──────────────────────────── */

let fallas = 0;
let revisadas = 0;
for (const d of DESIGNS) {
  for (const p of d.palettes) {
    revisadas++;
    for (const f of revisar(piel(d, p.id))) {
      console.error(`✗ ${d.slug} · ${p.id}  ${explicar(f)}`);
      fallas++;
    }
  }
}
if (fallas) {
  console.error(`\n${fallas} pares ilegibles en ${revisadas} combinaciones. No escribo nada.`);
  process.exit(1);
}

/* ── Escribir ───────────────────────────────────────────────── */

const previos = new Set(
  fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => f.endsWith(".html")) : []
);

let bytes = 0;
const escritos: string[] = [];

for (const d of DESIGNS) {
  const id = templateId(d.slug);
  const html = page(d, piel(d), contenido(d.occasion, d.palettes[0].id));
  fs.writeFileSync(path.join(OUT, `${id}.html`), html);
  escritos.push(`${id}.html`);
  bytes += html.length;
  console.log(
    `${id.padEnd(28)} ${(html.length / 1024).toFixed(1)} kb · ` +
      `${d.palettes.length} paletas (${d.palettes.map((p) => p.id).join(", ")})`
  );
}

/* Los archivos de una generación anterior que ya nadie declara. Se avisa en
   vez de borrarlos: borrar el HTML de alguien sin preguntar no toca. */
const huerfanos = [...previos].filter((f) => !escritos.includes(f));
if (huerfanos.length) {
  console.log(`\nSobran ${huerfanos.length} archivos de la versión anterior:`);
  huerfanos.forEach((f) => console.log(`  ${f}`));
  console.log("Ningún diseño los declara. Bórralos cuando lo verifiques.");
}

console.log(
  `\n${escritos.length} diseños · ${(bytes / 1024).toFixed(0)} kb · ` +
    `${revisadas} paletas con contraste verificado`
);
