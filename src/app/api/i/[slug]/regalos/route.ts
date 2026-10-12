import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/auth";
import { eventoLlego, fechaActivacionDe } from "@/lib/disponibilidadEvento";
import {
  claveDeEleccion, configRegalos, listarRegalos, soltarRegalo, tomarRegalo,
} from "@/lib/regalos";
import type { InvitationData } from "@/lib/schema";

/**
 * La lista de regalos, para quien la está mirando.
 *
 * Sin sesión y sin registro, como el resto de lo que ven los invitados. Lo
 * que la hace distinta del libro de deseos es que aquí **sí** hay que saber
 * quién eres: la lista reparte cosas y nadie puede tomar el regalo de otro
 * ni soltarlo. Eso lo dice el código del enlace de invitado (`?g=CODE`), que
 * ya existía para saber qué familia confirmó.
 */
export const dynamic = "force-dynamic";

/** Lo que hay que saber de quien pide, resuelto una vez. */
async function contexto(slug: string, codigo: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true, published: true, data: true },
  });
  if (!invitation) return null;

  const esOrganizador = !!(await sesionActual());
  if (!invitation.published && !esOrganizador) return null;

  const data = JSON.parse(invitation.data) as InvitationData;
  const enlace = codigo
    ? await prisma.guestLink.findFirst({
        where: { code: codigo, invitationId: invitation.id },
        select: { id: true, names: true },
      })
    : null;

  return {
    invitation,
    data,
    cfg: configRegalos(data),
    esOrganizador,
    enlace,
    abierto: eventoLlego(fechaActivacionDe(data, "regalos")) || esOrganizador,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const codigo = new URL(request.url).searchParams.get("g") || "";
  const ctx = await contexto(params.slug, codigo);
  if (!ctx) {
    return NextResponse.json({ error: "Esta invitación no está disponible." }, { status: 404 });
  }

  const clave = ctx.enlace ? claveDeEleccion(ctx.enlace.id, ctx.enlace.names) : null;

  /* En «yo asigno» la lista no se enseña: el invitado abre y ve sólo lo
     suyo. Enseñarla entera sería deshacer el modo — si ve lo que queda
     libre, lo que hay es una lista de la que no puede elegir, que es peor
     que no tenerla. */
  if (ctx.cfg.modo === "asignado" && !ctx.esOrganizador) {
    if (!ctx.enlace) {
      return NextResponse.json({ modo: "asignado", sinEnlace: true, mios: [] });
    }
    const mios = await prisma.regaloEleccion.findMany({
      where: { invitationId: ctx.invitation.id, clave: claveDeEleccion(ctx.enlace.id, ctx.enlace.names) },
      orderBy: { createdAt: "asc" },
      include: { regalo: { select: { nombre: true, nota: true, imagen: true } } },
    });
    return NextResponse.json({
      modo: "asignado",
      quien: ctx.enlace.names,
      mios: mios.map((e) => ({
        id: e.regaloId,
        nombre: e.regalo.nombre,
        nota: e.regalo.nota || "",
        imagen: e.regalo.imagen || "",
      })),
    });
  }

  /* Los nombres de quién eligió sólo viajan al organizador. Para un invitado
     la lista dice si algo está tomado, no por quién: en un baby shower, ver
     que la suegra ya tomó el cochecito cambia lo que la gente elige. */
  const regalos = await listarRegalos(ctx.invitation.id, clave, ctx.esOrganizador);
  return NextResponse.json({
    modo: ctx.cfg.modo,
    abierto: ctx.abierto,
    tope: ctx.cfg.tope,
    quien: ctx.enlace?.names || "",
    sinEnlace: !ctx.enlace,
    regalos,
  });
}

/**
 * Tomar o soltar un regalo.
 *
 * Sin enlace de invitado no se puede: la elección tiene que quedar colgada
 * de alguien, y «alguien» aquí es el enlace. Quien entre por la dirección
 * pelada ve la lista y a quién pedirle el suyo, que es más honesto que
 * dejarle tomar algo que luego nadie sabe de quién es.
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({}));
  const codigo = String(body.g || "").trim();
  const ctx = await contexto(params.slug, codigo);
  if (!ctx) {
    return NextResponse.json({ error: "Esta invitación no está disponible." }, { status: 404 });
  }
  if (!ctx.abierto) {
    return NextResponse.json(
      { error: "La lista todavía no está abierta." },
      { status: 403 }
    );
  }
  if (ctx.cfg.modo === "asignado") {
    return NextResponse.json(
      { error: "En esta lista los regalos los reparte quien invita." },
      { status: 403 }
    );
  }
  if (!ctx.enlace) {
    return NextResponse.json(
      { error: "Abre la lista desde tu enlace de invitación para poder elegir." },
      { status: 403 }
    );
  }

  const regaloId = String(body.regalo || "").trim();
  if (!regaloId) return NextResponse.json({ error: "Falta el regalo." }, { status: 400 });

  const clave = claveDeEleccion(ctx.enlace.id, ctx.enlace.names);

  if (body.accion === "soltar") {
    const ok = await soltarRegalo(ctx.invitation.id, regaloId, clave);
    if (!ok) {
      return NextResponse.json(
        { error: "Ese regalo ya no es tuyo para soltarlo." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  const r = await tomarRegalo(
    ctx.invitation.id, regaloId, ctx.enlace.id, ctx.enlace.names, ctx.cfg.tope
  );
  if (!r.ok) {
    const mensajes: Record<string, string> = {
      tomado: "Alguien se adelantó: ese regalo ya está tomado.",
      repetido: "Ese regalo ya lo tienes tú.",
      tope: `Ya elegiste el máximo de ${ctx.cfg.tope} regalos.`,
      "no-existe": "Ese regalo ya no está en la lista.",
    };
    /* 409 y no 400: no es que la petición esté mal escrita, es que el mundo
       cambió entre que se pintó la lista y se tocó el botón. La página lo
       distingue para volver a pedir la lista en vez de culpar a quien pulsó. */
    return NextResponse.json(
      { error: mensajes[r.motivo] || "No se pudo tomar ese regalo." },
      { status: r.motivo === "no-existe" ? 404 : 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
