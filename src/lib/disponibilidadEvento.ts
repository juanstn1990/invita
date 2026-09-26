/**
 * Si ya llegó el día del evento.
 *
 * Lo usan las fotos y el libro de deseos: las dos son cosas que se hacen
 * *en* el evento —una foto del salón vacío tres semanas antes, o un deseo
 * escrito sin haber visto la fiesta, no tienen el mismo sentido—. Por eso
 * las dos páginas se quedan cerradas hasta el día de la fecha puesta, y
 * ninguna vuelve a cerrarse después: la fiesta puede seguir hasta la
 * madrugada, y alguien puede querer escribir su deseo al día siguiente
 * mirando las fotos que ya se subieron.
 *
 * Por día de calendario y no por instante exacto, igual que `faltan`/`urge`
 * en el tablero: una boda a las 6 p.m. no debe abrirse a las 5:59 y sí a
 * las 00:01 del mismo día.
 */
export function eventoLlego(fechaIso: string, ahora = new Date()): boolean {
  const fecha = String(fechaIso || "").trim();
  if (!fecha) return true; // Sin fecha puesta, no hay nada que esperar.
  const evento = new Date(fecha);
  if (Number.isNaN(evento.getTime())) return true;

  const soloDia = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  return soloDia(ahora) >= soloDia(evento);
}
