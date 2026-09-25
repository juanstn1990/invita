"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ESTADOS,
  RESPONSABLES,
  PAGOS,
  faltan,
  urge,
  resumir,
  whatsapp,
  pagoDe,
  siguientePago,
  PAGO_POR_ID,
  type Estado,
  type Pago,
  type Responsable,
} from "@/lib/tablero";
import type { Occasion } from "@/lib/design/theme";
import styles from "./tablero.module.css";

export interface Tarjeta {
  id: string;
  titulo: string;
  slug: string;
  publicada: boolean;
  /** Boda, quince, grado… lo que se elige al crearla, no se cambia después. */
  tipo: Occasion;
  /** Su nombre en español, resuelto en el servidor: `templates.ts` lee
      archivos y este componente es de cliente, así que no puede traerlo. */
  tipoLabel: string;
  estado: Estado;
  pago: Pago;
  /** Quién la lleva. Sin asignar en lo que ya existía antes de este campo. */
  responsable: Responsable | null;
  /** Cerrada y fuera de las columnas, salvo que se pida verla. */
  archivada: boolean;
  /** ISO del evento, para los días que faltan. */
  fecha: string;
  fechaTexto: string;
  diseno: string;
  paleta: [string, string, string];
  /** El contacto de quien la encargó. Privado: no sale en la invitación. */
  telefono: string;
  /** Notas del organizador. También privadas. */
  notas: string;
}

/**
 * El tablero.
 *
 * Optimista a propósito: al soltar una tarjeta se mueve en pantalla y
 * **después** se avisa al servidor. Esperar la respuesta para moverla hace
 * que arrastrar se sienta pegajoso, y pegajoso en un tablero es la diferencia
 * entre usarlo y no usarlo. Si el servidor dice que no, vuelve a su sitio y
 * se explica — que es lo que casi nunca se hace y por lo que «optimista»
 * tiene mala fama.
 */
