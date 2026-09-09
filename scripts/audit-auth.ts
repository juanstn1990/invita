/**
 * Comprueba que ninguna ruta se quede sin cerradura por descuido.
 *
 * El riesgo aquí no es equivocarse hoy, es añadir mañana un
 * `src/app/api/algo/route.ts` y olvidar el guardia. Así que la regla se
 * invierte: todo handler está protegido salvo lo que aparezca en ABIERTAS,
 * y añadir algo a esa lista obliga a escribir por qué.
 */
import fs from "fs";
import path from "path";

const APP = path.join(process.cwd(), "src/app");

/** Lo que tiene que seguir abierto, y la razón. */
const ABIERTAS: Record<string, string> = {
  "[slug]/route.ts":
    "la invitación publicada; se comparte por WhatsApp con gente sin cuenta",
  "entrar/page.tsx": "la puerta",
  "api/salir/route.ts": "cerrar sesión no puede exigir sesión",
  "api/i/[slug]/rsvp/route.ts": "confirma un invitado, no el organizador",
  "api/media/[...path]/route.ts":
    "las imágenes de una invitación publicada se piden desde el navegador de cualquiera",
  "api/g/[token]/route.ts": "el token del enlace es la llave",
  "g/[token]/page.tsx": "el token del enlace es la llave",
};

const HANDLER = /export\s+(?:async\s+)?function\s+(GET|POST|PATCH|PUT|DELETE)\b/;

function recorrer(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return recorrer(p);
    return /^(route\.ts|page\.tsx)$/.test(e.name) ? [p] : [];
  });
}

const problemas: string[] = [];
const sobran = new Set(Object.keys(ABIERTAS));

for (const abs of recorrer(APP)) {
  const rel = path.relative(APP, abs);
  if (rel in ABIERTAS) {
    sobran.delete(rel);
    continue;
  }
  const src = fs.readFileSync(abs, "utf8");
  const esApi = abs.endsWith("route.ts");
  const guardado = esApi
    ? /noAutorizado\(\)/.test(src)
    : /requiereSesion\(/.test(src);

  if (esApi) {
    // Cada método exportado necesita el suyo, no basta con que el archivo lo mencione.
    const metodos = [...src.matchAll(new RegExp(HANDLER.source, "g"))].map((m) => m[1]);
    const guardias = (src.match(/noAutorizado\(\)/g) || []).length;
    if (metodos.length && guardias < metodos.length) {
      problemas.push(
        `${rel}: ${metodos.length} método(s) (${metodos.join(", ")}) y ${guardias} guardia(s)`,
      );
    }
  } else if (!guardado) {
    problemas.push(`${rel}: página sin requiereSesion()`);
  }
}

for (const r of sobran) problemas.push(`ABIERTAS menciona "${r}", que ya no existe`);

if (problemas.length) {
  console.error("✗ rutas sin cerradura:");
  problemas.forEach((p) => console.error("   " + p));
  process.exit(1);
}
console.log(
  `Todas las rutas cerradas; ${Object.keys(ABIERTAS).length} abiertas a propósito`,
);
