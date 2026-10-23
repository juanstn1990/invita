/**
 * Cataloga en la biblioteca los papeles rasgados que vienen con la app.
 *
 *   npm run media:papeles
 *
 * Los archivos viven en `public/disenos/papeles/` y se despliegan con el
 * código, así que el servidor MCP ya los acepta sin más —`esArteDelDiseno`
 * comprueba que el archivo exista—. Lo que falta es el **selector del
 * editor**, que no enseña el arte de los diseños: enseña la tabla `Media`.
 *
 * Por eso esto anota una fila por papel apuntando a su ruta de `/disenos`, y
 * no copia nada a `uploads/`: copiarlos dejaría dos ficheros iguales y una
 * invitación apuntando a la copia, que es justo lo que se evita en `mcp.ts`
 * con el arte de los diseños. Aquí el catálogo apunta al original.
 *
 * Es idempotente: se puede correr en cada despliegue.
 */
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

const DIR = path.join(process.cwd(), "public", "disenos", "papeles");

/** El nombre que se lee en el selector, a partir del archivo. */
const titulo = (archivo: string) =>
  "Papel rasgado " +
  path.basename(archivo, path.extname(archivo)).replace(/-/g, " ");

/** Las medidas salen de la cabecera del PNG, sin decodificarlo entero. */
function medidas(f: string): { width: number | null; height: number | null } {
  try {
    const b = fs.readFileSync(f).subarray(0, 24);
    if (b.length < 24 || b.readUInt32BE(12) !== 0x49484452) return { width: null, height: null };
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  } catch {
    return { width: null, height: null };
  }
}

async function main() {
  if (!fs.existsSync(DIR)) {
    console.log("No hay carpeta de papeles:", DIR);
    return;
  }
  const archivos = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".png"));
  let nuevos = 0;
  let ya = 0;

  for (const archivo of archivos) {
    const ruta = path.join(DIR, archivo);
    const url = `/disenos/papeles/${archivo}`;
    const { width, height } = medidas(ruta);
    const datos = {
      name: titulo(archivo),
      mime: "image/png",
      bytes: fs.statSync(ruta).size,
      width,
      height,
      /* Decoración, no una foto del evento: así sale en el estante que le
         toca cuando el campo pide un adorno. */
      kind: "adorno",
    };
    const antes = await prisma.media.findUnique({ where: { url } });
    await prisma.media.upsert({ where: { url }, create: { url, ...datos }, update: datos });
    if (antes) ya += 1;
    else nuevos += 1;
    console.log(`${antes ? "·" : "+"} ${url}  ${width}×${height}`);
  }

  console.log(`\n${nuevos} nuevo(s), ${ya} ya estaban.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
