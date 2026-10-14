/**
 * La lista de regalos: quién se lleva qué, sin que dos se lleven lo mismo.
 *
 * Es lo contrario del libro de deseos, aunque se parezcan por fuera. En el
 * libro cada quien **añade** lo suyo: no hay nada que repartir, el orden da
 * igual y dos personas escribiendo a la vez no se estorban. Aquí hay un
 * cochecito, uno solo, y en cuanto alguien lo toma deja de estar para los
 * demás. Eso es estado disputado, y casi todo lo de este archivo existe por
 * esa frase.
 *
 * **Dónde vive y por qué no en el JSON.** Todo el contenido de una
 * invitación vive en `Invitation.data`, un JSON que el editor reescribe
 * entero al guardar. Esto no puede: dos invitados eligiendo con un segundo
 * de diferencia escribirían dos versiones del mismo JSON y la segunda se
 * llevaría por delante la primera — el regalo quedaría libre y acabarían
 * comprándolo los dos. Por eso son dos tablas.
 *
 * **Quién es quien elige.** El enlace de invitado, que ya existe: cada
 * familia tiene el suyo (`?invitado=Ana,Carlos&g=CODE`) y el código dice
 * cuál es. Nadie escribe su nombre, así que no hay dos maneras de llamarse
 * igual ni forma de que alguien suelte el regalo de otro.
 *
 * **Los dos modos** son del bloque, no de aquí: en «eligen ellos» el
 * invitado ve la lista y toma; en «yo asigno» el organizador reparte y el
 * invitado abre y ve sólo el suyo.
 */

import { prisma } from "./prisma";
import { readLayout } from "./blocks";
import { nombreNormalizado } from "./rsvp";
import type { InvitationData } from "./schema";

/* ────────────────────────────────────────────────────────────────
   La configuración, que vive en el bloque
   ──────────────────────────────────────────────────────────────── */

export interface ConfigRegalos {
  /** "elige" = el invitado toma de la lista · "asignado" = tú repartes. */
  modo: "elige" | "asignado";
  titulo: string;
  texto: string;
  /** Cuántos regalos puede llevarse un mismo enlace. 0 = sin tope. */
  tope: number;
}

/**
 * Lo que el organizador configuró, leído del bloque.
 *
 * Igual que `configLibro`: la página de regalos no pasa por el motor de
 * plantillas —es una URL propia, no una sección— así que tiene que ir a
 * buscar estos datos ella misma, y éste es el único sitio que sabe cómo.
 */
export function configRegalos(data: InvitationData): ConfigRegalos {
  const bloque = readLayout(data).find((b) => b.type === "regalos");
  const cfg = (bloque?.data || {}) as Record<string, unknown>;
  const tope = Number(cfg.tope);
  return {
    modo: cfg.modo === "asignado" ? "asignado" : "elige",
    titulo: String(cfg.title || "") || "Lista de regalos",
    texto: String(cfg.texto || ""),
    tope: Number.isFinite(tope) && tope > 0 ? Math.min(20, tope) : 0,
  };
}

/** Si la invitación tiene el bloque puesto y encendido. */
export function tieneRegalos(data: InvitationData): boolean {
  const bloque = readLayout(data).find((b) => b.type === "regalos");
  return !!bloque && (bloque.data as Record<string, unknown>)?.enabled !== false;
}

/* ────────────────────────────────────────────────────────────────
   Quién elige
   ──────────────────────────────────────────────────────────────── */

/**
 * La clave de una elección dentro de un regalo.
 *
 * Con enlace es el id del enlace: es lo que de verdad identifica a una
 * familia, no cambia aunque se le corrijan los nombres, y dos familias con
 * una Ana cada una no se pisan.
 *
 * Sin enlace queda el nombre normalizado, por el mismo camino que el RSVP
 * (ver `nombreNormalizado`). Es peor —«Ana» y «Ana G.» son dos personas— y
 * por eso el modo asignado no lo admite; pero quien reparte un solo enlace
 * genérico para todos tiene que poder usar la lista igual.
 */
export function claveDeEleccion(guestLinkId: string | null, nombre: string): string {
  return guestLinkId || `n:${nombreNormalizado(nombre)}`;
}

/* ────────────────────────────────────────────────────────────────
   Leer la lista
   ──────────────────────────────────────────────────────────────── */

export interface RegaloVisto {
  id: string;
  nombre: string;
  nota: string;
  imagen: string;
  cupo: number;
  /** Cuántos quedan por tomar. */
  libres: number;
  /** Lo tomó quien está mirando. */
  mio: boolean;
  /**
   * Quién lo tiene. Vacío para los invitados: la lista dice si algo está
   * tomado, no por quién. Quien organiza sí los ve — ver `conNombres`.
   */
  de: { nombre: string; asignado: boolean; cuando: string }[];
}

/**
 * La lista con el estado de cada regalo.
 *
 * `conNombres` decide si viajan los nombres de quien eligió. Apagado para
 * los invitados y no por pudor: en un baby shower, ver que la suegra ya
 * tomó el cochecito cambia lo que la gente elige, y lo que se pidió es
 * repartir los regalos, no publicar un marcador.
 */
