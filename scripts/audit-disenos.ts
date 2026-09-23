/**
 * El lint de los diseños.
 *
 *   npm run audit:disenos
 *
 * Los 42 diseños que son sólo tokens no se rompen nunca. Los 18 que escriben
 * CSS propio concentran las 1.300 reglas a mano y **todos** los fallos que
 * hemos tenido. Esta auditoría comprueba, sobre el código fuente de cada
 * diseño, las trampas que ya nos costaron un despliegue:
 *
 * 1. CSS muerto: reglas que apuntan a una sección que esa plantilla no
 *    tiene. No se ve nunca y nadie lo nota; queda de copiar el CSS de otro
 *    diseño, que es como se empieza uno. (Apuntar por `#id` ya no es un
 *    problema: desde que el bloque se escribe dentro de la sección del
 *    diseño, conserva su id y el CSS le llega igual.)
 * 2. Arte que no existe. Una ruta con una errata no avisa: sale un hueco.
 * 3. Un adorno declarado apuntando a un archivo que no está.
 * 4. Pintar sobre `.ornament` mientras se declara una filigrana para esa
 *    misma sección. El adorno quita el hueco horneado, así que el dibujo que
 *    colgaba de él desaparece — que es exactamente cómo Rosal perdió los
 *    novios del dress code.
 * 5. Arte demasiado pesado. Una invitación se abre en un teléfono con datos.
 *
 * Es estática: lee los archivos, no arranca nada. Corre en dos segundos y
 * por eso puede correr siempre.
 */
import fs from "fs";
import path from "path";
import { DESIGNS } from "../src/lib/design/designs";
import { SECCIONES_CON_TITULO } from "../src/lib/design/theme";
import { BLOCKS } from "../src/lib/blocks";

/** Todas las variantes que existen, para cazar las escritas de memoria. */
const VARIANTES = new Set(
  BLOCKS.flatMap((b) => b.variants.map((v) => v.id || "propia"))
);

const RAIZ = process.cwd();
const DIR_DISENOS = path.join(RAIZ, "src/lib/design/designs");
const PUBLICO = path.join(RAIZ, "public");

/** Las secciones del esqueleto, con la clave de datos que les toca. */
const BLOQUE_DE: Record<string, string> = {
  countdown: "countdown", guests: "guests", events: "events", gallery: "gallery",
  features: "features", gifts: "gifts", social: "social", confirmation: "confirm",
};

/** El marcado horneado de un diseño, para saber qué secciones trae. */
function plantillaDe(slug: string): string {
  const f = path.join(RAIZ, "templates", `invitacion-${slug}.html`);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
}

/** Cuánto puede pesar el arte de un diseño antes de que estorbe. */
const TECHO_KB = 900;

interface Aviso {
  diseno: string;
  regla: string;
  detalle: string;
}

const avisos: Aviso[] = [];
const avisa = (diseno: string, regla: string, detalle: string) =>
  avisos.push({ diseno, regla, detalle });

/** El cuerpo de la plantilla `css` de un diseño, tal cual se escribió. */
function cssDe(fuente: string): string {
  const i = fuente.indexOf("const css = ");
  if (i < 0) return "";
  const abre = fuente.indexOf("`", i);
  if (abre < 0) return "";
  const cierra = fuente.indexOf("`;", abre + 1);
  return cierra < 0 ? "" : fuente.slice(abre + 1, cierra);
}

/** Las rutas de arte que usa un archivo, resueltas contra `public/`. */
function artePorDiseno(css: string, base: string): string[] {
  const rutas = new Set<string>();
  for (const m of css.matchAll(/url\(\$\{A\}\/([\w./-]+)\)/g)) {
    rutas.add(`${base}/${m[1]}`);
  }
  for (const m of css.matchAll(/url\((\/disenos\/[\w./-]+)\)/g)) rutas.add(m[1]);
  return [...rutas];
}

