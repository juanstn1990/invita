/**
 * Controles del panel que no cambian nada.
 *
 * `support.ts` **declara** el soporte en vez de detectarlo: da por hecho que
 * todos los diseños salen del mismo esqueleto y traen todos los campos. Esto
 * comprueba si sigue siendo verdad, y lo comprueba por el único camino que no
 * miente: escribir el campo y mirar si el HTML cambia. Un control que sale en
 * el panel y no cambia nada es peor que uno ausente — se usa, no pasa nada, y
 * no hay forma de saber si el fallo es del diseño o de quien edita.
 */
import { TEMPLATES, TEMPLATE_BY_ID, readTemplate } from "../src/lib/templates";
import { templateSupport } from "../src/lib/support";
import { presetFor } from "../src/lib/presets";
import { renderInvitation } from "../src/lib/render";
import { SECTIONS } from "../src/lib/schema";

/** Un valor de prueba distinto del que ya hay, según el tipo del campo. */
function valorDe(f: any, crudo: unknown): unknown {
  /* Vacío, nulo y ausente son lo mismo para el renderer —«lo que trae el
     diseño»—, así que normalizarlos es lo que evita proponer como "cambio"
     un valor que ya estaba puesto. Sin esto la auditoría acusa de mudo a
     cualquier desplegable cuyo campo aún no se ha tocado. */
  const actual = crudo === undefined || crudo === null ? "" : String(crudo);
  const dif = (a: unknown, b: unknown) => (actual === String(a) ? b : a);
  switch (f.type) {
    case "text": case "textarea": return dif("ZZPRUEBAZZ", "YYPRUEBAYY");
    case "url": return dif("https://ejemplo.test/zz", "https://ejemplo.test/yy");
    case "tel": return dif("+573001112233", "+573004445566");
    case "datetime": return dif("2031-07-15T18:30", "2032-08-16T19:30");
    case "image": case "video": case "audio": case "medio":
      return dif("/api/media/2099/01/" + "a".repeat(24) + ".jpg",
                 "/api/media/2099/01/" + "b".repeat(24) + ".jpg");
    case "color": return dif("#123456", "#654321");
    case "emoji": return dif("corazon", "estrella");
    case "range": {
      const min = f.min ?? 0, max = f.max ?? 100;
      return dif(String(min), String(max));
    }
    case "select": {
      const vals = (f.options || []).map((o: any) => String(o.value));
      if (vals.length < 2) return null;
      /* Vacío significa «la primera opción», así que hay que comparar contra
         el valor efectivo y no contra la cadena vacía. */
      const efectivo = actual || vals[0];
      return vals.find((v: string) => v !== efectivo) ?? null;
    }
    default: return null;
  }
}

const soloDisenos = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const lista = soloDisenos.length
  ? TEMPLATES.filter((t) => soloDisenos.includes(t.id))
  : TEMPLATES;

const SPEC = new Map(SECTIONS.map((s) => [s.key, s]));

/**
 * ¿El panel enseña de verdad este campo?
 *
 * Misma regla que `SectionEditor`: un campo con `showIf` sólo aparece si el
 * otro campo de su sección tiene el valor que pide. Sin esto la auditoría
 * acusa a controles que el panel nunca llegó a ofrecer —la opacidad de un
 * fondo que no se ha puesto— y el informe se llena de ruido.
 */
function visible(spec: any, f: any, d: any): boolean {
  if (!f.showIf) return true;
  const valores = [f.showIf.value].flat().map(String);
  return [f.showIf.key].flat().some((llave: string) => {
    const actual = String(d[spec.key]?.[llave] ?? "");
    if (valores.includes("*")) return actual.trim() !== "";
    const efectivo =
      actual ||
      String(spec.fields.find((o: any) => o.key === llave)?.options?.[0]?.value ?? "");
    return valores.includes(efectivo);
  });
}

/** Lo que hay que poner para que el panel llegue a enseñar este campo. */
function destrabar(spec: any, f: any, d: any): boolean {
  if (!f.showIf) return true;
  /* Con varias llaves basta destrabar la primera: la regla es "alguna". */
  const llave = [f.showIf.key].flat()[0] as string;
  const dep = spec.fields.find((o: any) => o.key === llave);
  if (!dep) return false;
  const valores = [f.showIf.value].flat().map(String);
  d[spec.key][llave] = valores.includes("*") ? (valorDe(dep, "") ?? "x") : valores[0];
  return visible(spec, f, d);
}
const mudos = new Map<string, string[]>();   // campo -> diseños donde no hace nada
let probados = 0;

for (const tpl of lista) {
  const html = readTemplate(tpl.id);
  const base = presetFor(TEMPLATE_BY_ID[tpl.id]) as any;
  const render = (d: any) =>
    renderInvitation({ templateId: tpl.id, templateHtml: html, data: d, slug: "x",
      /* Las etiquetas de «Al compartir» sólo se emiten con un origen: sin él
         esos campos parecerían mudos y no lo son. */
      origin: "https://ejemplo.test" } as any);

  for (const path of templateSupport(tpl.id).fields) {
    if (path.includes("@") || path.includes(".items")) continue;
    const [sec, campo] = path.split(".");
    const spec = SPEC.get(sec);
    const f = spec?.fields.find((x: any) => x.key === campo);
    if (!f) continue;

    const d = JSON.parse(JSON.stringify(base));
    d[sec] = { ...(d[sec] || {}) };
    /* Primero se destraba (para que el panel lo enseñe) y la referencia se
       mide YA destrabado: si no, el cambio del campo del que depende se
       contaría como si lo hubiera hecho este control. */
    if (!destrabar(spec, f, d)) continue;
    const ref = render(d);

    const nuevo = valorDe(f, d[sec]?.[campo]);
    if (nuevo === null) continue;
    d[sec][campo] = nuevo;
    /* Una sección apagada no dibuja nada, y entonces ningún campo suyo
       cambiaría el HTML: eso no es un control roto, es una sección cerrada. */
    if (d[sec].enabled === false) continue;
    probados++;

    if (render(d) === ref) {
      (mudos.get(path) ?? mudos.set(path, []).get(path)!).push(tpl.id);
    }
  }
}

const total = lista.length;
console.log(`Diseños: ${total} · comprobaciones: ${probados}\n`);
console.log("=== Controles que no cambian nada ===");
const filas = [...mudos].sort((a, b) => b[1].length - a[1].length);
for (const [campo, ds] of filas) {
  const todos = ds.length === total;
  console.log(`${String(ds.length).padStart(3)}/${total}  ${campo}${todos ? "   ← en TODOS" : ""}`);
}
console.log(`\nCampos afectados: ${mudos.size}`);

const parciales = filas.filter(([, ds]) => ds.length < total);
if (parciales.length) {
  console.log("\n=== Los que fallan sólo en algunos diseños (lo más confuso) ===");
  for (const [campo, ds] of parciales) {
    console.log(`\n${campo}  (${ds.length}/${total})`);
    console.log(`   ${ds.join(", ")}`);
  }
}
