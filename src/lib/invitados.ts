/**
 * Links personalizados por invitado.
 *
 * La idea es la de siempre: los nombres viajan en la dirección
 * (`?invitado=Ana Gómez,Carlos Gómez`), así que quien recibe la invitación no
 * tiene que registrarse ni entrar a ningún sitio. Lo que se añade aquí es el
 * otro lado: un panel para quien invita, donde va creando esos links y ve
 * quién ha contestado.
 *
 * A la dirección se le suma un código corto (`&g=`). Sirve sólo para
 * reconocer de qué link vino la respuesta; emparejar por nombre fallaría a la
 * primera tilde de más o de menos. Si alguien entra sin código —porque copió
 * el enlace a medias o entró por su cuenta— la confirmación se guarda igual,
 * sin link asociado.
 */

import { prisma } from "./prisma";

/** Sin vocales ni parecidos: nada de 0/O ni 1/l en algo que se dicta. */
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

function aleatorio(largo: number): string {
  let s = "";
  for (let i = 0; i < largo; i++) {
    s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return s;
}

/** Código de un link de invitado, único en toda la base. */
export async function nuevoCodigo(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = aleatorio(7);
    if (!(await prisma.guestLink.findUnique({ where: { code } }))) return code;
  }
  // Con 31^7 combinaciones esto no pasa; si pasara, más largo y a otra cosa.
  return aleatorio(12);
}

/** Llave del panel del organizador. Larga: es la única puerta. */
export async function nuevoTokenPanel(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const manageToken = aleatorio(22);
    if (!(await prisma.invitation.findUnique({ where: { manageToken } }))) return manageToken;
  }
  return aleatorio(32);
}

/**
 * Los nombres tal como se guardan: separados por coma, sin espacios de más y
 * sin repetidos. Es lo que va a leer la invitación desde la dirección.
 */
export function limpiarNombres(crudo: string): string[] {
  const vistos = new Set<string>();
  return String(crudo || "")
    .split(/[,;\n]/)
    .map((n) => n.trim().replace(/\s+/g, " ").slice(0, 60))
    .filter((n) => {
      if (!n) return false;
      const k = n.toLocaleLowerCase("es");
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, 12);
}

/** "Ana, Carlos y Sofía" */
export function unir(nombres: string[]): string {
  if (nombres.length < 2) return nombres[0] || "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/**
 * Los pases de un enlace, tal como se guardan: un entero entre 1 y 50, o
 * null si no se pusieron. Lo que no sea eso —un texto, un cero, un negativo—
 * es «sin límite», no un error: quien invita puede dejarlo vacío.
 */
export function limpiarPases(crudo: unknown): number | null {
  const n = Math.floor(Number(crudo));
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(n, 50);
}

/** La dirección que se le manda a un invitado. */
export function urlDeLink(origen: string, slug: string, names: string, code: string): string {
  return `${origen}/${slug}?invitado=${encodeURIComponent(names)}&g=${code}`;
}

export type EstadoLink = "sin respuesta" | "confirmado" | "no asiste" | "parcial";

/** Una respuesta de RSVP, tal como la dejó quien la envió. */
export interface RespuestaInvitado {
  name: string;
  status: string;
  partySize: number;
  /** El teléfono que dejó al confirmar, si dejó alguno. */
  phone: string | null;
  /** El mensaje que escribió —o la canción pedida, que viaja pegada a él. */
  note: string | null;
  createdAt: Date;
}

export interface FilaInvitado {
  id: string;
  code: string;
  nombres: string[];
  note: string | null;
  /** Personas que caben en el enlace; null = sin límite. */
  pases: number | null;
  estado: EstadoLink;
  /** Cuántas personas de este link dijeron que sí. */
  asisten: number;
  /** Personas anunciadas, sumando acompañantes. */
  total: number;
  respondidoEl: Date | null;
  /** Cuántas personas distintas abrieron este enlace. */
  abrieron: number;
  /** Cuántas veces se abrió en total, contando quien volvió. */
  veces: number;
  /** La última vez que alguien lo abrió. */
  abiertoEl: Date | null;
  /**
   * Las respuestas de este enlace, con su teléfono y su mensaje.
   *
   * El resumen de arriba (`estado`, `asisten`, `total`) es para ver de un
   * vistazo; esto es para cuando hay que llamar a alguien o leer lo que
   * pidió. Sin esto, el teléfono y el mensaje que deja quien confirma sólo
   * se veían en el editor —y el panel de enlaces lo usa a veces otra
   * persona, que organiza la logística sin tener acceso al editor.
   */
  respuestas: RespuestaInvitado[];
}

/** Estado de cada link a partir de las respuestas que trae. */
export function resumirLink(link: {
  id: string;
  code: string;
  names: string;
  note: string | null;
  pases?: number | null;
  rsvps: {
    name: string; status: string; partySize: number;
    phone: string | null; note: string | null; createdAt: Date;
  }[];
  aperturas?: { veces: number; updatedAt: Date }[];
}): FilaInvitado {
  const nombres = limpiarNombres(link.names);
  const rsvps = link.rsvps;
  const asisten = rsvps.filter((r) => r.status === "confirmado").length;
  const total = rsvps
    .filter((r) => r.status === "confirmado")
    .reduce((n, r) => n + (r.partySize || 1), 0);

  const aperturas = link.aperturas || [];
  const veces = aperturas.reduce((n, a) => n + (a.veces || 1), 0);
  const abiertoEl = aperturas.length
    ? aperturas.reduce((a, x) => (x.updatedAt > a ? x.updatedAt : a), aperturas[0].updatedAt)
    : null;

  let estado: EstadoLink = "sin respuesta";
  if (rsvps.length) {
    if (!asisten) estado = "no asiste";
    else if (asisten === rsvps.length) estado = "confirmado";
    else estado = "parcial";
  }

  return {
    id: link.id,
    code: link.code,
    nombres,
    note: link.note,
    pases: link.pases ?? null,
    estado,
    asisten,
    total,
    respondidoEl: rsvps.length
      ? rsvps.reduce((a, r) => (r.createdAt > a ? r.createdAt : a), rsvps[0].createdAt)
      : null,
    abrieron: aperturas.length,
    veces,
    abiertoEl,
    // Las más recientes primero: es lo que se acaba de recibir.
    respuestas: [...rsvps].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
}
