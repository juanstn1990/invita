/**
 * El servidor MCP, servido por la app desplegada.
 *
 * Así es como se conecta un asistente a las invitaciones **de producción**
 * sin sacar la base de datos a internet. El servidor ya está donde están los
 * datos y los archivos subidos; lo único que faltaba era una puerta.
 *
 * ── Apagado mientras no haya llave ───────────────────────────────
 *
 * Sin `MCP_TOKEN` en el entorno, esta ruta responde 503 y no monta nada. No
 * es una comodidad: estas herramientas **crean y modifican invitaciones**, y
 * una dirección pública que las ofrezca sin credencial es un formulario de
 * escritura abierto al que llegue. Que el estado por defecto sea «apagada»
 * significa que desplegar esto sin querer no abre nada, y que encenderlo es
 * un acto deliberado con una llave que alguien tuvo que generar.
 *
 * El token se compara **entero y en tiempo constante**. Comparar con `===`
 * corta en la primera letra distinta, y esa diferencia de tiempo se puede
 * medir a través de la red para adivinar el token carácter a carácter. Es un
 * ataque viejo y conocido y cuesta cuatro líneas no tenerlo.
 *
 * ── Sin capturas, y se dice ──────────────────────────────────────
 *
 * `ver` devuelve el enlace en vez de una foto: Playwright es una dependencia
 * de desarrollo y el contenedor de producción no la trae —ni debería, son
 * cuatrocientos megas de navegador para una captura—. El servidor por stdio,
 * que corre desde el proyecto, sí la hace. La diferencia se declara en la
 * respuesta en vez de disimularse.
 */

import crypto from "crypto";
import { construirServidor } from "@/lib/mcp-servidor";
import { WebStandardStreamableHTTPServerTransport } from
  "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

/* Node y no Edge: por debajo hay Prisma, `fs` para leer los diseños y
   `crypto`. Y dinámica, porque cada petición trae su propia sesión. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Iguales, sin que el tiempo de la comparación diga cuánto coincidían. */
function iguales(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function autorizado(req: Request): boolean {
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

const BASE = process.env.INVITA_URL || "https://tuinvitacion.simpplee.com";

async function atender(req: Request): Promise<Response> {
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

  /*
   * Un transporte por petición, sin sesión.
   *
   * Sin `sessionIdGenerator` el transporte trabaja suelto: cada petición se
   * atiende y se cierra. Es lo que pide este despliegue —puede haber varias
   * copias del contenedor detrás del balanceador, y una sesión abierta en
   * una no la conoce la siguiente—, y lo que se pierde a cambio son los
   * avisos que el servidor manda por su cuenta, que aquí no hay ninguno.
   */
  const transporte = new WebStandardStreamableHTTPServerTransport({});
  const servidor = construirServidor({ base: BASE });
  await servidor.connect(transporte);
  return transporte.handleRequest(req);
}

export const POST = atender;
export const GET = atender;
export const DELETE = atender;
