/**
 * El filtro que separa personas de rastreadores.
 *
 *   npm run audit:aperturas
 *
 * Es la pieza de la que depende que «¿ya la vieron?» tenga respuesta o
 * mienta. Si un día se cuela el rastreador de WhatsApp, toda invitación
 * aparecerá vista en el momento de compartirla — y nadie lo notará, porque el
 * número seguirá subiendo con normalidad.
 *
 * El caso delicado es el par de los dos últimos bloques: `WhatsApp/2.19.81 A`
 * es el rastreador armando la tarjeta, y el UA con `; wv)` es una persona
 * abriendo el enlace en el navegador incrustado de WhatsApp. Filtrar por la
 * palabra "whatsapp" dejaría fuera a la persona, que es la mayoría de quienes
 * abren una invitación repartida por ahí.
 */
import { claveDeApertura, esRastreador } from "../src/lib/aperturas";

const RASTREADORES: [string, string][] = [
  ["WhatsApp al pegar el enlace (iOS)", "WhatsApp/2.23.20.0 i"],
  ["WhatsApp al pegar el enlace (Android)", "WhatsApp/2.19.81 A"],
  ["Facebook", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"],
  ["Telegram", "TelegramBot (like TwitterBot)"],
  ["Twitter", "Mozilla/5.0 (compatible; Twitterbot/1.0)"],
  ["Google", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
  ["Bing", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
  ["Slack", "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"],
  ["Discord", "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"],
  ["Skype", "Mozilla/5.0 (Windows NT 10.0; WOW64) SkypeUriPreview Preview/0.5"],
  ["curl", "curl/8.5.0"],
  ["wget", "Wget/1.21.4"],
  ["python", "python-requests/2.31.0"],
  ["sin user-agent", ""],
  ["sólo espacios", "   "],
  ["Playwright", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36"],
];

const PERSONAS: [string, string][] = [
  ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"],
  ["Android Chrome", "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"],
  ["navegador dentro de WhatsApp", "Mozilla/5.0 (Linux; Android 13; SM-A536E Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36"],
  ["navegador dentro de Instagram", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.23.113"],
  ["navegador dentro de Facebook", "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone14,2]"],
  ["Mac escritorio", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"],
  ["Windows Edge", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"],
  ["Firefox Android", "Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0"],
  ["iPad", "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"],
];

let mal = 0;
for (const [nombre, ua] of RASTREADORES) {
  const ok = esRastreador(ua);
  if (!ok) mal++;
  console.log(`  ${ok ? "✓" : "✗"} no cuenta · ${nombre}`);
}
for (const [nombre, ua] of PERSONAS) {
  const ok = !esRastreador(ua);
  if (!ok) mal++;
  console.log(`  ${ok ? "✓" : "✗"} sí cuenta · ${nombre}`);
}

/* La clave tiene que separar enlaces y visitantes, y tener siempre la misma
   forma: si un día cambia, hay que rehacerlas todas a la vez. */
const pares: [string, boolean][] = [
  ["misma persona, mismo enlace", claveDeApertura("l1", "v1") === claveDeApertura("l1", "v1")],
  ["misma persona, otro enlace", claveDeApertura("l1", "v1") !== claveDeApertura("l2", "v1")],
  ["otra persona, mismo enlace", claveDeApertura("l1", "v1") !== claveDeApertura("l1", "v2")],
  ["sin enlace no choca con uno con enlace", claveDeApertura(null, "v1") !== claveDeApertura("l1", "v1")],
  ["sin enlace lleva el separador igual", claveDeApertura(null, "v1").startsWith("|")],
];
for (const [nombre, ok] of pares) {
  if (!ok) mal++;
  console.log(`  ${ok ? "✓" : "✗"} clave · ${nombre}`);
}

console.log(
  mal
    ? `\n${mal} mal de ${RASTREADORES.length + PERSONAS.length + pares.length}`
    : `\n${RASTREADORES.length} rastreadores fuera, ${PERSONAS.length} personas dentro`
);
process.exit(mal ? 1 : 0);
