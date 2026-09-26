"use client";

import { useState } from "react";
import styles from "./galeria.module.css";

export interface Foto {
  id: string;
  url: string;
  autor: string | null;
  kb: number;
}

export function Galeria({
  invitationId, inicial,
}: {
  invitationId: string;
  inicial: Foto[];
}) {
  const [fotos, setFotos] = useState(inicial);
  const [borrando, setBorrando] = useState<string | null>(null);

  async function borrar(id: string) {
    if (!confirm("¿Borrar esta foto? No se puede deshacer.")) return;
    setBorrando(id);
    const antes = fotos;
    setFotos(fotos.filter((f) => f.id !== id));
    const r = await fetch(`/api/invitations/${invitationId}/fotos?fotoId=${id}`, {
      method: "DELETE",
    });
    if (!r.ok) setFotos(antes);
    setBorrando(null);
  }

  if (!fotos.length) {
    return (
      <p className={styles.vacio}>
        Todavía no hay fotos. En cuanto alguien use el enlace o el QR, aparecen aquí.
      </p>
    );
  }

  const totalKb = fotos.reduce((n, f) => n + f.kb, 0);

  return (
    <>
      <p className={styles.cuenta}>
        {fotos.length} {fotos.length === 1 ? "foto" : "fotos"} ·{" "}
        {totalKb > 1024 ? `${(totalKb / 1024).toFixed(1)} MB` : `${totalKb} KB`}
      </p>
      <ul className={styles.grid}>
        {fotos.map((f) => (
          <li key={f.id} className={styles.item} data-borrando={borrando === f.id || undefined}>
            <a href={f.url} target="_blank" rel="noopener">
              <img src={f.url} alt="" className={styles.foto} loading="lazy" />
            </a>
            <div className={styles.pie}>
              <span className={styles.autor}>{f.autor || "Anónimo"}</span>
              <div className={styles.acciones}>
                <a href={f.url} download className={styles.descargar} title="Descargar">
                  ↓
                </a>
                <button
                  type="button"
                  className={styles.borrar}
                  onClick={() => borrar(f.id)}
                  title="Borrar"
                >
                  ×
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
