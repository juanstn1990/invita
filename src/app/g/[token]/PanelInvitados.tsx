"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { limpiarNombres, unir, urlDeLink, type EstadoLink } from "@/lib/invitados";
import styles from "./panel.module.css";

interface Fila {
  id: string;
  code: string;
  nombres: string[];
  note: string | null;
  estado: EstadoLink;
  asisten: number;
  total: number;
  respondidoEl: string | null;
  abrieron: number;
  veces: number;
  abiertoEl: string | null;
}

/**
 * «Abrió hace dos días» dice más que una fecha.
 *
 * Lo que se hace con este dato es decidir a quién insistirle, y para eso lo
 * que importa es cuánto lleva sin contestar desde que la vio.
 */
function hace(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const m = Math.round(d / 30);
  return m === 1 ? "hace un mes" : `hace ${m} meses`;
}

const ETIQUETA: Record<EstadoLink, string> = {
  "sin respuesta": "Sin respuesta",
  confirmado: "Confirmado",
  "no asiste": "No asiste",
  parcial: "Vienen algunos",
};

/**
 * Crear los links y ver quién ha contestado.
 *
 * Todo gira alrededor de una sola idea: los nombres van en la dirección. Aquí
 * se escriben, se copia el enlace y se manda por donde sea. Quien lo abre ve
 * su nombre en la invitación y confirma sin escribir nada.
 */
