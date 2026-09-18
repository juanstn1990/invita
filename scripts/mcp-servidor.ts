/**
 * El servidor MCP por la entrada estándar.
 *
 * El punto de entrada es `scripts/mcp.ts`, que se planta en la raíz del
 * proyecto antes de cargar esto. Aquí no se toca el directorio actual.
 *
 * Las seis herramientas viven en `src/lib/mcp-servidor.ts`, compartidas con
 * la ruta HTTP de la app. Lo único de aquí es el transporte y la captura:
 * Playwright está en el proyecto y no en el contenedor de producción, así
 * que la versión que corre desde aquí sí puede enseñar cómo quedó.
 */

import fs from "fs";
import os from "os";
import path from "path";

/* Chromium necesita nss, nspr y alsa-lib; en esta máquina no hay sudo, así
   que se toman de los paquetes que ya trae conda. Igual que en `shots.ts` y
   en las auditorías de navegador. */
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
if (fs.existsSync(CONDA)) {
  process.env.LD_LIBRARY_PATH = fs
    .readdirSync(CONDA)
    .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d))
    .map((d) => path.join(CONDA, d, "lib"))
    .join(":");
}

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { construirServidor } from "../src/lib/mcp-servidor";

/** Dónde vive la app, para armar los enlaces que se devuelven. */
const BASE = process.env.INVITA_URL || "http://localhost:3000";

/**
 * La captura, con Playwright.
 *
 * Antes de disparar hay que abrir el velo —`enterSite`, la puerta que definen
 * los 50 diseños—, retirar la cortina y dar por vistas las entradas al
 * asomarse. Sin eso la captura es la pantalla de bienvenida y media página en
 * blanco, que es justo lo que no hace falta revisar.
 */
async function capturar(html: string, ancho: number): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const page = await b.newPage({ viewport: { width: ancho, height: 900 } });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.evaluate(`(() => {
      try { if (typeof enterSite === 'function') enterSite(); } catch (e) {}
      var c = document.querySelector('.inv-cortina'); if (c) c.remove();
      var s = document.getElementById('splash') || document.querySelector('.splash');
      if (s) s.style.display = 'none';
      document.body.style.overflow = '';
      [].forEach.call(document.querySelectorAll('[data-inv-anim]'),
        function(e){ e.classList.add('in'); });
    })()`);
    await page.waitForTimeout(900);
    return await page.screenshot({ fullPage: true });
  } finally {
    await b.close();
  }
}

construirServidor({ base: BASE, capturar })
  .connect(new StdioServerTransport())
  .catch((e) => {
    /* Por la salida de error: la estándar es el canal del protocolo, y
       escribir ahí cualquier otra cosa rompe la conversación. */
    console.error("El servidor MCP no arrancó:", e);
    process.exit(1);
  });
