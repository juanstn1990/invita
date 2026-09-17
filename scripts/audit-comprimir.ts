/**
 * La reducción de vídeo antes de subir, medida.
 *
 *   npm run audit:comprimir
 *
 * Un teléfono graba a 1080p o a 4K y una invitación se abre en 390 px de
 * ancho: el archivo que se sube pesa diez veces lo que hace falta, y quien la
 * recibe suele estar en datos móviles. Reducirlo es lo que decide si espera o
 * cierra.
 *
 * Se prueba **el código que se publica**: `upload.ts` se transpila con esbuild
 * y se mete en una página de verdad, en vez de reimplementar aquí lo que se
 * quiere comprobar. Es código de navegador —usa `MediaRecorder` y un lienzo—
 * así que no hay forma de correrlo desde node.
 *
 * Lo que se mide, y por qué cada cosa:
 *
 *  · **Que reduzca.** Es el objetivo.
 *  · **Que el resultado se pueda reproducir.** Un archivo más pequeño que no
 *    decodifica es peor que el original.
 *  · **Que conserve el audio.** El vídeo se reproduce en silencio mientras se
 *    comprime —si no, sonaría en la oreja de quien edita— y había que
 *    comprobar que silenciar la reproducción no se lleva por delante la pista
 *    capturada. No se lleva, pero eso no se puede saber leyendo el código.
 *  · **Que lo pequeño vuelva tal cual.** Recodificar un clip que ya venía
 *    ligero sólo quitaría calidad.
 */
import fs from "fs"; import os from "os"; import path from "path";
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
process.env.LD_LIBRARY_PATH = fs.readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d)).map((d) => path.join(CONDA, d, "lib")).join(":");

import { chromium } from "playwright";
import { buildSync } from "esbuild";

/** `upload.ts` transpilado, para meterlo en la página. */
const SUBIDA = buildSync({
  stdin: {
    contents: `export * from "./src/app/editor/[id]/upload.ts";`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "iife",
  globalName: "SUBIDA",
  write: false,
  target: "es2020",
}).outputFiles[0].text;

/** Graba un clip en la propia página: lienzo animado más un tono. */
const grabar = (ancho: number, alto: number, caudal: number, segs: number) => `
  (async () => {
    const c = document.createElement('canvas'); c.width = ${ancho}; c.height = ${alto};
    const x = c.getContext('2d');
    const ac = new AudioContext();
    const osc = ac.createOscillator(); const dest = ac.createMediaStreamDestination();
    osc.frequency.value = 440; osc.connect(dest); osc.start();
    const s = c.captureStream(30);
    dest.stream.getAudioTracks().forEach(t => s.addTrack(t));
    const rec = new MediaRecorder(s, { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: ${caudal} });
    const trozos = []; rec.ondataavailable = e => e.data.size && trozos.push(e.data);
    const fin = new Promise(ok => rec.onstop = ok);
    rec.start(200);
    let i = 0;
    const pinta = () => { i++;
      const g = x.createLinearGradient(0, 0, ${ancho}, ${alto});
      g.addColorStop(0, 'hsl(' + (i*7%360) + ',80%,55%)');
      g.addColorStop(1, 'hsl(' + ((i*7+120)%360) + ',80%,45%)');
      x.fillStyle = g; x.fillRect(0, 0, ${ancho}, ${alto});
      x.fillStyle = '#fff'; x.font = '${Math.round(alto / 6)}px sans-serif';
      x.fillText(String(i), 40 + (i*9) % Math.max(1, ${ancho} - 200), ${Math.round(alto / 2)});
      requestAnimationFrame(pinta); };
    pinta();
    await new Promise(r => setTimeout(r, ${segs * 1000}));
    rec.stop(); await fin; osc.stop();
    return new File([new Blob(trozos, { type: 'video/webm' })], 'clip.webm', { type: 'video/webm' });
  })()`;

(async () => {
  const b = await chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await b.newPage();
  await page.setContent("<body></body>");
  let malos = 0;
  const decir = (ok: boolean, txt: string) => { if (!ok) malos++; console.log(`${ok ? "✓" : "✗"} ${txt}`); };

  const medir = async (grande: boolean) =>
    (await page.evaluate(`(async () => {
      ${SUBIDA}
      const orig = await ${grabar(grande ? 1920 : 320, grande ? 1080 : 240, grande ? 8_000_000 : 150_000, 5)};
      const salida = await SUBIDA.__prueba_shrink(orig);
      const leer = async (blob) => {
        const v = document.createElement('video');
        v.src = URL.createObjectURL(blob);
        await new Promise(ok => { v.onloadedmetadata = ok; v.onerror = ok; });
        const st = v.captureStream ? v.captureStream() : null;
        return { w: v.videoWidth, h: v.videoHeight, audio: st ? st.getAudioTracks().length : -1 };
      };
      return { antes: orig.size, despues: salida.size, cambio: salida !== orig,
               o: await leer(orig), s: await leer(salida) };
    })()`)) as any;

  /* ── 1 · Un clip grande ── */
  {
    const r = await medir(true);
    const menos = Math.round((1 - r.despues / r.antes) * 100);
    decir(r.cambio && r.despues < r.antes, `reduce un clip de 1080p  (${(r.antes/1048576).toFixed(2)} MB → ${(r.despues/1048576).toFixed(2)} MB, ${menos}% menos)`);
    decir(r.s.w > 0 && r.s.h > 0, `y el resultado se reproduce  (${r.s.w}×${r.s.h}, venía en ${r.o.w}×${r.o.h})`);
    decir(r.s.w <= 1280 && r.s.h <= 1280, "no pasa del lado máximo");
    decir(r.o.audio > 0 && r.s.audio > 0, `conserva el audio  (${r.o.audio} pista antes, ${r.s.audio} después)`);
  }

  /* ── 2 · Uno que ya venía ligero ── */
  {
    const r = await medir(false);
    decir(!r.cambio, `un clip ya pequeño vuelve tal cual  (${(r.antes/1024).toFixed(0)} kB)`);
  }

  await b.close();
  console.log(
    malos
      ? `\n${malos} comprobaciones con problemas`
      : "\nEl vídeo se reduce antes de subir, y lo que ya era ligero no se toca"
  );
  process.exit(malos ? 1 : 0);
})();
