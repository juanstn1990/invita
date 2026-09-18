/**
 * Auditoría del tablero.
 *
 *   npm run audit:tablero
 *
 * Lo que se vigila es la aritmética de las fechas y el rescate de lo que no
 * se reconoce, que son las dos cosas que se rompen sin avisar:
 *
 * · **Los días que faltan.** Contados entre instantes, una boda a las 17:00
 *   de mañana está a menos de 24 horas desde esta tarde y saldría «faltan 0
 *   días» para algo que es mañana. Hay que contar días de calendario.
 * · **Un estado que no existe.** Una invitación de antes de que hubiera
 *   estados, o de un cambio de nombre, no puede desaparecer del tablero: es
 *   de alguien. Sin rescate no sale en ninguna columna y parece borrada.
 */

import { ESTADOS, estadoDe, esEstado, faltan, urge, resumir, whatsapp } from "../src/lib/tablero";

let malos = 0;
const decir = (ok: boolean, nombre: string, detalle = "") => {
  if (!ok) malos++;
  console.log(`${ok ? "✓" : "✗"} ${nombre}${!ok && detalle ? `  ${detalle}` : ""}`);
};

/* Una hora fija: probar fechas con el reloj de verdad hace que la prueba
   falle sola dentro de unos meses, y ese fallo cuesta media hora de entender
   antes de descubrir que no era nada. */
const AHORA = new Date("2026-06-10T15:00:00");
const dia = (d: string) => `2026-06-${d}T17:00:00`;

/* ── Los estados ─────────────────────────────────────────────── */

{
  decir(ESTADOS.length === 4, "cuatro columnas", `${ESTADOS.length}`);
  decir(
    !ESTADOS.some((e) => e.id === ("pagada" as string)),
    "y «pagada» no es una de ellas: es un sello aparte"
  );
  decir(ESTADOS.every((e) => e.hint?.trim()), "cada columna explica qué significa estar ahí");
  decir(new Set(ESTADOS.map((e) => e.id)).size === 4, "sin ids repetidos");

  decir(estadoDe("demo") === "demo", "un estado conocido se respeta");
  decir(estadoDe("inventado") === "borrador", "uno que no existe cae en la primera columna");
  decir(estadoDe("") === "borrador", "y uno vacío también");
  decir(estadoDe(null) === "borrador", "y uno nulo, que es lo que había antes del campo");
  decir(esEstado("curso") && !esEstado("pagada"), "`esEstado` distingue los cuatro");
}

/* ── Los días que faltan ─────────────────────────────────────── */

{
  const casos: [string, string, string][] = [
    ["hoy por la tarde", dia("10"), "es hoy"],
    /* El que importa: menos de 24 horas de diferencia, pero es otro día. */
    ["mañana a las 17:00", dia("11"), "es mañana"],
    ["dentro de doce días", dia("22"), "faltan 12 días"],
    ["ayer", dia("09"), "fue ayer"],
    ["hace una semana", dia("03"), "fue hace 7 días"],
    ["dentro de dos meses", "2026-08-10T17:00:00", "faltan 2 meses"],
    ["el año que viene", "2027-09-10T17:00:00", "falta un año"],
  ];
  for (const [nombre, iso, espera] of casos) {
    const r = faltan(iso, AHORA);
    decir(r === espera, `faltan · ${nombre}`, `dijo "${r}", no "${espera}"`);
  }
  decir(faltan("", AHORA) === "", "sin fecha no dice nada");
  decir(faltan("mañana por la tarde", AHORA) === "", "y con una fecha ilegible tampoco");
}

/* ── Lo urgente ──────────────────────────────────────────────── */

{
  decir(urge(dia("18"), "curso", AHORA), "a ocho días y sin entregar, urge");
  decir(!urge(dia("18"), "entregada", AHORA), "a ocho días pero entregada, no");
  /* Catorce y no siete: una invitación se reparte con antelación, y a siete
     días de la boda mandarla ya llega tarde. */
  decir(urge(dia("24"), "demo", AHORA), "a catorce días todavía urge");
  decir(!urge("2026-06-30T17:00:00", "demo", AHORA), "a veinte días ya no");
  decir(!urge(dia("01"), "curso", AHORA), "lo que ya pasó no urge: es otra cosa");
  decir(!urge("", "curso", AHORA), "sin fecha no urge");
}

/* ── El resumen ──────────────────────────────────────────────── */

{
  const filas = [
    { estado: "borrador", pagada: false, fecha: "2026-12-01T17:00:00" },
    { estado: "demo", pagada: true, fecha: dia("18") },
    { estado: "curso", pagada: false, fecha: dia("18") },
    { estado: "entregada", pagada: false, fecha: "2026-07-01T17:00:00" },
    { estado: "entregada", pagada: true, fecha: "2026-07-01T17:00:00" },
    { estado: "loquesea", pagada: false, fecha: "" },
  ];
  const r = resumir(filas, AHORA);

  decir(r.total === 6, "cuenta todas", `${r.total}`);
  decir(r.porEstado.borrador === 2, "y la de estado desconocido cae en borrador", `${r.porEstado.borrador}`);
  decir(r.porEstado.entregada === 2, "dos entregadas", `${r.porEstado.entregada}`);
  /* La pregunta del dinero: entregadas sin cobrar, no «sin cobrar» a secas.
     Un borrador sin pagar no es una deuda, es trabajo por hacer. */
  decir(r.sinCobrar === 1, "una entregada sin cobrar", `${r.sinCobrar}`);
  decir(r.urgentes === 2, "dos urgentes", `${r.urgentes}`);

  /* Que la suma cuadre: una invitación en ninguna columna es una invitación
     que se perdió, y en el tablero eso no se nota mirando. */
  const suma = Object.values(r.porEstado).reduce((a, b) => a + b, 0);
  decir(suma === r.total, "y ninguna se queda fuera de una columna", `${suma} de ${r.total}`);
}

/* ── El contacto ─────────────────────────────────────────────── */

{
  /* Los números llegan escritos a mano y cada quien los copia distinto. Lo
     que se vigila es que salga un enlace usable de cualquiera de esas formas
     —y, sobre todo, que NO salga uno de lo que no es un número: un enlace de
     WhatsApp a cuatro cifras abre una conversación con nadie, y eso se
     descubre delante del cliente. */
  const casos: [string, string, string][] = [
    ["como lo pega WhatsApp", "+57 302 3466143", "https://wa.me/573023466143"],
    ["con guiones", "302-346-6143", "https://wa.me/3023466143"],
    ["con paréntesis", "(302) 3466143", "https://wa.me/3023466143"],
    ["ya limpio", "573023466143", "https://wa.me/573023466143"],
    ["vacío", "", ""],
    ["una extensión suelta", "123", ""],
    ["texto que no es un número", "preguntar a la mamá", ""],
  ];
  for (const [nombre, entra, espera] of casos) {
    const r = whatsapp(entra);
    decir(r === espera, `whatsapp · ${nombre}`, `dio "${r}", esperaba "${espera}"`);
  }
  decir(whatsapp(null) === "", "whatsapp · sin teléfono guardado");
}

console.log(
  malos ? `\n${malos} comprobación(es) con problemas` : "\nEl tablero cuenta bien lo que hay"
);
process.exit(malos ? 1 : 0);
