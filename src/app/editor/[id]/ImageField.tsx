"use client";

import { useEffect, useRef, useState } from "react";
import {
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  fetchBiblioteca,
  uploadImages,
  type MediaItem,
  type MediaKind,
} from "./upload";
import styles from "./editor.module.css";

/* ── La biblioteca ────────────────────────────────────────── */

/**
 * Lo que ya se subió, para volver a usarlo.
 *
 * Un marco floral o una guirnalda se usan en varias invitaciones, y antes
 * había que volver a buscar el archivo en el disco cada vez. La biblioteca se
 * llena sola: todo lo que se sube queda anotado.
 */
function Biblioteca({
  kind, onPick, onClose,
}: {
  kind?: MediaKind;
  onPick: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let vivo = true;
    fetchBiblioteca(kind).then((r) => vivo && setItems(r));
    return () => { vivo = false; };
  }, [kind]);

  const filtrados = (items || []).filter(
    (m) => !q.trim() || m.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className={styles.biblio}>
      <div className={styles.biblioHead}>
        <input
          className="input"
          placeholder="Buscar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-sm btn-ghost" onClick={onClose}>Cerrar</button>
      </div>

      {items === null && <p className={styles.listEmpty}>Cargando…</p>}
      {items !== null && !filtrados.length && (
        <p className={styles.listEmpty}>
          {items.length ? "Nada con ese nombre." : "Todavía no has subido nada."}
        </p>
      )}

      <div className={styles.biblioGrid}>
        {filtrados.map((m) => (
          <button
            key={m.id}
            className={styles.biblioItem}
            title={m.name}
            onClick={() => { onPick(m.url); onClose(); }}
          >
            {/* Un vídeo no se puede pintar como fondo: sale un hueco gris. */}
            {m.mime?.startsWith("video/") ? (
              <video className={styles.thumb} src={m.url} muted preload="metadata" />
            ) : (
              <span className={styles.thumb} style={{ backgroundImage: `url("${m.url}")` }} />
            )}
            <span className={styles.biblioName}>{m.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Una sola imagen (portada) ────────────────────────────── */

export function ImageField({
  value, onChange, kind,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Los adornos se catalogan aparte de las fotos, y el vídeo aparte de todo. */
  kind?: MediaKind;
}) {
  const video = kind === "video";
  const accept = video ? VIDEO_ACCEPT : IMAGE_ACCEPT;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [byUrl, setByUrl] = useState(false);
  const [biblio, setBiblio] = useState(false);

  async function take(files: FileList | null) {
    const list = files ? Array.from(files).slice(0, 1) : [];
    if (!list.length) return;
    setBusy(true);
    setError(null);
    try {
      const [url] = await uploadImages(list, kind);
      onChange(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className={styles.imagePicked}>
        {video ? (
          <video className={styles.thumbLg} src={value} muted controls preload="metadata" />
        ) : (
          <span className={styles.thumbLg} style={{ backgroundImage: `url("${value}")` }} />
        )}
        <div className={styles.imagePickedInfo}>
          <button className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Subiendo…" : "Cambiar"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setBiblio(true)}>
            Biblioteca
          </button>
          <button className="btn btn-sm btn-ghost btn-danger" onClick={() => onChange("")}>
            Quitar
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => take(e.target.files)}
        />
      </div>
    );
  }

  if (biblio) {
    return <Biblioteca kind={kind} onPick={onChange} onClose={() => setBiblio(false)} />;
  }

  if (byUrl) {
    return (
      <div>
        <input
          className="input"
          type="url"
          autoFocus
          placeholder="https://…"
          onChange={(e) => onChange(e.target.value)}
        />
        <button className={styles.linkBtn} onClick={() => setByUrl(false)}>
          ← subir un archivo
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className={styles.dropzone}
        data-over={over}
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      >
        <span className={styles.dropIcon} aria-hidden>↑</span>
        <span>
          {busy
            ? "Subiendo…"
            : video
              ? "Arrastra un vídeo o haz clic"
              : "Arrastra una foto o haz clic"}
        </span>
        <span className={styles.dropHint}>
          {video ? "MP4 o WebM · hasta 64 MB" : "JPG, PNG o WebP · hasta 8 MB"}
        </span>
      </button>
      <span className={styles.imageAlts}>
        <button className={styles.linkBtn} onClick={() => setBiblio(true)}>
          elegir de la biblioteca
        </button>
        <button className={styles.linkBtn} onClick={() => setByUrl(true)}>
          o usar una URL
        </button>
      </span>
      {error && <p className={styles.error}>{error}</p>}
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => take(e.target.files)}
      />
    </div>
  );
}

/* ── Varias imágenes (galería) ────────────────────────────── */

export function PhotoGrid({
  urls, max, onChange,
}: {
  urls: string[];
  max: number;
  onChange: (urls: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const room = max - urls.length;

  async function take(files: FileList | null) {
    const list = files ? Array.from(files).slice(0, Math.max(0, room)) : [];
    if (!list.length) return;
    setBusy(true);
    setError(null);
    try {
      onChange([...urls, ...(await uploadImages(list))]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;
    const next = [...urls];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <div>
      <div className={styles.photoGrid}>
        {urls.map((url, i) => (
          <div key={`${url}-${i}`} className={styles.photo}>
            <span className={styles.photoImg} style={{ backgroundImage: `url("${url}")` }} />
            <span className={styles.photoBar}>
              <button onClick={() => move(i, i - 1)} disabled={i === 0} title="Antes">←</button>
              <button onClick={() => move(i, i + 1)} disabled={i === urls.length - 1} title="Después">→</button>
              <button
                className={styles.photoRemove}
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
                title="Quitar"
              >✕</button>
            </span>
          </div>
        ))}

        {room > 0 && (
          <button
            className={styles.photoAdd}
            data-over={over}
            disabled={busy}
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
          >
            {busy ? "…" : "+"}
          </button>
        )}
      </div>

      <p className="field-help">
        {urls.length === 0
          ? "Sin fotos, cada casilla conserva el marcador del diseño original."
          : `${urls.length} de ${max} · arrastra varias de una vez`}
      </p>
      {error && <p className={styles.error}>{error}</p>}

      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(e) => take(e.target.files)}
      />
    </div>
  );
}
