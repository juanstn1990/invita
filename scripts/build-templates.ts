/**
 * Genera los 27 archivos de `templates/`.
 *
 *   npm run templates:build
 *
 * Los 27 salen del mismo esqueleto. Antes eran 14 archivos HTML escritos a
 * mano más 13 generados, y esa división costaba: los hechos a mano
 * necesitaban un mapa de 555 líneas de selectores para saber dónde poner cada
 * campo, fallaban 213 veces, y sus tokens visuales había que sacarlos
 * abriéndolos en Chromium.
 *
 * El build **valida antes de escribir**: si un tema tiene un par de colores
 * ilegible, falla y dice cuál. Es la comprobación que antes hacía el renderer
 * a mano y a destiempo.
 */

import fs from "fs";
import path from "path";
import { contenido } from "../src/lib/design/content";
import { explicar, revisar } from "../src/lib/design/contraste";
import { DESIGNS, templateId } from "../src/lib/design/designs";
import { page } from "../src/lib/design/skeleton";
import type { Variant } from "../src/lib/design/theme";

const OUT = path.join(process.cwd(), "templates");

/* ── Validar ────────────────────────────────────────────────── */

let fallas = 0;
for (const d of DESIGNS) {
  for (const [variant, t] of Object.entries(d.themes)) {
    if (!t) continue;
    for (const f of revisar(t)) {
      console.error(`✗ ${d.slug} · ${variant}  ${explicar(f)}`);
      fallas++;
    }
  }
}
if (fallas) {
  console.error(`\n${fallas} pares de colores ilegibles. No escribo nada.`);
  process.exit(1);
}

/* ── Escribir ───────────────────────────────────────────────── */

const previos = new Set(
  fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => f.endsWith(".html")) : []
);

let bytes = 0;
let n = 0;
const escritos: string[] = [];

for (const d of DESIGNS) {
  for (const [variant, t] of Object.entries(d.themes)) {
    if (!t) continue;
    const id = templateId(d.slug, variant);
    const html = page(d, t, contenido(d.occasion, variant as Variant));
    fs.writeFileSync(path.join(OUT, `${id}.html`), html);
    escritos.push(`${id}.html`);
    bytes += html.length;
    n++;
    console.log(`${id.padEnd(30)} ${(html.length / 1024).toFixed(1)} kb`);
  }
}

/* Los archivos de la generación anterior que ya nadie declara. Se avisa en
   vez de borrarlos: borrar solo el HTML de alguien es la clase de cosa que
   no se debe hacer sin preguntar. */
const huerfanos = [...previos].filter((f) => !escritos.includes(f));
if (huerfanos.length) {
  console.log(`\nSobran ${huerfanos.length} archivos de la versión anterior:`);
  huerfanos.forEach((f) => console.log(`  ${f}`));
  console.log("Ningún diseño los declara. Bórralos cuando lo verifiques.");
}

console.log(`\n${n} invitaciones · ${(bytes / 1024).toFixed(0)} kb · contraste verificado`);
