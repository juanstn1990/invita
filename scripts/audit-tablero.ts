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

import {
  ESTADOS, estadoDe, esEstado, esTrabajo, faltan, urge, resumir, whatsapp,
  pagoDe, esPago, siguientePago, esResponsable,
} from "../src/lib/tablero";

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
  decir(ESTADOS.length === 5, "cinco columnas: cuatro de trabajo y el catálogo", `${ESTADOS.length}`);
  decir(
    !ESTADOS.some((e) => e.id === ("pagada" as string)),
    "y «pagada» no es una de ellas: es un sello aparte"
  );
  decir(ESTADOS.every((e) => e.hint?.trim()), "cada columna explica qué significa estar ahí");
  decir(new Set(ESTADOS.map((e) => e.id)).size === 5, "sin ids repetidos");

  decir(estadoDe("demo") === "demo", "un estado conocido se respeta");
  decir(estadoDe("inventado") === "borrador", "uno que no existe cae en la primera columna");
  decir(estadoDe("") === "borrador", "y uno vacío también");
  decir(estadoDe(null) === "borrador", "y uno nulo, que es lo que había antes del campo");
  decir(esEstado("curso") && esEstado("catalogo") && !esEstado("pagada"), "`esEstado` distingue los cinco");
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

/* ── El cobro ────────────────────────────────────────────────── */

{
  decir(pagoDe("parcial") === "parcial", "un pago conocido se respeta");
  decir(pagoDe("inventado") === "no", "uno que no existe cae en «sin cobrar»");
  decir(pagoDe("") === "no", "y uno vacío también");
  decir(pagoDe(null) === "no", "y uno nulo, que es lo que había antes del campo");
  decir(esPago("completo") && esPago("no") && !esPago("pagada"), "`esPago` distingue los tres, y «pagada» ya no es uno de ellos");

  decir(siguientePago("no") === "parcial", "de sin cobrar, un clic lleva a anticipo");
  decir(siguientePago("parcial") === "completo", "de anticipo, a pagada del todo");
  decir(siguientePago("completo") === "no", "y de pagada, vuelve a sin cobrar");
}

/* ── Quién la lleva ──────────────────────────────────────────── */

{
  decir(esResponsable("valentina") && esResponsable("juan"), "los dos nombres son válidos");
  decir(!esResponsable("") && !esResponsable(null) && !esResponsable("otro"), "nada más lo es: sin asignar no es un tercer nombre");
}

/* ── El resumen ──────────────────────────────────────────────── */

{
  const filas = [
    { estado: "borrador", pago: "no", fecha: "2026-12-01T17:00:00" },
    { estado: "demo", pago: "completo", fecha: dia("18") },
    { estado: "curso", pago: "no", fecha: dia("18") },
    { estado: "entregada", pago: "no", fecha: "2026-07-01T17:00:00" },
    { estado: "entregada", pago: "parcial", fecha: "2026-07-01T17:00:00" },
    { estado: "entregada", pago: "completo", fecha: "2026-07-01T17:00:00" },
    { estado: "loquesea", pago: "no", fecha: "" },
  ];
  const r = resumir(filas, AHORA);

  decir(r.total === 7, "cuenta todas", `${r.total}`);
  decir(r.porEstado.borrador === 2, "y la de estado desconocido cae en borrador", `${r.porEstado.borrador}`);
  decir(r.porEstado.entregada === 3, "tres entregadas", `${r.porEstado.entregada}`);
  /* La pregunta del dinero: entregadas sin cobrar DEL TODO —un anticipo
     todavía cuenta como pendiente—, no «sin cobrar» a secas. Un borrador sin
     pagar no es una deuda, es trabajo por hacer. */
  decir(r.sinCobrar === 2, "dos entregadas sin cobrar del todo (sin cobrar y con anticipo)", `${r.sinCobrar}`);
  decir(r.urgentes === 2, "dos urgentes", `${r.urgentes}`);

  /* Que la suma cuadre: una invitación en ninguna columna es una invitación
     que se perdió, y en el tablero eso no se nota mirando. */
  const suma = Object.values(r.porEstado).reduce((a, b) => a + b, 0);
  decir(suma === r.total, "y ninguna se queda fuera de una columna", `${suma} de ${r.total}`);
}

/* ── Lo archivado ────────────────────────────────────────────── */

{
  /* Cerrado y fuera del resumen activo, igual que las muestras del catálogo:
     es trabajo real, pero no del que se mira hoy. Sin esto, archivar no
     cumpliría su propósito —el tablero seguiría contándolas como si
     estuvieran a la vista. */
  const r = resumir([
    { estado: "entregada", pago: "no", fecha: dia("12"), archivada: true },
    { estado: "entregada", pago: "completo", fecha: "2026-01-01T17:00:00", archivada: true },
    { estado: "curso", pago: "no", fecha: dia("12") },
  ], AHORA);
  decir(r.total === 1, "el total no cuenta las archivadas", `${r.total}`);
  decir(r.archivadas === 2, "las archivadas se cuentan aparte", `${r.archivadas}`);
  decir(r.urgentes === 1, "una archivada a dos días no sale como urgente", `${r.urgentes}`);
  decir(r.sinCobrar === 0, "ni como pendiente de cobro, aunque esté entregada y sin pagar", `${r.sinCobrar}`);
}

/* ── El catálogo ─────────────────────────────────────────────── */

{
  /* Las muestras no son trabajo: fecha de mentira y nadie las paga. Si
     contaran, inflarían justo lo que se mira para decidir qué hacer hoy. */
  decir(ESTADOS[ESTADOS.length - 1].id === "catalogo",
    "el catálogo va el último: no es una fase del trabajo, es otro cajón");
  decir(!esTrabajo("catalogo") && esTrabajo("entregada"), "`esTrabajo` deja fuera sólo el catálogo");
  decir(!urge(dia("12"), "catalogo", AHORA),
    "una muestra con fecha a dos días no sale como urgente");

  const r = resumir([
    { estado: "catalogo", pago: "no", fecha: dia("12") },
    { estado: "catalogo", pago: "no", fecha: dia("13") },
    { estado: "curso", pago: "no", fecha: dia("12") },
  ], AHORA);
  decir(r.total === 1, "el total de invitaciones no cuenta las muestras", `${r.total}`);
  decir(r.muestras === 2, "las muestras se cuentan aparte", `${r.muestras}`);
  decir(r.urgentes === 1, "y sólo la de trabajo sale como urgente", `${r.urgentes}`);
  decir(r.sinCobrar === 0, "ninguna muestra sale «sin cobrar»");
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
