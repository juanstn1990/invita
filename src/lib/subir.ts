/**
 * Meter una imagen en la biblioteca sin pasar por el navegador.
 *
 * Lo usan el MCP (`subir`, que la descarga de un enlace) y la ruta
 * `/api/mcp/subir` (que la recibe con la llave del MCP, para subir desde el
 * disco de quien trabaja en el proyecto). La subida del editor sigue en
 * `/api/media`; ésta es la misma biblioteca por otra puerta.
 *
 * ── No se cree lo que dice el archivo ────────────────────────────
 *
 * El tipo sale de abrir la imagen con sharp, no de la extensión ni de la
 * cabecera `Content-Type`: un servidor ajeno puede decir `image/png` de un
 * HTML, y un HTML guardado como PNG en nuestro dominio es exactamente el tipo
 * de archivo que no se quiere servir. Si sharp no la abre, no es una imagen.
 *
 * ── Descargar de un enlace sin abrir la red de dentro ────────────
 *
 * «Descarga esta URL» dicho a un servidor es la forma clásica de hacerle
 * pedir cosas que sólo él alcanza: la base de datos, el panel de EasyPanel,
 * los metadatos del proveedor en 169.254.169.254. Por eso sólo https, se
 * resuelve el nombre y se rechaza cualquier dirección privada, y las
 * redirecciones se siguen a mano, comprobando cada salto — una redirección
 * es la manera de colar una IP interna detrás de un nombre inocente.
 */

import dns from "dns/promises";
import net from "net";
import sharp from "sharp";

import { prisma } from "./prisma";
import { MAX_BYTES, saveImage } from "./storage";

/** Lo que sharp reconoce y los navegadores muestran. SVG no: lleva scripts. */
const MIME_POR_FORMATO: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  heif: "image/avif",
};

export const TIPOS_BIBLIOTECA = ["adorno", "foto"] as const;
export type TipoBiblioteca = (typeof TIPOS_BIBLIOTECA)[number];

export interface Subida {
  url: string;
  nombre: string;
  ancho: number | null;
  alto: number | null;
  kb: number;
}

/**
 * Comprueba que los bytes son una imagen de verdad, la guarda y la anota.
 * Lanza un `Error` con un mensaje que se le puede enseñar a la persona.
 */
export async function guardarEnBiblioteca(
  bytes: Buffer,
  nombre: string,
  tipo: TipoBiblioteca
): Promise<Subida> {
  if (!bytes.length) throw new Error("El archivo está vacío.");
  if (bytes.length > MAX_BYTES) throw new Error("La imagen pesa más de 8 MB.");

  const meta = await sharp(bytes, { animated: true }).metadata().catch(() => null);
  const mime = meta?.format ? MIME_POR_FORMATO[meta.format] : undefined;
  if (!meta || !mime) {
    throw new Error("Eso no es una imagen que se pueda usar: tiene que ser PNG, JPG, WebP, GIF o AVIF.");
  }
  /* Un AVIF y un HEIC salen los dos como «heif». El HEIC del iPhone no lo
     muestra ningún navegador fuera de Safari, así que se distingue. */
  if (meta.format === "heif" && meta.compression !== "av1") {
    throw new Error("Es una foto HEIC del iPhone: los navegadores no la muestran. Pásala a JPG.");
  }

  const url = await saveImage(bytes, mime);
  const limpio = nombre.trim().slice(0, 200) || url.split("/").pop()!;
  const alto = meta.pageHeight || meta.height || null;
  /* Igual que en el editor: si falla el catálogo, los bytes ya están y la
     URL ya sirve. */
  await prisma.media
    .create({
      data: { url, name: limpio, mime, bytes: bytes.length,
        width: meta.width || null, height: alto, kind: tipo },
    })
    .catch(() => null);

  return { url, nombre: limpio, ancho: meta.width || null, alto, kb: Math.round(bytes.length / 1024) };
}

/* ── Descargar ───────────────────────────────────────────────── */

/**
 * ¿Es una dirección a la que un servidor no debería ir por encargo ajeno?
 * Loopback, privadas, enlace local (ahí vive el 169.254.169.254 de los
 * metadatos en la nube), CGNAT, las de documentación y multicast.
 */
export function esPrivada(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    /* Una IPv4 escrita como IPv6 (::ffff:10.0.0.1) es la misma IPv4. */
    const v4 = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4) return esPrivada(v4[1]);
    return (
      x === "::" || x === "::1" ||
      x.startsWith("fc") || x.startsWith("fd") ||   // únicas locales
      /^fe[89ab]/.test(x) ||                        // enlace local
      x.startsWith("ff")                            // multicast
    );
  }
  return true;
}

async function comprobarDestino(u: URL): Promise<void> {
  if (u.protocol !== "https:") throw new Error("Sólo enlaces https.");
  if (u.username || u.password) throw new Error("El enlace no puede llevar usuario y contraseña.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const ips = net.isIP(host)
    ? [host]
    : (await dns.lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (!ips.length) throw new Error(`No se encuentra el servidor ${host}.`);
  if (ips.some(esPrivada)) throw new Error("Ese enlace apunta a una red interna.");
}

/** Descarga una imagen de un enlace público, con todas las precauciones. */
export async function descargar(enlace: string): Promise<{ bytes: Buffer; nombre: string }> {
  let u: URL;
  try {
    u = new URL(enlace.trim());
  } catch {
    throw new Error("Eso no es un enlace.");
  }

  for (let salto = 0; salto < 4; salto++) {
    await comprobarDestino(u);
    const r = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
      headers: { "User-Agent": "tuinvitacion-biblioteca/1.0", Accept: "image/*" },
    }).catch((e) => {
      throw new Error(`No se pudo descargar: ${(e as Error).message}`);
    });

    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      u = new URL(r.headers.get("location")!, u);
      continue;
    }
    if (!r.ok || !r.body) throw new Error(`El servidor respondió ${r.status}.`);
    if (Number(r.headers.get("content-length") || 0) > MAX_BYTES) {
      throw new Error("La imagen pesa más de 8 MB.");
    }

    /* Leído por trozos con techo: `content-length` puede faltar o mentir, y
       sin techo un enlace a un archivo enorme se come la memoria. */
    const trozos: Buffer[] = [];
    let total = 0;
    const lector = r.body.getReader();
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) {
        await lector.cancel().catch(() => {});
        throw new Error("La imagen pesa más de 8 MB.");
      }
      trozos.push(Buffer.from(value));
    }
    const crudo = u.pathname.split("/").pop() || "";
    let nombre = crudo;
    try { nombre = decodeURIComponent(crudo); } catch { /* se queda como vino */ }
    nombre = nombre.slice(0, 120);
    return { bytes: Buffer.concat(trozos), nombre };
  }
  throw new Error("Demasiadas redirecciones.");
}

/* ── La biblioteca, para comprobar ───────────────────────────── */

/**
 * Las URLs que se pueden usar: las de la biblioteca y las que ya están en
 * los datos que se van a tocar.
 *
 * Lo segundo porque hay imágenes subidas antes de que existiera el catálogo,
 * o cuyo registro falló (la subida no se para por eso). Están en disco y
 * funcionan; rechazarlas al reescribir un adorno que ya las usa sería
 * obligar a subirlas otra vez.
 */
export async function urlsUsables(...datos: string[]): Promise<Set<string>> {
  const filas = await prisma.media.findMany({ select: { url: true } });
  const set = new Set(filas.map((f) => f.url));
  for (const d of datos) {
    for (const m of d.matchAll(/\/api\/media\/[\w./-]+/g)) set.add(m[0]);
  }
  return set;
}
