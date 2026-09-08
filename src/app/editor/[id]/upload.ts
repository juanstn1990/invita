"use client";

/**
 * Subida de imágenes desde el editor.
 *
 * Antes de subir, la foto se reduce en el navegador: las cámaras de celular
 * dan archivos de 5–12 MB que no aportan nada en una invitación y hacen la
 * subida lenta. `createImageBitmap` con `imageOrientation: "from-image"`
 * respeta el EXIF, así que las fotos verticales no salen acostadas.
 */

const MAX_SIDE = 2000;
const QUALITY = 0.85;
/** Los GIF pueden estar animados y el canvas los aplanaría. */
const PASS_THROUGH = new Set(["image/gif"]);

async function shrink(file: File): Promise<Blob> {
  if (PASS_THROUGH.has(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // Navegador sin soporte: que suba el original.
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // El PNG se conserva por la transparencia; lo demás va a JPEG.
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY)
  );

  // Si comprimir no ayudó (ya venía optimizada), mandamos el original.
  return blob && blob.size < file.size ? blob : file;
}

/** Lo que mide una imagen, para guardarlo en la biblioteca. */
async function medir(blob: Blob): Promise<string> {
  try {
    const bitmap = await createImageBitmap(blob);
    const m = `${bitmap.width}x${bitmap.height}`;
    bitmap.close?.();
    return m;
  } catch {
    return "";
  }
}

/**
 * Sube imágenes y devuelve sus URLs en el mismo orden.
 *
 * `kind` separa las fotos del evento de los adornos, que es lo que permite
 * que la biblioteca ofrezca sólo marcos cuando se está poniendo un marco.
 */
export async function uploadImages(
  files: File[],
  kind: "foto" | "adorno" = "foto"
): Promise<string[]> {
  const form = new FormData();
  const medidas: string[] = [];
  for (const file of files) {
    const blob = await shrink(file);
    const name = blob === (file as Blob) ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg";
    form.append("file", blob, name);
    medidas.push(await medir(blob));
  }
  form.append("kind", kind);
  form.append("medidas", medidas.join(","));

  const res = await fetch("/api/media", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "No se pudo subir la imagen.");
  return json.urls as string[];
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  width: number | null;
  height: number | null;
  kind: string;
}

/** Lo que ya se subió antes, para reutilizarlo sin volver a buscarlo. */
export async function fetchBiblioteca(kind?: string): Promise<MediaItem[]> {
  const q = new URLSearchParams();
  if (kind) q.set("kind", kind);
  const res = await fetch(`/api/media?${q}`);
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return (json.items || []) as MediaItem[];
}

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
