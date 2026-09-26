import { readLayout } from "./blocks";
import type { InvitationData } from "./schema";

/**
 * La configuración de "cómo se ve el libro" vive en el propio bloque
 * `deseos` —portada, colores, si es público—, no en un sitio nuevo: es
 * donde ya vive todo lo demás de ese bloque, y así el editor la muestra
 * sola sin construir una pantalla aparte.
 *
 * Pero la página del libro (`/{slug}/deseos`) no pasa por el motor de
 * plantillas —no es una sección de la invitación, es una URL propia—, así
 * que tiene que ir a buscar esos datos ella misma. Este es el único sitio
 * que sabe cómo.
 */
export interface ConfigLibro {
  visibilidad: "privado" | "publico";
  portada: string;
  colorHoja: string;
  colorLetra: string;
}

export function configLibro(data: InvitationData): ConfigLibro {
  const bloque = readLayout(data).find((b) => b.type === "deseos");
  const cfg = (bloque?.data || {}) as Record<string, unknown>;
  return {
    visibilidad: cfg.visibilidad === "publico" ? "publico" : "privado",
    portada: String(cfg.portada || ""),
    colorHoja: String(cfg.colorHoja || "") || "#fffdf8",
    colorLetra: String(cfg.colorLetra || "") || "#2c2312",
  };
}
