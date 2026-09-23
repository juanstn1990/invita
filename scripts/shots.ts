/**
 * Capturas de los diseños, para poder revisarlos sin abrir el navegador.
 *
 *   npm run templates:shots                     todos
 *   npx tsx scripts/shots.ts invitacion-rosal   uno
 *   npx tsx scripts/shots.ts --width 900        ancho de escritorio
 *
 * Capturar bien tiene su miga —servir el arte, revelar las secciones,
 * despertar las imágenes `lazy`— y eso vive en `lib/capturas.ts`, que se
 * comparte con `audit:visual`. Aquí sólo se guardan los archivos.
 */
import fs from "fs";
import path from "path";
import { conNavegador, elegidos } from "./lib/capturas";

const args = process.argv.slice(2);
const anchoArg = args.indexOf("--width");
const ancho = anchoArg > -1 ? Number(args[anchoArg + 1]) : 390;
const ids = args.filter((a) => !a.startsWith("--") && a !== String(ancho));

const salida = path.join(process.cwd(), ".preview", "shots");
fs.mkdirSync(salida, { recursive: true });

(async () => {
  await conNavegador(ancho, async (capturar) => {
    for (const tpl of elegidos(ids)) {
      const { imagen, alto, avisos } = await capturar(tpl);
      fs.writeFileSync(path.join(salida, `${tpl.id}.png`), imagen);
      for (const a of avisos) console.log(`  ⚠ ${a}`);
      console.log(`${tpl.id.padEnd(30)} ${ancho}×${alto}`);
    }
  });
  console.log(`\n→ ${salida}`);
})();
