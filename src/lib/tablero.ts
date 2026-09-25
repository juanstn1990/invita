/**
 * Los estados por los que pasa una invitación, y lo que se deduce de ellos.
 *
 * Sin esto la única distinción era `published`, que responde a «¿la dirección
 * pública funciona?» y no a «¿en qué punto voy?». Son preguntas distintas y
 * confundirlas es lo que desordena quince invitaciones: una demo se publica
 * para poder enseñarla —y con un solo interruptor queda indistinguible de una
 * entregada—, y una entregada se puede despublicar sin dejar de estar
 * entregada.
 *
 * Por eso el estado es un campo propio y `published` se queda como estaba,
 * diciendo sólo lo que siempre dijo.
 */

/** El identificador guardado en la base. Cambiarlo rompe lo ya guardado. */
export type Estado = "borrador" | "demo" | "curso" | "entregada" | "catalogo";

export interface EstadoSpec {
  id: Estado;
  label: string;
  /** Qué significa estar aquí, para que la columna no haya que interpretarla. */
  hint: string;
  /** Color de la cabecera. Del sistema del editor, no inventado aquí. */
  color: string;
}

/**
 * El orden es el del trabajo, y es el orden en que se pintan las columnas.
 *
 * `pagada` no está aquí a propósito. No es el final de la fila: se cobra un
 * anticipo de algo que sigue en curso, y —lo que de verdad importa— se
 * entrega algo que todavía no se ha cobrado. Como columna, «entregada sin
 * pagar» y «entregada y pagada» serían dos sitios y habría que mirar los dos
 * para saber qué falta por cobrar. Como sello encima de la tarjeta, la
 * columna «Entregada» responde esa pregunta sola.
 */
export const ESTADOS: EstadoSpec[] = [
  {
    id: "borrador",
    label: "Borrador",
    hint: "Empezada, todavía no se le ha enseñado a nadie",
    color: "#8b8b8b",
  },
  {
    id: "demo",
    label: "Demo",
    hint: "Enviada al cliente para que la vea",
    color: "#b08968",
  },
  {
    id: "curso",
    label: "En curso",
    hint: "Con cambios pedidos, aplicándolos",
    color: "#7a6ea8",
  },
  {
    id: "entregada",
    label: "Entregada",
    hint: "Terminada y en manos del cliente",
    color: "#4f8a6b",
  },
  /*
   * Las muestras: invitaciones que no son de ningún cliente y sirven para
   * enseñar lo que se hace. Va la última porque no es una fase del trabajo
   * —nada pasa de «Entregada» a «Catálogo»—, es otro cajón.
   *
   * Y por eso no cuenta como trabajo: su fecha es de mentira, así que no
   * puede salir como «urgente», y no se cobra, así que no lleva sello de
   * pago. Contarlas ahí inflaría justo los dos datos del resumen que se
   * miran para decidir qué hacer hoy.
   */
  {
    id: "catalogo",
    label: "Catálogo",
    hint: "Muestras para enseñar a los clientes",
    color: "#b5838d",
  },
];

/** Las columnas que son trabajo de verdad: todas menos el catálogo. */
export const esTrabajo = (e: Estado) => e !== "catalogo";

export const ESTADO_POR_ID: Record<string, EstadoSpec> = Object.fromEntries(
  ESTADOS.map((e) => [e.id, e])
);

/**
 * El estado de una fila, tolerando lo que no reconozca.
 *
 * Una invitación con un estado que no existe —de una versión anterior, de un
 * cambio de nombre— no puede desaparecer del tablero: es de alguien y tiene
 * que verse. Cae en la primera columna, que es de donde se puede sacar.
 */
export function estadoDe(valor: string | null | undefined): Estado {
  return ESTADO_POR_ID[String(valor || "")] ? (valor as Estado) : "borrador";
}

export function esEstado(valor: unknown): valor is Estado {
  return typeof valor === "string" && !!ESTADO_POR_ID[valor];
}

/* ── El cobro ─────────────────────────────────────────────────
   Tres estados y no un sí/no: un anticipo es algo que de verdad pasó, no un
   paso a medias hacia «pagada». Sin el estado de en medio, la única forma de
   anotar un anticipo era marcarla como pagada del todo (y perder de vista que
   falta el resto) o dejarla en «sin cobrar» (y perder que ya entró algo). */
export type Pago = "no" | "parcial" | "completo";

export interface PagoSpec {
  id: Pago;
  /** Lo que dice el botón del tablero. */
  label: string;
}

export const PAGOS: PagoSpec[] = [
  { id: "no", label: "Sin cobrar" },
  { id: "parcial", label: "Anticipo" },
  { id: "completo", label: "Pagada" },
];

export const PAGO_POR_ID: Record<string, PagoSpec> = Object.fromEntries(
  PAGOS.map((p) => [p.id, p])
);

/** El pago de una fila, tolerando lo que no reconozca (o lo que no tenga). */
export function pagoDe(valor: string | null | undefined): Pago {
  return PAGO_POR_ID[String(valor || "")] ? (valor as Pago) : "no";
}

export function esPago(valor: unknown): valor is Pago {
  return typeof valor === "string" && !!PAGO_POR_ID[valor];
}

