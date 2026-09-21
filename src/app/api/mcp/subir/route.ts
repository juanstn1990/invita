/**
 * Subir a la biblioteca con la llave del MCP, sin sesión de navegador.
 *
 *   curl -H "Authorization: Bearer $MCP_TOKEN" \
 *        -F kind=adorno -F file=@farolillo.png -F file=@sol.png \
 *        https://tuinvitacion.simpplee.com/api/mcp/subir
 *
 * Es la otra mitad de la herramienta `subir` del MCP. Aquella descarga de un
 * enlace, que es lo que se puede hacer desde un chat; ésta recibe los bytes,
 * que es lo que hace falta cuando la imagen está en el disco de quien trabaja
 * —los adornos que salen de `scripts/adornos-grok.py`—. Pasarlos por el MCP
 * en base64 obligaría al modelo a escribir el archivo entero letra por letra.
 */

import { sinLlave } from "@/lib/mcp-llave";
import { guardarEnBiblioteca, TIPOS_BIBLIOTECA, type TipoBiblioteca } from "@/lib/subir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const no = sinLlave(req);
  if (no) return no;

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Envío inválido." }, { status: 400 });

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "No llegó ningún archivo." }, { status: 400 });
  if (files.length > 12) return Response.json({ error: "Máximo 12 archivos a la vez." }, { status: 400 });

  const k = String(form.get("kind") || "adorno");
  const tipo: TipoBiblioteca = (TIPOS_BIBLIOTECA as readonly string[]).includes(k)
    ? (k as TipoBiblioteca)
    : "adorno";

  /* Uno a uno y sin parar en el primero que falle: de doce, que uno no sea
     una imagen no es razón para no subir los otros once. */
  const subidas = [];
  for (const f of files) {
    try {
      subidas.push(await guardarEnBiblioteca(Buffer.from(await f.arrayBuffer()), f.name, tipo));
    } catch (e) {
      subidas.push({ nombre: f.name, error: (e as Error).message });
    }
  }
  return Response.json({ subidas });
}
