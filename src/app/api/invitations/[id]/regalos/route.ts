import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noAutorizado } from "@/lib/auth";
import { asignarRegalo, cargarRegalos, listarRegalos } from "@/lib/regalos";

/**
 * La lista de regalos desde el panel: cargarla, repartirla y liberarla.
 *
 * Todo detrás de sesión. Lo que ve el organizador es lo que no ve nadie
 * más: quién eligió cada regalo y cuándo.
 */

/** La lista con quién tiene qué, y los enlaces a los que repartir. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const [regalos, enlaces] = await Promise.all([
    listarRegalos(params.id, null, true),
    prisma.guestLink.findMany({
      where: { invitationId: params.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, names: true, note: true },
    }),
  ]);
  return NextResponse.json({ regalos, enlaces });
}

/**
 * Agrega regalos a la lista.
 *
 * Acepta varios de una vez porque así es como se carga una lista de verdad:
 * se pega lo que ya está escrito en una nota del teléfono, un regalo por
 * renglón, en lugar de abrir un formulario treinta veces.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const body = await request.json().catch(() => ({}));

  /* Repartir: una elección que pone el organizador, marcada como `asignado`
     para que el panel distinga lo que eligió el invitado de lo que le
     tocó, y para que la invitación no le deje soltarlo. */
  if (body.accion === "asignar") {
    const regaloId = String(body.regalo || "").trim();
    const guestLinkId = String(body.enlace || "").trim();
    if (!regaloId || !guestLinkId) {
      return NextResponse.json({ error: "Falta el regalo o el invitado." }, { status: 400 });
    }
    const r = await asignarRegalo(params.id, regaloId, guestLinkId);
    if (r === "no-existe") {
      return NextResponse.json({ error: "Ese regalo o ese invitado ya no están." }, { status: 404 });
    }
    if (r === "lleno") {
      return NextResponse.json({ error: "Ese regalo ya no tiene sitio." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, ...(r === "ya-lo-tenia" ? { yaEstaba: true } : {}) });
  }

  const agregados = await cargarRegalos(params.id, String(body.texto || ""));
  if (agregados) return NextResponse.json({ ok: true, agregados });
  if (String(body.texto || "").trim()) {
    return NextResponse.json({ error: "No había nada que agregar." }, { status: 400 });
  }

  return NextResponse.json({ error: "Escribe al menos un regalo." }, { status: 400 });
}

/** Cambia un regalo: su nombre, su nota, su foto o cuántos caben. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const body = await request.json().catch(() => ({}));
  const regaloId = String(body.regalo || "").trim();
  if (!regaloId) return NextResponse.json({ error: "Falta el regalo." }, { status: 400 });

  const cupo = Number(body.cupo);
  const datos: Record<string, unknown> = {};
  if (typeof body.nombre === "string") datos.nombre = body.nombre.trim().slice(0, 120);
  if (typeof body.nota === "string") datos.nota = body.nota.trim().slice(0, 200) || null;
  if (typeof body.imagen === "string") datos.imagen = body.imagen.trim() || null;
  if (Number.isFinite(cupo)) datos.cupo = Math.min(50, Math.max(1, cupo));
  if (!Object.keys(datos).length) return NextResponse.json({ ok: true });

  await prisma.regalo.updateMany({ where: { id: regaloId, invitationId: params.id }, data: datos });
  return NextResponse.json({ ok: true });
}

/**
 * Quita un regalo de la lista, o libera el que tenía alguien.
 *
 * Liberar y borrar son cosas distintas y por eso son dos parámetros: liberar
 * deja el regalo en la lista para que lo tome otro —se arrepintieron, o lo
 * asignaste mal—, borrar se lo lleva entero con lo que hubiera elegido
 * alguien, que es lo que hay que poder hacer cuando un regalo sobra.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const no = await noAutorizado();
  if (no) return no;

  const q = new URL(request.url).searchParams;
  const liberar = q.get("liberar");
  if (liberar) {
    await prisma.regaloEleccion.deleteMany({
      where: { invitationId: params.id, regaloId: liberar, ...(q.get("clave") ? { clave: q.get("clave")! } : {}) },
    });
    return NextResponse.json({ ok: true });
  }

  const regaloId = q.get("regalo");
  if (!regaloId) return NextResponse.json({ error: "Falta el regalo." }, { status: 400 });
  await prisma.regalo.deleteMany({ where: { id: regaloId, invitationId: params.id } });
  return NextResponse.json({ ok: true });
}
