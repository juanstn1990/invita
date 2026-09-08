/**
 * Capturas de los diseños, para poder revisarlos sin abrir el navegador.
 *
 *   npx tsx scripts/shots.ts                    todos
 *   npx tsx scripts/shots.ts invitacion-globos-nina
 *   npx tsx scripts/shots.ts --width 900        ancho de escritorio
 *
 * Chromium necesita nss, nspr y alsa-lib; en esta máquina no hay sudo, así
 * que se toman de los paquetes que ya trae conda.
 */
import fs from "fs";
import os from "os";
import path from "path";

const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
const libs = fs
  .readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d))
  .map((d) => path.join(CONDA, d, "lib"))
  .filter((d) => fs.existsSync(d));
process.env.LD_LIBRARY_PATH = [...libs, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");

import { chromium } from "playwright";
import { renderInvitation } from "../src/lib/render";
import { TEMPLATES, readTemplate } from "../src/lib/templates";
import { presetFor } from "../src/lib/presets";

const args = process.argv.slice(2);
const widthArg = args.indexOf("--width");
const width = widthArg > -1 ? Number(args[widthArg + 1]) : 390;
const ids = args.filter((a) => !a.startsWith("--") && a !== String(width));

const out = path.join(process.cwd(), ".preview", "shots");
fs.mkdirSync(out, { recursive: true });

const targets = ids.length ? TEMPLATES.filter((t) => ids.includes(t.id)) : TEMPLATES;

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width, height: 900 } });

  /* La página se carga desde una URL, no con `setContent`: así la prueba se
     parece a cómo se sirve de verdad y las rutas absolutas resuelven. */
  const ORIGEN = "https://invitacion.local";
  let paginaHtml = "";
  await page.route(`https://invitacion.local/`, (ruta) =>
    ruta.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: paginaHtml })
  );

  for (const tpl of targets) {
    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id),
      templateId: tpl.id,
      data: presetFor(tpl),
      preview: true,
    });
    paginaHtml = html;
    await page.goto(ORIGEN + "/", { waitUntil: "networkidle" });
    // Recorrer la página para disparar las animaciones de aparición.
    await page.evaluate(async () => {
      const step = window.innerHeight / 2;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    const pending = await page
      .waitForFunction(
        () => document.querySelectorAll(".reveal:not(.in)").length === 0,
        undefined,
        { timeout: 5000 }
      )
      .then(() => 0)
      .catch(async () => page.evaluate(() => document.querySelectorAll(".reveal:not(.in)").length));
    if (pending) console.log(`  ⚠ ${pending} secciones no se revelaron`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    const file = path.join(out, `${tpl.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const h = await page.evaluate(() => document.body.scrollHeight);
    console.log(`${tpl.id.padEnd(30)} ${width}×${h}`);
  }

  await browser.close();
  console.log(`\n→ ${out}`);
})();