export function Tablero({
  inicial,
  ocultas = 0,
}: {
  inicial: Tarjeta[];
  /** Las del constructor retirado: se cuentan aunque no se puedan abrir. */
  ocultas?: number;
}) {
  const [tarjetas, setTarjetas] = useState(inicial);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<Estado | null>(null);
  const [error, setError] = useState("");
  /* Qué tarjeta tiene la ficha del cliente abierta. Una a la vez: abiertas
     todas, el tablero deja de caber en una pantalla y deja de ser un tablero. */
  const [abierta, setAbierta] = useState<string | null>(null);
  /* Qué tarjeta acaba de copiar su enlace, para confirmarlo un momento. */
  const [copiado, setCopiado] = useState<string | null>(null);
  /* Las archivadas están fuera por defecto: es lo que evita que el tablero
     se llene de trabajo ya cerrado según crece. */
  const [verArchivadas, setVerArchivadas] = useState(false);
  /* Por nombre o teléfono. Vacío no filtra nada. */
  const [busqueda, setBusqueda] = useState("");
  /* Los tres filtros de arriba: vacío es "cualquiera", igual que la
     búsqueda. "" para responsable no puede significar "sin asignar" —ese
     valor lo necesita el select para su propia opción vacía "Cualquiera"—,
     así que "sin asignar" es una cadena propia que no colisiona con ningún
     id real. */
  const [filtroTipo, setFiltroTipo] = useState<Occasion | "">("");
  const [filtroPago, setFiltroPago] = useState<Pago | "">("");
  const [filtroResp, setFiltroResp] = useState<Responsable | "sin" | "">("");

  const resumen = resumir(tarjetas);
  const archivadasN = tarjetas.filter((t) => t.archivada).length;
  /* Sólo los tipos que de verdad hay: ofrecer "Baby shower" en el filtro
     cuando nadie tiene una invitación de baby shower sería un hueco que
     siempre vuelve vacío. Con su etiqueta al lado, para no depender de
     `KIND_LABEL` aquí —ver por qué en el campo `tipoLabel` de `Tarjeta`. */
  const tiposPresentes = Array.from(
    new Map(tarjetas.map((t) => [t.tipo, t.tipoLabel])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const q = busqueda.trim().toLowerCase();
  const visibles = tarjetas.filter((t) => {
    if (t.archivada && !verArchivadas) return false;
    if (q && !(t.titulo.toLowerCase().includes(q) || t.telefono.includes(q))) return false;
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (filtroPago && t.pago !== filtroPago) return false;
    if (filtroResp === "sin" && t.responsable) return false;
    if (filtroResp && filtroResp !== "sin" && t.responsable !== filtroResp) return false;
    return true;
  });

  async function guardar(id: string, cambio: Record<string, unknown>, deshacer: () => void) {
    setError("");
    try {
      const r = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambio),
      });
      if (!r.ok) {
        const { error } = await r.json().catch(() => ({ error: "" }));
        throw new Error(error || `El servidor respondió ${r.status}.`);
      }
    } catch (e) {
      deshacer();
      setError(`No se pudo guardar: ${(e as Error).message}`);
    }
  }

  function mover(id: string, estado: Estado) {
    const antes = tarjetas;
    const t = tarjetas.find((x) => x.id === id);
    if (!t || t.estado === estado) return;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, estado } : x)));
    guardar(id, { estado }, () => setTarjetas(antes));
  }

  /* El teléfono y las notas se guardan al salir del campo y no en cada
     tecla: una petición por letra llena el registro de ruido y, con la red
     mala, llegan desordenadas y gana la penúltima. */
  function anotar(id: string, campo: "telefono" | "notas", valor: string) {
    const antes = tarjetas;
    const t = tarjetas.find((x) => x.id === id);
    if (!t || t[campo] === valor) return;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, [campo]: valor } : x)));
    guardar(id, { [campo]: valor }, () => setTarjetas(antes));
  }

  function pagar(id: string) {
    const antes = tarjetas;
    const t = tarjetas.find((x) => x.id === id);
    if (!t) return;
    const pago = siguientePago(t.pago);
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, pago } : x)));
    guardar(id, { pago }, () => setTarjetas(antes));
  }

  function asignar(id: string, responsable: Responsable | null) {
    const antes = tarjetas;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, responsable } : x)));
    guardar(id, { responsable: responsable || "" }, () => setTarjetas(antes));
  }

  function archivar(id: string, archivada: boolean) {
    const antes = tarjetas;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, archivada } : x)));
    guardar(id, { archivada }, () => setTarjetas(antes));
  }

  return (
    <div className={styles.envoltorio}>
      <div className={styles.resumen}>
        <span className={styles.dato}>
          <strong>{resumen.total}</strong> invitaciones
        </span>
        {resumen.muestras > 0 && (
          <span className={styles.dato}>
            <strong>{resumen.muestras}</strong> en el catálogo
          </span>
        )}
        {ocultas > 0 && (
          <span className={styles.dato} title="Hechas con el constructor visual, que se retiró">
            <strong>{ocultas}</strong> de una versión anterior, sin poder abrir
          </span>
        )}
        {resumen.urgentes > 0 && (
          <span className={`${styles.dato} ${styles.urgente}`}>
            <strong>{resumen.urgentes}</strong>{" "}
            {resumen.urgentes === 1 ? "se celebra" : "se celebran"} en menos de dos
            semanas y no {resumen.urgentes === 1 ? "está entregada" : "están entregadas"}
          </span>
        )}
        {resumen.sinCobrar > 0 && (
          <span className={`${styles.dato} ${styles.cobro}`}>
            <strong>{resumen.sinCobrar}</strong>{" "}
            {resumen.sinCobrar === 1 ? "entregada sin cobrar" : "entregadas sin cobrar"}
          </span>
        )}

        {/* Buscar y archivar son la respuesta a lo mismo: que el tablero
            siga cabiendo de un vistazo aunque haya cien tarjetas y no quince.
            Buscar encuentra una entre todas sin recorrer columnas; archivar
            saca del camino lo que ya se cerró sin borrar nada. */}
        <input
          type="search"
          className={styles.buscar}
          placeholder="Buscar por nombre o teléfono…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className={styles.filtro}
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as Occasion | "")}
        >
          <option value="">Cualquier tipo</option>
          {tiposPresentes.map(([tipo, label]) => (
            <option key={tipo} value={tipo}>{label}</option>
          ))}
        </select>

        <select
          className={styles.filtro}
          value={filtroPago}
          onChange={(e) => setFiltroPago(e.target.value as Pago | "")}
        >
          <option value="">Cualquier pago</option>
          {PAGOS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        <select
          className={styles.filtro}
          value={filtroResp}
          onChange={(e) => setFiltroResp(e.target.value as Responsable | "sin" | "")}
        >
          <option value="">Cualquiera</option>
          {RESPONSABLES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
          <option value="sin">Sin asignar</option>
        </select>

        {archivadasN > 0 && (
          <button
            type="button"
            className={styles.toggleArchivadas}
            aria-pressed={verArchivadas}
            onClick={() => setVerArchivadas((v) => !v)}
          >
            {verArchivadas ? "Ocultar" : "Ver"} {archivadasN} archivada{archivadasN === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.columnas}>
        {ESTADOS.map((col) => {
          const suyas = visibles.filter((t) => t.estado === col.id);
          return (
            <section
              key={col.id}
              className={styles.columna}
              data-encima={encima === col.id || undefined}
              onDragOver={(e) => { e.preventDefault(); setEncima(col.id); }}
              onDragLeave={() => setEncima((x) => (x === col.id ? null : x))}
              onDrop={(e) => {
                e.preventDefault();
                setEncima(null);
                const id = e.dataTransfer.getData("text/plain") || arrastrando;
                /* También aquí y no sólo en `onDragEnd`: si ese evento no
                   llega —pasa al soltar fuera, y con algunas capas de por
                   medio— la tarjeta se queda translúcida para siempre y
                   parece rota. */
                setArrastrando(null);
                if (id) mover(id, col.id);
              }}
            >
              <header className={styles.cabecera}>
                <span className={styles.punto} style={{ background: col.color }} aria-hidden />
                <h2 className={styles.tituloColumna}>{col.label}</h2>
                <span className={styles.cuenta}>{suyas.length}</span>
              </header>
              <p className={styles.pista}>{col.hint}</p>

              <ul className={styles.pila}>
                {suyas.map((t) => (
                  <li
                    key={t.id}
                    className={styles.tarjeta}
                    draggable
                    data-arrastrando={arrastrando === t.id || undefined}
                    data-urgente={urge(t.fecha, t.estado) || undefined}
                    data-archivada={t.archivada || undefined}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastrando(t.id);
                    }}
                    onDragEnd={() => { setArrastrando(null); setEncima(null); }}
                  >
                    <Link href={`/editor/${t.id}`} className={styles.nombre}>
                      {t.titulo}
                    </Link>
                    <p className={styles.tipo}>{t.tipoLabel}</p>

                    <p className={styles.cuando}>
                      {t.fechaTexto}
                      {t.estado !== "catalogo" && faltan(t.fecha) && (
                        <span className={styles.faltan}> · {faltan(t.fecha)}</span>
                      )}
                    </p>

                    <div className={styles.pie}>
                      {/* El sello de pago. Un botón y no una casilla: es una
                          acción que se hace y se deshace, y la casilla sugiere
                          un formulario que hay que enviar. */}
                      {t.estado === "catalogo" ? (
                        t.publicada ? (
                          <button
                            type="button"
                            className={styles.copiar}
                            onClick={() => {
                              navigator.clipboard?.writeText(`${location.origin}/${t.slug}`);
                              setCopiado(t.id);
                              setTimeout(() => setCopiado((x) => (x === t.id ? null : x)), 1800);
                            }}
                            title="Copiar el enlace para mandarlo por WhatsApp"
                          >
                            {copiado === t.id ? "¡Copiado!" : "Copiar enlace"}
                          </button>
                        ) : (
                          <span className={styles.aviso}>Publícala para poder compartirla</span>
                        )
                      ) : (
                      <button
                        type="button"
                        className={styles.pago}
                        data-pago={t.pago}
                        onClick={() => pagar(t.id)}
                        title={`Clic para: ${PAGO_POR_ID[siguientePago(t.pago)].label}`}
                      >
                        {PAGO_POR_ID[t.pago].label}
                      </button>
                      )}

                      {/* Quién la lleva: sin asignar por defecto en un select
                          normal, para no inventar un tercer estado visual
                          sólo para "nadie todavía". */}
                      {t.estado !== "catalogo" && (
                        <select
                          className={styles.responsable}
                          value={t.responsable || ""}
                          onChange={(e) =>
                            asignar(t.id, (e.target.value || null) as Responsable | null)
                          }
                          title="Quién la lleva"
                        >
                          <option value="">¿Quién?</option>
                          {RESPONSABLES.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      )}

                      {t.publicada && (
                        <a
                          href={`/${t.slug}`}
                          target="_blank"
                          rel="noopener"
                          className={styles.enlace}
                          title={`Abrir /${t.slug}`}
                        >
                          ver ↗
                        </a>
                      )}

                      {t.estado !== "catalogo" && (
                        <button
                          type="button"
                          className={styles.archivar}
                          onClick={() => archivar(t.id, !t.archivada)}
                          title={t.archivada ? "Sacarla del archivo" : "Archivarla: sale de las columnas"}
                        >
                          {t.archivada ? "Desarchivar" : "Archivar"}
                        </button>
                      )}
                    </div>

                    {/* La ficha del cliente: teléfono y notas.

                        Plegada por defecto, y con un rastro cuando hay algo
                        dentro — un botón que no dice si esconde algo obliga a
                        abrir las quince tarjetas para saber cuáles tienen
                        nota, que es justo el trabajo que el tablero venía a
                        quitar. */}
                    <div className={styles.cliente}>
                      <button
                        type="button"
                        className={styles.fichaBtn}
                        onClick={() => setAbierta(abierta === t.id ? null : t.id)}
                        aria-expanded={abierta === t.id}
                      >
                        {t.telefono || t.notas ? "Ficha ·" : "Ficha"}
                        {t.telefono && <span className={styles.pista2}>tel.</span>}
                        {t.notas && <span className={styles.pista2}>nota</span>}
                      </button>

                      {t.telefono && whatsapp(t.telefono) && (
                        <a
                          className={styles.wa}
                          href={whatsapp(t.telefono)}
                          target="_blank"
                          rel="noopener"
                          title={`Escribir a ${t.telefono} por WhatsApp`}
                        >
                          WhatsApp ↗
                        </a>
                      )}

                      {abierta === t.id && (
                        <div className={styles.fichaCuerpo}>
                          <label className={styles.campo}>
                            <span>Teléfono</span>
                            <input
                              type="tel"
                              defaultValue={t.telefono}
                              placeholder="+57 300 000 0000"
                              onBlur={(e) => anotar(t.id, "telefono", e.target.value)}
                            />
                          </label>
                          <label className={styles.campo}>
                            <span>Notas</span>
                            <textarea
                              rows={3}
                              defaultValue={t.notas}
                              placeholder="Lo que se acordó, qué falta, qué se cobró…"
                              onBlur={(e) => anotar(t.id, "notas", e.target.value)}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Arrastrar no existe en un teléfono: los eventos de
                        arrastre de HTML no llegan con el dedo. Sin esto el
                        tablero se vería perfecto y no se podría usar, que es
                        la peor clase de roto. */}
                    <label className={styles.mover}>
                      <span className="sr-only">Mover {t.titulo} a otra columna</span>
                      <select
                        value={t.estado}
                        onChange={(e) => mover(t.id, e.target.value as Estado)}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e.id} value={e.id}>{e.label}</option>
                        ))}
                      </select>
                    </label>
                  </li>
                ))}

                {!suyas.length && <li className={styles.vacia}>Nada aquí</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
