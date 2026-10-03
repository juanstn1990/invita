/**
 * Los tres modos de la vista previa, en un navegador de verdad.
 *
 * Señalar y escribir sobre la invitación se apoyan en un `contenteditable` y
 * en mensajes entre dos ventanas: nada de eso se puede comprobar leyendo el
 * HTML, que es lo único que hacen las otras auditorías de marcado. Y lo que
 * más importa no es que funcionen, sino que **no** funcionen donde no toca:
 * en una invitación publicada esto sería dejar que quien la recibe reescriba
 * la fecha de la boda.
 */
/* El Chromium de Playwright viene sin NSS/NSPR en esta máquina; las de
   miniconda sirven. Igual que en `audit-adornos.ts`, y antes de importar
   Playwright: el enlazador lee la variable al lanzar el proceso hijo. */
import fs from "fs"; import os from "os"; import path from "path";
const CONDA = path.join(os.homedir(), "miniconda3/pkgs");
process.env.LD_LIBRARY_PATH = fs.readdirSync(CONDA)
  .filter((d) => /^(nss|nspr|alsa-lib)-\d/.test(d)).map((d) => path.join(CONDA, d, "lib")).join(":");

import { chromium } from "playwright";
import { TEMPLATES, readTemplate } from "../src/lib/templates";
import { BLOCKS, BLOCK_BY_TYPE, readLayout } from "../src/lib/blocks";
import { defaultData } from "../src/lib/schema";
import { renderInvitation } from "../src/lib/render";

const TPL = TEMPLATES[0];

const invitacion = (preview: boolean) =>
  renderInvitation({
    templateHtml: readTemplate(TPL.id), templateId: TPL.id,
    data: defaultData() as any, preview,
  });