export async function listarRegalos(
  invitationId: string,
  clave: string | null,
  conNombres: boolean
): Promise<RegaloVisto[]> {
  const regalos = await prisma.regalo.findMany({
    where: { invitationId },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    include: {
      elecciones: {
        orderBy: { createdAt: "asc" },
        select: { clave: true, nombre: true, asignado: true, createdAt: true },
      },
    },
  });

  return regalos.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    nota: r.nota || "",
    imagen: r.imagen || "",
    cupo: r.cupo,
    libres: Math.max(0, r.cupo - r.elecciones.length),
    mio: !!clave && r.elecciones.some((e) => e.clave === clave),
    de: conNombres
      ? r.elecciones.map((e) => ({
          nombre: e.nombre,
          asignado: e.asignado,
          cuando: e.createdAt.toISOString(),
        }))
      : [],
  }));
}

/* ────────────────────────────────────────────────────────────────
   Tomar y soltar
   ──────────────────────────────────────────────────────────────── */

export type ResultadoTomar =
  | { ok: true }
  | { ok: false; motivo: "tomado" | "no-existe" | "tope" | "repetido" };

/**
 * Tomar un regalo.
 *
 * Las dos reglas que hay que cumplir se guardan de maneras distintas, y la
 * diferencia es el fondo de este archivo:
 *
 * · **«No dos veces la misma familia»** lo guarda el índice único
 *   `(regaloId, clave)`. Es una restricción que la base entiende, así que
 *   no hay carrera posible: el segundo intento choca y punto.
 *
 * · **«No más de `cupo`»** no se puede expresar como índice —«como mucho N
 *   filas» no es una restricción que exista— así que se cuenta y se escribe
 *   dentro de una transacción `Serializable`. Es el único nivel que impide
 *   que dos transacciones cuenten «queda 1» a la vez y escriban las dos; con
 *   el nivel de siempre, dos invitados tocando el botón en el mismo segundo
 *   se llevan los dos el último.
 *
 * Que el motor rechace una transacción serializada es **normal** y no un
 * error: significa que otro llegó antes. Se traduce a «ya lo tomaron», que
 * es lo que hay que enseñar.
 */
export async function tomarRegalo(
  invitationId: string,
  regaloId: string,
  guestLinkId: string | null,
  nombre: string,
  tope: number
): Promise<ResultadoTomar> {
  const clave = claveDeEleccion(guestLinkId, nombre);
  for (let intento = 0; ; intento++) {
    const r = await intentarTomar(invitationId, regaloId, guestLinkId, nombre, tope, clave);
    if (r !== REINTENTA) return r;
    if (intento >= 3) return { ok: false, motivo: "tomado" };
    /* Un respiro corto y desigual antes de volver. Desigual a propósito: si
       los tres reintentaran a la vez volverían a chocar entre ellos, que es
       lo que acaba de pasar. */
    await new Promise((r) => setTimeout(r, 12 + Math.random() * 40));
  }
}

/** Lo que devuelve un intento que no decidió nada y hay que repetir. */
const REINTENTA = Symbol("reintenta");

/**
 * Un intento. Devuelve `REINTENTA` cuando el motor abortó la transacción por
 * serialización, que **no** es que el regalo esté tomado: es que otro escribía
 * a la vez y hay que volver a contar.
 *
 * Distinguirlo importa y costó una auditoría verlo: con cupo 2 y tres
 * invitados a la vez, tratar el aborto como «ya está tomado» dejaba entrar a
 * uno solo y les decía a los otros dos que no quedaba —cuando quedaba—. Con
 * cupo 1 no se notaba, porque ahí la respuesta equivocada coincidía con la
 * correcta.
 */
async function intentarTomar(
  invitationId: string,
  regaloId: string,
  guestLinkId: string | null,
  nombre: string,
  tope: number,
  clave: string
): Promise<ResultadoTomar | typeof REINTENTA> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const regalo = await tx.regalo.findFirst({
          where: { id: regaloId, invitationId },
          select: { id: true, cupo: true },
        });
        if (!regalo) return { ok: false, motivo: "no-existe" } as const;

        const tomadas = await tx.regaloEleccion.count({ where: { regaloId } });
        if (tomadas >= regalo.cupo) return { ok: false, motivo: "tomado" } as const;

        /* El tope por familia se cuenta aquí dentro por lo mismo que el cupo:
           fuera de la transacción, dos elecciones a la vez lo saltarían. */
        if (tope) {
          const mios = await tx.regaloEleccion.count({ where: { invitationId, clave } });
          if (mios >= tope) return { ok: false, motivo: "tope" } as const;
        }

        await tx.regaloEleccion.create({
          data: { regaloId, invitationId, guestLinkId, nombre, clave },
        });
        return { ok: true } as const;
      },
      { isolationLevel: "Serializable" }
    );
  } catch (e) {
    /* P2002 es el índice único: esta familia ya lo tenía, y eso no mejora
       repitiendo. Lo demás —P2034 y los abortos por serialización— es que
       alguien escribía a la vez, y eso sí se repite. */
    const codigo = (e as { code?: string })?.code;
    return codigo === "P2002" ? { ok: false, motivo: "repetido" } : REINTENTA;
  }
}

