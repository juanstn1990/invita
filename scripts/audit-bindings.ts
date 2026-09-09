/**
 * Verifica el contrato de atributos entre el esquema y los templates.
 *
 *   npm run audit:bindings
 *   npm run audit:bindings -- --full     # campo por campo, con su texto
 *
 * Antes esta auditoría comprobaba si los selectores del mapa acertaban en
 * cada diseño y reportaba 213 combinaciones campo/diseño sin mapear, todas en
 * los 14 hechos a mano. Ahora comprueba dos cosas, y las dos importan:
 *
 * 1. **Que no falte nada**: todo campo del esquema tiene su `data-inv` en
 *    todos. Si falta, el editor ofrecería un campo que no se escribe en
 *    ningún sitio.
 * 2. **Que no sobre nada**: todo `data-inv` del marcado corresponde a un
 *    campo del esquema. Si sobra, es un atributo que quedó de un campo que se
 *    renombró y nadie escribe nunca — el error silencioso de este diseño.
 */

import { parseHTML } from "linkedom";
import { mapFor } from "../src/lib/bindings";
import { SECTIONS } from "../src/lib/schema";
import { TEMPLATES, readTemplate } from "../src/lib/templates";

const full = process.argv.includes("--full");
const map = mapFor();

/** Todos los `data-inv` que el esquema espera encontrar. */
const esperados = new Set<string>();
for (const s of SECTIONS) {
  for (const f of s.fields) {
    const path = `${s.key}.${f.key}`;
    if (map.fields[path]) esperados.add(path);
  }
  if (!s.list) continue;
  for (const f of s.list.fields) {
    if (map.lists[s.key]?.fields[f.key]) esperados.add(`${s.key}.items.${f.key}`);
  }
}
// Los globales viven en varias secciones; su clave no sale de un campo suelto.
["event.names", "event.dateLabel", "event.quote"].forEach((k) =>
  esperados.add(k)
);
/*
 * Éstos, por definición, no llevan atributo propio:
 *
 * - `name1` y `name2` los escribe la operación `couple` sobre
 *   `event.names`, que respeta la estructura del "&" de cada diseño.
 * - `city` sólo alimenta la línea del pie (ver `footer.dateLine`).
 * - `panelOpacity` no escribe texto: inyecta una regla CSS.
 * - `mapSrc` es un campo calculado del bloque de Ubicación, que sólo existe
 *   como marcado sintetizado.
 * - `splash.mapUrl` es el href del botón secundario del velo, y ese elemento
 *   lleva ya el `data-inv` de su texto (`splash.ctaSecondary`): un elemento
 *   sólo puede llevar un atributo, así que el href se resuelve por la clase
 *   `.splash-btn-mapa`.
 */
[
  "event.name1",
  "event.name2",
  "event.city",
  "hero.panelOpacity",
  "ubicacion.mapSrc",
  "splash.mapUrl",
].forEach((k) => esperados.delete(k));

// La rejilla de invitados no se edita, pero su marcado existe y se vacía.
["guests.items.name", "guests.items.role", "guests.items.initial"].forEach((k) =>
  esperados.add(k)
);

const clip = (s: string) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 40 ? t.slice(0, 39) + "…" : t;
};

let faltan = 0;
let sobran = 0;
const porCampo: Record<string, string[]> = {};

for (const tpl of TEMPLATES) {
  const { document } = parseHTML(readTemplate(tpl.id));
  const lineas: string[] = [];

  /* 1 · Presentes en el marcado */
  const presentes = new Map<string, number>();
  for (const el of Array.from(document.querySelectorAll("[data-inv]")) as any[]) {
    const k = el.getAttribute("data-inv");
    presentes.set(k, (presentes.get(k) || 0) + 1);
  }

  /* 2 · Las secciones */
  for (const s of SECTIONS) {
    /* `event` son los datos comunes —nombres, fecha, ciudad— y se escriben en
       la portada, el velo y el pie, no en una sección propia. `compartir` no
       se dibuja en la página: alimenta las etiquetas Open Graph del `<head>`
       (ver el paso 5 de `renderInvitation`), y `marca` es una capa que se
       añade encima de todo. Ninguna de las tres tiene, ni debe tener, un
       `data-inv-section` que buscar. */
    if (s.key === "event" || s.key === "compartir" || s.key === "marca") continue;
    if (!document.querySelector(`[data-inv-section="${s.key}"]`)) {
      lineas.push(`  ✗ SECCIÓN ${s.key}`);
      faltan++;
      (porCampo[`§${s.key}`] ||= []).push(tpl.id);
    }
  }

  /* 3 · Las listas */
  for (const s of SECTIONS) {
    if (!s.list) continue;
    const cont = document.querySelector(`[data-inv-list="${s.key}"]`);
    if (!cont) {
      lineas.push(`  ✗ LISTA ${s.key}`);
      faltan++;
      (porCampo[`${s.key}.items[]`] ||= []).push(tpl.id);
      continue;
    }
    const n = cont.querySelectorAll("[data-inv-item]").length;
    if (!n) {
      lineas.push(`  ✗ LISTA ${s.key} sin fichas`);
      faltan++;
    } else if (full) {
      lineas.push(`  ✓ lista ${s.key.padEnd(10)} ${n} fichas`);
    }
  }

  /* 4 · Lo que falta */
  for (const path of esperados) {
    if (presentes.has(path)) {
      if (full) {
        const el = document.querySelector(`[data-inv="${path}"]`) as any;
        const veces = presentes.get(path)!;
        lineas.push(
          `  ✓ ${path.padEnd(26)} ${veces > 1 ? `×${veces} ` : "   "}` +
            `“${clip(el?.textContent || el?.getAttribute?.("class") || "")}”`
        );
      }
      continue;
    }
    lineas.push(`  ✗ ${path.padEnd(26)} sin data-inv en el marcado`);
    faltan++;
    (porCampo[path] ||= []).push(tpl.id);
  }

  /* 5 · Lo que sobra */
  for (const [path] of presentes) {
    if (esperados.has(path)) continue;
    lineas.push(`  ⚠ ${path.padEnd(26)} atributo sin campo en el esquema`);
    sobran++;
    (porCampo[`+${path}`] ||= []).push(tpl.id);
  }

  const problemas = lineas.some((l) => l.includes("✗") || l.includes("⚠"));
  if (full) console.log(`\n━━ ${tpl.id}\n${lineas.join("\n")}`);
  else if (problemas)
    console.log(`\n━━ ${tpl.id}\n${lineas.filter((l) => !l.includes("✓")).join("\n")}`);
}

if (Object.keys(porCampo).length) {
  console.log("\n━━ Agrupado por campo ━━");
  Object.entries(porCampo)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([k, v]) =>
      console.log(`  ${k.padEnd(30)} ${v.length}/${TEMPLATES.length}`)
    );
}

console.log(
  `\n${TEMPLATES.length} diseños · ${esperados.size} campos · ` +
    `${faltan} sin marcado · ${sobran} atributos de más`
);
if (faltan || sobran) process.exit(1);
console.log(`El marcado y el esquema coinciden en los ${TEMPLATES.length}.`);
