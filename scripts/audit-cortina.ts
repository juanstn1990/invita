/**
 * La cortina de apertura, en el navegador.
 *
 * Lo que hay que probar aquí no es que el vídeo se vea bonito: es que **nunca
 * deje a nadie encerrado**. Una cortina que se queda puesta no es un efecto
 * que falla, es una invitación que no se puede leer, y el marcado no dice
 * nada de eso — hay que abrirla y mirar quién ocupa el centro de la pantalla
 * cuando debería estar la portada.
 *
 * Hay cuatro maneras de quedarse encerrado y las cuatro se prueban: que el
 * archivo no exista, que no sea un vídeo, que quien la abre no quiera verlo, y
 * el camino bueno, que termina solo.
 *
 * El clip de prueba lo graba el propio navegador al empezar. Podría ser un
 * archivo en el repo, pero entonces habría un binario que nadie sabe de dónde
 * salió ni cómo volver a generarlo; así la prueba se explica sola y no pesa.
 *
 *   npm run audit:cortina
 */
import fs from "fs"; import os from "os"; import path from "path";
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
process.env.LD_LIBRARY_PATH = fs.readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d)).map((d) => path.join(CONDA, d, "lib")).join(":");

import { chromium, type Browser } from "playwright";
import { renderInvitation } from "../src/lib/render";
import { presetFor } from "../src/lib/presets";
import { TEMPLATES, readTemplate } from "../src/lib/templates";

const ORIGEN = "https://invitacion.local";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "invita-cortina-"));

/** Un clip corto de verdad, grabado por el navegador. */
async function clip(b: Browser): Promise<Buffer> {
  const ctx = await b.newContext({ recordVideo: { dir: TMP, size: { width: 360, height: 640 } } });
  const p = await ctx.newPage();
  await p.setContent(
    `<body style="margin:0"><div id="c" style="width:360px;height:640px"></div><script>` +
      `let i=0;setInterval(()=>{document.getElementById('c').style.background='hsl('+(i+=13)+',65%,45%)'},70)</script></body>`
  );
  await p.waitForTimeout(1800);
  await ctx.close();
  const f = fs.readdirSync(TMP).find((n) => n.endsWith(".webm"))!;
  return fs.readFileSync(path.join(TMP, f));
}

/** Tres segundos de tono, para la música de fondo. */
function musica(): Buffer {
  const tasa = 8000, segs = 3, n = tasa * segs;
  const datos = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) datos.writeInt16LE(Math.round(9000 * Math.sin((2 * Math.PI * 440 * i) / tasa)), i * 2);
  const cab = Buffer.alloc(44);
  cab.write("RIFF", 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write("WAVEfmt ", 8);
  cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(1, 22);
  cab.writeUInt32LE(tasa, 24); cab.writeUInt32LE(tasa * 2, 28);
  cab.writeUInt16LE(2, 32); cab.writeUInt16LE(16, 34); cab.write("data", 36);
  cab.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cab, datos]);
}

type Caso = {
  nombre: string;
  roto?: "404" | "basura";
  saltar?: boolean;
  sonido?: boolean;
  /** Qué debe pasar con la música mientras la cortina está puesta. */
  musicaDurante: boolean;
};

