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

/* ── Vídeo ──────────────────────────────────────────────────── */

/**
 * El lado mayor al que se reduce un vídeo.
 *
 * Una invitación se abre en un móvil de 390 px de ancho, y un teléfono graba
 * a 1080p o a 4K. 1280 sigue sobrando para retina y es donde está casi toda
 * la rebaja: el peso de un vídeo va con el cuadrado del lado, así que bajar
 * de 2160 a 1280 quita más que cualquier ajuste de calidad.
 */
const VIDEO_MAX_LADO = 1280;

/**
 * El caudal de vídeo, en bits por segundo.
 *
 * 1,5 Mbps a 720p es calidad de sobra para lo que aquí se ve —un clip de
 * ambiente detrás de unos nombres— y deja un segundo en unos 190 kB. Quien
 * abre la invitación suele estar en datos móviles, y ése es el número que de
 * verdad decide si espera o cierra.
 */
const VIDEO_BITRATE = 1_500_000;
const AUDIO_BITRATE = 96_000;

/** Los contenedores que sabemos grabar, de mejor a peor. */
const VIDEO_SALIDA = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

/**
 * Reduce un vídeo antes de subirlo.
 *
 * Se hace **en el navegador**, igual que con las fotos, y por las mismas
 * razones: no hay que meter un transcodificador de 80 MB en la imagen de
 * Docker, ni una cola de trabajos, ni CPU del servidor por cada subida. La
 * máquina que ya tiene el archivo lo reduce antes de mandarlo.
 *
 * El método es reproducirlo sobre un lienzo más pequeño y grabar el lienzo.
 * Eso trae una limitación que hay que decir de frente: **va en tiempo real**,
 * así que un clip de diez segundos tarda diez segundos. Para lo que se sube
 * aquí —la cortina se corta a los cinco— es un precio razonable, y por eso el
 * campo avisa mientras tanto en vez de quedarse callado.
 *
 * Ante cualquier duda, el original. Un vídeo que no se puede recodificar es
 * un vídeo que se sube tal cual, no un error.
 */
async function encogerVideo(
  file: File,
  avisar?: (pct: number) => void
): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") return file;
  const salida = VIDEO_SALIDA.find((t) => MediaRecorder.isTypeSupported(t));
  /* Safari no graba WebM. Ahí se sube el original: más vale pesado que un
     archivo que su propio navegador no supo escribir. */
  if (!salida) return file;

  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const limpiar = () => URL.revokeObjectURL(video.src);

  try {
    await new Promise<void>((ok, fallo) => {
      video.onloadedmetadata = () => ok();
      video.onerror = () => fallo(new Error("no se pudo leer"));
      setTimeout(() => fallo(new Error("tardó demasiado")), 15000);
    });

    const ancho = video.videoWidth;
    const alto = video.videoHeight;
    if (!ancho || !alto) { limpiar(); return file; }

    /* Un WebM grabado por el propio navegador no trae la duración en la
       cabecera y llega como `Infinity`. Antes eso bastaba para no comprimir —
       y es justo uno de los archivos que más falta hace reducir. Lo que se
       pierde sin ella es el porcentaje y el reloj ajustado, no la reducción:
       el final lo marca `ended` igual. */
    const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;

    const escala = Math.min(1, VIDEO_MAX_LADO / Math.max(ancho, alto));
    /* Si ya viene pequeño y con poco caudal no hay nada que ganar: recodificar
       sólo perdería calidad. Sin duración no se puede calcular el caudal, así
       que ahí se intenta y el resultado decide (si sale mayor, va el original). */
    if (escala === 1 && dur && file.size / dur < VIDEO_BITRATE / 8) {
      limpiar();
      return file;
    }

    const lienzo = document.createElement("canvas");
    /* Pares: varios codificadores rechazan un lado impar. */
    lienzo.width = Math.max(2, Math.round((ancho * escala) / 2) * 2);
    lienzo.height = Math.max(2, Math.round((alto * escala) / 2) * 2);
    const ctx = lienzo.getContext("2d");
    if (!ctx) { limpiar(); return file; }

    const flujo = lienzo.captureStream(30);
    /* El audio del original, si lo tiene. `muted` silencia los altavoces, no
       lo que se captura: sin eso, subir un vídeo sonaría en la oreja de quien
       está editando. */
    const conAudio = (video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
    }).captureStream?.();
    for (const pista of conAudio?.getAudioTracks?.() || []) flujo.addTrack(pista);

    const rec = new MediaRecorder(flujo, {
      mimeType: salida,
      videoBitsPerSecond: VIDEO_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE,
    });
    const trozos: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
    const grabado = new Promise<void>((ok) => { rec.onstop = () => ok(); });

    rec.start(500);
    await video.play();

    let pedir = 0;
    const pintar = () => {
      if (video.ended || video.paused) return;
      ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      if (dur) avisar?.(Math.min(99, Math.round((video.currentTime / dur) * 100)));
      pedir = requestAnimationFrame(pintar);
    };
    pintar();

    await new Promise<void>((ok) => {
      video.onended = () => ok();
      /* Red de seguridad: un vídeo que no dispara `ended` dejaría la subida
         colgada para siempre. Con duración conocida se le da la suya y un
         margen; sin ella, un tope absoluto — tres minutos es más de lo que
         cabe en los 64 MB que se aceptan. */
      setTimeout(ok, dur ? dur * 1000 + 8000 : 180000);
    });

    cancelAnimationFrame(pedir);
    if (rec.state !== "inactive") rec.stop();
    await grabado;
    limpiar();

    const blob = new Blob(trozos, { type: "video/webm" });
    /* Si recodificar no ayudó —un clip ya muy comprimido—, el original. */
    return blob.size > 0 && blob.size < file.size ? blob : file;
  } catch {
    limpiar();
    return file;
  }
}