/**
 * Soltar un regalo que se había tomado.
 *
 * Sólo el suyo, y sólo si lo eligió él: un regalo que puso el organizador
 * —`asignado`— no se suelta desde la invitación. Si se pudiera, «yo asigno»
 * dejaría de significar nada en cuanto alguien no quisiera el suyo.
 */
export async function soltarRegalo(
  invitationId: string,
  regaloId: string,
  clave: string
): Promise<boolean> {
  const { count } = await prisma.regaloEleccion.deleteMany({
    where: { invitationId, regaloId, clave, asignado: false },
  });
  return count > 0;
}

/* ────────────────────────────────────────────────────────────────
   Cargar la lista y repartirla
   ──────────────────────────────────────────────────────────────── */

/**
 * Agrega regalos a la lista, uno por renglón.
 *
 * Vivía dentro de la ruta del panel, que era el único sitio que cargaba
 * listas. Ahora también la carga el servidor MCP, y dos copias de «cómo se
 * parte un renglón» habrían empezado iguales y terminado distintas: el panel
 * entendiendo la nota y el MCP no, o al revés.
 */
export async function cargarRegalos(invitationId: string, crudo: string): Promise<number> {
  const texto = crudo.trim();
  if (!texto) return 0;

  const ultimo = await prisma.regalo.findFirst({
    where: { invitationId },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });
  let orden = (ultimo?.orden ?? -1) + 1;

  /* Un regalo por renglón, y lo que vaya detrás de "—" es la nota:
     «Cochecito — talla única, en Falabella». Se parte por el guion largo y
     no por el corto porque el corto aparece dentro de los nombres —«Body
     0-3 meses»— y partir por él los rompería. */
  const filas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 200)
    .map((linea) => {
      const corte = linea.indexOf("—");
      const nombre = (corte > 0 ? linea.slice(0, corte) : linea).trim().slice(0, 120);
      const nota = corte > 0 ? linea.slice(corte + 1).trim().slice(0, 200) : "";
      return { invitationId, nombre, nota: nota || null, orden: orden++ };
    })
    .filter((r) => r.nombre);

  if (!filas.length) return 0;
  await prisma.regalo.createMany({ data: filas });
  return filas.length;
}

export type ResultadoAsignar = "ok" | "ya-lo-tenia" | "no-existe" | "lleno";

/**
 * Le pone un regalo a una familia.
 *
 * Marcado `asignado`, que es lo que distingue «se lo puse yo» de «lo eligió
 * él» — y lo que impide que lo suelte desde la invitación: si pudiera,
 * «yo asigno» dejaría de significar nada en cuanto alguien no quisiera el
 * suyo.
 *
 * No necesita la transacción serializable de `tomarRegalo`: aquí no hay
 * carrera, reparte una sola persona desde un solo sitio. Lo que sí hace
 * falta es respetar el cupo, porque asignar a ciegas dejaría un regalo con
 * más dueños que unidades y eso es justo lo que la lista existe para evitar.
 */
export async function asignarRegalo(
  invitationId: string,
  regaloId: string,
  guestLinkId: string
): Promise<ResultadoAsignar> {
  const [enlace, regalo] = await Promise.all([
    prisma.guestLink.findFirst({
      where: { id: guestLinkId, invitationId },
      select: { id: true, names: true },
    }),
    prisma.regalo.findFirst({
      where: { id: regaloId, invitationId },
      select: { id: true, cupo: true, _count: { select: { elecciones: true } } },
    }),
  ]);
  if (!enlace || !regalo) return "no-existe";

  /* «Ya lo tenía» se mira **antes** que el cupo, y no es un detalle de
     orden: con cupo 1 y esa misma familia dentro, el cupo está lleno —por
     ella—, así que preguntar primero por el cupo contestaba «ya no tiene
     sitio» a quien ya lo tiene. Repartiendo veinticinco de una vez eso
     importa: repetir la llamada para completar lo que faltó devolvía
     veinticinco errores de algo que estaba bien. Volver a asignar lo mismo
     a la misma familia tiene que ser decir lo que ya se dijo. */
  const clave = claveDeEleccion(enlace.id, enlace.names);
  const suya = await prisma.regaloEleccion.findUnique({
    where: { regaloId_clave: { regaloId: regalo.id, clave } },
    select: { id: true },
  });
  if (suya) return "ya-lo-tenia";

  if (regalo._count.elecciones >= regalo.cupo) return "lleno";

  try {
    await prisma.regaloEleccion.create({
      data: {
        regaloId, invitationId, guestLinkId: enlace.id,
        nombre: enlace.names, clave,
        asignado: true,
      },
    });
  } catch {
    /* El índice único: esa familia ya tenía ese regalo. No es un fallo que
       enseñar — el resultado es el que se quería. */
    return "ya-lo-tenia";
  }
  return "ok";
}
