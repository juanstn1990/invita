/**
 * Capturar un diseño como se ve de verdad.
 *
 * Lo usan dos guiones —`shots.ts`, que guarda las imágenes para mirarlas, y
 * `audit-visual.ts`, que las compara contra la línea base— y estaba escrito
 * dos veces. Separarlo no es orden por el orden: la primera versión de
 * `shots.ts` **no servía las imágenes** y nadie lo vio en meses, porque el
 * fallo se ve igual que un diseño sin arte. Con una sola copia, arreglarlo
 * una vez lo arregla en todo lo que compare capturas.
 *
 * Tres cosas que la captura tiene que hacer o miente:
 *
 * 1. **Servir `public/`**. Si sólo se sirve el HTML, el arte no llega y la
 *    página mide lo mismo —los seudoelementos reservan su alto igual—, así
 *    que parece correcta.
 * 2. **Recorrer la página**, para que las secciones se revelen.
 * 3. **Quitar el `lazy` a las imágenes** y esperarlas: una captura de página
 *    entera no despierta lo que está fuera de la pantalla.
 */
import fs from "fs";
import os from "os";
import path from "path";

/* Chromium necesita nss, nspr y alsa-lib; en esta máquina no hay sudo, así
   que se toman de los paquetes que ya trae conda. Va antes de cargar
   Playwright, que lee el entorno al arrancar el navegador. */
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
if (fs.existsSync(CONDA)) {
  const libs = fs
    .readdirSync(CONDA)
    .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d))
    .map((d) => path.join(CONDA, d, "lib"))
    .filter((d) => fs.existsSync(d));
  process.env.LD_LIBRARY_PATH = [...libs, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
}

import { renderInvitation } from "../../src/lib/render";
import { TEMPLATES, readTemplate, type TemplateInfo } from "../../src/lib/templates";
import { presetFor } from "../../src/lib/presets";

const ORIGEN = "https://invitacion.local";
const PUBLICO = path.join(process.cwd(), "public");

const TIPOS: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".avif": "image/avif",
};

export interface Captura {
  imagen: Buffer;
  alto: number;
  /** Lo que salió regular, para avisarlo sin romper la captura. */
  avisos: string[];
}

/** Los diseños a capturar: los que se pidan, o todos. */
export const elegidos = (ids: string[]): TemplateInfo[] =>
  ids.length ? TEMPLATES.filter((t) => ids.includes(t.id)) : TEMPLATES;

/**
 * Abre un navegador, entrega una función que captura un diseño, y lo cierra.
 *
 * El navegador se abre una vez para todos: arrancar Chromium cuesta más que
 * capturar una página, y son 68.
 */
export async function conNavegador<T>(
  ancho: number,
  trabajo: (capturar: (tpl: TemplateInfo) => Promise<Captura>) => Promise<T>
): Promise<T> {
  const { chromium } = await import("playwright");
  const navegador = await chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: 900 } });

  let html = "";
  /* La página se carga desde una URL y no con `setContent`: así se parece a
     cómo se sirve de verdad y las rutas absolutas resuelven. */
  await pagina.route(`${ORIGEN}/`, (ruta) =>
    ruta.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html })
  );
  /* Y el arte, desde `public/`. Playwright prueba el último manejador
     registrado primero, así que éste le devuelve el turno a la página. */
  await pagina.route(`${ORIGEN}/**`, (ruta) => {
    const dentro = new URL(ruta.request().url()).pathname;
    if (dentro === "/") return ruta.fallback();
    const archivo = path.join(PUBLICO, decodeURIComponent(dentro));
    if (
      !archivo.startsWith(PUBLICO) ||
      !fs.existsSync(archivo) ||
      !fs.statSync(archivo).isFile()
    ) {
      return ruta.fulfill({ status: 404, body: "" });
    }
    return ruta.fulfill({
      status: 200,
      contentType: TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream",
      body: fs.readFileSync(archivo),
    });
  });

  const capturar = async (tpl: TemplateInfo): Promise<Captura> => {
    const avisos: string[] = [];
    html = renderInvitation({
      templateHtml: readTemplate(tpl.id),
      templateId: tpl.id,
      data: presetFor(tpl),
      preview: true,
    });
    await pagina.goto(`${ORIGEN}/`, { waitUntil: "networkidle" });

    // Recorrer la página para disparar las animaciones de aparición.
    await pagina.evaluate(async () => {
      const paso = window.innerHeight / 2;
      for (let y = 0; y < document.body.scrollHeight; y += paso) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    const sinRevelar = await pagina
      .waitForFunction(
        () => document.querySelectorAll(".reveal:not(.in)").length === 0,
        undefined,
        { timeout: 5000 }
      )
      .then(() => 0)
      .catch(() =>
        pagina.evaluate(() => document.querySelectorAll(".reveal:not(.in)").length)
      );
    if (sinRevelar) avisos.push(`${sinRevelar} secciones no se revelaron`);

    await pagina.evaluate(() => {
      document.querySelectorAll("img[loading='lazy']").forEach((i) => {
        (i as HTMLImageElement).loading = "eager";
      });
    });
    await pagina
      .waitForFunction(
        () => Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0),
        undefined,
        { timeout: 10000 }
      )
      .catch(() => avisos.push("alguna imagen no cargó a tiempo"));

    await pagina.evaluate(() => window.scrollTo(0, 0));
    await pagina.waitForTimeout(900);
    const imagen = await pagina.screenshot({ fullPage: true });
    const alto = await pagina.evaluate(() => document.body.scrollHeight);
    return { imagen, alto, avisos };
  };

  try {
    return await trabajo(capturar);
  } finally {
    await navegador.close();
  }
}
