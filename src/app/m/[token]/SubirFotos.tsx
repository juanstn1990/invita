"use client";

import { useRef, useState } from "react";
import type { FotoCliente, Papel } from "@/lib/multimedia";
import styles from "./multimedia.module.css";

/** El lado más largo con el que se sube. Sobra para una pantalla y baja de 8 MB. */
const LADO = 2400;

/**
 * Achica la foto en el propio teléfono antes de subirla.
 *
 * Una foto de cámara pesa diez megas y el servidor corta en ocho; y un
 * iPhone puede entregar HEIC, que ningún otro navegador muestra. Dibujarla
 * en un lienzo y sacarla como JPG arregla las dos cosas de una vez. Si el
 * navegador no la sabe abrir, se manda tal cual y que decida el servidor.
 */
async function preparar(archivo: File): Promise<File> {
  if (archivo.type === "image/gif") return archivo;
  try {
    const img = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO / Math.max(img.width, img.height));
    if (escala === 1 && archivo.type === "image/jpeg" && archivo.size < 4 * 1024 * 1024) return archivo;
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(img.width * escala);
    lienzo.height = Math.round(img.height * escala);
    lienzo.getContext("2d")!.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.88));
    if (!blob) return archivo;
    return new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

export function SubirFotos({
  token, nombres, iniciales, maximo,
}: { token: string; nombres: string; iniciales: FotoCliente[]; maximo: number }) {
  const [fotos, setFotos] = useState(iniciales);
  const [subiendo, setSubiendo] = useState<{ papel: Papel; van: number; de: number } | null>(null);
  const [error, setError] = useState("");
  const dePortada = useRef<HTMLInputElement>(null);
  const deFotos = useRef<HTMLInputElement>(null);

  const portada = fotos.find((f) => f.papel === "portada");
  const otras = fotos.filter((f) => f.papel === "foto");

  async function subir(lista: FileList | null, papel: Papel) {
    const archivos = Array.from(lista || []);
    if (!archivos.length) return;
    setError("");
    const fallos: string[] = [];
    for (let i = 0; i < archivos.length; i++) {
      setSubiendo({ papel, van: i + 1, de: archivos.length });
      try {
        const cuerpo = new FormData();
        cuerpo.set("papel", papel);
        cuerpo.set("archivo", await preparar(archivos[i]));
        const res = await fetch(`/api/m/${token}`, { method: "POST", body: cuerpo });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          fallos.push(`${archivos[i].name}: ${json.error || "no se pudo subir"}`);
          if (res.status === 409) break;
        } else {
          setFotos(json.fotos);
        }
      } catch {
        fallos.push(`${archivos[i].name}: se cortó la conexión`);
      }
    }
    setSubiendo(null);
    if (fallos.length) setError(fallos.join(" · "));
  }

  async function quitar(id: string) {
    setError("");
    const res = await fetch(`/api/m/${token}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setFotos(json.fotos);
    else setError(json.error || "No se pudo quitar.");
  }

  const ocupado = subiendo !== null;
  const progreso = (papel: Papel) =>
    subiendo?.papel === papel ? `Subiendo ${subiendo.van} de ${subiendo.de}…` : "";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Fotos para tu invitación</p>
        <h1 className={styles.title}>{nombres || "Tus fotos"}</h1>
        <p className={styles.sub}>
          Sube aquí las fotos que quieres que aparezcan. Se guardan solas: cuando
          termines, simplemente cierra esta página.
        </p>
      </header>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <section className={styles.caja}>
        <h2 className={styles.cajaTitulo}>Portada</h2>
        <p className={styles.ayuda}>
          La foto principal, la primera que se ve al abrir la invitación. Una sola.
        </p>
        {portada ? (
          <div className={styles.portada}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${portada.url}?w=800`} alt="Foto de portada" />
          </div>
        ) : null}
        <input
          ref={dePortada} type="file" accept="image/*" hidden
          onChange={(e) => { void subir(e.target.files, "portada"); e.target.value = ""; }}
        />
        <div className={styles.acciones}>
          <button className="btn btn-primary" disabled={ocupado} onClick={() => dePortada.current?.click()}>
            {progreso("portada") || (portada ? "Cambiar la portada" : "Elegir la portada")}
          </button>
          {portada ? (
            <button className="btn btn-ghost" disabled={ocupado} onClick={() => quitar(portada.id)}>
              Quitar
            </button>
          ) : null}
        </div>
      </section>

      <section className={styles.caja}>
        <h2 className={styles.cajaTitulo}>Más fotos</h2>
        <p className={styles.ayuda}>
          Las demás fotos para la galería. Puedes elegir varias a la vez
          {otras.length ? ` (${otras.length} de ${maximo})` : ` (hasta ${maximo})`}.
        </p>
        {otras.length ? (
          <ul className={styles.rejilla}>
            {otras.map((f) => (
              <li key={f.id} className={styles.foto}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${f.url}?w=400`} alt={f.nombre} loading="lazy" />
                <button
                  className={styles.quitar} disabled={ocupado}
                  aria-label={`Quitar ${f.nombre}`} onClick={() => quitar(f.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          ref={deFotos} type="file" accept="image/*" multiple hidden
          onChange={(e) => { void subir(e.target.files, "foto"); e.target.value = ""; }}
        />
        <div className={styles.acciones}>
          <button
            className="btn btn-primary" disabled={ocupado || otras.length >= maximo}
            onClick={() => deFotos.current?.click()}
          >
            {progreso("foto") || "Agregar fotos"}
          </button>
        </div>
      </section>
    </main>
  );
}
