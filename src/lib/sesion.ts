/**
 * El nombre de la cookie, y nada más.
 *
 * Vive aparte de `auth.ts` porque el middleware lo necesita y corre en el
 * runtime Edge, donde no hay `node:crypto` ni base de datos: importarlo de
 * `auth.ts` metía todo eso en el bundle del middleware y el build fallaba.
 */
export const COOKIE = "invita_sesion";
