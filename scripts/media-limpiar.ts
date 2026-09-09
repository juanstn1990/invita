/**
 * Encuentra los descuadres entre los archivos y el catálogo.
 *
 *   npm run media:limpiar            sólo informa
 *   npm run media:limpiar -- --borrar  borra de verdad
 *
 * Los archivos y el catálogo son dos cosas, y se pueden desincronizar en las
 * dos direcciones. La distinción que importa:
 *
 * · **Archivo sin fila** — está en disco pero la biblioteca no lo ve, así que
 *   no se puede volver a elegir. Es lo que arregla `media:index`.
 * · **Fila sin archivo** — la biblioteca lo ofrece y al elegirlo sale roto.
 * · **En una invitación pero sin archivo** — una invitación publicada con una
 *   foto que no carga. El más grave y el único que hay que mirar de verdad.
 *
 * Lo que **no** es un descuadre: una imagen en la biblioteca que ninguna
 * invitación usa. Ése es el punto de tener biblioteca — material disponible
 * para el próximo proyecto. Borrarla sería tirar lo que se guardó a propósito.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { ROOT } from "../src/lib/storage";

const borrar = process.argv.includes("--borrar");

/* ── Lo que hay en disco ────────────────────────────────────── */

function archivos(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) archivos(f, out);
    else if (!e.name.startsWith(".")) out.push(f);
  }
  return out;
}

const urlDe = (f: string) => `/api/media/${path.relative(ROOT, f).split(path.sep).join("/")}`;

/* ── Lo que usan las invitaciones ───────────────────────────── */

/**
 * Todas las URLs de `/api/media/` que aparecen en los datos de una
 * invitación, sin importar en qué campo.
 *
 * Se busca sobre el JSON en crudo y no campo por campo a propósito: los
 * sitios donde puede haber una imagen han crecido —portada, galería, fondo de
 * sección, adornos, bloques de foto— y una lista escrita a mano se queda corta
 * en el próximo campo que se añada. Aquí un falso positivo es inofensivo (no
 * borrar algo que sí se usa) y un falso negativo borraría una foto en uso.
 */
const usadas = (json: string): string[] =>
  [...json.matchAll(/\/api\/media\/[0-9]{4}\/[0-9]{2}\/[a-f0-9]{24}\.[a-z]{3,4}/g)].map((m) => m[0]);

(async () => {
  console.log(`Carpeta: ${ROOT}\n`);

  const enDisco = archivos(ROOT);
  const urlsDisco = new Set(enDisco.map(urlDe));

  const filas = await prisma.media.findMany({ select: { id: true, url: true, name: true } });
  const urlsCatalogo = new Set(filas.map((f) => f.url));

  const invitaciones = await prisma.invitation.findMany({ select: { slug: true, data: true } });
  const enUso = new Map<string, string[]>();
  for (const inv of invitaciones) {
    for (const u of usadas(inv.data)) {
      enUso.set(u, [...(enUso.get(u) || []), inv.slug]);
    }
  }

  /* ── Los tres descuadres ── */

  const sinFila = enDisco.filter((f) => !urlsCatalogo.has(urlDe(f)));
  const sinArchivo = filas.filter((f) => !urlsDisco.has(f.url));
  const rotasEnUso = [...enUso.entries()].filter(([u]) => !urlsDisco.has(u));

  console.log(`  ${enDisco.length} archivos · ${filas.length} en el catálogo · ${enUso.size} en uso\n`);

  if (rotasEnUso.length) {
    console.log(`⚠ ${rotasEnUso.length} imágenes usadas por una invitación que NO están en disco:`);
    for (const [u, slugs] of rotasEnUso.slice(0, 10)) {
      console.log(`    ${u}  ← /${slugs.join(", /")}`);
    }
    console.log("  Esas invitaciones se ven con huecos. Restaura un respaldo o vuelve a subirlas.\n");
  }

  if (sinFila.length) {
    console.log(`· ${sinFila.length} archivos en disco que la biblioteca no ve.`);
    console.log("  Se arregla con: npm run media:index\n");
  }

  if (sinArchivo.length) {
    console.log(`· ${sinArchivo.length} filas del catálogo cuyo archivo ya no está:`);
    sinArchivo.slice(0, 10).forEach((f) => console.log(`    ${f.name}  ${f.url}`));
    if (borrar) {
      const { count } = await prisma.media.deleteMany({
        where: { id: { in: sinArchivo.map((f) => f.id) } },
      });
      console.log(`  → ${count} filas borradas.\n`);
    } else {
      console.log("  Aparecen en el selector y al elegirlas salen rotas.");
      console.log("  Para sacarlas: npm run media:limpiar -- --borrar\n");
    }
  }

  if (!rotasEnUso.length && !sinFila.length && !sinArchivo.length) {
    console.log("Todo cuadra: cada archivo tiene su fila y cada fila su archivo.");
  }

  /* Para tener la foto completa, sin proponer borrar nada. */
  const guardadas = filas.filter((f) => urlsDisco.has(f.url) && !enUso.has(f.url));
  if (guardadas.length) {
    const mb = enDisco
      .filter((f) => guardadas.some((g) => g.url === urlDe(f)))
      .reduce((n, f) => n + fs.statSync(f).size, 0) / 1048576;
    console.log(
      `\n${guardadas.length} imágenes están en la biblioteca sin usarse en ninguna ` +
        `invitación (${mb.toFixed(1)} MB).\nNo son basura: es material para el próximo ` +
        `proyecto, que es para lo que existe la biblioteca.`
    );
  }

  await prisma.$disconnect();
})();
