"use client";

import { useState } from "react";
import styles from "./editor.module.css";

/**
 * Guardar la invitación como plantilla, o actualizar una que ya existe.
 *
 * Lo que se guarda es una copia de todo lo que está en `data`: el diseño, la
 * paleta, el orden de los bloques, los colores por sección, las tipografías,
 * los adornos con sus efectos, la marca de agua. No se lleva el slug ni las
 * confirmaciones ni los enlaces de invitado, que son de esta invitación y no
 * del punto de partida.
 *
 * Actualizar sobrescribe la plantilla con lo que hoy tiene esta invitación,
 * pero antes guarda lo que había: si la mejora sale mal, «Deshacer» la deja
 * como estaba. Sin eso, mejorar una plantilla daría miedo, y una plantilla que
 * da miedo tocar no se mejora nunca.
 *
 * Y sigue siendo una copia: actualizar la plantilla no cambia las
 * invitaciones que ya salieron de ella.
 */

interface PlantillaItem {
  id: string;
  nombre: string;
  origenId: string | null;
  versiones: number;
}

type Estado = "" | "cargando" | "guardando" | "guardada" | "actualizada" | "deshecha";

export function GuardarPlantilla({ id, sugerido }: { id: string; sugerido: string }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [plantillas, setPlantillas] = useState<PlantillaItem[]>([]);
  /* "" = guardar como nueva; si no, el id de la plantilla a actualizar. */
  const [destino, setDestino] = useState("");
  const [estado, setEstado] = useState<Estado>("");
  const [error, setError] = useState("");
  const [versiones, setVersiones] = useState(0);

  async function abrir() {
    setAbierto(true);
    setEstado("cargando");
    setError("");
    setNombre("");
    const res = await fetch("/api/mis-plantillas");
    const j = await res.json().catch(() => ({ items: [] }));
    const items: PlantillaItem[] = j.items || [];
    setPlantillas(items);
    /* Si esta invitación es la maestra de una plantilla, lo normal al abrir
       es querer actualizar esa: se propone sola. Guardar una nueva sigue a un
       cambio del desplegable. */
    const suya = items.find((p) => p.origenId === id);
    setDestino(suya ? suya.id : "");
    setEstado("");
  }

  async function guardar() {
    setEstado("guardando");
    setError("");
    const res = destino
      ? await fetch("/api/mis-plantillas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: destino, invitationId: id }),
        })
      : await fetch("/api/mis-plantillas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: id, nombre: (nombre.trim() || sugerido).slice(0, 80) }),
        });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEstado("");
      setError(j.error || "No se pudo guardar.");
      return;
    }
    setVersiones(j.versiones || 0);
    setEstado(destino ? "actualizada" : "guardada");
  }

  async function deshacerUltima() {
    setEstado("guardando");
    const res = await fetch("/api/mis-plantillas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: destino, deshacer: true }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEstado("actualizada");
      setError(j.error || "No se pudo deshacer.");
      return;
    }
    setVersiones(j.versiones || 0);
    setEstado("deshecha");
  }

  if (!abierto) {
    return (
      <button
        className="btn btn-sm btn-ghost"
        onClick={abrir}
        title="Guardarla para empezar otras igual, o actualizar una plantilla"
      >
        Guardar como plantilla
      </button>
    );
  }

  const elegida = plantillas.find((p) => p.id === destino);

  return (
    <div className={styles.plantillaCaja} role="dialog" aria-label="Guardar como plantilla">
      {estado === "guardada" ? (
        <>
          <span>Guardada. Aparece en <b>Elige un diseño</b>, arriba del todo.</span>
          <button className="btn btn-sm" onClick={() => setAbierto(false)}>Cerrar</button>
        </>
      ) : estado === "actualizada" || estado === "deshecha" ? (
        <>
          <span>
            {estado === "actualizada"
              ? <>«{elegida?.nombre}» actualizada. Las invitaciones que ya salieron de ella no cambian.</>
              : <>«{elegida?.nombre}» volvió a su versión anterior.</>}
          </span>
          {versiones > 0 && (
            <button className="btn btn-sm btn-ghost" onClick={deshacerUltima}>
              Deshacer
            </button>
          )}
          <button className="btn btn-sm" onClick={() => setAbierto(false)}>Cerrar</button>
          {error && <span className={styles.plantillaError}>{error}</span>}
        </>
      ) : (
        <>
          <select
            className="select"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            disabled={estado === "cargando"}
            aria-label="Guardar como nueva o actualizar una existente"
          >
            <option value="">Guardar como plantilla nueva</option>
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                Actualizar «{p.nombre}»{p.origenId === id ? " (salió de ésta)" : ""}
              </option>
            ))}
          </select>

          {!destino && (
            <input
              className="input"
              autoFocus
              placeholder={sugerido}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") guardar(); }}
            />
          )}

          <button
            className="btn btn-sm btn-primary"
            onClick={guardar}
            disabled={estado === "guardando" || estado === "cargando"}
          >
            {estado === "guardando" ? "Guardando…" : destino ? "Actualizar" : "Guardar"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAbierto(false)}>
            Cancelar
          </button>

          {/* Qué va a pasar, dicho antes de que pase: sobrescribir una
              plantilla es la clase de cosa que se hace sin querer. */}
          {destino && (
            <span className={styles.plantillaNota}>
              La plantilla pasará a ser esta invitación. Se guarda la versión
              anterior por si quieres deshacer.
            </span>
          )}
          {error && <span className={styles.plantillaError}>{error}</span>}
        </>
      )}
    </div>
  );
}
