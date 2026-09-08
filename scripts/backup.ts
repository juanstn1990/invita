/**
 * Copia la biblioteca y la base a una carpeta de respaldo.
 *
 *   npm run backup
 *   BACKUP_DIR=/mnt/c/Users/juan/invita-respaldos npm run backup
 *
 * Copia dos cosas, y las dos hacen falta: los **archivos** (los bytes de cada
 * imagen) y la **base** (el catálogo, que es lo que hace que una imagen se
 * pueda volver a elegir, y todas las invitaciones). Con los archivos pero sin
 * la base se pueden recuperar los archivos con `npm run media:index`; con la
 * base pero sin los archivos no se recupera nada.
 *
 * La base se copia con `VACUUM INTO` y no con `cp`: es la forma que trae
 * SQLite de sacar una copia consistente **con la aplicación corriendo**.
 * Copiar el archivo a pelo mientras hay una escritura a medias da una copia
 * corrupta, y es justo la clase de respaldo que se descubre roto el día que
 * se necesita.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { ROOT } from "../src/lib/storage";

const DESTINO = process.env.BACKUP_DIR
  ? path.resolve(process.cwd(), process.env.BACKUP_DIR)
  : path.join(process.cwd(), "..", "invita-respaldos");

/** El archivo de la base, sacado de DATABASE_URL. */
function baseDeDatos(): string | null {
  const url = process.env.DATABASE_URL || "";
  const m = /^file:(.*)$/.exec(url);
  if (!m) return null;
  // Prisma resuelve las rutas relativas contra la carpeta del esquema.
  return path.resolve(process.cwd(), "prisma", m[1]);
}

const sello = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const carpeta = path.join(DESTINO, sello);

function copiarArchivos(desde: string, hasta: string): { n: number; bytes: number } {
  let n = 0;
  let bytes = 0;
  if (!fs.existsSync(desde)) return { n, bytes };
  for (const e of fs.readdirSync(desde, { withFileTypes: true })) {
    const a = path.join(desde, e.name);
    const b = path.join(hasta, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(b, { recursive: true });
      const r = copiarArchivos(a, b);
      n += r.n;
      bytes += r.bytes;
    } else {
      fs.mkdirSync(hasta, { recursive: true });
      fs.copyFileSync(a, b);
      n += 1;
      bytes += fs.statSync(a).size;
    }
  }
  return { n, bytes };
}

fs.mkdirSync(carpeta, { recursive: true });
console.log(`Respaldo → ${carpeta}\n`);

/* ── Los archivos ── */
const r = copiarArchivos(ROOT, path.join(carpeta, "uploads"));
console.log(`  archivos   ${String(r.n).padStart(5)}  ${(r.bytes / 1048576).toFixed(1)} MB`);

/* ── La base ── */
const db = baseDeDatos();
if (!db || !fs.existsSync(db)) {
  console.log(`  base       no la encontré (DATABASE_URL=${process.env.DATABASE_URL || "sin definir"})`);
} else {
  const salida = path.join(carpeta, "dev.db");
  try {
    execFileSync("sqlite3", [db, `VACUUM INTO '${salida.replace(/'/g, "''")}'`]);
    console.log(`  base       ${(fs.statSync(salida).size / 1024).toFixed(0)} kB (VACUUM INTO)`);
  } catch {
    /* Sin el binario de sqlite3 se copia a pelo. Vale para una base que no se
       está escribiendo; se avisa porque no es lo mismo. */
    fs.copyFileSync(db, salida);
    console.log(
      `  base       ${(fs.statSync(salida).size / 1024).toFixed(0)} kB ` +
        `(copia simple: sin el comando sqlite3 no puedo hacer VACUUM INTO;\n` +
        `             para que sea fiable, córrelo con la app detenida)`
    );
  }
}

/* Un archivo que dice qué es esto, para el día que haya diez carpetas. */
fs.writeFileSync(
  path.join(carpeta, "LEEME.txt"),
  [
    `Respaldo de Invita · ${new Date().toISOString()}`,
    ``,
    `uploads/   los archivos de la biblioteca`,
    `dev.db     el catálogo y las invitaciones`,
    ``,
    `Para restaurar:`,
    `  1. copiar uploads/ a donde apunte UPLOADS_DIR`,
    `  2. copiar dev.db a donde apunte DATABASE_URL`,
    `  3. si sólo tienes uploads/, correr: npm run media:index`,
    ``,
  ].join("\n")
);

console.log(`\nListo. Guarda esta carpeta fuera de la VM de WSL.`);