export function PanelInvitados({
  token, slug, publicada, titulo, fecha, origen, inicial,
}: {
  token: string;
  slug: string;
  publicada: boolean;
  titulo: string;
  fecha: string;
  origen: string;
  inicial: Fila[];
}) {
  const router = useRouter();
  const [filas, setFilas] = useState<Fila[]>(inicial);
  const [nombres, setNombres] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const previsualizacion = limpiarNombres(nombres);

  const cuentas = useMemo(() => {
    const personas = filas.reduce((n, f) => n + f.nombres.length, 0);
    const confirmados = filas.reduce((n, f) => n + f.asisten, 0);
    const conAcompanantes = filas.reduce((n, f) => n + f.total, 0);
    const sinResponder = filas.filter((f) => f.estado === "sin respuesta").length;
    /* Los que hay que perseguir: la abrieron y no contestaron. Es la lista
       corta que de verdad se usa. */
    const vieronYCallan = filas.filter(
      (f) => f.estado === "sin respuesta" && f.abrieron > 0
    ).length;
    const sinAbrir = filas.filter((f) => f.abrieron === 0).length;
    return { personas, confirmados, conAcompanantes, sinResponder, vieronYCallan, sinAbrir };
  }, [filas]);

  async function crear() {
    if (!previsualizacion.length) {
      setError("Escribe al menos un nombre.");
      return;
    }
    setGuardando(true);
    setError("");
    const r = await fetch(`/api/g/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: nombres, note: nota }),
    });
    const j = await r.json().catch(() => ({}));
    setGuardando(false);
    if (!r.ok) {
      setError(j.error || "No se pudo crear el link.");
      return;
    }
    setFilas([
      { id: j.id, code: j.code, nombres: previsualizacion, note: nota.trim() || null,
        estado: "sin respuesta", asisten: 0, total: 0, respondidoEl: null,
        abrieron: 0, veces: 0, abiertoEl: null },
      ...filas,
    ]);
    setNombres("");
    setNota("");
  }

  async function borrar(id: string) {
    if (!confirm("Se borra el link. Quien ya lo tenga podrá seguir abriendo la invitación, pero su confirmación dejará de aparecer aquí.")) return;
    setFilas(filas.filter((f) => f.id !== id));
    await fetch(`/api/g/${token}?id=${id}`, { method: "DELETE" });
  }

  async function copiar(f: Fila) {
    const url = urlDeLink(origen, slug, f.nombres.join(", "), f.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(f.id);
      setTimeout(() => setCopiado((c) => (c === f.id ? null : c)), 1800);
    } catch {
      prompt("Copia el enlace:", url);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Invitados</p>
        <h1 className={styles.title}>{titulo}</h1>
        {fecha && <p className={styles.sub}>{fecha}</p>}
      </header>

      {!publicada && (
        <p className={styles.avisoFuerte}>
          <b>La invitación todavía no está publicada.</b> Puedes ir creando los
          enlaces, pero <b>no abrirán</b> hasta que quien la está armando le dé
          a Publicar. Espera a repartirlos.
        </p>
      )}

      <section className={styles.caja}>
        <h2 className={styles.cajaTitulo}>Crear un enlace</h2>
        <p className={styles.ayuda}>
          Escribe los nombres de quienes van juntos —una familia, una pareja— separados
          por coma. Cada enlace lleva esos nombres dentro, así que quien lo abre
          se ve nombrado y confirma sin escribir nada.
        </p>

        <label className="field-label" htmlFor="nombres">Nombres</label>
        <input
          id="nombres"
          className="input"
          value={nombres}
          placeholder="Ana Gómez, Carlos Gómez"
          onChange={(e) => setNombres(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") crear(); }}
        />
        {previsualizacion.length > 1 && (
          <p className={styles.ayuda}>Se verá como “{unir(previsualizacion)}”.</p>
        )}

        <label className="field-label" htmlFor="nota">Para acordarte (opcional)</label>
        <input
          id="nota"
          className="input"
          value={nota}
          placeholder="Familia de la novia"
          onChange={(e) => setNota(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") crear(); }}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className="btn btn-primary" onClick={crear} disabled={guardando}>
          {guardando ? "Creando…" : "Crear enlace"}
        </button>
      </section>

      {filas.length > 0 && (
        <div className={styles.cuentas}>
          <span><b>{filas.length}</b> enlaces</span>
          <span><b>{cuentas.personas}</b> personas invitadas</span>
          <span><b>{cuentas.conAcompanantes}</b> confirmadas</span>
          <span><b>{cuentas.sinResponder}</b> sin responder</span>
          {/* La cuenta que decide a quién escribirle: la vieron y callan.
              Separada de "sin abrir", que necesita otra cosa —volver a
              mandar el enlace, no insistir. */}
          {cuentas.vieronYCallan > 0 && (
            <span className={styles.cuentaOjo}>
              <b>{cuentas.vieronYCallan}</b> la vieron y no han contestado
            </span>
          )}
          {cuentas.sinAbrir > 0 && (
            <span><b>{cuentas.sinAbrir}</b> sin abrir</span>
          )}
        </div>
      )}

      {filas.length === 0 ? (
        <p className={styles.vacio}>
          Todavía no has creado ningún enlace. El primero que crees aparecerá aquí,
          con su estado.
        </p>
      ) : (
        <ul className={styles.lista}>
          {filas.map((f) => (
            <li key={f.id} className={styles.fila}>
              <div className={styles.filaCuerpo}>
                <p className={styles.nombres}>{unir(f.nombres)}</p>
                {f.note && <p className={styles.nota}>{f.note}</p>}
                <p className={`${styles.enlace} mono`}>
                  /{slug}?invitado=…&amp;g={f.code}
                </p>
              </div>
              <div className={styles.filaLado}>
                <span className={styles.estado} data-estado={f.estado}>
                  {ETIQUETA[f.estado]}
                  {f.estado !== "sin respuesta" && f.total > 0 && ` · ${f.total}`}
                </span>
                {/* Si abrió y no contestó, eso es lo que hay que ver de un
                    vistazo: es a quien se le insiste. */}
                <span
                  className={styles.apertura}
                  data-abierto={f.abrieron > 0}
                  title={
                    f.abrieron > 0
                      ? `${f.veces} ${f.veces === 1 ? "apertura" : "aperturas"}` +
                        (f.abrieron > 1 ? ` · ${f.abrieron} personas` : "")
                      : "Nadie de este enlace la ha abierto todavía"
                  }
                >
                  {f.abrieron > 0 ? `Vista ${hace(f.abiertoEl)}` : "Sin abrir"}
                </span>
                <div className={styles.acciones}>
                  <button
                    className="btn btn-sm"
                    onClick={() => copiar(f)}
                    title={publicada ? undefined : "Todavía no abre: falta publicar la invitación"}
                  >
                    {copiado === f.id ? "Copiado" : publicada ? "Copiar enlace" : "Copiar (aún no abre)"}
                  </button>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={urlDeLink("", slug, f.nombres.join(", "), f.code)}
                    target="_blank"
                    rel="noopener"
                  >
                    Abrir
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => borrar(f.id)}
                    title="Borrar el enlace"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filas.length > 0 && (
        <button className={`btn btn-ghost btn-sm ${styles.refrescar}`} onClick={() => router.refresh()}>
          Actualizar respuestas
        </button>
      )}
    </main>
  );
}
