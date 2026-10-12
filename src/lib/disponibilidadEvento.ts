import { readLayout } from "./blocks";
import type { InvitationData } from "./schema";

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

/**
 * Desde cuándo se activa una de las páginas aparte.
 *
 * Cada una puede traer su propia fecha —quien organiza puede querer que las
 * fotos se abran el día de antes, o el libro de deseos un día después—, pero
 * casi nadie va a tocarla: por eso, si el bloque la deja vacía, se usa la
 * fecha del evento y no hace falta configurar dos veces lo mismo.
 *
 * **La lista de regalos es la excepción, y es la que explica la regla.** Las
 * fotos y los deseos se hacen *en* el evento, así que esperar al día tiene
 * sentido. Una lista de regalos se reparte **antes** —ésa es toda su razón
 * de ser, que a nadie le toque comprar dos veces lo mismo— y heredar la
 * fecha del evento la habría dejado cerrada justo durante las semanas en
 * que sirve. Vacía significa abierta.
 */
export function fechaActivacionDe(
  data: InvitationData,
  tipo: "fotos" | "deseos" | "regalos"
): string {
  const bloque = readLayout(data).find((b) => b.type === tipo);
  const propia = String((bloque?.data as Record<string, unknown> | undefined)?.fechaActivacion || "").trim();
  if (propia) return propia;
  if (tipo === "regalos") return "";
  return String((data.event as Record<string, unknown> | undefined)?.date || "");
}
