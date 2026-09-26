"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./fotos.module.css";

/**
 * El mismo recorte de siempre —2000px, 85%— pero dibujado directo desde el
 * vídeo de la cámara a un canvas: no hace falta `createImageBitmap` ni pasar
 * por un `File`, porque aquí el "archivo" nace ya como fotograma.
 */
const MAX_SIDE = 2000;
const QUALITY = 0.85;

/** El nombre se recuerda entre fotos y entre visitas: pedirlo cada vez es la
 *  fricción que hace que nadie use esto. `localStorage` y no una cookie: no
 *  hace falta que el servidor lo vea, sólo que el formulario lo recuerde. */
const CLAVE_NOMBRE = "invita-fotos-nombre";

type Estado =
  | "pidiendo" // esperando el permiso de la cámara
  | "camara" // en vivo, lista para capturar
  | "revisando" // ya se tomó una, antes de subirla
  | "subiendo"
  | "sin-camara"; // sin cámara del navegador: se cae al selector de archivo

async function reducirArchivo(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
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

export function Camara({ slug }: { slug: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [estado, setEstado] = useState<Estado>("pidiendo");
  const [frente, setFrente] = useState(false);
  const [nombre, setNombre] = useState("");
  const [capturada, setCapturada] = useState<{ blob: Blob; url: string } | null>(null);
  const [subidas, setSubidas] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setNombre(localStorage.getItem(CLAVE_NOMBRE) || "");
    } catch {
      /* Sin storage —modo privado, o bloqueado— se pide cada vez, que es lo
         peor que puede pasar: la app sigue funcionando igual. */
    }
  }, []);

  /* Pide la cámara al entrar, y de nuevo si se voltea entre frontal y
     trasera. Se para la anterior antes de pedir la nueva: dos cámaras
     encendidas a la vez son justo el doble de batería para ver una sola. */
  useEffect(() => {
    let vivo = true;
    setEstado((e) => (e === "sin-camara" ? e : "pidiendo"));
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: frente ? "user" : "environment" }, audio: false })
      .then((stream) => {
        if (!vivo) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setEstado("camara");
      })
      .catch(() => { if (vivo) setEstado("sin-camara"); });
    return () => {
      vivo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [frente]);

  function guardarNombre(v: string) {
    setNombre(v);
    try { localStorage.setItem(CLAVE_NOMBRE, v); } catch {}
  }

  function capturar() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    canvas!.width = Math.round(video.videoWidth * scale);
    canvas!.height = Math.round(video.videoHeight * scale);
    const ctx = canvas!.getContext("2d");
    if (!ctx) return;
    /* La cámara frontal se ve en espejo en el visor —así se espera verse a
       uno mismo— pero guardada en espejo el texto detrás sale al revés.
       Sólo se voltea al capturar, nunca en el vídeo en vivo. */
    if (frente) { ctx.translate(canvas!.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas!.width, canvas!.height);
    canvas!.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturada({ blob, url: URL.createObjectURL(blob) });
        setEstado("revisando");
      },
      "image/jpeg",
      QUALITY
    );
  }

  function repetir() {
    if (capturada) URL.revokeObjectURL(capturada.url);
    setCapturada(null);
    setError("");
    setEstado("camara");
  }

  async function subir() {
    if (!capturada) return;
    setEstado("subiendo");
    setError("");
    try {
      const form = new FormData();
      form.append("file", capturada.blob, "foto.jpg");
      if (nombre.trim()) form.append("autor", nombre.trim());
      const r = await fetch(`/api/i/${slug}/fotos`, { method: "POST", body: form });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || "No se pudo subir la foto.");
      URL.revokeObjectURL(capturada.url);
      setCapturada(null);
      setSubidas((n) => n + 1);
      setEstado("camara");
    } catch (err) {
      setError((err as Error).message);
      setEstado("revisando");
    }
  }

  /* El respaldo: sin cámara del navegador —o sin permiso—, el selector de
     archivo nativo. En el celular ese mismo selector ya ofrece "Cámara"
     como una opción más, así que no se pierde la función, sólo la vista
     previa en la página. */
  async function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setEstado("subiendo");
    try {
      const blob = await reducirArchivo(file);
      const form = new FormData();
      form.append("file", blob, "foto.jpg");
      if (nombre.trim()) form.append("autor", nombre.trim());
      const r = await fetch(`/api/i/${slug}/fotos`, { method: "POST", body: form });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || "No se pudo subir la foto.");
      setSubidas((n) => n + 1);
      setEstado("sin-camara");
    } catch (err) {
      setError((err as Error).message);
      setEstado("sin-camara");
    }
  }

  const campoNombre = (
    <label className={styles.campoNombre}>
      <span>Tu nombre (opcional)</span>
      <input
        type="text"
        value={nombre}
        onChange={(e) => guardarNombre(e.target.value)}
        placeholder="¿Quién eres?"
        maxLength={60}
      />
    </label>
  );

  if (estado === "sin-camara") {
    return (
      <div className={styles.camara}>
        {campoNombre}
        <button
          type="button"
          className={styles.boton}
          onClick={() => fileRef.current?.click()}
        >
          Elegir o tomar una foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={elegirArchivo}
          hidden
        />
        {subidas > 0 && <p className={styles.contador}>{subidas} foto{subidas === 1 ? "" : "s"} subida{subidas === 1 ? "" : "s"}. ¡Gracias!</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.camara}>
      {campoNombre}

      <div className={styles.visor} data-oculto={estado === "revisando" || estado === "subiendo" || undefined}>
        <video ref={videoRef} autoPlay playsInline muted className={styles.video} data-espejo={frente || undefined} />
        {estado === "pidiendo" && <p className={styles.pidiendo}>Pidiendo permiso de la cámara…</p>}
        {estado === "camara" && (
          <button type="button" className={styles.voltear} onClick={() => setFrente((f) => !f)} title="Cambiar de cámara">
            ⟲
          </button>
        )}
      </div>

      {capturada && (estado === "revisando" || estado === "subiendo") && (
        <img src={capturada.url} alt="" className={styles.previa} data-subiendo={estado === "subiendo" || undefined} />
      )}

      <canvas ref={canvasRef} hidden />

      {estado === "camara" && (
        <button type="button" className={styles.disparo} onClick={capturar} aria-label="Tomar foto" />
      )}

      {(estado === "revisando" || estado === "subiendo") && (
        <div className={styles.accionesFoto}>
          <button type="button" className={styles.repetir} onClick={repetir} disabled={estado === "subiendo"}>
            Repetir
          </button>
          <button type="button" className={styles.boton} onClick={subir} disabled={estado === "subiendo"}>
            {estado === "subiendo" ? "Subiendo…" : "Subir"}
          </button>
        </div>
      )}

      {subidas > 0 && <p className={styles.contador}>{subidas} foto{subidas === 1 ? "" : "s"} subida{subidas === 1 ? "" : "s"}. ¡Sigue!</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
