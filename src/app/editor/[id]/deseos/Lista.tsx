"use client";

import { useState } from "react";
import styles from "./libro.module.css";

export interface Deseo {
  id: string;
  nombre: string;
  texto: string;
  createdAt: string;
}

export function Lista({
  invitationId, inicial,
}: {
  invitationId: string;
  inicial: Deseo[];
}) {
  const [deseos, setDeseos] = useState(inicial);
  const [borrando, setBorrando] = useState<string | null>(null);

  async function borrar(id: string) {
    if (!confirm("¿Borrar este deseo? No se puede deshacer.")) return;
    setBorrando(id);
    const antes = deseos;
    setDeseos(deseos.filter((d) => d.id !== id));
    const r = await fetch(`/api/invitations/${invitationId}/deseos?deseoId=${id}`, {
      method: "DELETE",
    });
    if (!r.ok) setDeseos(antes);
    setBorrando(null);
  }

  if (!deseos.length) {
    return (
      <p className={styles.vacio}>
        Todavía no hay deseos. En cuanto alguien use el enlace o el QR, aparecen aquí.
      </p>
    );
  }

  return (
    <>
      <p className={styles.cuenta}>
        {deseos.length} {deseos.length === 1 ? "deseo" : "deseos"}
      </p>
      <ul className={styles.lista}>
        {deseos.map((d) => (
          <li key={d.id} className={styles.item} data-borrando={borrando === d.id || undefined}>
            <p className={styles.texto}>{d.texto}</p>
            <div className={styles.pie}>
              <span className={styles.firma}>— {d.nombre}</span>
              <button
                type="button"
                className={styles.borrar}
                onClick={() => borrar(d.id)}
                title="Borrar"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
