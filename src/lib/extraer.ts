/**
 * De una conversación a una propuesta de cambios.
 *
 * El cliente manda los datos regados —la fecha en un mensaje, el lugar en un
 * audio, una corrección tres días después— y aquí se convierten en una lista
 * de «este campo pasa a valer esto, por este mensaje».
 *
 * ── Propone, no escribe ──────────────────────────────────────────
 *
 * Nada de lo que sale de aquí toca la invitación. «Mejor a las 5» puede ser
 * la misa o la fiesta, y un cambio mal aplicado es peor que uno olvidado: la
 * propuesta se le enseña a una persona, que aprueba, corrige o descarta, y
 * sólo lo aprobado pasa por `aplicarCambios`.
 *
 * ── El modelo no decide qué es válido ────────────────────────────
 *
 * Cada cambio propuesto se pasa por `fusionar`, la misma validación del MCP y
 * del editor, antes de enseñarse. Lo que no encaja sale marcado con su motivo
 * en vez de fallar al aplicar.
 */

import { esquemaDe, fusionar, type CampoResumen } from "./mcp";

/** Lo que se le pide al cliente por chat: contenido, no estilo. */
const DE_CONTENIDO = new Set(["text", "textarea", "datetime", "url", "tel", "emoji"]);

const MODELO = process.env.OPENAI_MODEL || "gpt-6-luna";

export interface Mensaje {
  id: number;
  /** `nota` es una nota privada del agente: lo que se habló por teléfono. */
  de: "cliente" | "agente" | "nota";
  fecha: string;
  texto: string;
  adjuntos?: { tipo: string; url?: string }[];
}

export interface Cambio {
  seccion: string;
  /** `date`, o `items[2].time` para un elemento de la lista de la sección. */
  campo: string;
  etiqueta: string;
  actual: unknown;
  valor: unknown;
  motivo: string;
  mensajes: number[];
  /** Por qué no se podría escribir tal cual; vacío si encaja. */
  problema?: string;
}

export interface Propuesta {
  cambios: Cambio[];
  dudas: { pregunta: string; mensajes: number[] }[];
  /** Pedidos que no son un campo: fotos, colores, «muévame esto». */
  otros: { pedido: string; mensajes: number[] }[];
  faltantes: { seccion: string; campo: string; etiqueta: string }[];
  mensajeParaCliente: string;
  /** El último mensaje que se miró; se guarda al aplicar. */
  hasta: number | null;
}

type Datos = Record<string, Record<string, unknown>>;

const ITEM = /^items\[(\d+)\]\.([A-Za-z0-9_]+)$/;

/** El valor que hay ahora en `seccion.campo`, entendiendo `items[n].x`. */
function valorDe(datos: Datos, seccion: string, campo: string): unknown {
  const s = datos?.[seccion] || {};
  const m = ITEM.exec(campo);
  if (!m) return s[campo];
  const items = (s.items as Record<string, unknown>[] | undefined) || [];
  return items[Number(m[1])]?.[m[2]];
}

const vacio = (v: unknown) => v === "" || v === null || v === undefined;

/**
 * Los campos de contenido de un diseño, con lo que vale cada uno ahora.
 *
 * `deMuestra` marca los que siguen exactamente como venían en la invitación o
 * plantilla de la que se partió: tienen valor, pero es el de otra fiesta.
 */
