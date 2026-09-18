"use client";

import { useState } from "react";
import Link from "next/link";
import { ESTADOS, faltan, urge, resumir, type Estado } from "@/lib/tablero";
import styles from "./tablero.module.css";

export interface Tarjeta {
  id: string;
  titulo: string;
  slug: string;
  publicada: boolean;
  estado: Estado;
  pagada: boolean;
  /** ISO del evento, para los días que faltan. */
  fecha: string;
  fechaTexto: string;
  diseno: string;
  paleta: [string, string, string];
}

/**
 * El tablero.
 *
 * Optimista a propósito: al soltar una tarjeta se mueve en pantalla y
 * **después** se avisa al servidor. Esperar la respuesta para moverla hace
 * que arrastrar se sienta pegajoso, y pegajoso en un tablero es la diferencia
 * entre usarlo y no usarlo. Si el servidor dice que no, vuelve a su sitio y
 * se explica — que es lo que casi nunca se hace y por lo que «optimista»
 * tiene mala fama.
 */
export function Tablero({
  inicial,
  ocultas = 0,
}: {
  inicial: Tarjeta[];
  /** Las del constructor retirado: se cuentan aunque no se puedan abrir. */
  ocultas?: number;
}) {
  const [tarjetas, setTarjetas] = useState(inicial);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<Estado | null>(null);
  const [error, setError] = useState("");

  const resumen = resumir(tarjetas);

  async function guardar(id: string, cambio: Record<string, unknown>, deshacer: () => void) {
    setError("");
    try {
      const r = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambio),
      });
      if (!r.ok) {
        const { error } = await r.json().catch(() => ({ error: "" }));
        throw new Error(error || `El servidor respondió ${r.status}.`);
      }
    } catch (e) {
      deshacer();
      setError(`No se pudo guardar: ${(e as Error).message}`);
    }
  }

  function mover(id: string, estado: Estado) {
    const antes = tarjetas;
    const t = tarjetas.find((x) => x.id === id);
    if (!t || t.estado === estado) return;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, estado } : x)));
    guardar(id, { estado }, () => setTarjetas(antes));
  }

  function cobrar(id: string, pagada: boolean) {
    const antes = tarjetas;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, pagada } : x)));
    guardar(id, { pagada }, () => setTarjetas(antes));
  }

  return (
    <div className={styles.envoltorio}>
      <div className={styles.resumen}>
        <span className={styles.dato}>
          <strong>{resumen.total}</strong> invitaciones
        </span>
        {ocultas > 0 && (
          <span className={styles.dato} title="Hechas con el constructor visual, que se retiró">
            <strong>{ocultas}</strong> de una versión anterior, sin poder abrir
          </span>
        )}
        {resumen.urgentes > 0 && (
          <span className={`${styles.dato} ${styles.urgente}`}>
            <strong>{resumen.urgentes}</strong>{" "}
            {resumen.urgentes === 1 ? "se celebra" : "se celebran"} en menos de dos
            semanas y no {resumen.urgentes === 1 ? "está entregada" : "están entregadas"}
          </span>
        )}
        {resumen.sinCobrar > 0 && (
          <span className={`${styles.dato} ${styles.cobro}`}>
            <strong>{resumen.sinCobrar}</strong>{" "}
            {resumen.sinCobrar === 1 ? "entregada sin cobrar" : "entregadas sin cobrar"}
          </span>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.columnas}>
        {ESTADOS.map((col) => {
          const suyas = tarjetas.filter((t) => t.estado === col.id);
          return (
            <section
              key={col.id}
              className={styles.columna}
              data-encima={encima === col.id || undefined}
              onDragOver={(e) => { e.preventDefault(); setEncima(col.id); }}
              onDragLeave={() => setEncima((x) => (x === col.id ? null : x))}
              onDrop={(e) => {
                e.preventDefault();
                setEncima(null);
                const id = e.dataTransfer.getData("text/plain") || arrastrando;
                /* También aquí y no sólo en `onDragEnd`: si ese evento no
                   llega —pasa al soltar fuera, y con algunas capas de por
                   medio— la tarjeta se queda translúcida para siempre y
                   parece rota. */
                setArrastrando(null);
                if (id) mover(id, col.id);
              }}
            >
              <header className={styles.cabecera}>
                <span className={styles.punto} style={{ background: col.color }} aria-hidden />
                <h2 className={styles.tituloColumna}>{col.label}</h2>
                <span className={styles.cuenta}>{suyas.length}</span>
              </header>
              <p className={styles.pista}>{col.hint}</p>

              <ul className={styles.pila}>
                {suyas.map((t) => (
                  <li
                    key={t.id}
                    className={styles.tarjeta}
                    draggable
                    data-arrastrando={arrastrando === t.id || undefined}
                    data-urgente={urge(t.fecha, t.estado) || undefined}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastrando(t.id);
                    }}
                    onDragEnd={() => { setArrastrando(null); setEncima(null); }}
                  >
                    <Link href={`/editor/${t.id}`} className={styles.nombre}>
                      {t.titulo}
                    </Link>

                    <p className={styles.cuando}>
                      {t.fechaTexto}
                      {faltan(t.fecha) && (
                        <span className={styles.faltan}> · {faltan(t.fecha)}</span>
                      )}
                    </p>

                    <div className={styles.pie}>
                      {/* El sello de pago. Un botón y no una casilla: es una
                          acción que se hace y se deshace, y la casilla sugiere
                          un formulario que hay que enviar. */}
                      <button
                        type="button"
                        className={styles.pago}
                        data-pagada={t.pagada || undefined}
                        onClick={() => cobrar(t.id, !t.pagada)}
                        title={t.pagada ? "Marcar como no cobrada" : "Marcar como cobrada"}
                      >
                        {t.pagada ? "Pagada" : "Sin cobrar"}
                      </button>

                      {t.publicada && (
                        <a
                          href={`/${t.slug}`}
                          target="_blank"
                          rel="noopener"
                          className={styles.enlace}
                          title={`Abrir /${t.slug}`}
                        >
                          ver ↗
                        </a>
                      )}
                    </div>

                    {/* Arrastrar no existe en un teléfono: los eventos de
                        arrastre de HTML no llegan con el dedo. Sin esto el
                        tablero se vería perfecto y no se podría usar, que es
                        la peor clase de roto. */}
                    <label className={styles.mover}>
                      <span className="sr-only">Mover {t.titulo} a otra columna</span>
                      <select
                        value={t.estado}
                        onChange={(e) => mover(t.id, e.target.value as Estado)}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e.id} value={e.id}>{e.label}</option>
                        ))}
                      </select>
                    </label>
                  </li>
                ))}

                {!suyas.length && <li className={styles.vacia}>Nada aquí</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
