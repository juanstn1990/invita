/**
 * La línea base visual de los 68 diseños.
 *
 *   npm run audit:visual              compara contra la base
 *   npm run audit:visual -- --aceptar guarda lo de ahora como base
 *   npx tsx scripts/audit-visual.ts invitacion-rosal   sólo uno
 *
 * Por qué existe: un cambio en el motor toca los 68 a la vez, y hasta hoy la
 * única forma de saber si algo se había movido era abrirlos de uno en uno.
 * Así se fue a producción una migración que dejó sin arte a las invitaciones
 * publicadas —lo vio el cliente, no nosotros—.
 *
 * Qué guarda. No la captura: una **huella**. Cada diseño se reduce a una
 * rejilla de 16×256 en gris, que cabe en unos kilobytes y se puede versionar
 * con el código. Es sensible a lo que importa —que una pieza desaparezca,
 * que una sección crezca, que el orden cambie— y sorda a lo que no: el
 * antialias, los segundos de la cuenta atrás, el brillo que recorre un
 * nombre. Se elige una rejilla fija y no proporcional para que dos alturas
 * distintas sigan siendo comparables: si la invitación crece, la huella
 * entera se desplaza y la distancia lo canta.
 *
 * Qué hacer cuando salta: mirar la captura de `.preview/shots/`, decidir si
 * el cambio era el que se buscaba, y `--aceptar` si lo era.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { conNavegador, elegidos } from "./lib/capturas";

const REJILLA = { ancho: 16, alto: 256 };
/* Los umbrales salen de medir, no de la intuición: dos corridas iguales del
   mismo diseño dan media ~0 y pico ~0; quitar dos esquinas da pico 30. */
const UMBRAL = 2.5;
const UMBRAL_PICO = 12;
/** Y un crecimiento así ya no es antialias. */
const UMBRAL_ALTO = 12;

const BASE = path.join(process.cwd(), "scripts", "visual.base.json");
const SHOTS = path.join(process.cwd(), ".preview", "shots");

interface Huella {
  alto: number;
  /** La rejilla en gris, en base64: 16×256 bytes. */
  rejilla: string;
}

const args = process.argv.slice(2);
const aceptar = args.includes("--aceptar");
/** Para elegir los umbrales con datos y no a ojo. */
const detalle = args.includes("--detalle");
const ids = args.filter((a) => !a.startsWith("--"));

const base: Record<string, Huella> = fs.existsSync(BASE)
  ? JSON.parse(fs.readFileSync(BASE, "utf8"))
  : {};

/**
 * Cuánto se movió una huella respecto de otra, en dos números.
 *
 * La media sola no vale: una esquina que desaparece ocupa treinta celdas de
 * cuatro mil, así que la media apenas se entera —se probó, y no lo vio—. El
 * pico es la celda que más cambió, y ésa sí lo canta. Los dos juntos separan
 * «se movió la composición entera» de «faltó una pieza».
 */
function distancia(a: string, b: string): { media: number; pico: number } {
  const x = Buffer.from(a, "base64");
  const y = Buffer.from(b, "base64");
  if (x.length !== y.length) return { media: 100, pico: 100 };
  let suma = 0;
  let pico = 0;
  for (let i = 0; i < x.length; i++) {
    const d = Math.abs(x[i] - y[i]);
    suma += d;
    if (d > pico) pico = d;
  }
  return { media: (suma / x.length / 255) * 100, pico: (pico / 255) * 100 };
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const ahora: Record<string, Huella> = {};
  const movidos: [string, number, number, number, number][] = [];
  const nuevos: string[] = [];

  await conNavegador(390, async (capturar) => {
    for (const tpl of elegidos(ids)) {
      const { imagen, alto, avisos } = await capturar(tpl);
      for (const a of avisos) console.log(`  ⚠ ${tpl.id}: ${a}`);
      fs.writeFileSync(path.join(SHOTS, `${tpl.id}.png`), imagen);

      const rejilla = await sharp(imagen)
        .grayscale()
        .resize(REJILLA.ancho, REJILLA.alto, { fit: "fill" })
        .raw()
        .toBuffer();
      const huella: Huella = { alto, rejilla: rejilla.toString("base64") };
      ahora[tpl.id] = huella;

      const antes = base[tpl.id];
      if (!antes) {
        nuevos.push(tpl.id);
        continue;
      }
      const { media, pico } = distancia(antes.rejilla, huella.rejilla);
      const dAlto = huella.alto - antes.alto;
      if (detalle) {
        console.log(`  ${tpl.id.padEnd(30)} media ${media.toFixed(2)} · pico ${pico.toFixed(1)} · alto ${dAlto >= 0 ? "+" : ""}${dAlto}`);
      }
      if (media > UMBRAL || pico > UMBRAL_PICO || Math.abs(dAlto) > UMBRAL_ALTO) {
        movidos.push([tpl.id, media, pico, antes.alto, huella.alto]);
      }
    }
  });

  if (aceptar) {
    fs.writeFileSync(BASE, JSON.stringify({ ...base, ...ahora }, null, 1) + "\n");
    console.log(
      `\nLínea base guardada: ${Object.keys(ahora).length} diseños` +
        (movidos.length ? ` (${movidos.length} habían cambiado)` : "")
    );
    process.exit(0);
  }

  for (const id of nuevos) console.log(`+ ${id.padEnd(30)} sin línea base todavía`);
  for (const [id, media, pico, antes, hoy] of movidos) {
    const alto = antes === hoy ? `${hoy}` : `${antes} → ${hoy}`;
    console.log(
      `✗ ${id.padEnd(30)} media ${media.toFixed(1)} · pico ${pico.toFixed(0)} · alto ${alto}`
    );
  }

  const comparados = Object.keys(ahora).length - nuevos.length;
  console.log(
    `\n${comparados} diseños comparados · ${movidos.length} se movieron` +
      (nuevos.length ? ` · ${nuevos.length} sin base` : "")
  );
  if (movidos.length) {
    console.log(
      `Mira las capturas en .preview/shots y, si el cambio era el que buscabas,\n` +
        `guárdalo con: npm run audit:visual -- --aceptar`
    );
  } else if (!nuevos.length) {
    console.log("Ninguno se movió.");
  }
  process.exit(movidos.length ? 1 : 0);
})();
