"use client";

import { useRef, useState } from "react";
import styles from "./fotos.module.css";

/**
 * Se reduce en el navegador antes de mandarla, igual que en el editor
 * (`upload.ts`) y por la misma razón: la cámara de un celular da 3-8 MB por
 * foto, y en quinientas fotos de un evento eso es la diferencia entre un
 * evento que pesa 250 MB y uno que pesa 2 GB. Los números —2000 px, 85%— son
 * los mismos que ya usa el resto de la app, para no tener dos calidades
 * distintas de "comprimido" en el mismo proyecto.
 */
const MAX_SIDE = 2000;
const QUALITY = 0.85;

async function reducir(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // Navegador sin soporte: que suba el original.
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  return blob && blob.size < file.size ? blob : file;
}

type Estado = "listo" | "subiendo" | "hecho" | "error";

export function Camara({ slug }: { slug: string }) {
  const [estado, setEstado] = useState<Estado>("listo");
  const [error, setError] = useState("");
  const [autor, setAutor] = useState("");
  const [previa, setPrevia] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // Poder elegir la misma foto otra vez si algo falla.
    if (!file) return;

    setError("");
    setEstado("subiendo");
    /* Se ve algo de inmediato mientras sube: la reducción y la subida pueden
       tardar un par de segundos en una red de evento, mala por definición. */
    setPrevia(URL.createObjectURL(file));

    try {
      const blob = await reducir(file);
      const form = new FormData();
      form.append("file", blob, "foto.jpg");
      if (autor.trim()) form.append("autor", autor.trim());

      const r = await fetch(`/api/i/${slug}/fotos`, { method: "POST", body: form });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || "No se pudo subir la foto.");

      setEstado("hecho");
    } catch (err) {
      setEstado("error");
      setError((err as Error).message);
    }
  }

  if (estado === "hecho") {
    return (
      <div className={styles.hecho}>
        <p className={styles.hechoTitulo}>¡Gracias!</p>
        <p>Tu foto ya está con nosotros.</p>
        <button
          type="button"
          className={styles.otra}
          onClick={() => { setEstado("listo"); setPrevia(null); }}
        >
          Tomar otra
        </button>
      </div>
    );
  }

  return (
    <div className={styles.camara}>
      {previa && (
        <img src={previa} alt="" className={styles.previa} data-subiendo={estado === "subiendo" || undefined} />
      )}

      <label className={styles.campoNombre}>
        <span>Tu nombre (opcional)</span>
        <input
          type="text"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="¿Quién eres?"
          maxLength={60}
          disabled={estado === "subiendo"}
        />
      </label>

      <button
        type="button"
        className={styles.boton}
        disabled={estado === "subiendo"}
        onClick={() => inputRef.current?.click()}
      >
        {estado === "subiendo" ? "Subiendo…" : "Tomar una foto"}
      </button>

      {/* `capture` abre la cámara del celular directo, sin pasar por la
          galería primero — es lo que hace que esto se sienta como un botón
          de cámara y no como "adjuntar un archivo". */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={elegir}
        hidden
      />

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