/** Un clic recorre los tres: sin cobrar → anticipo → pagada → sin cobrar. */
export function siguientePago(actual: Pago): Pago {
  if (actual === "no") return "parcial";
  if (actual === "parcial") return "completo";
  return "no";
}

/* ── Quién la lleva ───────────────────────────────────────────── */

export type Responsable = "valentina" | "juan";

export const RESPONSABLES: { id: Responsable; label: string }[] = [
  { id: "valentina", label: "Valentina" },
  { id: "juan", label: "Juan" },
];

export function esResponsable(valor: unknown): valor is Responsable {
  return valor === "valentina" || valor === "juan";
}

/* ── Lo que se muestra en cada tarjeta ───────────────────────── */

/**
 * Cuánto falta para el evento, en palabras.
 *
 * Se cuenta por **días de calendario** y no por milisegundos entre dos
 * instantes. Una boda a las 17:00 de mañana está a menos de 24 horas desde
 * esta tarde, y «faltan 0 días» para algo que es mañana es sencillamente
 * falso. Lo que se quiere saber es en qué día cae, no cuántas horas quedan.
 */
export function faltan(iso: string, ahora = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const soloDia = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.round((soloDia(d) - soloDia(ahora)) / 86400000);

  if (dias < 0) return dias === -1 ? "fue ayer" : `fue hace ${-dias} días`;
  if (dias === 0) return "es hoy";
  if (dias === 1) return "es mañana";
  if (dias < 31) return `faltan ${dias} días`;

  /* El verbo concuerda con el número, y por eso se arma entero en cada rama
     en vez de pegarle una "n" a "falta": «falta 2 meses» pasó la primera
     versión de la prueba porque la prueba la escribí después. */
  const meses = Math.round(dias / 30.4);
  if (meses < 12) return meses === 1 ? "falta un mes" : `faltan ${meses} meses`;
  const anos = Math.floor(dias / 365);
  return anos === 1 ? "falta un año" : `faltan ${anos} años`;
}

/**
 * Lo urgente: lo que ocurre dentro de poco y todavía no está entregado.
 *
 * El umbral en catorce días y no en siete porque una invitación se reparte
 * con antelación: cuando faltan siete días para la boda, mandarla ya llega
 * tarde. Lo que ya pasó no es urgente, es otra cosa, y sale aparte.
 */
export function urge(iso: string, estado: Estado, ahora = new Date()): boolean {
  if (estado === "entregada" || estado === "catalogo" || !iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const soloDia = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.round((soloDia(d) - soloDia(ahora)) / 86400000);
  return dias >= 0 && dias <= 14;
}

/* ── El resumen de arriba ────────────────────────────────────── */

export interface Resumen {
  porEstado: Record<Estado, number>;
  /** La pregunta del dinero: entregadas que todavía no se han cobrado del todo. */
  sinCobrar: number;
  /** Las que se celebran dentro de dos semanas y no están entregadas. */
  urgentes: number;
  /** Invitaciones de clientes activas: ni catálogo ni archivadas. */
  total: number;
  /** Las muestras del catálogo, aparte. */
  muestras: number;
  /** Trabajo ya cerrado, guardado fuera de las columnas. */
  archivadas: number;
}

/**
 * Recibe todas las filas, archivadas incluidas, y las cuenta aparte —igual
 * que las muestras del catálogo—: son trabajo real, pero no del que se mira
 * hoy, y contarlas con las demás inflaría el resumen con algo que ya se
 * cerró. El tablero decide por su cuenta si además las enseña en las
 * columnas; este resumen no cambia según esa decisión.
 */
export function resumir(
  filas: { estado: string; pago: string; fecha: string; archivada?: boolean }[],
  ahora = new Date()
): Resumen {
  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e.id, 0])) as Record<Estado, number>;
  let sinCobrar = 0;
  let urgentes = 0;
  let archivadas = 0;

  for (const f of filas) {
    if (f.archivada) { archivadas++; continue; }
    const e = estadoDe(f.estado);
    porEstado[e]++;
    if (e === "entregada" && pagoDe(f.pago) !== "completo") sinCobrar++;
    if (urge(f.fecha, e, ahora)) urgentes++;
  }
  const muestras = porEstado.catalogo || 0;
  return {
    porEstado,
    sinCobrar,
    urgentes,
    total: filas.length - muestras - archivadas,
    muestras,
    archivadas,
  };
}

/* ── El contacto ─────────────────────────────────────────────── */

/**
 * El enlace de WhatsApp de un teléfono escrito a mano.
 *
 * Se quedan sólo las cifras: los números llegan como «+57 302 3466143», con
 * espacios, guiones o paréntesis según quién lo copie, y wa.me no acepta nada
 * de eso. Un `+` delante tampoco: wa.me lo quiere sin él.
 *
 * Devuelve vacío si no queda un número plausible. Un enlace de WhatsApp a
 * cuatro cifras abre una conversación con nadie, y eso se descubre delante
 * del cliente.
 */
export function whatsapp(telefono: string | null | undefined): string {
  const cifras = String(telefono || "").replace(/\D/g, "");
  return cifras.length >= 7 ? `https://wa.me/${cifras}` : "";
}
