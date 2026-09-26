"use client";

import { useEffect, useState } from "react";
import styles from "./deseos.module.css";

/** Mismo nombre de llave que usan las fotos: si ya lo escribió allá, aquí no
 *  se lo vuelve a pedir, y viceversa — es la misma persona en el mismo
 *  evento. */
const CLAVE_NOMBRE = "invita-nombre-invitado";

type Estado = "listo" | "enviando" | "error";

export function Formulario({ slug }: { slug: string }) {
  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("listo");
  const [error, setError] = useState("");
  const [firmados, setFirmados] = useState(0);

  useEffect(() => {
    try {
      setNombre(localStorage.getItem(CLAVE_NOMBRE) || "");
    } catch {}
  }, []);

  function guardarNombre(v: string) {
    setNombre(v);
    try { localStorage.setItem(CLAVE_NOMBRE, v); } catch {}
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !texto.trim()) return;

    setEstado("enviando");
    setError("");
    try {
      const r = await fetch(`/api/i/${slug}/deseos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), texto: texto.trim() }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || "No se pudo guardar el deseo.");
      setTexto("");
      setFirmados((n) => n + 1);
      setEstado("listo");
    } catch (err) {
      setEstado("error");
      setError((err as Error).message);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={enviar}>
      <label className={styles.campo}>
        <span>Tu nombre</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => guardarNombre(e.target.value)}
          placeholder="¿Quién firma?"
          maxLength={60}
          required
          disabled={estado === "enviando"}
        />
      </label>

      <label className={styles.campo}>
        <span>Tu deseo</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe aquí lo que quieras decirles…"
          maxLength={600}
          rows={5}
          required
          disabled={estado === "enviando"}
        />
      </label>

      <button type="submit" className={styles.boton} disabled={estado === "enviando"}>
        {estado === "enviando" ? "Firmando…" : "Firmar"}
      </button>

      {firmados > 0 && (
        <p className={styles.contador}>
          {firmados === 1 ? "¡Gracias por tu deseo!" : `${firmados} deseos firmados. ¡Gracias!`}{" "}
          Puedes escribir otro si quieres.
        </p>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </form>
  );
}
