/**
 * Quién es quien contesta.
 *
 * El problema que resuelve: una confirmación era siempre una fila nueva, así
 * que quien recargaba la página y volvía a confirmar —o confirmaba «por si
 * acaso» dos días después— aparecía dos veces, y el recuento de cabezas del
 * panel sumaba las dos. Con quince invitados haciendo eso, la lista deja de
 * servir para calcular la comida, que es para lo que existe.
 *
 * Para que una respuesta pueda reemplazar a la anterior hace falta decidir
 * qué significa «la misma persona». Es una decisión, no un detalle:
 *
 * - **El nombre, normalizado.** «Ana Gómez», «ana gomez» y «  Ana  Gómez  »
 *   son la misma persona escribiendo con prisa en un teléfono.
 * - **Más el link por el que entró**, si entró por uno. Dos familias pueden
 *   tener cada una su Ana, y cada link es una casa distinta. Sin esto, la Ana
 *   de una familia borraría la respuesta de la otra — y perder una respuesta
 *   es un daño peor que mostrar dos filas.
 *
 * Lo que **no** cubre: la misma persona escribiendo «Ana» una vez y «Ana
 * García» la otra son, para cualquier programa, dos personas. Eso no tiene
 * arreglo desde aquí; los links personalizados sí lo evitan, porque ahí el
 * nombre lo pone quien invita y no quien contesta.
 */

/**
 * El nombre reducido a lo que lo identifica.
 *
 * Se quitan los acentos porque quien escribe desde un teléfono los pone o no
 * según le quede el teclado, y «Gómez» y «Gomez» son la misma persona.
 */
export function nombreNormalizado(nombre: string): string {
  return nombre
    .normalize("NFD")
    /* Los acentos que NFD acaba de separar de su letra. */
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * La clave de una respuesta dentro de una invitación.
 *
 * El separador es "|" y el link vacío se escribe como cadena vacía en lugar
 * de omitirse, para que la clave tenga siempre la misma forma: si un día se
 * cambia el formato, hay que rehacer todas las claves a la vez (ver
 * `scripts/rsvp-deduplicar.ts`).
 */
export function claveDeRespuesta(guestLinkId: string | null, nombre: string): string {
  return `${guestLinkId ?? ""}|${nombreNormalizado(nombre)}`;
}
