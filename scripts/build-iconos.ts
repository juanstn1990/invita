/**
 * Vendoriza el arte de Phosphor Icons a `src/lib/iconos.arte.ts`.
 *
 *   npm run iconos:build
 *
 * Se copia el interior de cada svg en un archivo del proyecto en vez de leerlo
 * de `node_modules` en tiempo de render, por dos razones: el renderer corre en
 * un route handler y no queremos que dependa del sistema de archivos, y así el
 * arte queda versionado con el resto del proyecto — actualizar Phosphor es
 * volver a correr esto y ver el diff.
 *
 * Sólo se copian los iconos que la tabla declara: son 37 de los 1512, y se
 * copian en dos pesos. Traerlos todos serían 3 MB de paths que nadie usa.
 */

import fs from "fs";
import path from "path";
import { ICONOS, ORNAMENTOS, PESOS, type Peso } from "../src/lib/iconos.datos";

const RAIZ = path.join(process.cwd(), "node_modules/@phosphor-icons/core/assets");
const SALIDA = path.join(process.cwd(), "src/lib/iconos.arte.ts");

/**
 * El archivo del icono. En Phosphor el peso `regular` no lleva sufijo en el
 * nombre y los otros cinco sí; el catálogo sólo usa `light` y `duotone`, que
 * lo llevan.
 */
const archivo = (peso: Peso, nombre: string) =>
  path.join(RAIZ, peso, `${nombre}-${peso}.svg`);

/** El interior del svg: los `<path>`, sin el envoltorio. */
function interior(peso: Peso, nombre: string): string {
  const f = archivo(peso, nombre);
  if (!fs.existsSync(f)) throw new Error(`No existe en Phosphor: ${nombre} (${peso})`);
  const svg = fs.readFileSync(f, "utf8");
  const m = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg);
  if (!m) throw new Error(`No pude leer el svg de ${nombre} (${peso})`);
  return m[1].replace(/\s+/g, " ").trim();
}

const necesarios = [
  ...new Set([...ICONOS.map((i) => i.fosforo), ...Object.values(ORNAMENTOS)]),
].sort();

const arte: Record<string, Record<string, string>> = {};
for (const peso of PESOS) {
  arte[peso] = {};
  for (const n of necesarios) arte[peso][n] = interior(peso, n);
}

const bytes = JSON.stringify(arte).length;

const cabecera = `/**
 * Arte de los iconos. **Generado** por \`npm run iconos:build\`.
 *
 * Sale de [Phosphor Icons](https://phosphoricons.com) (MIT), versión
 * ${JSON.parse(fs.readFileSync(path.join(process.cwd(), "node_modules/@phosphor-icons/core/package.json"), "utf8")).version}.
 * Es el interior de cada svg —los paths, sin envoltorio— indexado por peso y
 * por el nombre que tiene en Phosphor. El envoltorio lo pone \`iconoHtml\`.
 *
 * No se edita a mano: se cambia la tabla de \`iconos.datos.ts\` y se vuelve a
 * generar.
 */

import type { Peso } from "./iconos.datos";

export const ARTE: Record<Peso, Record<string, string>> = ${JSON.stringify(arte, null, 2)};
`;

fs.writeFileSync(SALIDA, cabecera);
console.log(
  `${necesarios.length} iconos × ${PESOS.length} pesos → src/lib/iconos.arte.ts (${(bytes / 1024).toFixed(0)} kb)`
);
