"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./nueva.module.css";

export interface PlantillaInfo {
  id: string;
  nombre: string;
  templateId: string;
}

/**
 * Las plantillas propias, arriba de los 42 diseños.
 *
 * Van primero porque quien ya guardó una es porque quiere empezar desde ahí:
 * ponerlas debajo de cuarenta y dos tarjetas sería esconderlas.
 */
export function MisPlantillas({ inicial }: { inicial: PlantillaInfo[] }) {
  const router = useRouter();
  const [items, setItems] = useState(inicial);
  const [busy, setBusy] = useState<string | null>(null);

  if (!items.length) return null;

  async function crear(p: PlantillaInfo) {
    setBusy(p.id);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantillaId: p.id }),
    });
    if (!res.ok) {
      setBusy(null);
      const j = await res.json().catch(() => ({}));
      alert(j.error || "No se pudo crear la invitación.");
      return;
    }
    const { id } = await res.json();
    router.push(`/editor/${id}`);
  }

  async function borrar(p: PlantillaInfo) {
    if (!confirm(`¿Borrar la plantilla “${p.nombre}”?\n\nLas invitaciones que hiciste con ella no se tocan.`)) {
      return;
    }
    await fetch(`/api/mis-plantillas?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    setItems((xs) => xs.filter((x) => x.id !== p.id));
  }

  return (
    <section className={styles.group}>
      <h3 className={styles.groupTitle}>Mis plantillas</h3>
      <div className={styles.grid}>
        {items.map((p) => (
          <article key={p.id} className={styles.card}>
            <div className={styles.frame}>
              <iframe
                className={styles.preview}
                src={`/api/mis-plantillas/${p.id}/vista`}
                title={`Vista previa · ${p.nombre}`}
                loading="lazy"
                scrolling="no"
                tabIndex={-1}
              />
              <div className={styles.frameOverlay} />
            </div>

            <div className={styles.info}>
              <div className={styles.infoTop}>
                <h3 className={styles.name}>{p.nombre}</h3>
              </div>
              <p className={styles.mood}>Guardada por ti</p>
              <div className={styles.actions}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => crear(p)}
                  disabled={busy === p.id}
                >
                  {busy === p.id ? "Creando…" : "Usar esta"}
                </button>
                <a
                  className="btn btn-ghost btn-sm"
                  href={`/api/mis-plantillas/${p.id}/vista`}
                  target="_blank"
                  rel="noopener"
                >
                  Ver completa ↗
                </a>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => borrar(p)}
                  title="Borrar la plantilla"
                >
                  ✕
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
