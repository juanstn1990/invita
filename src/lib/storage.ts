/**
 * Almacenamiento de los archivos subidos: imágenes y vídeo.
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
import { createReadStream } from "fs";
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

/**
 * Vídeo.
 *
 * Sólo MP4 (H.264) y WebM: son los dos que reproducen todos los navegadores
 * sin plugins. Un MOV de iPhone o un AVI se rechazan con su nombre, que es
 * mejor que aceptarlos y que la invitación muestre un recuadro negro.
 *
 * MKV queda fuera aunque el contenedor pueda llevar H.264 dentro: ningún
 * navegador lo reproduce de forma fiable.
 */
export const ALLOWED_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const TYPE_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries({ ...ALLOWED_TYPES, ...ALLOWED_VIDEO }).map(([mime, ext]) => [ext, mime])
);

export const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Cuánto se acepta de vídeo.
 *
 * 64 MB no es generosidad, es el límite de lo razonable: quien abre la
 * invitación suele estar en datos móviles, y un vídeo de 64 MB ya son dos
 * minutos de espera en una conexión mala. El editor avisa del peso; esto es
 * el techo duro.
 */
export const MAX_VIDEO_BYTES = 64 * 1024 * 1024;

/** Si el archivo es vídeo, se sirve entero y por tramos; nunca se redimensiona. */
export const esVideo = (mime: string) => mime.startsWith("video/");

/**
 * Los anchos que se sirven redimensionados.
 *
 * Son pocos a propósito: cada uno es una entrada de caché, y aceptar
 * cualquier número convertiría el servidor en un redimensionador para quien
 * quiera. 400 es una casilla de galería, 800 una foto entre secciones, 1600
 * una portada a pantalla completa en retina.
 */
export const ANCHOS = [400, 800, 1600];

/** Sólo aceptamos rutas que nosotros mismos generamos: aaaa/mm/id.ext */
const SAFE_PATH = /^\d{4}\/\d{2}\/[a-f0-9]{24}\.(jpg|png|webp|gif|avif|mp4|webm)$/;

export async function saveImage(bytes: Buffer, mime: string): Promise<string> {
  const ext = { ...ALLOWED_TYPES, ...ALLOWED_VIDEO }[mime];
  if (!ext) throw new Error("Formato no soportado.");

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

/**
 * Un archivo abierto por tramos, para vídeo.
 *
 * Las imágenes se leen enteras a memoria y se devuelven; un vídeo no puede.
 * Dos razones, y las dos rompen cosas visibles:
 *
 * 1. **Memoria.** Un MP4 de 60 MB leído entero por petición, con varias
 *    personas abriendo la invitación a la vez, tumba el contenedor.
 * 2. **`Range`.** Safari —y iOS entero— no reproduce un vídeo si el servidor
 *    no responde `206 Partial Content` a una petición por tramos: pide los
 *    primeros bytes para leer la cabecera y, si recibe un `200` con todo,
 *    abandona. Adelantar el vídeo también depende de esto: sin tramos, el
 *    navegador tendría que descargarlo completo para saltar al minuto dos.
 */
export async function statFile(
  relPath: string
): Promise<{ size: number; mime: string } | null> {
  if (!SAFE_PATH.test(relPath)) return null;
  try {
    const st = await fs.stat(path.join(ROOT, relPath));
    if (!st.isFile()) return null;
    const ext = relPath.slice(relPath.lastIndexOf(".") + 1);
    return { size: st.size, mime: TYPE_BY_EXT[ext] };
  } catch {
    return null;
  }
}

/** Un tramo del archivo como stream, para pasárselo tal cual a la respuesta. */
export function readStream(relPath: string, desde: number, hasta: number) {
  return createReadStream(path.join(ROOT, relPath), { start: desde, end: hasta });
}

/**
 * Interpreta la cabecera `Range` de una petición.
 *
 * Se acepta un solo tramo: los múltiples (`bytes=0-99,200-299`) exigen una
 * respuesta multipart que ningún reproductor de vídeo pide. Un `Range` que no
 * se entienda o que caiga fuera del archivo devuelve `null`, y quien llama
 * responde el archivo completo o un 416, según corresponda.
 */
export function tramo(
  cabecera: string | null,
  size: number
): { desde: number; hasta: number } | null {
  if (!cabecera) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(cabecera.trim());
  if (!m) return null;
  const [, a, b] = m;

  /* `bytes=-500` son los últimos 500 bytes, no del 0 al 500. */
  if (a === "") {
    const largo = Number(b);
    if (!largo) return null;
    return { desde: Math.max(0, size - largo), hasta: size - 1 };
  }

  const desde = Number(a);
  if (desde >= size) return null;
  const hasta = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  if (hasta < desde) return null;
  return { desde, hasta };
}
