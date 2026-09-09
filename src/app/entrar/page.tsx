import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import {
  COOKIE,
  abrirSesion,
  cifrar,
  coincide,
  cookieOpts,
  sesionActual,
  sinCuentas,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./entrar.module.css";

export const dynamic = "force-dynamic";

/** Sólo se aceptan destinos de esta misma app, para no reenviar a otro sitio. */
function destinoSeguro(v: string | undefined) {
  if (!v || !v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: { volver?: string; error?: string };
}) {
  if (await sesionActual()) redirect(destinoSeguro(searchParams.volver));

  const primera = await sinCuentas();
  const volver = destinoSeguro(searchParams.volver);

  async function entrar(form: FormData) {
    "use server";

    const email = String(form.get("email") || "").trim().toLowerCase();
    const clave = String(form.get("clave") || "");
    const volverA = destinoSeguro(String(form.get("volver") || "/"));
    const falla = (m: string) =>
      redirect(`/entrar?volver=${encodeURIComponent(volverA)}&error=${encodeURIComponent(m)}`);

    if (!email.includes("@") || clave.length < 8) {
      return falla("Escribe un correo y una contraseña de al menos 8 caracteres.");
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // La primera cuenta se crea sola: es la del organizador, que acaba de
      // levantar la app y no tiene por dónde registrarse. En cuanto existe una,
      // esta puerta se cierra y ya no se puede crear otra desde aquí.
      if (!(await sinCuentas())) return falla("Correo o contraseña incorrectos.");
      user = await prisma.user.create({
        data: { email, password: await cifrar(clave) },
      });
    } else if (!(await coincide(clave, user.password))) {
      return falla("Correo o contraseña incorrectos.");
    }

    const { token, expiresAt } = await abrirSesion(
      user.id,
      headers().get("user-agent"),
    );
    cookies().set(COOKIE, token, cookieOpts(expiresAt));
    redirect(volverA);
  }

  return (
    <main className={styles.page}>
      <div className={styles.caja}>
        <h1 className={styles.marca}>Invita</h1>
        <p className={styles.lema}>
          {primera ? "Crea la cuenta del organizador." : "Entra para editar tus invitaciones."}
        </p>

        {searchParams.error ? (
          <p className={styles.error}>{searchParams.error}</p>
        ) : null}

        {primera ? (
          <p className={styles.aviso}>
            Todavía no hay ninguna cuenta. El correo y la contraseña que
            escribas aquí quedan como los tuyos. Las invitaciones publicadas
            siguen abiertas para quien reciba el enlace; esto sólo protege el
            editor.
          </p>
        ) : null}

        <form action={entrar}>
          <input type="hidden" name="volver" value={volver} />
          <div className={styles.campo}>
            <label className="field-label" htmlFor="email">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className={styles.campo}>
            <label className="field-label" htmlFor="clave">Contraseña</label>
            <input
              id="clave"
              name="clave"
              type="password"
              className="input"
              autoComplete={primera ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className={`btn btn-primary ${styles.enviar}`}>
            {primera ? "Crear la cuenta" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
