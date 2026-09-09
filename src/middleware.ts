import { NextRequest, NextResponse } from "next/server";
import { COOKIE } from "@/lib/sesion";

/*
 * Esto no es la cerradura, es el pomo.
 *
 * El middleware corre en el runtime Edge, donde no hay base de datos, así que
 * lo único que puede ver es si la cookie está. Sirve para que quien no ha
 * entrado aterrice en la puerta en lugar de en una página en blanco. La
 * comprobación de verdad —que la sesión exista y no haya caducado— la hace
 * cada página y cada API con `sesionActual()`.
 *
 * Las direcciones publicadas quedan fuera a propósito: una invitación se
 * comparte por WhatsApp con gente que no tiene cuenta aquí, y el enlace de
 * cada invitado (`/g/…`) ya lleva su propia llave en el token.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(COOKIE)) return NextResponse.next();

  const volver = request.nextUrl.pathname + request.nextUrl.search;
  const url = new URL("/entrar", request.url);
  if (volver !== "/") url.searchParams.set("volver", volver);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/nueva", "/editor/:path*"],
};
