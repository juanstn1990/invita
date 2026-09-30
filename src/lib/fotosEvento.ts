import { readLayout } from "./blocks";
import type { InvitationData } from "./schema";

/**
 * La configuración de "quién ve el álbum" vive en el propio bloque `fotos`,
 * igual que la del libro de deseos vive en `deseos` — ver `libroDeseos.ts`,
 * mismo motivo exacto: la página de la cámara (`/{slug}/fotos`) no pasa por
 * el motor de plantillas, así que va a buscar esto ella misma.
 *
 * Tres niveles y no dos: subir una foto es siempre igual, pero verlas ya
 * subidas puede ser "sólo yo" (privado), "cada quien las suyas" (propias) o
 * "todas, para cualquiera" (público). "Propias" no pide cuenta ni contraseña
 * —nadie las tiene—: el navegador de quien sube recuerda el id de cada foto
 * suya en `localStorage`, y sólo pide esas, nunca la lista entera. Ver
 * `Camara.tsx` y `/api/i/[slug]/fotos/mias`.
 */
export type VisibilidadFotos = "privado" | "propias" | "publico";

export function configFotos(data: InvitationData): { visibilidad: VisibilidadFotos } {
  const bloque = readLayout(data).find((b) => b.type === "fotos");
  const cfg = (bloque?.data || {}) as Record<string, unknown>;
  const visibilidad =
    cfg.visibilidad === "publico" || cfg.visibilidad === "propias"
      ? cfg.visibilidad
      : "privado";
  return { visibilidad };
}
