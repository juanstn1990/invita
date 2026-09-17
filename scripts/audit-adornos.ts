/**
 * Arrastrar un adorno y volver a dibujarlo tienen que coincidir.
 *
 *   npm run audit:adornos
 *
 * Son dos códigos distintos hablando del mismo sistema de coordenadas: el
 * guion de arrastre mide en píxeles dentro del iframe y reporta porcentajes,
 * y el renderer convierte esos porcentajes en `left`/`top`. Si uno mide desde
 * el centro de la pieza y el otro desde su esquina, el adorno **salta al
 * soltarlo** — y eso no lo ve ninguna prueba de marcado, porque el marcado es
 * correcto en los dos casos.
 *
 * Se comprueba el viaje redondo: se suelta en un punto conocido, se toma lo
 * que reporta, se vuelve a dibujar con eso, y se mide dónde quedó.
 *
 * Y que nada de esto viaje en lo publicado: un guion que deja mover la
 * decoración a quien recibe la invitación.
 */
import fs from "fs"; import os from "os"; import path from "path";
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
process.env.LD_LIBRARY_PATH = fs.readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d)).map((d) => path.join(CONDA, d, "lib")).join(":");

import { chromium } from "playwright";
import { renderInvitation } from "../src/lib/render";
import { defaultData } from "../src/lib/schema";
import { TEMPLATES, readTemplate } from "../src/lib/templates";

const ORIGEN = "https://invitacion.local";
const TPL = TEMPLATES[0];
/** Un cuadrado opaco: hace falta que mida algo para poder agarrarlo. */
const PNG = (() => {
  const w = 200, h = 200;
  const zlib = require("zlib") as typeof import("zlib");
  const crudo = Buffer.concat(
    Array.from({ length: h }, () =>
      Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 180)])
    )
  );
  const trozo = (t: string, d: Buffer) => {
    const c = Buffer.concat([Buffer.from(t), d]);
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(d.length);
    /* El CRC a mano: `zlib.crc32` no está en todas las versiones de Node. */
    let n = ~0;
    for (const b of c) {
      n ^= b;
      for (let k = 0; k < 8; k++) n = (n >>> 1) ^ (0xedb88320 & -(n & 1));
    }
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE((~n) >>> 0);
    return Buffer.concat([largo, c, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", ihdr), trozo("IDAT", zlib.deflateSync(crudo)), trozo("IEND", Buffer.alloc(0)),
  ]);
})();

const invitacion = (preview: boolean, adorno: Record<string, string>) => {
  const d: any = defaultData();
  d.gallery = { ...d.gallery, adornos: [adorno] };
  return renderInvitation({
    templateHtml: readTemplate(TPL.id), templateId: TPL.id, data: d, preview,
  });
};

/** La vista previa del editor vive en un iframe con `srcdoc`: se reproduce igual. */
const conIframe = (html: string) =>
  `<!DOCTYPE html><body style="margin:0"><script>
     window.recibidos = [];
     addEventListener('message', function(e){
       if (e.data && e.data.inv === 'adorno') window.recibidos.push(e.data);
     });
   </script><iframe id="vp" style="width:420px;height:900px;border:0" srcdoc="${
     html.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
   }"></iframe></body>`;

(async () => {
  let malos = 0;
  const decir = (ok: boolean, txt: string, extra = "") => {
    if (!ok) malos++;
    console.log(`${ok ? "✓" : "✗"} ${txt}${extra ? `  ${extra}` : ""}`);
  };

  /* ── 1 · Lo publicado no lleva nada de esto ── */
  {
    const h = invitacion(false, { url: "https://ejemplo.test/a.png", sitio: "arriba-izq", tamano: "20" });
    decir(!h.includes("data-inv-adorno"), "lo publicado no marca los adornos");
    decir(!h.includes("inv-ad-agarrado"), "lo publicado no lleva el guion de arrastre");
  }

  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const nuevaPagina = async (html: string) => {
    const page = await b.newPage({ viewport: { width: 420, height: 900 } });
    await page.route("**/ejemplo.test/**", (r) =>
      r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
    await page.route(`${ORIGEN}/`, (r) =>
      r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
    await page.goto(`${ORIGEN}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    return page;
  };

  /* ── 2 · El de a sangre no se arrastra ── */
  {
    const page = await nuevaPagina(conIframe(invitacion(true, {
      url: "https://ejemplo.test/a.png", sitio: "sangre", tamano: "100",
    })));
    const n = await page.frameLocator("#vp").locator("[data-inv-adorno]").count();
    decir(n === 0, "el adorno a sangre no se puede arrastrar", n ? `hay ${n}` : "");
    await page.close();
  }

  /* ── 3 · El viaje redondo, en tres puntos ── */
  for (const [px, py] of [[25, 60], [10, 15], [80, 85]] as [number, number][]) {
    const page = await nuevaPagina(conIframe(invitacion(true, {
      url: "https://ejemplo.test/a.png", sitio: "arriba-izq", tamano: "20",
    })));
    const marco = page.frameLocator("#vp");
    const caja = marco.locator("[data-inv-adorno]").first();
    await marco.locator("#gallery").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    const iframeCaja = (await page.locator("#vp").boundingBox())!;
    const sec = await marco.locator("#gallery").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, w: r.width, h: r.height };
    });
    const desde = (await caja.boundingBox())!;
    await page.mouse.move(desde.x + desde.width / 2, desde.y + desde.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      iframeCaja.x + sec.left + (sec.w * px) / 100,
      iframeCaja.y + sec.top + (sec.h * py) / 100,
      { steps: 8 }
    );
    await page.mouse.up();
    await page.waitForTimeout(200);

    const avisos: any[] = await page.evaluate("window.recibidos");
    await page.close();

    if (avisos.length !== 1) {
      decir(false, `soltar en ${px}/${py} avisa una vez`, `avisos: ${avisos.length}`);
      continue;
    }
    const a = avisos[0];
    const cerca = Math.abs(a.x - px) <= 2 && Math.abs(a.y - py) <= 2;
    decir(cerca, `soltar en ${px}/${py} reporta ${a.x}/${a.y}`);
    if (!cerca) continue;

    /* Y ahora la otra mitad: dibujarlo con eso y medir dónde quedó. */
    const page2 = await nuevaPagina(invitacion(false, {
      url: "https://ejemplo.test/a.png", sitio: "libre", tamano: "20",
      x: String(a.x), y: String(a.y),
    }));
    const medido = await page2.evaluate(`(() => {
      var el = document.querySelector('#gallery .inv-adorno');
      var sec = document.querySelector('#gallery');
      var r = el.getBoundingClientRect(), s = sec.getBoundingClientRect();
      return {
        x: ((r.left + r.width / 2 - s.left) / s.width) * 100,
        y: ((r.top + r.height / 2 - s.top) / s.height) * 100,
      };
    })()`) as { x: number; y: number };
    await page2.close();

    const clava = Math.abs(medido.x - a.x) <= 1.5 && Math.abs(medido.y - a.y) <= 1.5;
    decir(
      clava,
      `dibujado en ${a.x}/${a.y} queda en ${medido.x.toFixed(1)}/${medido.y.toFixed(1)}`
    );
  }

  await b.close();
  console.log(
    malos
      ? `\n${malos} comprobaciones con problemas`
      : "\nArrastrar y dibujar coinciden: el adorno se queda donde se suelta"
  );
  process.exit(malos ? 1 : 0);
})();