function campos(templateId: string, datos: Datos, origen: Datos | null) {
  const fila = (seccion: string, etiquetaSeccion: string, clave: string, c: CampoResumen) => {
    const actual = valorDe(datos, seccion, clave);
    const antes = origen ? valorDe(origen, seccion, clave) : undefined;
    return {
      seccion,
      campo: clave,
      etiqueta: `${etiquetaSeccion} · ${c.etiqueta}`,
      tipo: c.tipo,
      ...(c.ayuda ? { ayuda: c.ayuda } : {}),
      actual: vacio(actual) ? "" : actual,
      ...(!vacio(actual) && origen && JSON.stringify(actual) === JSON.stringify(antes)
        ? { deMuestra: true }
        : {}),
    };
  };

  const out: ReturnType<typeof fila>[] = [];
  const listas: { seccion: string; etiqueta: string; cuantos: number; maximo: number; campos: string[] }[] = [];

  for (const s of esquemaDe(templateId)) {
    if (datos?.[s.seccion]?.enabled === false) continue;
    for (const c of s.campos) {
      if (DE_CONTENIDO.has(c.tipo)) out.push(fila(s.seccion, s.etiqueta, c.campo, c));
    }
    if (s.lista) {
      const propios = s.lista.campos.filter((c) => DE_CONTENIDO.has(c.tipo));
      if (!propios.length) continue;
      const items = (datos?.[s.seccion]?.items as unknown[] | undefined) || [];
      listas.push({
        seccion: s.seccion,
        etiqueta: `${s.etiqueta} · ${s.lista.etiqueta}`,
        cuantos: items.length,
        maximo: s.lista.maximo,
        campos: propios.map((c) => c.campo),
      });
      items.forEach((_, i) => {
        for (const c of propios) {
          out.push(fila(s.seccion, `${s.etiqueta} #${i + 1}`, `items[${i}].${c.campo}`, c));
        }
      });
    }
  }
  return { campos: out, listas };
}

/**
 * Arma el parche que entiende `fusionar` a partir de cambios sueltos.
 *
 * Los de lista se aplican sobre la lista que ya hay y se manda entera: así un
 * cambio de hora no se lleva por delante la foto o el mapa de ese evento, que
 * es lo que pasaría si la lista la reescribiera el modelo.
 */
export function parcheDe(
  datos: Datos,
  cambios: { seccion: string; campo: string; valor: unknown }[]
): Record<string, Record<string, unknown>> {
  const parche: Record<string, Record<string, unknown>> = {};
  for (const c of cambios) {
    const destino = (parche[c.seccion] ||= {});
    const m = ITEM.exec(c.campo);
    if (!m) {
      destino[c.campo] = c.valor;
      continue;
    }
    const items = (destino.items ||= JSON.parse(
      JSON.stringify((datos?.[c.seccion]?.items as unknown[] | undefined) || [])
    )) as Record<string, unknown>[];
    const i = Math.min(Number(m[1]), items.length);
    items[i] = { ...(items[i] || {}), [m[2]]: c.valor };
  }
  return parche;
}

const INSTRUCCIONES = `Eres quien pasa a limpio los pedidos de los clientes de un estudio de invitaciones digitales.

Recibes: los campos de contenido de UNA invitación con su valor actual, y la conversación de WhatsApp con el cliente. Devuelves qué campos hay que cambiar.

Reglas:
- Sólo propones lo que el cliente (o una nota del agente) dijo. No inventas ni completas: lo que nadie dijo va en "faltantes".
- Lo último manda. Si dijo sábado 14 y después "mejor el 21", propones el 21 y citas los dos mensajes.
- Los mensajes con "nuevo": true son los que aún no se han revisado. Los demás son contexto: ya se aplicaron, no los vuelvas a proponer salvo que un mensaje nuevo los corrija.
- No propongas un cambio cuyo valor sea igual al actual.
- Un mismo dato suele estar en varios campos (los nombres en la portada, en el pie y en la pantalla de entrada; la fecha como fecha y como texto). Propón todos los que deban cambiar para que la invitación quede coherente, y respeta la forma en que ya está escrito cada uno (mayúsculas, "&" o "y", formato de fecha).
- Los campos con "deMuestra": true traen el contenido de la muestra de la que se partió, que es de otra fiesta: cuentan como pendientes de llenar. Si el cliente no ha dado ese dato, va en "faltantes"; pero sólo los que de verdad son datos del evento (nombres, fechas, lugares, horas, cuentas, teléfonos, textos personales), no los rótulos genéricos ("Confirmar asistencia", "Nuestra historia").
- Si un pedido es ambiguo ("a las 5": ¿misa o fiesta?), no elijas: va en "dudas" con la pregunta que habría que hacerle.
- Lo que pide y no es ninguno de estos campos (fotos, colores, música, quitar o mover una sección) va en "otros", para que no se olvide.
- Campos de tipo "datetime": formato "2026-11-15T17:00". Si no dijo el año, usa la próxima vez que caiga esa fecha a partir de hoy y dilo en el motivo.
- Listas: los elementos se nombran "items[0].campo". Para agregar uno nuevo usa el índice siguiente al último, sin pasar el máximo.
- "mensajes": los id de los mensajes de los que sale cada cosa.
- "motivo": una frase corta, con las palabras del cliente cuando ayude.
- "mensajeParaCliente": un mensaje de WhatsApp breve y cordial, en el tono del agente, que pregunte sólo las dudas y los faltantes importantes. Vacío si no hay nada que preguntar.
- Si en los mensajes nuevos no hay nada que aplicar, devuelve las listas vacías.`;

