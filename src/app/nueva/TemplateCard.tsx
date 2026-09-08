"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TemplateInfo } from "@/lib/templates";
import styles from "./nueva.module.css";

/**
 * La vista previa es un iframe con el diseño real renderizado a 390px de
 * ancho y escalado; es la única forma honesta de elegir entre 14 diseños.
 */
export function TemplateCard({ template }: { template: TemplateInfo }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id }),
    });
    if (!res.ok) {
      setBusy(false);
      alert("No se pudo crear la invitación.");
      return;
    }
    const { id } = await res.json();
    router.push(`/editor/${id}`);
  }

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <iframe
          className={styles.preview}
          src={`/api/plantilla/${template.id}`}
          title={`Vista previa · ${template.name}`}
          loading="lazy"
          scrolling="no"
          tabIndex={-1}
        />
        <div className={styles.frameOverlay} />
      </div>

      <div className={styles.info}>
        <div className={styles.infoTop}>
          <h3 className={styles.name}>{template.name}</h3>
          <span className={styles.palette} aria-hidden>
            {template.palette.map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
        </div>
        <p className={styles.mood}>{template.mood}</p>
        <div className={styles.actions}>
          <button className="btn btn-primary btn-sm" onClick={create} disabled={busy}>
            {busy ? "Creando…" : "Usar este"}
          </button>
          <a
            className="btn btn-ghost btn-sm"
            href={`/api/plantilla/${template.id}`}
            target="_blank"
            rel="noopener"
          >
            Ver completo ↗
          </a>
        </div>
      </div>
    </article>
  );
}