/** La vista previa del editor: un iframe con `srcdoc`, igual que el editor. */
const conIframe = (html: string) =>
  `<!DOCTYPE html><body style="margin:0"><script>
     window.recibidos = [];
     addEventListener('message', function(e){
       if (e.data && e.data.inv) window.recibidos.push(e.data);
     });
     window.modo = function(m){
       document.getElementById('vp').contentWindow.postMessage({inv:'modo', modo:m}, '*');
     };
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
    const h = invitacion(false);
    decir(!h.includes("data-inv-texto"), "lo publicado no marca los textos");
    decir(!h.includes("data-inv-modo"), "lo publicado no lleva el guion de edición");
    decir(!h.includes("contenteditable"), "lo publicado no trae nada editable");
  }

  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const nueva = async () => {
    const page = await b.newPage({ viewport: { width: 420, height: 900 } });
    await page.setContent(conIframe(invitacion(true)));
    await page.waitForTimeout(350);
    return page;
  };

  /* ── 2 · Nace en «ver» y pide el modo ── */
  {
    const page = await nueva();
    const avisos: any[] = await page.evaluate("window.recibidos");
    decir(avisos.some((a) => a.inv === "listo"), "el marco avisa de que está listo");
    const modo = await page.frameLocator("#vp").locator("body")
      .evaluate((el) => el.ownerDocument.documentElement.getAttribute("data-inv-modo"));
    decir(modo === "ver", "nace en modo «ver»", `modo: ${modo}`);
    const n = await page.frameLocator("#vp").locator("[contenteditable]").count();
    decir(n === 0, "en «ver» no hay nada editable", n ? `hay ${n}` : "");
    await page.close();
  }

  /* ── 3 · En «ver», tocar no señala nada ── */
  {
    const page = await nueva();
    await page.frameLocator("#vp").locator("[data-inv-texto]").first().click();
    await page.waitForTimeout(150);
    const avisos: any[] = await page.evaluate("window.recibidos");
    const n = avisos.filter((a) => a.inv === "selecciona").length;
    decir(n === 0, "en «ver» tocar un texto no señala nada", n ? `señaló ${n}` : "");
    await page.close();
  }

  /* ── 4 · En «texto» se señala, y se dice qué campo es ── */
  {
    const page = await nueva();
    await page.evaluate("window.modo('texto')");
    await page.waitForTimeout(150);
    const el = page.frameLocator("#vp").locator("[data-inv-texto]").first();
    const path = await el.getAttribute("data-inv");
    await el.click();
    await page.waitForTimeout(150);
    const avisos: any[] = await page.evaluate("window.recibidos");
    const sel = avisos.filter((a) => a.inv === "selecciona").pop();
    decir(!!sel, "tocar un texto avisa al editor");
    decir(sel?.path === path, `avisa el campo correcto (${path})`, sel ? `dijo: ${sel.path}` : "");
    await page.close();
  }

  /* ── 5 · Escribir encima llega al editor ── */
  {
    const page = await nueva();
    await page.evaluate("window.modo('texto')");
    await page.waitForTimeout(150);
    const el = page.frameLocator("#vp").locator("[data-inv-texto]").first();
    const path = await el.getAttribute("data-inv");
    await el.click();
    await el.fill("");
    await el.type("ZZESCRITOZZ");
    /* Se avisa al salir del campo, no en cada tecla: un render por letra
       dejaría la vista previa parpadeando y el cursor en ninguna parte. */
    await page.frameLocator("#vp").locator("body").click({ position: { x: 2, y: 2 } });
    await page.waitForTimeout(250);
    const avisos: any[] = await page.evaluate("window.recibidos");
    const txt = avisos.filter((a) => a.inv === "texto").pop();
    decir(!!txt, "al salir del campo, el texto llega al editor");
    decir(txt?.valor === "ZZESCRITOZZ", "llega lo que se escribió", txt ? `llegó: ${JSON.stringify(txt.valor)}` : "");
    decir(txt?.path === path, "con el campo al que pertenece", txt ? `dijo: ${txt.path}` : "");
    await page.close();
  }

  /* ── 6 · Los campos de una ficha, con su número de ficha ──
     Viven en `map.lists` y no en `map.fields`, así que durante un rato no se
     marcaron: el itinerario entero se veía como no editable. Y sin el índice
     no se sabría **cuál** de las fichas se tocó. */
  {
    const page = await nueva();
    await page.evaluate("window.modo('texto')");
    await page.waitForTimeout(150);
    const fichas = page.frameLocator("#vp").locator('[data-inv="events.items.title"]');
    const cuantas = await fichas.count();
    decir(cuantas > 1, "los títulos del itinerario son editables", `hay ${cuantas}`);
    if (cuantas > 1) {
      const segunda = fichas.nth(1);
      await segunda.scrollIntoViewIfNeeded();
      await segunda.click();
      await page.waitForTimeout(150);
      const avisos: any[] = await page.evaluate("window.recibidos");
      const sel = avisos.filter((a) => a.inv === "selecciona").pop();
      decir(sel?.path === "events.items.title", "avisa el campo de la ficha",
        sel ? `dijo: ${sel.path}` : "");
      decir(sel?.indice === 1, "y de qué ficha se trata", `dijo: ${sel?.indice}`);
    }
    await page.close();
  }

  /* ── 7 · Lo que no se escribe aquí, al menos se señala ──
     El mensaje a los invitados lleva marcado, así que se edita en el panel y
     no sobre la invitación. Pero tocarlo tiene que llevar hasta él: marcarlo
     y no hacer nada más es el peor de los dos mundos. */
  {
    const page = await nueva();
    await page.evaluate("window.modo('texto')");
    await page.waitForTimeout(150);
    const rico = page.frameLocator("#vp").locator('[data-inv="guests.text"]').first();
    if (await rico.count()) {
      decir(
        (await rico.getAttribute("data-inv-texto")) === null,
        "el texto con formato no se edita sobre la invitación"
      );
      await rico.scrollIntoViewIfNeeded();
      await rico.click();
      await page.waitForTimeout(150);
      const avisos: any[] = await page.evaluate("window.recibidos");
      const sel = avisos.filter((a) => a.inv === "selecciona").pop();
      decir(sel?.path === "guests.text", "pero tocarlo sí lleva a su campo",
        sel ? `dijo: ${sel.path}` : "no avisó");
    }
    await page.close();
  }

  /* ── 8 · Con una variante puesta, todo sigue respondiendo ──
     El marcado de las variantes lo sintetiza `blocks.ts` y no trae los
     `data-inv` del esqueleto: el mapa los resuelve por clase, así que pintar
     funciona igual, pero la vista previa se quedaba sin nada que leer y
     dejaba de responder justo en lo que más se toca. Sin dar ningún error.

     Se comprueba sin navegador —es marcado— y en todas las rondas de
     variantes, no en una: el que se rompa será el que no se haya mirado. */
  {
    const datos: any = defaultData();
    const bloques = readLayout(datos);
    const ref = renderInvitation({
      templateHtml: readTemplate(TPL.id), templateId: TPL.id, data: datos, preview: true,
    });
    const rutas = (html: string, sec: string) =>
      new Set([...html.matchAll(/data-inv="([^"]+)"/g)]
        .map((m) => m[1]).filter((p) => p.split(".")[0] === sec));

    const rondas = Math.max(...BLOCKS.map((b) => b.variants.length)) - 1;
    const perdidas: string[] = [];
    for (let i = 1; i <= rondas; i++) {
      const d = JSON.parse(JSON.stringify(datos));
      d.layout = {
        ...(d.layout || {}),
        blocks: bloques.map((b) => {
          const vs = BLOCK_BY_TYPE[b.type]?.variants.filter((v) => v.id) || [];
          return vs.length ? { ...b, variant: vs[(i - 1) % vs.length].id } : b;
        }),
      };
      const out = renderInvitation({
        templateHtml: readTemplate(TPL.id), templateId: TPL.id, data: d, preview: true,
      });
      for (const b of bloques) {
        const sec = BLOCK_BY_TYPE[b.type]?.section || b.type;
        for (const p of rutas(ref, sec)) {
          if (!rutas(out, sec).has(p)) perdidas.push(`ronda ${i}: ${p}`);
        }
      }
    }
    decir(
      perdidas.length === 0,
      `con variante puesta no se pierde ninguna ruta (${rondas} rondas)`,
      perdidas.slice(0, 3).join(" · ")
    );
  }

  /* ── 9 · Dos bloques del mismo tipo se distinguen ──
     La ruta del campo es la misma en los dos (`paragraph.text`), así que sin
     el id del bloque el editor abría siempre el primero: con dos párrafos,
     la mitad de las veces el equivocado. */
  {
    const datos: any = defaultData();
    const bloques = readLayout(datos);
    const texto = (n: string) => ({ label: "", title: `TITULO-${n}`, text: `CUERPO-${n}` });
    datos["paragraph-a"] = texto("A");
    datos["paragraph-b"] = texto("B");
    datos.layout = {
      ...(datos.layout || {}),
      blocks: [
        ...bloques,
        { id: "paragraph-a", type: "paragraph", variant: "", data: texto("A") },
        { id: "paragraph-b", type: "paragraph", variant: "", data: texto("B") },
      ],
    };
    const page = await b.newPage({ viewport: { width: 420, height: 900 } });
    await page.setContent(conIframe(renderInvitation({
      templateHtml: readTemplate(TPL.id), templateId: TPL.id, data: datos, preview: true,
    })));
    await page.waitForTimeout(350);
    await page.evaluate("window.modo('texto')");
    await page.waitForTimeout(150);

    const segundo = page.frameLocator("#vp").locator('[data-inv-bloque="paragraph-b"]')
      .locator('[data-inv="paragraph.text"]').first();
    const hay = await segundo.count();
    decir(hay > 0, "el segundo párrafo se marca con su propio id", hay ? "" : "no está");
    if (hay) {
      await segundo.scrollIntoViewIfNeeded();
      await segundo.click();
      await page.waitForTimeout(150);
      const avisos: any[] = await page.evaluate("window.recibidos");
      const sel = avisos.filter((a) => a.inv === "selecciona").pop();
      decir(sel?.bloque === "paragraph-b", "y al tocarlo se avisa de cuál es",
        `dijo: ${sel?.bloque}`);
    }
    await page.close();
  }

  /* ── 10 · La pantalla de bienvenida se puede ver, y sólo si se pide ──
     Estaba apagada en el editor desde el primer día —tapa la pantalla entera
     y el marco se rehace en cada tecla—, y el efecto secundario era que no
     se podía ver nunca: se editaba a ciegas y sólo aparecía al abrir el
     enlace ya publicado. */
  {
    const datos: any = defaultData();
    datos.splash = { ...(datos.splash || {}), enabled: true };
    const pinta = (verSplash: boolean) =>
      renderInvitation({
        templateHtml: readTemplate(TPL.id), templateId: TPL.id,
        data: datos, preview: true, verSplash,
      });

    for (const pedida of [false, true]) {
      const page = await b.newPage({ viewport: { width: 420, height: 900 } });
      await page.setContent(conIframe(pinta(pedida)));
      await page.waitForTimeout(400);
      /* Se mide lo que se ve, no lo que está en el marcado: el elemento
         existe en los dos casos y lo que cambia es que se esconda. */
      const visible = await page.frameLocator("#vp").locator("#splash").isVisible()
        .catch(() => false);
      decir(
        visible === pedida,
        pedida
          ? "pidiéndola, la bienvenida se ve en el editor"
          : "sin pedirla, no estorba la vista normal",
        `visible: ${visible}`
      );
      await page.close();
    }

    /* Y que pedirla no sea una puerta trasera: en lo publicado manda el
       interruptor de la sección, no este parámetro del editor. */
    const publicada = renderInvitation({
      templateHtml: readTemplate(TPL.id), templateId: TPL.id,
      data: { ...datos, splash: { ...datos.splash, enabled: false } },
      verSplash: true,
    });
    decir(
      publicada.includes("splash") ? !publicada.includes("data-inv-texto") : true,
      "en lo publicado el parámetro del editor no pinta nada"
    );
  }

  /* ── 11 · Un adorno puede ser una frase, y se coloca como las piezas ──
     Lo que se pedía era «un texto que se pueda acomodar libremente», y eso
     es lo que un adorno ya sabía hacer con una imagen. */
  {
    const datos: any = defaultData();
    datos.splash = {
      ...(datos.splash || {}),
      enabled: true,
      adornos: [{ texto: "FRASE-LIBRE", sitio: "libre", x: "30", y: "70", tamano: "28" }],
    };
    const page = await b.newPage({ viewport: { width: 420, height: 900 } });
    await page.setContent(conIframe(renderInvitation({
      templateHtml: readTemplate(TPL.id), templateId: TPL.id,
      data: datos, preview: true, verSplash: true,
    })));
    await page.waitForTimeout(400);
    const marco = page.frameLocator("#vp");
    const frase = marco.locator(".inv-ad-texto").first();
    decir(await frase.isVisible().catch(() => false), "la frase se ve en la bienvenida");
    decir((await frase.innerText()).trim() === "FRASE-LIBRE", "y dice lo que se escribió");
    const caja = marco.locator("[data-inv-adorno]").first();
    decir(await caja.count() > 0, "y se puede agarrar como un adorno");
    /* Se coloca por coordenadas, igual que una pieza suelta. */
    const estilo = (await caja.getAttribute("style")) || "";
    decir(
      estilo.includes("--inv-ad-x:30%") && estilo.includes("--inv-ad-y:70%"),
      "en las coordenadas que se le dieron",
      estilo.slice(0, 60)
    );
    await page.close();

    /* Y en lo publicado sigue siendo contenido normal: ni marcas del editor
       ni nada que se pueda arrastrar. */
    const pub = renderInvitation({
      templateHtml: readTemplate(TPL.id), templateId: TPL.id, data: datos,
    });
    decir(pub.includes("FRASE-LIBRE"), "en lo publicado la frase también sale");
    decir(!pub.includes("data-inv-adorno"), "pero ahí no se puede mover");
  }

  /* ── 12 · Los nombres, de un color distinto en cada sitio ──
     Se escriben una vez y salen en tres —bienvenida, portada y pie, y en el
     pie en los 75 diseños—, así que el color del campo los pintaba los tres
     a la vez. Se comprueba el color **calculado**, no la regla: con dos
     reglas compitiendo, lo único que vale es cuál gana en el navegador. */
  {
    const datos: any = defaultData();
    datos.splash = { ...(datos.splash || {}), enabled: true, nombresColor: "#00aa00" };
    datos.hero = { ...(datos.hero || {}), nombresColor: "#0000ff" };
    datos.footer = { ...(datos.footer || {}), nombresColor: "#aa00aa" };
    /* Y con el color general puesto, para que de verdad haya un empate que
       resolver y no un hueco que rellenar. */
    datos.event = { ...(datos.event || {}), colors: { name1: "#ff0000" } };

    const page = await b.newPage({ viewport: { width: 420, height: 900 } });
    await page.setContent(conIframe(renderInvitation({
      templateHtml: readTemplate(TPL.id), templateId: TPL.id,
      data: datos, preview: true, verSplash: true,
    })));
    await page.waitForTimeout(400);
    const marco = page.frameLocator("#vp");

    const esperado: [string, string, string][] = [
      ["splash", "rgb(0, 170, 0)", "la bienvenida"],
      ["hero", "rgb(0, 0, 255)", "la portada"],
      ["footer", "rgb(170, 0, 170)", "el pie"],
    ];
    for (const [seccion, rgb, nombre] of esperado) {
      const el = marco.locator(`[data-inv-section="${seccion}"] [data-inv="event.names"]`).first();
      if (!(await el.count())) { decir(false, `${nombre} tiene los nombres`, "no está"); continue; }
      const color = await el.evaluate((n) => getComputedStyle(n as Element).color);
      decir(color === rgb, `los nombres de ${nombre} llevan su propio color`, `salió ${color}`);
    }
    await page.close();
  }

  /* ── 13 · Volver a «ver» apaga la edición ── */
  {
    const page = await nueva();
    await page.evaluate("window.modo('texto')");
    await page.waitForTimeout(150);
    const encendidos = await page.frameLocator("#vp").locator("[contenteditable]").count();
    await page.evaluate("window.modo('ver')");
    await page.waitForTimeout(150);
    const apagados = await page.frameLocator("#vp").locator("[contenteditable]").count();
    decir(encendidos > 0, "en «texto» los textos son editables", `son ${encendidos}`);
    decir(apagados === 0, "al volver a «ver» dejan de serlo", apagados ? `quedan ${apagados}` : "");
    await page.close();
  }

  await b.close();
  console.log(
    malos
      ? `\n${malos} comprobación(es) con problemas`
      : "\nLos tres modos hacen lo suyo, y sólo en el editor"
  );
  process.exit(malos ? 1 : 0);
})();
