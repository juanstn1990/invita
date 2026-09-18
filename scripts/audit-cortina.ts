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

/**
 * Un clip de verdad, grabado por el navegador.
 *
 * Hacen falta dos: uno más corto que el tope, para ver que termina solo, y
 * uno más largo, para ver que se corta. Con uno solo, el corte a los tres
 * segundos no se distingue de que el vídeo se acabara.
 */
async function clip(b: Browser, segs: number): Promise<Buffer> {
  const dir = fs.mkdtempSync(path.join(TMP, "clip-"));
  const ctx = await b.newContext({ recordVideo: { dir, size: { width: 360, height: 640 } } });
  const p = await ctx.newPage();
  await p.setContent(
    `<body style="margin:0"><div id="c" style="width:360px;height:640px"></div><script>` +
      `let i=0;setInterval(()=>{document.getElementById('c').style.background='hsl('+(i+=13)+',65%,45%)'},70)</script></body>`
  );
  await p.waitForTimeout(segs * 1000);
  await ctx.close();
  const f = fs.readdirSync(dir).find((n) => n.endsWith(".webm"))!;
  return fs.readFileSync(path.join(dir, f));
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
  /** Un clip más largo que el tope, para ver que se corta. */
  largo?: boolean;
  /** Qué debe pasar con la música mientras la cortina está puesta. */
  musicaDurante: boolean;
};

/** El tope que aplica el renderer. Si cambia allí, cambia aquí. */
const TOPE = 5000;
/** Lo que dura la salida, que es lo que hay que esperar de más. */
const SALIDA = 2000;

const CASOS: Caso[] = [
  { nombre: "se reproduce y se va sola al terminar", musicaDurante: true },
  { nombre: "un vídeo largo se corta a los 5 segundos", largo: true, musicaDurante: true },
  { nombre: "con sonido, la música de fondo espera", sonido: true, musicaDurante: false },
  { nombre: "se puede saltar", saltar: true, musicaDurante: true },
  { nombre: "el archivo no existe", roto: "404", musicaDurante: true },
  { nombre: "el archivo no es un vídeo", roto: "basura", musicaDurante: true },
];

