import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { claveDeRespuesta } from "@/lib/rsvp";

const STATUSES = new Set(["confirmado", "rechazado", "quiza"]);

interface Respuesta {
  name: string;
  status: string;
  partySize?: number;
}

/** Un link puede traer varios invitados; cada uno responde por separado. */
function normalizar(body: Record<string, unknown>): Respuesta[] {
  const lista = Array.isArray(body.guests) ? body.guests : [body];
  return lista
    .slice(0, 20)
    .map((g) => {
      const fila = (g || {}) as Record<string, unknown>;
      return {
        name: String(fila.name || "").trim().slice(0, 120),
        status: STATUSES.has(String(fila.status)) ? String(fila.status) : "confirmado",
        partySize: Math.min(Math.max(1, Math.floor(Number(fila.partySize) || 1)), 20),
      };
    })
    .filter((g) => g.name);
}

/** Confirmación de asistencia desde una invitación publicada. Sin registro. */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({}));
  const respuestas = normalizar(body);
  if (!respuestas.length) {
    return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { slug: params.slug },
    select: { id: true, published: true },
  });
  if (!invitation || !invitation.published) {
    return NextResponse.json({ error: "Esta invitación no está disponible." }, { status: 404 });
  }

  const phone = String(body.phone || "").trim().slice(0, 40) || null;
  const note = String(body.note || "").trim().slice(0, 500) || null;

  // De qué link personalizado viene, si viene de uno. Se comprueba que sea de
  // esta invitación: el código va en la dirección y podría venir cambiado.
  const codigo = String(body.code || "").trim().slice(0, 40);
  const link = codigo
    ? await prisma.guestLink.findFirst({
        where: { code: codigo, invitationId: invitation.id },
        select: { id: true },
      })
    : null;

  /*
   * Una respuesta por persona, y la última manda.
   *
   * Antes esto era un `createMany` y cada envío añadía filas: quien recargaba
   * la página y volvía a confirmar aparecía dos veces, y el recuento de
   * cabezas del panel sumaba las dos. Ahora la clave dice quién contesta (ver
   * `src/lib/rsvp.ts`) y volver a contestar **reemplaza**: cambiar de idea de
   * «no puedo» a «sí voy» tiene que dejar una sola respuesta, la nueva.
   *
   * Se hace con `upsert` y no leyendo antes para decidir: entre la lectura y
   * la escritura hay una rendija de milisegundos, y un doble clic cae justo
   * ahí. La restricción de la base es la que lo cierra de verdad.
   */
  let repetidas = 0;
  for (const r of respuestas) {
    const clave = claveDeRespuesta(link?.id ?? null, r.name);
    const campos = {
      name: r.name,
      phone,
      status: r.status,
      partySize: r.status === "confirmado" ? r.partySize ?? 1 : 1,
      note,
    };
    const antes = await prisma.rsvp.findUnique({
      where: { invitationId_clave: { invitationId: invitation.id, clave } },
      select: { id: true },
    });
    if (antes) repetidas++;

    try {
      await prisma.rsvp.upsert({
        where: { invitationId_clave: { invitationId: invitation.id, clave } },
        create: {
          invitationId: invitation.id,
          guestLinkId: link?.id ?? null,
          clave,
          ...campos,
        },
        /* El link no se toca al actualizar: si la primera vez contestó por su
           link y ahora entró por la dirección pelada, seguir colgada del link
           es lo que mantiene el panel de quien invita al día. */
        update: campos,
      });
    } catch (e) {
      /* P2002: la restricción de unicidad saltó. Sólo puede pasar si otra
         petición del mismo invitado creó la fila entre el `create` de este
         upsert y su escritura — el doble clic exacto. La respuesta ya está
         registrada, así que se actualiza y se sigue: contestarle "no se pudo
         enviar" le haría reintentar, o pensar que la invitación está rota. */
      if ((e as { code?: string }).code !== "P2002") throw e;
      await prisma.rsvp.update({
        where: { invitationId_clave: { invitationId: invitation.id, clave } },
        data: campos,
      });
      repetidas++;
    }
  }

  const asisten = respuestas.filter((r) => r.status === "confirmado").length;
  return NextResponse.json({
    ok: true,
    // "mixto" cuando en el mismo link unos vienen y otros no.
    status: asisten === respuestas.length ? "confirmado" : asisten ? "mixto" : "rechazado",
    total: respuestas.length,
    asisten,
    /* Para poder decir "actualizamos tu respuesta" en lugar de fingir que es
       la primera vez: quien vuelve a confirmar merece saber que la anterior
       no quedó duplicada. */
    actualizada: repetidas === respuestas.length && repetidas > 0,
  });
}
