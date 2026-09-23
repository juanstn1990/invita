import { NextResponse } from "next/server";
import { DESIGNS } from "@/lib/design/designs";
import { TEMPLATES } from "@/lib/templates";

/**
 * Qué versión está corriendo.
 *
 * Se despliega a mano, y la pregunta «¿esto ya está arriba?» se repitió tanto
 * que se resolvía mirando una invitación y adivinando. Esto la contesta:
 * cuándo se construyó la imagen y qué trae dentro.
 *
 * No hay secretos aquí —números y nombres de diseño— así que es pública, que
 * es lo que la hace útil: se abre desde el móvil sin entrar a nada.
 */
export const dynamic = "force-dynamic";

/* El momento en que se cargó el módulo: en producción, el arranque del
   contenedor, que para este uso es la fecha del despliegue. */
const ARRANQUE = new Date().toISOString();

export async function GET() {
  const conAdornos = DESIGNS.filter((d) => d.adornos?.length);
  return NextResponse.json({
    arrancado: ARRANQUE,
    disenos: DESIGNS.length,
    plantillas: TEMPLATES.length,
    /* Dos cifras que cambian con lo último que se trabajó, para reconocer de
       un vistazo si la imagen trae los cambios o es la de antes. */
    disenosConAdornos: conAdornos.length,
    adornosDeclarados: conAdornos.reduce((n, d) => n + (d.adornos?.length || 0), 0),
  });
}
