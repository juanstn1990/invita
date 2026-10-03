/** Rutas propias de la app que no pueden usarse como slug de invitación. */
const RESERVED = new Set([
  "api", "editor", "nueva", "plantillas", "invitaciones",
  "_next", "favicon.ico", "robots.txt", "sitemap.xml", "static", "public",
]);

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Devuelve el error a mostrar, o null si el slug sirve. */
export function slugError(slug: string): string | null {
  if (!slug) return "Escribe una dirección para tu invitación.";
  if (slug.length < 3) return "Usa al menos 3 caracteres.";
  if (RESERVED.has(slug)) return `"${slug}" está reservada para la app.`;
  if (slug !== normalizeSlug(slug))
    return "Sólo minúsculas, números y guiones.";
  return null;
}

/**
 * La dirección que se propone a partir de los nombres del evento.
 *
 * `ana-luis-k3m9x`: los nombres para que se reconozca de un vistazo y un id
 * corto al final porque dos parejas se pueden llamar igual, y sin él la
 * segunda se quedaba con «ana-luis-2», que además revela que hubo una
 * primera. El alfabeto deja fuera lo que se confunde al dictarlo por
 * teléfono (0/o, 1/l/i).
 */
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

export function idCorto(largo = 5): string {
  const bytes = new Uint8Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

/** Sólo la parte de los nombres, sin el id. Vacía → «invitacion». */
export function raizDeNombres(nombres: string): string {
  return normalizeSlug(nombres).slice(0, 40).replace(/-+$/g, "") || "invitacion";
}

export function slugDeNombres(nombres: string): string {
  return `${raizDeNombres(nombres)}-${idCorto()}`;
}

/** ¿Esta dirección ya parte de esos nombres? Para no cambiarla sin motivo. */
export function slugCoincide(slug: string, nombres: string): boolean {
  return new RegExp(`^${raizDeNombres(nombres)}-[a-z2-9]{5}$`).test(slug);
}
