/**
 * Los ids de las fotos que este navegador subió a esta invitación, para el
 * álbum "cada quien ve sólo las suyas" (ver `fotosEvento.ts`).
 *
 * Por invitación y no una sola lista para todas: quien reparte fotos en dos
 * eventos distintos no debería ver las de uno mezcladas con las del otro.
 */
const CLAVE = (slug: string) => `invita-mis-fotos-${slug}`;
export const CLAVE_MIS_FOTOS = CLAVE;

/** Nunca crece sin límite: pasado esto, se descartan las más viejas primero. */
const MAX_GUARDADOS = 500;

export function recordarFotoPropia(slug: string, id: string) {
  try {
    const actuales: string[] = JSON.parse(localStorage.getItem(CLAVE(slug)) || "[]");
    const lista = [...actuales, id].slice(-MAX_GUARDADOS);
    localStorage.setItem(CLAVE(slug), JSON.stringify(lista));
  } catch {
    // Sin storage —modo privado, o bloqueado—: la foto se sube igual, sólo
    // que "las mías" no podrá encontrarla después. No es motivo para fallar.
  }
}