const CASOS: Caso[] = [
  { nombre: "se reproduce y se va sola al terminar", musicaDurante: true },
  { nombre: "con sonido, la música de fondo espera", sonido: true, musicaDurante: false },
  { nombre: "se puede saltar", saltar: true, musicaDurante: true },
  { nombre: "el archivo no existe", roto: "404", musicaDurante: true },
  { nombre: "el archivo no es un vídeo", roto: "basura", musicaDurante: true },
];

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const CLIP = await clip(b);
  const MUSICA = musica();
  const tpl = TEMPLATES[0];
  let malos = 0;

  for (const caso of CASOS) {
    const page = await b.newPage({ viewport: { width: 390, height: 844 } });
    const fallos: string[] = [];

    await page.route("**/ejemplo.test/**", (r) =>
      r.fulfill({ status: 200, contentType: "image/gif",
        body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") }));
    await page.route("**/ejemplo.test/intro.webm*", (r) =>
      caso.roto === "404"
        ? r.fulfill({ status: 404, body: "no está" })
        : caso.roto === "basura"
          ? r.fulfill({ status: 200, contentType: "video/webm", body: Buffer.from("esto no es un vídeo") })
          : r.fulfill({ status: 200, contentType: "video/webm", body: CLIP }));
    await page.route("**/ejemplo.test/musica.wav*", (r) =>
      r.fulfill({ status: 200, contentType: "audio/wav", body: MUSICA }));

    const data: any = presetFor(tpl);
    data.splash.introUrl = "https://ejemplo.test/intro.webm";
    data.splash.introSonido = caso.sonido ? "con" : "";
    data.splash.musicUrl = "https://ejemplo.test/musica.wav";

    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id), templateId: tpl.id, data, slug: "demo",
    });
    await page.route(`${ORIGEN}/`, (r) =>
      r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
    await page.goto(`${ORIGEN}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    /* Antes de entrar la cortina existe pero no se ve: si se viera, taparía
       el velo, que es lo primero que hay que leer. */
    const antes: any = await page.evaluate(`(() => {
      var c = document.querySelector('.inv-cortina');
      return { existe: !!c, oculta: c ? c.hasAttribute('hidden') : null };
    })()`);
    if (!antes.existe) fallos.push("no se montó la cortina");
    else if (!antes.oculta) fallos.push("la cortina se ve antes de entrar");

    await page.click(".splash-btn-primary");
    if (caso.saltar) { await page.waitForTimeout(700); await page.click(".inv-cortina-saltar"); }
    await page.waitForTimeout(caso.saltar ? 80 : 500);

    /* Con el camino bueno, a medio segundo la cortina tiene que estar puesta
       y el vídeo corriendo; con el roto, ya se fue. */
    const durante: any = await page.evaluate(`(() => {
      var c = document.querySelector('.inv-cortina'), v = c.querySelector('video');
      var m = document.getElementById('inv-musica');
      return { puesta: !c.hasAttribute('hidden') && !c.classList.contains('fuera'),
        corriendo: !v.paused, musica: m ? !m.paused : null,
        saltar: c.classList.contains('lista') };
    })()`);
    const buena = !caso.roto && !caso.saltar;
    if (buena && !durante.puesta) fallos.push("la cortina no llegó a verse");
    if (buena && !durante.corriendo) fallos.push("el vídeo no arrancó");
    if (buena && !durante.saltar) fallos.push("sin botón de saltar");
    if (durante.puesta && durante.musica !== caso.musicaDurante) {
      fallos.push(`la música ${durante.musica ? "suena" : "no suena"} durante la cortina`);
    }

    /* Y lo único que de verdad importa: que pasado el vídeo no quede nada
       encima de la invitación. Se pregunta quién ocupa el centro. */
    await page.waitForTimeout(4200);
    const despues: any = await page.evaluate(`(() => {
      var c = document.querySelector('.inv-cortina');
      var m = document.getElementById('inv-musica');
      var el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return { oculta: c.hasAttribute('hidden'), scroll: document.body.style.overflow,
        musica: m ? !m.paused : null,
        encima: el && el.closest('.inv-cortina') ? 'la cortina' : '' };
    })()`);
    if (!despues.oculta) fallos.push("la cortina sigue puesta");
    if (despues.encima) fallos.push("la cortina tapa el centro de la pantalla");
    if (despues.scroll === "hidden") fallos.push("el scroll quedó bloqueado");
    if (despues.musica === false) fallos.push("la música no volvió");

    await page.close();
    if (fallos.length) malos++;
    console.log(
      `${fallos.length ? "✗" : "✓"} ${caso.nombre.padEnd(40)}` +
        (fallos.length ? `  ${fallos.join(" · ")}` : "")
    );
  }

  await b.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(
    malos
      ? `\n${malos} de ${CASOS.length} casos con problemas`
      : `\nLa cortina se va siempre: los ${CASOS.length} casos salen limpios`
  );
  process.exit(malos ? 1 : 0);
})();