/** Las once salidas, que se prueban aparte: todas tienen que retirarse. */
const SALIDAS = ["", "negro", "destello", "acerca", "aleja", "sube", "baja",
  "cortinas", "circulo", "barrido", "desenfoque"];

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const CORTO = await clip(b, 1.6);
  const LARGO = await clip(b, 8);
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
          : r.fulfill({ status: 200, contentType: "video/webm",
              body: caso.largo ? LARGO : CORTO }));
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

    /* El cronómetro se instala **antes** del clic, no después.
       Puesto después perdía la carrera: para cuando el navegador evaluaba el
       guion, el vídeo ya había disparado su 'playing' y el oyente llegaba a
       un evento que no iba a repetirse. Aquí se anotan los dos instantes
       según pasan y se leen luego con calma. */
    await page.evaluate(`(() => {
      var c = document.querySelector('.inv-cortina');
      var v = c.querySelector('video');
      window.__t = {};
      v.addEventListener('playing', function () {
        if (!window.__t.ini) window.__t.ini = performance.now();
      }, { once: true });
      new MutationObserver(function () {
        if (c.classList.contains('fuera') && !window.__t.fin) window.__t.fin = performance.now();
      }).observe(c, { attributes: true, attributeFilter: ['class'] });
    })()`);

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
    const buena = !caso.roto && !caso.saltar && !caso.largo;
    if (buena && !durante.puesta) fallos.push("la cortina no llegó a verse");
    if (buena && !durante.corriendo) fallos.push("el vídeo no arrancó");
    if (buena && !durante.saltar) fallos.push("sin botón de saltar");
    if (durante.puesta && durante.musica !== caso.musicaDurante) {
      fallos.push(`la música ${durante.musica ? "suena" : "no suena"} durante la cortina`);
    }

    /* Y lo único que de verdad importa: que pasado el vídeo no quede nada
       encima de la invitación. Se pregunta quién ocupa el centro. */
    await page.waitForTimeout(TOPE + SALIDA + 1200);
    const despues: any = await page.evaluate(`(() => {
      var c = document.querySelector('.inv-cortina');
      var m = document.getElementById('inv-musica');
      var el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return { oculta: c.hasAttribute('hidden'), scroll: document.body.style.overflow,
        musica: m ? !m.paused : null,
        encima: el && el.closest('.inv-cortina') ? 'la cortina' : '' };
    })()`);
    /* Cuánto se vio de verdad: del arranque del vídeo a que empieza a irse.
       Se cuenta desde 'playing' y no desde el clic, que metería dentro lo que
       tardara en cargar. */
    if (caso.largo) {
      const t: any = await page.evaluate(`window.__t`);
      const visto = t.ini && t.fin ? Math.round(t.fin - t.ini) : null;
      if (visto === null) fallos.push("no llegó a cortarse");
      /* Medio segundo de margen: el reloj de una página no es un cronómetro. */
      else if (Math.abs(visto - TOPE) > 500) fallos.push(`se vio ${visto} ms, no ~${TOPE}`);
    }

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

  /* ── Y que las once salidas se vayan ──────────────────────────
     Cada una mueve una propiedad distinta —opacidad, transform, clip-path,
     máscara, filtro— y a cada una le toca dejar la pantalla libre. Una que se
     quede a medias no es un efecto feo: es la invitación tapada, y como
     ninguna se parece a las otras, que funcione el fundido no dice nada de
     las diez restantes. */
  console.log();
  for (const salida of SALIDAS) {
    const page = await b.newPage({ viewport: { width: 390, height: 844 } });
    await page.route("**/ejemplo.test/**", (r) =>
      r.fulfill({ status: 200, contentType: "image/gif",
        body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") }));
    await page.route("**/ejemplo.test/intro.webm*", (r) =>
      r.fulfill({ status: 200, contentType: "video/webm", body: CORTO }));

    const data: any = presetFor(tpl);
    data.splash.introUrl = "https://ejemplo.test/intro.webm";
    data.splash.introSalida = salida;
    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id), templateId: tpl.id, data, slug: "demo",
    });
    await page.route(`${ORIGEN}/`, (r) =>
      r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
    await page.goto(`${ORIGEN}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.click(".splash-btn-primary");
    /* El clip corto acaba solo antes del tope, así que aquí basta con lo que
       dura él más la salida entera. */
    await page.waitForTimeout(2000 + SALIDA + 1500);

    const r: any = await page.evaluate(`(() => {
      var c = document.querySelector('.inv-cortina');
      /* Cinco puntos y no uno: una salida que se va por un lado —el telón, el
         barrido— podría dejar libre el centro y seguir tapando una esquina. */
      var puntos = [[.5,.5],[.12,.12],[.88,.12],[.12,.88],[.88,.88]];
      var tapados = puntos.filter(function (p) {
        var el = document.elementFromPoint(innerWidth * p[0], innerHeight * p[1]);
        return el && el.closest('.inv-cortina');
      }).length;
      return { clase: c.className, oculta: c.hasAttribute('hidden'), tapados: tapados };
    })()`);

    const fallos: string[] = [];
    const esperada = salida || "fundido";
    if (!r.clase.includes("inv-cortina-s-" + esperada)) fallos.push(`clase: ${r.clase}`);
    if (!r.oculta) fallos.push("no se retiró");
    if (r.tapados) fallos.push(`tapa ${r.tapados} de 5 puntos`);

    await page.close();
    if (fallos.length) malos++;
    console.log(
      `${fallos.length ? "✗" : "✓"} salida · ${(salida || "fundido").padEnd(31)}` +
        (fallos.length ? `  ${fallos.join(" · ")}` : "")
    );
  }

  /* ── 4 · Que nunca se vea la cortina sin imagen ──────────────
     El fallo que esto vigila: la cortina se destapaba en el mismo clic y el
     vídeo empezaba cuando podía, así que con la descarga a medias se veía un
     rectángulo negro. Medido antes del arreglo, 1.080 ms en una conexión
     mala. Ahora lo que la destapa es el propio vídeo al arrancar.

     Se simula la conexión retrasando la respuesta del servidor, que es lo
     que de verdad pasa: el archivo llega tarde, no lento. */
  console.log();
  for (const [comoEs, retraso] of [
    ["conexión rápida", 0],
    ["conexión mala", 1800],
  ] as [string, number][]) {
    const page = await b.newPage({ viewport: { width: 390, height: 800 } });
    await page.route("**/ejemplo.test/**", (r) =>
      r.fulfill({ status: 200, contentType: "image/gif",
        body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") }));
    await page.route("**/ejemplo.test/intro.webm*", async (r) => {
      if (retraso) await new Promise((ok) => setTimeout(ok, retraso));
      await r.fulfill({ status: 200, contentType: "video/webm", body: CORTO });
    });

    const data: any = presetFor(tpl);
    data.splash.introUrl = "https://ejemplo.test/intro.webm";
    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id), templateId: tpl.id, data, slug: "demo",
    });
    await page.route(`${ORIGEN}/`, (r) =>
      r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
    await page.goto(`${ORIGEN}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    /* El vigía se instala antes de pulsar: cada momento en que la cortina
       está destapada sin que el vídeo haya arrancado es negro en pantalla. */
    await page.evaluate(`(() => {
      var v = document.querySelector('.inv-cortina-video');
      var c = document.querySelector('.inv-cortina');
      window.__t = { play: 0, negro: 0 };
      v.addEventListener('playing', function(){
        if (!window.__t.play) window.__t.play = performance.now();
      }, { once: true });
      setInterval(function(){
        if (!window.__t.play && !c.hasAttribute('hidden')) window.__t.negro += 30;
      }, 30);
    })()`);
    await page.evaluate(`document.querySelector('.splash-btn-primary').click()`);
    await page.waitForTimeout(3200);

    const t: any = await page.evaluate(`window.__t`);
    await page.close();
    if (t.negro) malos++;
    console.log(
      `${t.negro ? "✗" : "✓"} sin negro · ${comoEs.padEnd(29)}` +
        (t.negro ? `  ${t.negro} ms de cortina vacía` : "")
    );
  }

  await b.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  const total = CASOS.length + SALIDAS.length + 2;
  console.log(
    malos
      ? `\n${malos} de ${total} casos con problemas`
      : `\nLa cortina se va siempre: los ${total} casos salen limpios`
  );
  process.exit(malos ? 1 : 0);
})();
