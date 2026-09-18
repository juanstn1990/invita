import fs from "fs"; import os from "os"; import path from "path";
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
process.env.LD_LIBRARY_PATH = fs.readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d)).map((d) => path.join(CONDA, d, "lib")).join(":");
import { chromium } from "playwright";
import { presetFor } from "../src/lib/presets";
import { TEMPLATES, readTemplate } from "../src/lib/templates";
import { renderInvitation } from "../src/lib/render";

const ITEMS = [
  { icon: "💍", title: "Ceremonia", note: "Comienzo de la ceremonia de boda.", time: "4:00 p.m." },
  { icon: "🥂", title: "Recepción", note: "Bienvenida y cóctel con música.", time: "5:00 p.m." },
  { icon: "🎉", title: "Fiesta", note: "Música y baile para todos.", time: "8:00 p.m." },
];
/* Los dos layouts: el normal y el de pantalla estrecha, que cambia el hueco
   del medallón. A 360px sólo se probaba el segundo, así que romper el
   primero no lo notaba nadie. */
const ANCHOS = [430, 360];

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  let malos = 0;
  for (const t of TEMPLATES) {
    const d: any = presetFor(t);
    d.events = { ...d.events, enabled: true, title: "Itinerario", items: ITEMS };
    d.layout = { blocks: [{ id: "ev", type: "events", variant: "itinerario" }] };
    const html = renderInvitation({ templateHtml: readTemplate(t.id), templateId: t.id, data: d, slug: "x" });
    const f: string[] = [];

    for (const ancho of ANCHOS) {
      const page = await b.newPage({ viewport: { width: ancho, height: 800 } });
      await page.route("**/*", (r) => r.request().url().endsWith("/")
        ? r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }) : r.abort());
      await page.goto("https://x.local/", { waitUntil: "domcontentloaded" });
      await page.evaluate(`(() => { try { if (typeof enterSite==='function') enterSite(); } catch(e){}
        var c=document.querySelector('.inv-cortina'); if(c) c.remove();
        var s=document.getElementById('splash')||document.querySelector('.splash'); if(s) s.style.display='none';
        document.body.style.overflow=''; document.documentElement.style.overflow='';
        var m=document.getElementById('main'); if(m){m.style.opacity='1';m.style.visibility='visible';}
        [].forEach.call(document.querySelectorAll('[data-inv-anim]'),function(e){e.classList.add('in')}); })()`);
      await page.waitForTimeout(220);

      const r: any = await page.evaluate(`(() => {
        var caja = document.querySelector('.inv-ev-itinerario');
        if (!caja) return { fallo: 'no hay itinerario' };
        var med = caja.querySelector('.event-icon');
        var tit = caja.querySelector('.event-title');
        var nota = caja.querySelector('.event-note');
        var hora = caja.querySelector('.event-time');
        if (!med || !tit || !hora || !nota) return { fallo: 'falta una pieza' };
        var m = med.getBoundingClientRect(), T = tit.getBoundingClientRect();
        var N = nota.getBoundingClientRect(), H = hora.getBoundingClientRect();
        return {
          w: Math.round(m.width), h: Math.round(m.height),
          redondo: getComputedStyle(med).borderTopLeftRadius,
          solapa: T.left < m.right - 0.5,
          orden: T.top <= N.top && N.top <= H.top,
          izq: Math.round(m.left),
          scrollH: document.documentElement.scrollWidth > window.innerWidth,
          oculto: getComputedStyle(med).display === 'none',
        };
      })()`);
      await page.close();

      const p = (s: string) => f.push(`${ancho}px: ${s}`);
      if (r.fallo) { p(r.fallo); continue; }
      if (r.oculto) p("el medallón no se ve");
      if (Math.abs(r.w - r.h) > 1) p(`medallón ovalado ${r.w}x${r.h}`);
      if (!String(r.redondo).includes("50%")) p(`no es redondo (${r.redondo})`);
      if (r.solapa) p("el texto pisa el medallón");
      if (!r.orden) p("el orden no es título→nota→hora");
      if (r.izq < 0) p(`el medallón se sale por la izquierda (${r.izq}px)`);
      if (r.scrollH) p("barra horizontal");
    }

    if (f.length) malos++;
    console.log(`${f.length ? "✗" : "✓"} ${t.id.padEnd(28)}${f.join(" · ")}`);
  }
  await b.close();
  console.log(malos ? `\n${malos} de ${TEMPLATES.length} con problemas`
    : `\nEl itinerario se ve bien en los ${TEMPLATES.length}, en los dos anchos`);
})();
