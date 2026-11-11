/**
 * La puerta por la que entra Chatwoot.
 *
 * Quien llama es el **servidor** de Chatwoot, nunca el navegador del agente:
 * el panel le habla a su propio Chatwoot, que ya sabe quién es, y es Chatwoot
 * el que viene aquí con la llave. Así la llave no viaja a ningún navegador y
 * esta app no necesita credenciales de Chatwoot: los mensajes de la
 * conversación llegan dentro de la petición.
 *
 * Apagada mientras no haya `CHATWOOT_TOKEN`, por lo mismo que el MCP: estas
 * rutas crean y modifican invitaciones.
 */

import crypto from "crypto";
import { prisma } from "./prisma";
import { TEMPLATE_BY_ID, KIND_LABEL } from "./templates";
import { ESTADO_POR_ID, estadoDe, PAGO_POR_ID, pagoDe } from "./tablero";

export const BASE = process.env.INVITA_URL || "https://tuinvitacion.simpplee.com";

function iguales(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** La respuesta cuando falta la llave o la integración está apagada. */
export function sinLlaveChatwoot(req: Request): Response | null {
  const esperado = process.env.CHATWOOT_TOKEN || "";
  if (!esperado) {
    return Response.json(
      { error: "La integración con Chatwoot está apagada. Define CHATWOOT_TOKEN para encenderla." },
      { status: 503 }
    );
  }
  const dado = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!dado || !iguales(dado, esperado)) {
    return Response.json({ error: "Hace falta la llave: Authorization: Bearer <token>." }, { status: 401 });
  }
  return null;
}

export const fallo = (error: string, status = 400) => Response.json({ error }, { status });

/** Un entero positivo, o undefined: los ids de Chatwoot llegan como vengan. */
export function entero(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

type Fila = {
  id: string; slug: string; title: string; templateId: string; published: boolean;
  estado: string; pago: string; updatedAt: Date; chatwootHasta: number | null;
  chatwootConversacion: number | null; manageToken: string | null;
};

export const CAMPOS_FICHA = {
  id: true, slug: true, title: true, templateId: true, published: true, estado: true,
  pago: true, updatedAt: true, chatwootHasta: true, chatwootConversacion: true,
  manageToken: true,
} as const;

/** Lo que el panel enseña de una invitación. */
export function ficha(i: Fila) {
  const tpl = TEMPLATE_BY_ID[i.templateId];
  const estado = estadoDe(i.estado);
  return {
    id: i.id,
    titulo: i.title,
    diseno: tpl?.name || i.templateId,
    ocasion: tpl ? KIND_LABEL[tpl.kind] : null,
    estado,
    estadoEtiqueta: ESTADO_POR_ID[estado].label,
    pago: PAGO_POR_ID[pagoDe(i.pago)].label,
    publicada: i.published,
    editable: estado !== "entregada" && !!tpl,
    editor: `${BASE}/editor/${i.id}`,
    enlace: i.published ? `${BASE}/${i.slug}` : null,
    /* Para pasárselo al cliente desde el chat. Vacío hasta que la
       invitación tenga llave; al crearla desde Chatwoot ya nace con ella. */
    multimedia: i.manageToken ? `${BASE}/m/${i.manageToken}` : null,
    vinculada: i.chatwootConversacion !== null,
    revisadoHasta: i.chatwootHasta,
    actualizada: i.updatedAt.toISOString(),
  };
}

/** Las invitaciones enlazadas a una conversación, la más reciente primero. */
export async function vinculadas(cuenta: number, conversacion: number) {
  const filas = await prisma.invitation.findMany({
    where: { chatwootCuenta: cuenta, chatwootConversacion: conversacion },
    select: CAMPOS_FICHA,
    orderBy: { updatedAt: "desc" },
  });
  return filas.map(ficha);
}
