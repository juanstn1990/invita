import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, cerrarSesion, cookieOpts } from "@/lib/auth";
import { origenDe } from "@/lib/origen";

/** Cierra la sesión y devuelve a la puerta. */
export async function POST(request: Request) {
  await cerrarSesion(cookies().get(COOKIE)?.value);
  const res = NextResponse.redirect(new URL("/entrar", origenDe(request)));
  res.cookies.set(COOKIE, "", { ...cookieOpts(), maxAge: 0 });
  return res;
}