async function shrink(file: File, avisar?: (pct: number) => void): Promise<Blob> {
  if (file.type.startsWith("video/")) return encogerVideo(file, avisar);
  /* El audio sube tal cual: un MP3 ya viene comprimido, y recodificarlo sólo
     quitaría calidad para ahorrar poco. */
  if (file.type.startsWith("audio/")) return file;
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
export type MediaKind = "foto" | "adorno" | "video" | "audio";

/** La extensión que le toca a lo recodificado, por su tipo. */
const EXT_POR_TIPO: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "video/webm": "webm",
};

export async function uploadImages(
  files: File[],
  kind: MediaKind = "foto",
  avisar?: (pct: number) => void
): Promise<string[]> {
  const form = new FormData();
  const medidas: string[] = [];
  for (const file of files) {
    const blob = await shrink(file, avisar);
    /* El nombre sigue al tipo de lo que de verdad se manda. Antes se le
       pegaba `.jpg` a todo lo recodificado, y con vídeo eso dejaba un
       "clip.jpg" en la biblioteca que era un WebM: el servidor guarda bien
       porque mira el tipo, pero buscarlo por nombre después era un acertijo. */
    const ext = blob === (file as Blob) ? "" : EXT_POR_TIPO[blob.type] || "";
    const name = ext ? file.name.replace(/\.\w+$/, "") + "." + ext : file.name;
    form.append("file", blob, name);
    medidas.push(await medir(blob));
  }
  form.append("kind", kind);
  form.append("medidas", medidas.join(","));

  const res = await fetch("/api/media", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "No se pudo subir el archivo.");
  return json.urls as string[];
}

/**
 * La reducción, expuesta para poder medirla.
 *
 * `shrink` es un detalle interno de `uploadImages`, pero es justo la parte
 * que hay que probar con un archivo de verdad y en un navegador de verdad —
 * y probarla por `uploadImages` exigiría un servidor al otro lado. Ver
 * `audit:comprimir`.
 */
export const __prueba_shrink = shrink;

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  width: number | null;
  height: number | null;
  kind: string;
  /** Para saber si la miniatura es una imagen de fondo o un <video>. */
  mime: string;
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

/** Los dos que reproducen todos los navegadores. Ver `ALLOWED_VIDEO`. */
export const VIDEO_ACCEPT = "video/mp4,video/webm";

/**
 * Lo mismo para el audio. Ver `ALLOWED_AUDIO`.
 *
 * Se añade `.m4a` por extensión además del tipo: Windows no siempre le pone
 * un `type` a ese archivo y el selector lo dejaría fuera aunque sea válido.
 */
export const AUDIO_ACCEPT = "audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a";