for (const d of DESIGNS) {
  const archivo = fs
    .readdirSync(DIR_DISENOS)
    .map((f) => path.join(DIR_DISENOS, f))
    .find((f) => {
      const s = fs.readFileSync(f, "utf8");
      return new RegExp(`slug:\\s*["']${d.slug}["']`).test(s);
    });
  if (!archivo) continue;

  const fuente = fs.readFileSync(archivo, "utf8");
  const css = cssDe(fuente);
  const base = (fuente.match(/const A = "([^"]+)"/) || [])[1] || "";

  /* 1 · CSS que apunta a una sección que la plantilla no tiene. */
  const plantilla = plantillaDe(d.slug);
  if (plantilla) {
    for (const id of Object.keys(BLOQUE_DE)) {
      const veces = (css.match(new RegExp(`#${id}\\b`, "g")) || []).length;
      if (veces && !plantilla.includes(`id="${id}"`)) {
        avisa(d.slug, "CSS muerto",
          `#${id} se estila ${veces} veces y la plantilla no tiene esa sección`);
      }
    }
    /* Y variantes que no existen: se escriben de memoria y se equivocan. */
    for (const m of css.matchAll(/\.inv-v-([\w-]+)/g)) {
      if (!VARIANTES.has(m[1])) {
        avisa(d.slug, "variante inventada", `.inv-v-${m[1]} no existe en ningún bloque`);
      }
    }
  }

  /* 2 · Arte que no existe. */
  for (const ruta of artePorDiseno(css, base)) {
    if (!fs.existsSync(path.join(PUBLICO, ruta))) {
      avisa(d.slug, "arte que falta", `el CSS pide ${ruta} y no está en public/`);
    }
  }

  /* 3 · Adornos declarados apuntando a un archivo que no está. */
  for (const a of d.adornos || []) {
    if (!a.url.startsWith("/")) continue;
    if (!fs.existsSync(path.join(PUBLICO, a.url))) {
      avisa(d.slug, "adorno sin archivo", `${a.seccion} → ${a.url}`);
    }
  }

  /* 4 · Pintar sobre .ornament donde ya hay filigrana declarada.
     El adorno «bajo el título» quita el hueco horneado, así que el dibujo
     que colgaba de él se va con él sin avisar. */
  const conFiligrana = new Set(
    (d.adornos || []).flatMap((a) =>
      a.sitio !== "titulo" ? [] : a.seccion === "*" ? SECCIONES_CON_TITULO : [a.seccion]
    )
  );
  for (const m of css.matchAll(/(^|\n)([^\n{]*\.ornament[^\n{]*)\{((?:[^{}]|\$\{[^{}]*\})*)\}/g)) {
    const sel = m[2].trim();
    if (!/url\(/.test(m[3])) continue;
    const id = (sel.match(/#(\w+)/) || [])[1];
    const clave = id ? BLOQUE_DE[id] || id : "";
    if (clave && conFiligrana.has(clave)) {
      avisa(d.slug, "ornamento pisado",
        `${sel} pinta sobre .ornament, pero ${clave} ya declara filigrana: ` +
        `el adorno se lleva el hueco y el dibujo desaparece`);
    }
  }

  /* 5 · Peso del arte. */
  if (base) {
    const dir = path.join(PUBLICO, base);
    if (fs.existsSync(dir)) {
      const kb = fs
        .readdirSync(dir)
        .reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) / 1024;
      if (kb > TECHO_KB) {
        avisa(d.slug, "arte pesado", `${Math.round(kb)} kb (el techo son ${TECHO_KB})`);
      }
    }
  }
}

/* ── Informe ─────────────────────────────────────────────────── */

const porRegla = new Map<string, Aviso[]>();
for (const a of avisos) {
  porRegla.set(a.regla, [...(porRegla.get(a.regla) || []), a]);
}

for (const [regla, lista] of porRegla) {
  console.log(`\n✗ ${regla} — ${lista.length}`);
  for (const a of lista) console.log(`    ${a.diseno.padEnd(14)} ${a.detalle}`);
}

const conCss = DESIGNS.filter((d) => d.css).length;
console.log(
  `\n${DESIGNS.length} diseños · ${conCss} con CSS propio · ` +
    `${avisos.length} aviso${avisos.length === 1 ? "" : "s"}`
);
if (!avisos.length) console.log("Los diseños están limpios.");
process.exit(avisos.length ? 1 : 0);
