import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { COOKIE } from "./sesion";

export { COOKIE };

/** Cuánto dura una sesión sin volver a pedir la contraseña. */
const DIAS = 30;

/*
 * Contraseñas
 * ───────────
 * scrypt viene en Node, así que no hace falta bcrypt ni argon2. Los
 * parámetros son los recomendados por OWASP para scrypt interactivo
 * (N=2^17, r=8, p=1); con maxmem por debajo del que piden, Node lanza en
 * lugar de calcular, de ahí el margen.
 */
const N = 2 ** 17;
const LARGO = 64;
const OPCIONES = { N, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

function derivar(clave: string, sal: Buffer): Promise<Buffer> {
  return new Promise((ok, mal) =>
    crypto.scrypt(clave.normalize("NFKC"), sal, LARGO, OPCIONES, (e, d) =>
      e ? mal(e) : ok(d),
    ),
  );
}

/** Convierte una contraseña en lo que se guarda: `sal:derivada`, en hex. */
export async function cifrar(clave: string): Promise<string> {
  const sal = crypto.randomBytes(16);
  const d = await derivar(clave, sal);
  return `${sal.toString("hex")}:${d.toString("hex")}`;
}

/**
 * Comprueba una contraseña contra lo guardado.
 *
 * La comparación es en tiempo constante: comparar con `===` filtra por
 * cuánto tarda cuántos bytes iniciales acertó quien prueba.
 */
export async function coincide(clave: string, guardado: string): Promise<boolean> {
  const [salHex, esperado] = guardado.split(":");
  if (!salHex || !esperado) return false;
  let d: Buffer;
  try {
    d = await derivar(clave, Buffer.from(salHex, "hex"));
  } catch {
    return false;
  }
  const a = Buffer.from(esperado, "hex");
  return a.length === d.length && crypto.timingSafeEqual(a, d);
}

/*
 * Sesiones
 * ────────
 * En la cookie viaja un token aleatorio; en la base, sólo su SHA-256. Así una
 * copia de la base —un respaldo, un volcado— no sirve para entrar. El token
 * es aleatorio de 32 bytes, no se deriva de nada, así que no hace falta el
 * coste de scrypt para hashearlo.
 */
const hashear = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Abre una sesión para un usuario y devuelve el token de la cookie. */
export async function abrirSesion(userId: string, agent?: string | null) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DIAS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      tokenHash: hashear(token),
      userId,
      expiresAt,
      agent: agent?.slice(0, 200) || null,
    },
  });
  // Las caducadas se van barriendo aquí y no en una tarea aparte: son pocas y
  // esto ocurre una vez por inicio de sesión.
  await prisma.session
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});
  return { token, expiresAt };
}

/** Cierra la sesión que trae la cookie, si existe. */
export async function cerrarSesion(token: string | undefined) {
  if (!token) return;
  await prisma.session
    .deleteMany({ where: { tokenHash: hashear(token) } })
    .catch(() => {});
}

export type Sesion = { id: string; email: string; name: string | null };

/**
 * Quién está entrando, o `null`.
 *
 * Ésta es la frontera de verdad: el middleware sólo redirige para que la
 * navegación se sienta bien, y una redirección no protege una API.
 */
export async function sesionActual(): Promise<Sesion | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session
    .findUnique({
      where: { tokenHash: hashear(token) },
      include: { user: { select: { id: true, email: true, name: true } } },
    })
    .catch(() => null);
  if (!s) return null;
  if (s.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: s.id } }).catch(() => {});
    return null;
  }
  return s.user;
}

/** Opciones de la cookie. Igual al ponerla que al borrarla. */
export function cookieOpts(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // En producción va por HTTPS; en local, no, y marcarla `secure` la haría
    // invisible para el navegador.
    secure: process.env.NODE_ENV === "production",
    ...(expires ? { expires } : {}),
  };
}

/** Si todavía no hay ninguna cuenta, la primera visita crea la del organizador. */
export async function sinCuentas() {
  return (await prisma.user.count()) === 0;
}

/**
 * Guardia para los route handlers.
 *
 * Devuelve `null` si hay sesión, o la respuesta que hay que devolver si no.
 * Se usa así:
 *
 *     const no = await noAutorizado();
 *     if (no) return no;
 */
export async function noAutorizado(): Promise<Response | null> {
  if (await sesionActual()) return null;
  return new Response(JSON.stringify({ error: "Entra para hacer esto." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Guardia para las páginas del editor: devuelve la sesión o manda a la puerta.
 *
 * El middleware ya redirige a quien no trae cookie, pero una cookie vieja o
 * de una sesión ya cerrada la pasa igual; aquí es donde se comprueba.
 */
export async function requiereSesion(volver?: string): Promise<Sesion> {
  const s = await sesionActual();
  if (s) return s;
  redirect(volver ? `/entrar?volver=${encodeURIComponent(volver)}` : "/entrar");
}
