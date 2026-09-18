/**
 * El filtro del bloque de HTML, con intentos de verdad.
 *
 *   npm run audit:html
 *
 * Este campo es el único sitio de la aplicación donde alguien escribe marcado
 * que acaba en el documento. Lo que se escriba sale en una página que abren
 * los invitados, y en la vista previa del editor sale dentro de un iframe
 * `srcdoc`, que **comparte origen con la aplicación**: un guion ahí corre con
 * la sesión de quien edita y puede llamar a la API en su nombre. La cookie es
 * `httpOnly` y no se puede leer, pero no hace falta leerla para usarla.
 *
 * Así que esto no es una prueba de formato: es la prueba de que el filtro
 * aguanta. Cada caso es una forma conocida de colar código, y lo que se
 * comprueba es que **no queda nada ejecutable**, no que el resultado se
 * parezca a algo.
 *
 * Se prueba por el renderer entero y no llamando a `sanearHtml` a secas: lo
 * que hay que garantizar es lo que sale en la invitación, y entre la función
 * y la página hay un binding que también podría equivocarse.
 */
import { parseHTML } from "linkedom";
import { renderInvitation } from "../src/lib/render";
import { defaultData } from "../src/lib/schema";
import { TEMPLATES, readTemplate } from "../src/lib/templates";
import { sanearHtml } from "../src/lib/sanear";

const publicado = (codigo: string) => {
  const d: any = defaultData();
  d.layout = {
    blocks: [{ id: "h1", type: "html", variant: "simple", data: { enabled: true, codigo } }],
  };
  return renderInvitation({
    templateHtml: readTemplate(TEMPLATES[0].id), templateId: TEMPLATES[0].id,
    data: d, slug: "demo",
  });
};

/** Lo que quedó dentro del bloque, ya en la invitación. */
const dentro = (codigo: string): string => {
  const { document } = parseHTML(publicado(codigo));
  return (document.querySelector("#inv-h1 .inv-html") as any)?.innerHTML || "";
};

type Caso = [string, string, (salida: string) => boolean];

const PELIGROSOS: Caso[] = [
  ["un script suelto", `<script>alert(1)</script><p>hola</p>`,
    (s) => !/script/i.test(s) && s.includes("hola")],
  ["un script con mayúsculas raras", `<ScRiPt>alert(1)</ScRiPt>`, (s) => !/alert/i.test(s)],
  ["un manejador de eventos", `<div onclick="alert(1)">toca</div>`,
    (s) => !/onclick/i.test(s) && s.includes("toca")],
  ["onerror en una imagen", `<img src=x onerror="alert(1)">`, (s) => !/onerror/i.test(s)],
  ["onload en un svg", `<svg onload="alert(1)"></svg>`, (s) => !/onload|svg/i.test(s)],
  ["un enlace javascript:", `<a href="javascript:alert(1)">pulsa</a>`,
    (s) => !/javascript:/i.test(s) && s.includes("pulsa")],
  ["un enlace data: con html", `<a href="data:text/html,<script>alert(1)</script>">x</a>`,
    (s) => !/data:text\/html/i.test(s)],
  ["un iframe a un sitio cualquiera", `<iframe src="https://malo.test/x"></iframe>`,
    (s) => !/malo\.test/.test(s)],
  ["un iframe javascript:", `<iframe src="javascript:alert(1)"></iframe>`,
    (s) => !/javascript:/i.test(s)],
  ["un formulario que roba", `<form action="https://malo.test"><input name="a"></form>`,
    (s) => !/malo\.test|<form|<input/i.test(s)],
  ["un style con @import", `<div style="background:url(javascript:alert(1))">x</div>`,
    (s) => !/javascript:/i.test(s)],
  ["una etiqueta style entera", `<style>body{display:none}</style><p>hola</p>`,
    (s) => !/<style|display:none/i.test(s) && s.includes("hola")],
  ["un comentario que esconde marcado", `<!--<script>alert(1)</script>--><p>hola</p>`,
    (s) => !/alert/i.test(s)],
  ["un objeto incrustado", `<object data="x.swf"></object>`, (s) => !/<object/i.test(s)],
  ["una base que secuestra los enlaces", `<base href="https://malo.test/">`,
    (s) => !/<base/i.test(s)],
  ["un meta refresh", `<meta http-equiv="refresh" content="0;url=https://malo.test">`,
    (s) => !/<meta|malo\.test/i.test(s)],
];

const LEGITIMOS: Caso[] = [
  ["texto con formato", `<p>Hola <strong>mundo</strong> y <em>algo más</em></p>`,
    (s) => s.includes("<strong>") && s.includes("<em>")],
  ["una tabla", `<table><tr><td>a</td><td>b</td></tr></table>`,
    (s) => s.includes("<td>") && s.includes("<table>")],
  ["un enlace normal", `<a href="https://ejemplo.com" target="_blank">ver</a>`,
    (s) => s.includes("https://ejemplo.com") && s.includes("noopener")],
  ["una imagen", `<img src="https://ejemplo.com/f.jpg" alt="foto">`,
    (s) => s.includes("f.jpg") && s.includes('alt="foto"')],
  ["estilos en línea", `<div style="color:red;padding:8px">x</div>`,
    (s) => s.includes("color:red")],
  ["un iframe de Spotify", `<iframe src="https://open.spotify.com/embed/track/abc"></iframe>`,
    (s) => s.includes("open.spotify.com") && s.includes("sandbox")],
  ["uno de YouTube", `<iframe src="https://www.youtube.com/embed/abc"></iframe>`,
    (s) => s.includes("youtube.com") && s.includes('loading="lazy"')],
  ["un mapa de Google", `<iframe src="https://www.google.com/maps/embed?pb=x"></iframe>`,
    (s) => s.includes("google.com/maps")],
];

let malos = 0;
const correr = (titulo: string, casos: Caso[]) => {
  console.log(`\n${titulo}`);
  for (const [nombre, codigo, comprueba] of casos) {
    let ok = false;
    let salida = "";
    try { salida = dentro(codigo); ok = comprueba(salida); } catch { ok = false; }
    if (!ok) malos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : `  → ${salida.slice(0, 70)}`}`);
  }
};

correr("Lo que no puede pasar:", PELIGROSOS);
correr("Lo que sí tiene que pasar:", LEGITIMOS);

/* Y que un bloque vacío no deje un hueco. */
{
  const { document } = parseHTML(publicado("<script>alert(1)</script>"));
  const bloque = document.querySelector("#inv-h1") as any;
  const vacio = !bloque || bloque.getAttribute("hidden") !== null;
  if (!vacio) malos++;
  console.log(`\n  ${vacio ? "✓" : "✗"} si no queda nada, el bloque se esconde`);
}

/* Lo que se quitó se puede decir, para avisar a quien lo escribió. */
{
  const { quitado } = sanearHtml(`<script>a</script><div onclick="b">x</div>`);
  const dice = quitado.length >= 2;
  if (!dice) malos++;
  console.log(`  ${dice ? "✓" : "✗"} informa de lo que quitó: ${quitado.join(", ")}`);
}

console.log(
  malos
    ? `\n${malos} agujeros`
    : `\nEl filtro aguanta los ${PELIGROSOS.length} intentos y deja pasar los ${LEGITIMOS.length} usos legítimos`
);
process.exit(malos ? 1 : 0);
