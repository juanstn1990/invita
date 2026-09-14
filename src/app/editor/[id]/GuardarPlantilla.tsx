"use client";

import { useState } from "react";
import styles from "./editor.module.css";

/**
 * Guardar la invitación como punto de partida para las siguientes.
 *
 * Lo que se guarda es una copia de todo lo que está en `data`: el diseño, la
 * paleta, el orden de los bloques, los colores por sección, las tipografías,
 * los adornos con sus efectos, la marca de agua. No se lleva el slug ni las
 * confirmaciones ni los enlaces de invitado, que son de esta invitación y no
 * del punto de partida.
 *
 * Y es una copia: si mañana se edita esta invitación, la plantilla se queda
 * como estaba. Una plantilla que se moviera sola bajo los pies dejaría de
 * servir para empezar igual dos veces.
 */
export function GuardarPlantilla({ id, sugerido }: { id: string; sugerido: string }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<"" | "guardando" | "listo">("");
  const [error, setError] = useState("");

  async function guardar() {
    const n = (nombre.trim() || sugerido).slice(0, 80);
    setEstado("guardando");
    setError("");
    const res = await fetch("/api/mis-plantillas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId: id, nombre: n }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEstado("");
      setError(j.error || "No se pudo guardar.");
      return;
    }
    setEstado("listo");
  }

  if (!abierto) {
    return (
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => { setAbierto(true); setEstado(""); setNombre(""); }}
        title="Guardarla para empezar otras igual"
      >
        Guardar como plantilla
      </button>
    );
  }

  return (
    <div className={styles.plantillaCaja} role="dialog" aria-label="Guardar como plantilla">
      {estado === "listo" ? (
        <>
          <span>
            Guardada. Aparece en <b>Elige un diseño</b>, arriba del todo.
          </span>
          <button className="btn btn-sm" onClick={() => setAbierto(false)}>Cerrar</button>
        </>
      ) : (
        <>
          <input
            className="input"
            autoFocus
            placeholder={sugerido}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") guardar(); }}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={guardar}
            disabled={estado === "guardando"}
          >
            {estado === "guardando" ? "Guardando…" : "Guardar"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
          {error && <span className={styles.plantillaError}>{error}</span>}
        </>
      )}
    </div>
  );
}