const FORMATO = {
  type: "json_schema",
  json_schema: {
    name: "propuesta",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["cambios", "dudas", "otros", "faltantes", "mensajeParaCliente"],
      properties: {
        cambios: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["seccion", "campo", "valor", "motivo", "mensajes"],
            properties: {
              seccion: { type: "string" },
              campo: { type: "string" },
              valor: { type: "string" },
              motivo: { type: "string" },
              mensajes: { type: "array", items: { type: "integer" } },
            },
          },
        },
        dudas: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["pregunta", "mensajes"],
            properties: {
              pregunta: { type: "string" },
              mensajes: { type: "array", items: { type: "integer" } },
            },
          },
        },
        otros: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["pedido", "mensajes"],
            properties: {
              pedido: { type: "string" },
              mensajes: { type: "array", items: { type: "integer" } },
            },
          },
        },
        faltantes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["seccion", "campo"],
            properties: { seccion: { type: "string" }, campo: { type: "string" } },
          },
        },
        mensajeParaCliente: { type: "string" },
      },
    },
  },
} as const;

export class ErrorDeExtraccion extends Error {
  constructor(mensaje: string, public status = 502) {
    super(mensaje);
  }
}

/**
 * Lee la conversación y propone los cambios.
 *
 * @param hasta  El último mensaje ya revisado; los posteriores son «nuevos».
 * @param todo   Ignora `hasta` y mira la conversación entera: el primer llenado.
 */
