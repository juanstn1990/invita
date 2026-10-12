"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./regalos.module.css";

interface Eleccion { nombre: string; asignado: boolean; cuando: string }
interface Regalo {
  id: string; nombre: string; nota: string; imagen: string;
  cupo: number; libres: number; de: Eleccion[];
}
interface Enlace { id: string; names: string; note: string | null }

/**
 * El panel de la lista: cargarla, ver quién tiene qué y repartir.
 *
 * Se refresca sola cada diez segundos. Más espaciado que la página de los
 * invitados —cinco— porque aquí nadie está compitiendo por nada: se mira
 * para saber cómo va, no para llegar antes que otro.
 */
export function Panel({ id, modo }: { id: string; modo: "elige" | "asignado" }) {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [enlaces, setEnlaces] = useState<Enlace[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`/api/invitations/${id}/regalos`, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      setRegalos(j.regalos || []);
      setEnlaces(j.enlaces || []);
    } catch {
      /* Sin red se deja lo último que se vio. */
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, [cargar]);

  async function pedir(metodo: string, cuerpo?: unknown, query = "") {
    setError("");
    try {
      const r = await fetch(`/api/invitations/${id}/regalos${query}`, {
        method: metodo,
        ...(cuerpo ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) } : {}),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "No se pudo.");
      return r.ok;
    } catch {
      setError("No hay conexión.");
      return false;
    } finally {
      await cargar();
    }
  }

  const tomados = regalos.filter((r) => r.de.length).length;

  return (
    <>
      <section className={styles.cargar}>
        <h2 className={styles.h2}>Cargar la lista</h2>
        <p className={styles.ayuda}>
          Un regalo por renglón. Lo que pongas después de un guion largo (—) es la
          nota: <code>Cochecito — color gris, en Falabella</code>
        </p>
        <textarea
          className={styles.area}
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={"Cochecito — color gris\nPañales talla 1\nBañera"}
        />
        <button
          className="btn btn-primary btn-sm"
          disabled={!texto.trim()}
          onClick={async () => {
            if (await pedir("POST", { texto })) setTexto("");
          }}
        >
          Agregar a la lista
        </button>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <section>
        <h2 className={styles.h2}>
          La lista{" "}
          <span className={styles.cuenta}>
            {cargando ? "…" : `${tomados} de ${regalos.length} con dueño`}
          </span>
        </h2>

        {!cargando && !regalos.length && (
          <p className={styles.ayuda}>Todavía no has cargado ningún regalo.</p>
        )}

        <ul className={styles.lista}>
          {regalos.map((r) => (
            <li key={r.id} className={styles.fila}>
              <div className={styles.datos}>
                <p className={styles.nombre}>{r.nombre}</p>
                {r.nota && <p className={styles.nota}>{r.nota}</p>}
                {r.de.length ? (
                  <ul className={styles.quienes}>
                    {r.de.map((e, i) => (
                      <li key={i}>
                        <b>{e.nombre}</b>
                        <span className={styles.cuando}>
                          {e.asignado ? " · se lo asignaste" : " · lo eligió"}{" "}
                          {new Date(e.cuando).toLocaleDateString("es", { day: "numeric", month: "short" })}
                        </span>
                        <button
                          className={styles.liberar}
                          onClick={() => pedir("DELETE", undefined, `?liberar=${r.id}`)}
                        >
                          liberar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.libre}>Libre{r.cupo > 1 ? ` · caben ${r.cupo}` : ""}</p>
                )}

                {/* Repartir. Sale siempre, no sólo en modo asignado: también
                    en «eligen ellos» hace falta poder ponerle el suyo a quien
                    no tiene teléfono o no lo va a abrir nunca. */}
                {r.libres > 0 && enlaces.length > 0 && (
                  <select
                    className={styles.asignar}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) pedir("POST", { accion: "asignar", regalo: r.id, enlace: e.target.value });
                    }}
                  >
                    <option value="">Asignárselo a…</option>
                    {enlaces.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.names}{x.note ? ` (${x.note})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button
                className={styles.borrar}
                title="Quitar de la lista"
                onClick={() => pedir("DELETE", undefined, `?regalo=${r.id}`)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      {modo === "asignado" && !enlaces.length && (
        <p className={styles.ayuda}>
          Para repartir hace falta tener enlaces de invitado creados. Se arman en el
          editor, en «Invitados».
        </p>
      )}
    </>
  );
}
