/**
 * La llave del MCP, compartida por las rutas que la aceptan.
 *
 * El token se compara **entero y en tiempo constante**. Comparar con `===`
 * corta en la primera letra distinta, y esa diferencia de tiempo se puede
 * medir a través de la red para adivinar el token carácter a carácter.
 */

import crypto from "crypto";

/** Iguales, sin que el tiempo de la comparación diga cuánto coincidían. */
function iguales(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function autorizado(req: Request): boolean {
  const esperado = process.env.MCP_TOKEN || "";
  if (!esperado) return false;
  const cabecera = req.headers.get("authorization") || "";
  /* La llave también puede venir en la dirección (?clave=…).
     Los conectores de claude.ai no dejan añadir cabeceras: sólo piden un
     nombre y una URL, y la única autenticación que ofrecen es OAuth. Sin
     esto el servidor sólo servía a Claude Code. Es menos discreta que la
     cabecera —una URL puede acabar en un registro—, así que la llave tiene
     que ser larga y aleatoria, y se cambia si la dirección circula. */
  const enUrl = new URL(req.url).searchParams.get("clave") || "";
  const dado = (cabecera.replace(/^Bearer\s+/i, "").trim() || enUrl).trim();
  return !!dado && iguales(dado, esperado);
}

/** La respuesta cuando falta la llave o el MCP está apagado; null si pasa. */
export function sinLlave(req: Request): Response | null {
  if (!process.env.MCP_TOKEN) {
    return Response.json(
      {
        error:
          "El servidor MCP está apagado. Define MCP_TOKEN en el entorno de la " +
          "aplicación para encenderlo.",
      },
      { status: 503 }
    );
  }
  if (!autorizado(req)) {
    return Response.json(
      { error: "Hace falta una credencial: Authorization: Bearer <token>." },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="mcp"' } }
    );
  }
  return null;
}