export async function proponer(o: {
  templateId: string;
  datos: Datos;
  origen: Datos | null;
  mensajes: Mensaje[];
  hasta: number | null;
  todo?: boolean;
  nota?: string;
  biblioteca?: Set<string>;
}): Promise<Propuesta> {
  const llave = process.env.OPENAI_API_KEY;
  if (!llave) {
    throw new ErrorDeExtraccion("Falta OPENAI_API_KEY en el entorno de invitaciones.", 503);
  }

  const desde = o.todo ? 0 : o.hasta || 0;
  const mensajes = o.mensajes
    .filter((m) => m.texto?.trim() || m.adjuntos?.length)
    .map((m) => ({
      id: m.id,
      de: m.de,
      fecha: m.fecha,
      texto: m.texto || "",
      ...(m.adjuntos?.length ? { adjuntos: m.adjuntos.map((a) => a.tipo) } : {}),
      ...(m.id > desde ? { nuevo: true } : {}),
    }));
  const ultimo = mensajes.length ? Math.max(...mensajes.map((m) => m.id)) : o.hasta;
  const hayNuevos = mensajes.some((m) => "nuevo" in m) || !!o.nota?.trim();

  const { campos: lista, listas } = campos(o.templateId, o.datos, o.origen);
  const vacia: Propuesta = {
    cambios: [], dudas: [], otros: [], faltantes: [], mensajeParaCliente: "", hasta: ultimo ?? null,
  };
  if (!hayNuevos) return vacia;

  const entrada = {
    hoy: new Date().toISOString().slice(0, 10),
    campos: lista,
    listas,
    conversacion: mensajes,
    ...(o.nota?.trim()
      ? { notaDelAgente: `Dicho fuera del chat, cuenta como mensaje nuevo: ${o.nota.trim()}` }
      : {}),
  };

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${llave}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: "system", content: INSTRUCCIONES },
          { role: "user", content: JSON.stringify(entrada) },
        ],
        response_format: FORMATO,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    throw new ErrorDeExtraccion(`No se pudo hablar con OpenAI: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    throw new ErrorDeExtraccion(
      `OpenAI respondió ${res.status}: ${cuerpo?.error?.message || "sin detalle"} (modelo ${MODELO}).`
    );
  }
  const cuerpo = await res.json();
  const eleccion = cuerpo?.choices?.[0];
  if (eleccion?.message?.refusal) {
    throw new ErrorDeExtraccion(`El modelo se negó a leer la conversación: ${eleccion.message.refusal}`);
  }
  if (eleccion?.finish_reason === "length") {
    throw new ErrorDeExtraccion("La respuesta del modelo se cortó; la conversación es demasiado larga.");
  }
  let crudo: {
    cambios: { seccion: string; campo: string; valor: string; motivo: string; mensajes: number[] }[];
    dudas: Propuesta["dudas"];
    otros: Propuesta["otros"];
    faltantes: { seccion: string; campo: string }[];
    mensajeParaCliente: string;
  };
  try {
    crudo = JSON.parse(eleccion?.message?.content || "");
  } catch {
    throw new ErrorDeExtraccion("El modelo no devolvió una propuesta legible.");
  }

  const porClave = new Map(lista.map((c) => [`${c.seccion}.${c.campo}`, c]));
  const etiquetaDe = (seccion: string, campo: string) => {
    const conocido = porClave.get(`${seccion}.${campo}`);
    if (conocido) return conocido.etiqueta;
    const m = ITEM.exec(campo);
    const l = listas.find((x) => x.seccion === seccion);
    return m && l
      ? `${l.etiqueta} #${Number(m[1]) + 1}${Number(m[1]) >= l.cuantos ? " (nuevo)" : ""} · ${m[2]}`
      : `${seccion}.${campo}`;
  };

  const cambios: Cambio[] = [];
  for (const c of crudo.cambios || []) {
    const actual = valorDe(o.datos, c.seccion, c.campo);
    if (String(actual ?? "") === c.valor) continue;
    /* Cada uno por separado: `fusionar` es todo o nada, y un campo mal
       nombrado no debe tumbar los nueve que sí encajan. */
    const r = fusionar(o.templateId, o.datos, parcheDe(o.datos, [c]), o.biblioteca);
    cambios.push({
      seccion: c.seccion,
      campo: c.campo,
      etiqueta: etiquetaDe(c.seccion, c.campo),
      actual: vacio(actual) ? "" : actual,
      valor: c.valor,
      motivo: c.motivo,
      mensajes: c.mensajes || [],
      ...(r.errores.length ? { problema: r.errores.join(" ") } : {}),
    });
  }

  const propuestos = new Set(cambios.map((c) => `${c.seccion}.${c.campo}`));
  return {
    cambios,
    dudas: crudo.dudas || [],
    otros: crudo.otros || [],
    faltantes: (crudo.faltantes || [])
      .filter((f) => porClave.has(`${f.seccion}.${f.campo}`) && !propuestos.has(`${f.seccion}.${f.campo}`))
      .map((f) => ({ ...f, etiqueta: etiquetaDe(f.seccion, f.campo) })),
    mensajeParaCliente: crudo.mensajeParaCliente || "",
    hasta: ultimo ?? null,
  };
}
