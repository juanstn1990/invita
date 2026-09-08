"use client";

import { useEffect, useState } from "react";
import { normalizeSlug, slugError } from "@/lib/slug";
import styles from "./editor.module.css";

interface Props {
  id: string;
  slug: string;
  published: boolean;
  /** Nombre de la pareja/homenajeado, para proponer una dirección. */
  suggestion: string;
  onClose: () => void;
  onDone: (slug: string, published: boolean) => void;
}

export function PublishDialog({
  id, slug, published, suggestion, onClose, onDone,
}: Props) {
  const [value, setValue] = useState(slug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(published);

  const clean = normalizeSlug(value);
  const localError = slugError(clean);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  async function publish() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/invitations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: clean, published: true }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "No se pudo publicar.");
      return;
    }
    setDone(true);
    onDone(json.slug, true);
  }

  async function unpublish() {
    setBusy(true);
    const res = await fetch(`/api/invitations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: false }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(false);
      onDone(clean, false);
    }
  }

  const url = `${origin}/${clean}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.dialogTitle}>
          {done ? "Tu invitación está publicada" : "Publicar invitación"}
        </h2>
        <p className={styles.dialogText}>
          Elige la dirección donde vivirá. Es el link que vas a compartir por
          WhatsApp — puedes cambiarlo después, pero el anterior dejará de
          funcionar.
        </p>

        <label className="field-label">Dirección</label>
        <div className={styles.slugRow}>
          <span className={styles.slugPrefix}>{origin.replace(/^https?:\/\//, "")}/</span>
          <input
            className={`input mono ${styles.slugInput}`}
            value={value}
            autoFocus
            spellCheck={false}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            placeholder="invitacionjuan"
          />
        </div>

        {clean !== value.trim() && clean && (
          <p className="field-help">Se guardará como <b>{clean}</b>.</p>
        )}
        {!value.trim() && suggestion && (
          <button
            className={styles.suggest}
            onClick={() => setValue(normalizeSlug(`invitacion ${suggestion}`))}
          >
            Usar “{normalizeSlug(`invitacion ${suggestion}`)}”
          </button>
        )}
        {(error || (value && localError)) && (
          <p className={styles.error}>{error || localError}</p>
        )}

        {done && !error && (
          <div className={styles.published}>
            <a className="mono" href={url} target="_blank" rel="noopener">{url} ↗</a>
            <button
              className="btn btn-sm"
              onClick={() => navigator.clipboard?.writeText(url)}
            >
              Copiar link
            </button>
          </div>
        )}

        <div className={styles.dialogActions}>
          {done && (
            <button className="btn btn-danger" onClick={unpublish} disabled={busy}>
              Despublicar
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>
            {done ? "Listo" : "Cancelar"}
          </button>
          <button
            className="btn btn-primary"
            onClick={publish}
            disabled={busy || !!localError}
          >
            {busy ? "Publicando…" : done ? "Actualizar dirección" : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
