/**
 * Quién abrió la invitación.
 *
 * «¿Ya la vieron?» es la primera pregunta de quien reparte invitaciones, y
 * por enlace de invitado es donde sirve: dice a qué familia hay que
 * insistirle.
 *
 * Ya había un contador `views` que subía en cada petición. No se mostraba en
 * ningún sitio, y era mejor así, porque contaba tres cosas que no son una
 * persona abriendo la invitación:
 *
 * 1. **Los rastreadores.** WhatsApp pide la página en el momento en que se
 *    pega el enlace, para armar la tarjeta de vista previa. Contando eso,
 *    toda invitación aparece «vista» justo al compartirla — y el dato miente
 *    exactamente donde importa.
 * 2. **Las recargas.** La misma persona entrando cuatro veces no son cuatro
 *    personas.
 * 3. **El organizador**, que abre su propia invitación veinte veces para
 *    revisarla.
 */

import crypto from "crypto";

/** Cookie con un identificador opaco del visitante. Ver `nuevoVisitante`. */
export const COOKIE_VISITA = "invita_visita";

/** Un año: una invitación se reparte con meses de antelación. */
export const DIAS_VISITA = 365;

/**
 * Un identificador de visitante.
 *
 * Es un número aleatorio y nada más: no sale de la IP, ni del navegador, ni
 * de nada de la persona. Sólo sirve para no contar cuatro veces a quien
 * recarga cuatro veces. Si el navegador no acepta cookies, cada visita trae
 * uno nuevo y se cuenta como otra persona — se prefiere contar de más a
 * inventar una identidad a partir de datos personales.
 */
export const nuevoVisitante = () => crypto.randomBytes(16).toString("base64url");

/**
 * Rastreadores que piden la página con el UA en la mano.
 *
 * Sólo hacen falta los que se presentan como un navegador: los demás los
 * caza la regla de `esRastreador`, que es la que hace el trabajo.
 */
const DISFRAZADOS = [
  "googlebot",
  "bingbot",
  "applebot",
  "yandexbot",
  "duckduckbot",
  "baiduspider",
  "facebookexternalhit",
  "facebookcatalog",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "pinterest",
  "redditbot",
  "embedly",
  "skypeuripreview",
  "vkshare",
  "whatsapp",
  "telegrambot",
  "headlesschrome",
  "bot/",
  "crawler",
  "spider",
];

/**
 * ¿Esta petición es de un programa y no de una persona?
 *
 * La regla que hace casi todo el trabajo es la segunda: **un navegador de
 * verdad manda un UA que empieza por `Mozilla/`**. `WhatsApp/2.23.20.0 i`,
 * `facebookexternalhit/1.1`, `TelegramBot`, `curl/8.5`, `python-requests` —
 * ninguno lo hace.
 *
 * Y eso resuelve la duda que parecería obligar a elegir: en Android, tocar un
 * enlace dentro de WhatsApp puede abrirlo en su navegador incrustado, cuyo UA
 * **sí** empieza por `Mozilla/5.0`. Filtrar por la palabra "whatsapp" a secas
 * dejaría fuera a personas de verdad, que son la mayoría de quienes abren una
 * invitación. Filtrando por la forma del UA, el rastreador se va y la persona
 * se queda.
 *
 * La lista `DISFRAZADOS` es para los que sí se presentan como navegador
 * (Googlebot lo hace) y se aplica sólo después.
 */
export function esRastreador(ua: string | null): boolean {
  const s = (ua || "").trim();

  /* Sin UA no hay navegador: ninguno lo omite. */
  if (!s) return true;

  /* La forma, antes que el contenido. */
  if (!/^mozilla\//i.test(s)) return true;

  const bajo = s.toLowerCase();
  return DISFRAZADOS.some((t) => bajo.includes(t));
}

/**
 * La clave de una apertura dentro de una invitación.
 *
 * Mismo problema y misma solución que en las confirmaciones: en Postgres dos
 * NULL no chocan en un índice único, así que el enlace vacío se escribe como
 * cadena vacía y la clave tiene siempre la misma forma.
 */
export const claveDeApertura = (guestLinkId: string | null, visitante: string) =>
  `${guestLinkId ?? ""}|${visitante}`;
