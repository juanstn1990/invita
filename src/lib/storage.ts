/**
 * Almacenamiento de imágenes subidas.
 *
 * Los archivos se sirven por `/api/media/...` y viven **fuera de `public/`**
 * a propósito: Next no sirve archivos que aparecen en `public/` después de
 * compilar, así que en producción las fotos subidas no se verían.
 *
 * Dónde viven lo decide `UPLOADS_DIR`. Por defecto es `uploads/` dentro del
 * proyecto, que es cómodo para empezar y **frágil para conservar**: está en
 * `.gitignore`, así que un `git clean -xdf`, un reclonado o —en WSL— un reset
 * de la VM se lleva la biblioteca entera. Apuntarlo a una carpeta de fuera es
 * la diferencia entre tener copia y no tenerla.
 *
 * Para pasar a Cloudflare R2 o S3 sólo hay que reimplementar `saveImage` y
 * `readImage`; nada fuera de este archivo sabe dónde están los bytes.
 */

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/**
 * La carpeta de los archivos. Absoluta o relativa al proyecto.
 *
 *   UPLOADS_DIR=/mnt/c/Users/juan/invita-biblioteca
 */
export const ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.cwd(), process.env.UPLOADS_DIR)
  : path.join(process.cwd(), "uploads");

/** SVG queda fuera a propósito: puede llevar scripts y lo servimos same-origin. */
export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const TYPE_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_TYPES).map(([mime, ext]) => [ext, mime])
);

export const MAX_BYTES = 8 * 1024 * 1024;

/** Sólo aceptamos rutas que nosotros mismos generamos: aaaa/mm/id.ext */
const SAFE_PATH = /^\d{4}\/\d{2}\/[a-f0-9]{24}\.(jpg|png|webp|gif|avif)$/;

export async function saveImage(bytes: Buffer, mime: string): Promise<string> {
  const ext = ALLOWED_TYPES[mime];
  if (!ext) throw new Error("Formato de imagen no soportado.");

  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;

  await fs.mkdir(path.join(ROOT, dir), { recursive: true });
  await fs.writeFile(path.join(ROOT, dir, name), bytes);

  return `/api/media/${dir}/${name}`;
}

export async function readImage(
  relPath: string
): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!SAFE_PATH.test(relPath)) return null;
  try {
    const bytes = await fs.readFile(path.join(ROOT, relPath));
    const ext = relPath.slice(relPath.lastIndexOf(".") + 1);
    return { bytes, mime: TYPE_BY_EXT[ext] };
  } catch {
    return null;
  }
}
