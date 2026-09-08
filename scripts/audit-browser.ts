/**
 * Auditoría en navegador de los 27 diseños.
 *
 * Renderiza cada uno con foto de portada y de galería, lo abre en Chromium y
 * revisa tres cosas que sólo se ven ejecutando la página:
 *
 *  1. Que ningún script del template lance errores.
 *  2. Que no salga ni una petición a un dominio externo de imágenes.
 *  3. Que la foto del organizador siga puesta después de que corran los
 *     scripts — los templates traían uno que la pisaba.
 *
 *   npm run audit:browser
 */
import fs from "fs"; import os from "os"; import path from "path";
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
process.env.LD_LIBRARY_PATH = fs.readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d)).map((d) => path.join(CONDA, d, "lib")).join(":");

import { chromium } from "playwright";
import { renderInvitation } from "../src/lib/render";
import { presetFor } from "../src/lib/presets";
import { TEMPLATES, readTemplate } from "../src/lib/templates";

const PORTADA = "https://ejemplo.test/portada.jpg";
const FOTO = "https://ejemplo.test/galeria.jpg";
/** Dominios que ninguna invitación debería contactar. */
const AJENOS = /fixdate\.io|unsplash|picsum|pexels/i;

/** Origen falso desde el que se sirve la invitación en la prueba. */
const ORIGEN = "https://invitacion.local";

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });

  let malos = 0;
  for (const tpl of TEMPLATES) {
    // Una página nueva por diseño: compartirla hace que los `const` de un
    // template choquen con los del anterior y el informe sale lleno de ruido
    // que no existe en la vida real.
    const page = await b.newPage({ viewport: { width: 390, height: 900 } });
    // Las imágenes de ejemplo no existen: se responden en blanco para no esperar.
    await page.route("**/ejemplo.test/**", (r) =>
      r.fulfill({ status: 200, contentType: "image/gif",
        body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") })
    );
    // La página se sirve desde una URL y no con `setContent`: así la prueba se
    // parece a cómo se sirve de verdad y las rutas absolutas resuelven.

    const errores: string[] = [];
    const externas: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message.split("\n")[0]));
    page.on("request", (r) => {
      if (AJENOS.test(r.url())) externas.push(r.url().slice(0, 60));
    });

    const data = presetFor(tpl);
    (data.hero as any).backgroundUrl = PORTADA;
    (data.gallery as any).items = [{ url: FOTO }, { url: FOTO }, { url: FOTO }];

    const html = renderInvitation({
      templateHtml: readTemplate(tpl.id), templateId: tpl.id, data, preview: true,
    });
    await page.route(`${ORIGEN}/`, (r) =>
      r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html })
    );
    await page.goto(`${ORIGEN}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    /* ¿Los adornos miden lo que deberían?
       Esta comprobación existe por un fallo real: al reorganizar el CSS se
       perdieron las reglas de `.orn-pieza`, el envoltorio dejó de ser un
       bloque en línea, y el adorno bajo cada título pasó a medir los 256px
       naturales del svg en los 27 diseños. Las otras auditorías no lo vieron
       porque miran el marcado y los errores de JavaScript, no los tamaños. */
    const adornosGrandes: string[] = await page.evaluate(`(() => {
      var malos = [];
      // El contenedor del adorno ocupa el ancho de la sección a propósito:
      // sólo su alto dice si la pieza de dentro se desbordó.
      document.querySelectorAll('.ornament').forEach(function (el) {
        var h = el.getBoundingClientRect().height;
        if (h > 80) malos.push('ornament alto ' + Math.round(h));
      });
      // La pieza y los iconos sí deben medir poco en las dos direcciones.
      document.querySelectorAll('.orn-pieza, .inv-ico').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width > 80 || r.height > 80) {
          malos.push(el.getAttribute('class') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
      });
      return malos.slice(0, 3);
    })()`);

    // ¿La foto del organizador sobrevivió a los scripts del template?
    const sobrevive = await page.evaluate((url) => {
      const fondo = Array.from(document.querySelectorAll<HTMLElement>("*")).some((n) =>
        (n.style.backgroundImage || "").includes(url)
      );
      const imagen = Array.from(document.querySelectorAll("img")).some((n) =>
        n.getAttribute("src")?.includes(url)
      );
      return fondo || imagen;
    }, FOTO);

    await page.close();

    const ok = !errores.length && !externas.length && sobrevive && !adornosGrandes.length;
    if (!ok) malos++;
    console.log(
      `${ok ? "✓" : "✗"} ${tpl.id.padEnd(28)}` +
        `${errores.length ? `  ${errores.length} error(es): ${errores[0]}` : ""}` +
        `${externas.length ? `  pide ${externas[0]}` : ""}` +
        `${sobrevive ? "" : "  FOTO PISADA"}` +
        `${adornosGrandes.length ? `  adorno gigante: ${adornosGrandes[0]}` : ""}`
    );
  }

  await b.close();
  console.log(malos ? `\n${malos} diseños con problemas` : "\nLos 27 corren limpio en el navegador");
  process.exit(malos ? 1 : 0);
})();
