/**
 * El punto de entrada del servidor MCP.
 *
 *   npx tsx scripts/mcp.ts
 *
 * Habla por la entrada estándar, así que se configura en el cliente (Claude
 * Code, Claude Desktop) como un comando, no como una URL. Ver el README.
 *
 * ── Por qué esto es un archivo aparte ────────────────────────────
 *
 * Sólo hace una cosa: plantarse en la raíz del proyecto antes de cargar nada
 * más. Un cliente MCP lanza el servidor desde donde le parece —su propio
 * directorio, la carpeta del usuario, `/`— y hay dos rutas que se resuelven
 * contra el directorio actual: `templates/`, de donde sale el marcado de cada
 * diseño, y `uploads/`, donde viven los archivos subidos. Lanzado desde otro
 * sitio el servidor arrancaba, listaba invitaciones sin problema, y sólo
 * fallaba al pedir `ver`, con un «ENOENT: /tmp/templates/…» que no se parece
 * en nada a la causa.
 *
 * Y es un archivo aparte porque **un `chdir` junto a los `import` no sirve**:
 * los imports se izan y se ejecutan antes que cualquier sentencia del módulo,
 * así que `templates.ts` ya había calculado su carpeta —al cargarse, no al
 * usarse— cuando llegaba el cambio de directorio. La primera versión estaba
 * escrita así y fallaba exactamente igual que antes. Un `import()` dinámico
 * es lo único que corre de verdad **después**.
 *
 * Se arregla aquí y no en `templates.ts` a propósito: ese archivo lo usan la
 * app, las auditorías y el build, y ahí el directorio actual siempre es la
 * raíz —también dentro del contenedor, donde el marcado está en
 * `/app/templates`—. Cambiarlo por un caso que sólo le pasa a este script
 * sería mover una pieza que no está rota y que sostiene todo lo demás.
 */

import path from "path";

process.chdir(path.join(__dirname, ".."));

import("./mcp-servidor").catch((e) => {
  /* Por la salida de error: la estándar es el canal del protocolo, y
     escribir ahí cualquier otra cosa rompe la conversación. */
  console.error("El servidor MCP no arrancó:", e);
  process.exit(1);
});
