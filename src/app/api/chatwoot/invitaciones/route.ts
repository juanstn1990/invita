/**
 * Las invitaciones vistas desde una conversación de Chatwoot.
 *
 * GET  ?cuenta=&conversacion=   las que están enlazadas a esa conversación
 * GET  ?buscar=                 para enlazar una que ya existe
 * POST                          crea una, ya enlazada, partiendo de un origen
 */

import { prisma } from "@/lib/prisma";
import { CAMPOS_FICHA, entero, fallo, ficha, sinLlaveChatwoot, vinculadas } from "@/lib/chatwoot";
import { crearDesde, cuantosOrigenes, partidaDe } from "@/lib/partida";
import { rutaMultimedia } from "@/lib/multimedia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const q = new URL(req.url).searchParams;
  const buscar = (q.get("buscar") || "").trim();
  if (q.has("buscar")) {
    /* Sin las muestras: enlazar una conversación a una muestra del catálogo
       sería escribirle encima los datos de un cliente. */
    const filas = await prisma.invitation.findMany({
      where: {
        archivada: false,
        estado: { not: "catalogo" },
        ...(buscar
          ? {
              OR: [
                { title: { contains: buscar, mode: "insensitive" as const } },
                { slug: { contains: buscar, mode: "insensitive" as const } },
                { telefono: { contains: buscar } },
              ],
            }
          : {}),
      },
      select: CAMPOS_FICHA,
      orderBy: { updatedAt: "desc" },
      take: 25,
    });
    return Response.json({ invitaciones: filas.map(ficha) });
  }

  const cuenta = entero(q.get("cuenta"));
  const conversacion = entero(q.get("conversacion"));
  if (!cuenta || !conversacion) return fallo("Hacen falta `cuenta` y `conversacion`.");
  return Response.json({ invitaciones: await vinculadas(cuenta, conversacion) });
}

export async function POST(req: Request) {
  const no = sinLlaveChatwoot(req);
  if (no) return no;

  const body = await req.json().catch(() => ({}));
  const cuenta = entero(body.cuenta);
  const conversacion = entero(body.conversacion);
  if (!cuenta || !conversacion) return fallo("Hacen falta `cuenta` y `conversacion`.");

  /* El origen se elige siempre: es lo único que no se deduce del chat. */
  const tipo = String(body.origen?.tipo || "");
  const id = String(body.origen?.id || "");
  const origen = {
    ...(tipo === "diseno" ? { diseno: id } : {}),
    ...(tipo === "plantilla" ? { plantilla: id } : {}),
    ...(tipo === "invitacion" ? { invitacion: id } : {}),
  };
  if (!id || cuantosOrigenes(origen) !== 1) {
    return fallo("Hay que elegir en cuál se basa: `origen: { tipo: diseno | plantilla | invitacion, id }`.");
  }

  const partida = await partidaDe(origen);
  if ("error" in partida) return fallo(partida.error, 404);

  const telefono = String(body.telefono || "").trim();
  const inv = await crearDesde(partida, String(body.titulo || ""), {
    chatwootCuenta: cuenta,
    chatwootConversacion: conversacion,
    ...(entero(body.contacto) ? { chatwootContacto: entero(body.contacto) } : {}),
    /* El último mensaje que ya había en la conversación al crearla. Lo de
       antes es historia —a veces importada de meses atrás— y «aplicar
       cambios» empieza a leer desde aquí. Llenarla con el chat entero sigue
       siendo posible a propósito, con «leer toda la conversación». */
    ...(entero(body.desde) ? { chatwootHasta: entero(body.desde) } : {}),
    ...(telefono ? { telefono } : {}),
  });

  /* Con su llave desde ya, para poder pasarle al cliente el enlace de
     multimedia en el mismo chat. */
  await rutaMultimedia(inv);
  const fila = await prisma.invitation.findUniqueOrThrow({ where: { id: inv.id }, select: CAMPOS_FICHA });
  return Response.json({ invitacion: ficha(fila), parteDe: partida.deDonde }, { status: 201 });
}
