/**
 * Las fotos que sube el cliente desde su enlace de multimedia.
 *
 * Pedir las fotos por WhatsApp las trae comprimidas, mezcladas con el resto
 * de la conversación y sin decir cuál es la de la portada. Aquí el cliente
 * las deja en su sitio: una en «Portada» y las demás en «Más fotos».
 *
 * Van a la **misma biblioteca** que todo lo demás, anotadas con la
 * invitación y el espacio. Por eso no hace falta ningún paso para usarlas:
 * el editor ya las ve, y el MCP ya acepta sus URLs al escribir.
 *
 * La llave es el `manageToken`, el mismo del panel de invitados: es la llave
 * que el cliente ya tiene, y un enlace más con otra llave sería otra cosa
 * que perder.
 */

import { prisma } from "./prisma";
import { nuevoTokenPanel } from "./invitados";

export const PAPELES = ["portada", "foto"] as const;
export type Papel = (typeof PAPELES)[number];
export const esPapel = (v: unknown): v is Papel => PAPELES.includes(v as Papel);

/** Cuántas caben en «Más fotos». Un tope, para que el enlace no sea un disco. */
export const MAX_FOTOS = 40;

/** La ruta del enlace de multimedia, creando la llave si aún no la tiene. */
export async function rutaMultimedia(inv: { id: string; manageToken: string | null }): Promise<string> {
  let token = inv.manageToken;
  if (!token) {
    token = await nuevoTokenPanel();
    await prisma.invitation.update({ where: { id: inv.id }, data: { manageToken: token } });
  }
  return `/m/${token}`;
}

export interface FotoCliente {
  id: string;
  url: string;
  papel: Papel;
  nombre: string;
  ancho: number | null;
  alto: number | null;
  subida: string;
}

/** Lo que el cliente ha subido para una invitación: la portada primero. */
export async function fotosDe(invitationId: string): Promise<FotoCliente[]> {
  const filas = await prisma.media.findMany({
    where: { invitationId },
    orderBy: { createdAt: "asc" },
  });
  return filas
    .map((f) => ({
      id: f.id,
      url: f.url,
      papel: (f.papel === "portada" ? "portada" : "foto") as Papel,
      nombre: f.name,
      ancho: f.width,
      alto: f.height,
      subida: f.createdAt.toISOString(),
    }))
    .sort((a, b) => Number(b.papel === "portada") - Number(a.papel === "portada"));
}
