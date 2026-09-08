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
