"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./regalos.module.css";

interface Regalo {
  id: string;
  nombre: string;
  nota: string;
  imagen: string;
  cupo: number;
  libres: number;
  mio: boolean;
}

interface Estado {
  modo: "elige" | "asignado";
  abierto?: boolean;
  tope?: number;
  quien?: string;
  sinEnlace?: boolean;
  regalos?: Regalo[];
  mios?: { id: string; nombre: string; nota: string; imagen: string }[];
}

/** Cada cuánto se vuelve a pedir la lista, en milisegundos. */
const CADA = 5000;

/**
 * La lista, y el botón de tomar.
 *
 * **El sondeo no es lo que evita los repetidos.** Eso lo hace la base, con
 * un índice único y una transacción serializada (ver `tomarRegalo`): dos
 * personas tocando el mismo botón en el mismo segundo sólo pueden ganar una,
 * pase lo que pase aquí. Lo que hace el sondeo es que la lista no mienta
 * mientras la miras — que lo que otro acaba de tomar se vea tomado antes de
 * que llegues a tocarlo. Refrescar cada cinco segundos es suficiente para
 * eso y no mete infraestructura nueva: lo otro sería mantener una conexión
 * abierta por invitado para un baby shower de treinta personas.
 *
 * Y cuando el servidor dice «alguien se adelantó», la lista se vuelve a
 * pedir inmediatamente: ese 409 es la prueba de que lo que se está viendo
 * ya caducó.
 */
export function Lista({ slug, codigo }: { slug: string; codigo: string }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");
  /* Para no pisar la lista con una respuesta vieja que llegó tarde. */
  const ultima = useRef(0);

  const cargar = useCallback(async () => {
    const turno = ++ultima.current;
    try {
      const r = await fetch(
        `/api/i/${slug}/regalos${codigo ? `?g=${encodeURIComponent(codigo)}` : ""}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (turno === ultima.current && r.ok) setEstado(j);
    } catch {
      /* Sin red: se deja lo último que se vio en vez de vaciar la pantalla. */
    }
  }, [slug, codigo]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, CADA);
    /* Al volver a la pestaña, antes de esperar los cinco segundos: es justo
       cuando más probable es que la lista esté vieja. */
    const alVolver = () => { if (!document.hidden) cargar(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", alVolver); };
  }, [cargar]);

  async function tocar(regalo: string, accion: "tomar" | "soltar") {
    setOcupado(regalo);
    setError("");
    try {
      const r = await fetch(`/api/i/${slug}/regalos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regalo, accion, g: codigo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "No se pudo. Inténtalo otra vez.");
    } catch {
      setError("No hay conexión. Inténtalo otra vez.");
    } finally {
      setOcupado("");
      await cargar();
    }
  }

  if (!estado) return <p className={styles.cargando}>Cargando la lista…</p>;

  /* ── «Yo asigno»: sólo el suyo ── */
  if (estado.modo === "asignado") {
    if (estado.sinEnlace) {
      return (
        <p className={styles.aviso}>
          Abre la invitación desde el enlace que te enviaron para ver qué regalo te tocó.
        </p>
      );
    }
    if (!estado.mios?.length) {
      return <p className={styles.aviso}>Todavía no te hemos asignado ningún regalo.</p>;
    }
    return (
      <>
        <p className={styles.quien}>Para {estado.quien}</p>
        <ul className={styles.rejilla}>
          {estado.mios.map((r) => (
            <li key={r.id} className={`${styles.ficha} ${styles.fichaMia}`}>
              {r.imagen && <img className={styles.foto} src={r.imagen} alt="" />}
              <div className={styles.datos}>
                <p className={styles.nombre}>{r.nombre}</p>
                {r.nota && <p className={styles.nota}>{r.nota}</p>}
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  }

  /* ── «Eligen ellos»: la lista entera ── */
  const regalos = estado.regalos || [];
  const mios = regalos.filter((r) => r.mio).length;
  const enTope = !!estado.tope && mios >= estado.tope;

  return (
    <>
      {estado.quien && <p className={styles.quien}>Hola, {estado.quien}</p>}
      {estado.sinEnlace && (
        <p className={styles.aviso}>
          Esta es la lista, pero para apartar un regalo hay que abrirla desde el
          enlace de invitación que te enviaron.
        </p>
      )}
      {!estado.abierto && <p className={styles.aviso}>La lista todavía no está abierta.</p>}
      {!!estado.tope && !estado.sinEnlace && (
        <p className={styles.tope}>
          Puedes elegir hasta {estado.tope} {estado.tope === 1 ? "regalo" : "regalos"} — llevas {mios}.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!regalos.length ? (
        <p className={styles.aviso}>Todavía no hay regalos en la lista.</p>
      ) : (
        <ul className={styles.rejilla}>
          {regalos.map((r) => {
            const tomado = r.libres <= 0 && !r.mio;
            return (
              <li
                key={r.id}
                className={`${styles.ficha} ${r.mio ? styles.fichaMia : ""} ${tomado ? styles.fichaTomada : ""}`}
              >
                {r.imagen && <img className={styles.foto} src={r.imagen} alt="" />}
                <div className={styles.datos}>
                  <p className={styles.nombre}>{r.nombre}</p>
                  {r.nota && <p className={styles.nota}>{r.nota}</p>}
                  {/* Cuántos quedan sólo se dice cuando hay varios: en un
                      regalo único, «queda 1» es ruido. */}
                  {r.cupo > 1 && !r.mio && (
                    <p className={styles.quedan}>
                      {r.libres > 0 ? `Quedan ${r.libres} de ${r.cupo}` : `Los ${r.cupo} están tomados`}
                    </p>
                  )}
                </div>
                {r.mio ? (
                  <button
                    className={styles.soltar}
                    disabled={ocupado === r.id}
                    onClick={() => tocar(r.id, "soltar")}
                  >
                    {ocupado === r.id ? "…" : "Lo llevo yo · soltar"}
                  </button>
                ) : tomado ? (
                  <span className={styles.yaEsta}>Ya lo llevan</span>
                ) : (
                  <button
                    className={styles.tomar}
                    disabled={!!ocupado || estado.sinEnlace || !estado.abierto || enTope}
                    onClick={() => tocar(r.id, "tomar")}
                  >
                    {ocupado === r.id ? "…" : "Lo llevo yo"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
