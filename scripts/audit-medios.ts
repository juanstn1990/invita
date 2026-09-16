/**
 * Que lo que se acepta al subir sea exactamente lo que se sirve.
 *
 *   npm run audit:medios
 *
 * Es el fallo más silencioso que puede haber en los archivos: un formato que
 * la subida admite pero que la ruta pública no entrega se sube bien, aparece
 * en el editor, se guarda en la invitación — y da 404 el día que alguien la
 * abre. Las dos listas viven en sitios distintos (`ALLOWED_*` y el filtro de
 * rutas de `statFile`) y nada obliga a que coincidan salvo esto.
 *
 * Se escribe un archivo de verdad por formato y se pide por el mismo camino
 * que usa la ruta pública, porque el filtro es privado a propósito y probarlo
 * de mentira sería probar otra cosa.
 */
import fs from "fs";
import path from "path";
import {
  ALLOWED_AUDIO,
  ALLOWED_TYPES,
  ALLOWED_VIDEO,
  MAX_AUDIO_BYTES,
  MAX_BYTES,
  MAX_VIDEO_BYTES,
  ROOT,
  esAudio,
  esVideo,
  porTramos,
  saveImage,
  statFile,
} from "../src/lib/storage";

(async () => {
  const todos = { ...ALLOWED_TYPES, ...ALLOWED_VIDEO, ...ALLOWED_AUDIO };
  let malos = 0;

  for (const [mime, ext] of Object.entries(todos)) {
    const fallos: string[] = [];
    let url = "";
    try {
      url = await saveImage(Buffer.from("no importa lo que haya dentro"), mime);
    } catch (e) {
      fallos.push(`no se pudo guardar: ${(e as Error).message}`);
    }

    if (url) {
      if (!url.endsWith(`.${ext}`)) fallos.push(`se guardó como ${url.split(".").pop()}`);
      const rel = url.replace("/api/media/", "");
      const st = await statFile(rel);
      /* null aquí es el 404 de la ruta pública: o el filtro no conoce la
         extensión, o el archivo no se escribió donde se dijo. */
      if (!st) fallos.push("la ruta pública no lo sirve (404)");
      else if (st.mime !== mime && todos[st.mime] !== ext) {
        fallos.push(`se sirve como ${st.mime}`);
      }

      /* Vídeo y audio van por tramos; una imagen no. */
      const tramos = porTramos(mime);
      if (tramos !== (esVideo(mime) || esAudio(mime))) fallos.push("no cuadra el servido por tramos");

      const f = path.join(ROOT, rel);
      if (fs.existsSync(f)) fs.rmSync(f);
    }

    if (fallos.length) malos++;
    console.log(
      `${fallos.length ? "✗" : "✓"} ${mime.padEnd(16)} → .${ext.padEnd(6)}` +
        (fallos.length ? `  ${fallos.join(" · ")}` : "")
    );
  }

  /* Y que un formato que no aceptamos no se cuele. */
  let rechaza = true;
  try {
    await saveImage(Buffer.from("x"), "image/svg+xml");
    rechaza = false;
  } catch {
    /* Lo esperado: SVG puede llevar scripts y lo servimos same-origin. */
  }
  if (!rechaza) malos++;
  console.log(`${rechaza ? "✓" : "✗"} image/svg+xml se rechaza, como debe`);

  const techos = [
    ["imagen", MAX_BYTES, 8],
    ["vídeo", MAX_VIDEO_BYTES, 64],
    ["audio", MAX_AUDIO_BYTES, 12],
  ] as const;
  console.log(
    "\nTechos: " + techos.map(([q, b]) => `${q} ${(b / 1048576).toFixed(0)} MB`).join(" · ")
  );

  console.log(
    malos
      ? `${malos} formatos con problemas`
      : `Los ${Object.keys(todos).length} formatos se aceptan y se sirven igual`
  );
  process.exit(malos ? 1 : 0);
})();
