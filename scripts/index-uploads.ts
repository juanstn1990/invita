/**
 * Cataloga en la biblioteca los archivos que ya están en disco.
 *
 *   npm run media:index
 *
 * Hace falta porque los archivos y el catálogo son dos cosas: los bytes viven
 * en `UPLOADS_DIR` y la tabla `Media` es lo que hace que una imagen se pueda
 * volver a elegir. Todo lo que se subió antes de que la tabla existiera está
 * en disco pero invisible para la biblioteca.
 *
 * Es idempotente: se puede correr cuantas veces se quiera. También sirve
 * después de restaurar un respaldo de los archivos sin el de la base.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { ALLOWED_TYPES, ROOT } from "../src/lib/storage";

const MIME_POR_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_TYPES).map(([mime, ext]) => [ext, mime])
);

/** Las medidas salen de la cabecera del archivo, sin decodificarlo entero. */
function medidas(f: string, ext: string): { width: number | null; height: number | null } {
  try {
    const b = fs.readFileSync(f);
    if (ext === "png" && b.length > 24 && b.toString("ascii", 12, 16) === "IHDR") {
      return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    }
    if (ext === "gif" && b.length > 10) {
      return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    }
    if (ext === "jpg") {
      // Recorrer los segmentos hasta el SOF, que es donde están las medidas.
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const marca = b[i + 1];
        if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
          return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch {
    /* Un archivo que no se puede leer se cataloga sin medidas. */
  }
  return { width: null, height: null };
}

function archivos(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) archivos(f, out);
    else out.push(f);
  }
  return out;
}

(async () => {
  console.log(`Carpeta: ${ROOT}`);
  const todos = archivos(ROOT);
  const yaEstan = new Set(
    (await prisma.media.findMany({ select: { url: true } })).map((m) => m.url)
  );

  let nuevos = 0;
  let saltados = 0;
  for (const f of todos) {
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    const url = `/api/media/${rel}`;
    if (yaEstan.has(url)) { saltados += 1; continue; }

    const ext = rel.slice(rel.lastIndexOf(".") + 1).toLowerCase();
    const mime = MIME_POR_EXT[ext];
    if (!mime) { console.log(`  · ${rel}  (extensión que no servimos, se deja)`); continue; }

    const st = fs.statSync(f);
    const { width, height } = medidas(f, ext);
    /* Lo ya subido se cataloga como foto: no hay forma de saber si era un
       adorno, y en el selector es más fácil buscar entre fotos que perderlas. */
    await prisma.media.create({
      data: {
        url,
        name: path.basename(rel),
        mime,
        bytes: st.size,
        width,
        height,
        kind: "foto",
        createdAt: st.mtime,
      },
    });
    nuevos += 1;
  }

  console.log(
    `\n${nuevos} catalogadas · ${saltados} ya estaban · ${todos.length} archivos en total`
  );
  await prisma.$disconnect();
})();
