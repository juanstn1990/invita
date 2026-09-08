"use client";

import { useEffect, useState } from "react";
import type { BlockSpec } from "@/lib/blocks";
import type { InvitationData } from "@/lib/schema";
import styles from "./editor.module.css";

interface Opcion {
  id: string;
  name: string;
  hint?: string;
  html: string;
}

/**
 * La biblioteca de un bloque: todas sus formas, dibujadas.
 *
 * Un desplegable con nombres obliga a probar una por una para saber cuál
 * queda bien. Aquí se piden todas al servidor ya renderizadas con el diseño,
 * los colores y los textos de esta invitación, y se ven a la vez. Cada tarjeta
 * es un iframe con la sección suelta, escalada para que quepa.
 */
export function Biblioteca({
  spec,
  actual,
  templateId,
  data,
  blockId,
  enDiseno,
  aviso,
  onElegir,
  onClose,
}: {
  spec: BlockSpec;
  actual: string;
  templateId: string;
  data: InvitationData;
  blockId: string;
  enDiseno: boolean;
  /** Advertencia previa: sin foto todas las portadas salen iguales. */
  aviso?: string;
  onElegir: (variant: string) => void;
  onClose: () => void;
}) {
  const [opciones, setOpciones] = useState<Opcion[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/biblioteca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, data, tipo: spec.type, blockId, enDiseno }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no se pudo cargar"))))
      .then((j) => vivo && setOpciones(j.opciones))
      .catch(() => vivo && setError("No se pudieron dibujar las opciones."));
    return () => {
      vivo = false;
    };
  }, [templateId, data, spec.type, blockId, enDiseno]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.dialog} ${styles.biblioteca}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Formas de ${spec.label}`}
      >
        <div className={styles.bibCabecera}>
          <h2 className={styles.dialogTitle}>{spec.label}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        </div>
        <p className={styles.dialogText}>
          Cada una con tus textos y la paleta de tu diseño. Elige y se cambia al
          momento; puedes volver aquí cuantas veces quieras.
        </p>

        {aviso && <p className={styles.bibAviso}>{aviso}</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!opciones && !error && <p className={styles.dialogText}>Dibujando las opciones…</p>}

        {opciones && (
          <div className={styles.bibRejilla}>
            {opciones.map((o) => (
              <button
                key={o.id}
                className={styles.bibItem}
                data-activa={o.id === actual}
                onClick={() => {
                  onElegir(o.id);
                  onClose();
                }}
              >
                <span className={styles.bibLienzo}>
                  <iframe
                    className={styles.bibFrame}
                    srcDoc={o.html}
                    title={o.name}
                    tabIndex={-1}
                    scrolling="no"
                  />
                </span>
                <span className={styles.bibNombre}>
                  {o.name}
                  {o.id === actual && <span className={styles.bibMarca}>en uso</span>}
                </span>
                {o.hint && <span className={styles.bibPista}>{o.hint}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
