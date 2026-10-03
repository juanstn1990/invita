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
  ordenar,
  esTrabajo,
  letraInicial,
  ENTREGADAS_VISIBLES,
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
  /** Sólo para las muestras del catálogo: qué son y a quién le quedan. */
  descripcion: string;
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
  /* El tablero de trabajo y el catálogo son dos cosas: el catálogo no tiene
     pago, ni responsable, ni fecha que corra prisa, y en una columna más
     rompía la lectura de las fases de izquierda a derecha. */
  const [vista, setVista] = useState<"trabajo" | "catalogo">("trabajo");
  /* Los filtros viven plegados: son tres selects que casi nunca se tocan y
     ocupaban la fila entera de arriba. */
  const [verFiltros, setVerFiltros] = useState(false);
  /* Los dos avisos de arriba, convertidos en filtro: leer «3 urgentes» y no
     poder ir a ellas obliga a buscarlas con la vista. */
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [soloSinCobrar, setSoloSinCobrar] = useState(false);
  /* El menú «⋯» de una tarjeta. Uno a la vez. */
  const [menu, setMenu] = useState<string | null>(null);
  /* Entregadas completas, no sólo las últimas. */
  const [todasEntregadas, setTodasEntregadas] = useState(false);

  const resumen = resumir(tarjetas);
  const filtrosActivos = [filtroTipo, filtroPago, filtroResp].filter(Boolean).length;
  const muestrasN = tarjetas.filter((t) => t.estado === "catalogo" && !t.archivada).length;
  const puente =
    vista === "trabajo"
      ? { estado: "catalogo" as Estado, texto: "Suelta aquí para pasarla al catálogo" }
      : { estado: "borrador" as Estado, texto: "Suelta aquí para sacarla del catálogo (vuelve a Borrador)" };
  const columnas = ESTADOS.filter((e) => (vista === "trabajo") === esTrabajo(e.id));
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
    if (soloUrgentes && !urge(t.fecha, t.estado)) return false;
    if (soloSinCobrar && !(t.estado === "entregada" && t.pago !== "completo")) return false;
    return true;
  });

  /**
   * Las muestras del catálogo, por ocasión.
   *
   * Se agrupan por lo que de verdad se busca —«una de quince», «una de
   * boda»— y no por fecha ni por nombre: una muestra no tiene fecha real y
   * su nombre no dice de qué es.
   */
  const muestrasPorTipo = Array.from(
    visibles
      .filter((t) => t.estado === "catalogo")
      .reduce((acc, t) => {
        const g = acc.get(t.tipo) ?? { label: t.tipoLabel, items: [] as Tarjeta[] };
        g.items.push(t);
        acc.set(t.tipo, g);
        return acc;
      }, new Map<string, { label: string; items: Tarjeta[] }>())
  )
    .map(([tipo, g]) => [tipo, g.label, g.items] as const)
    .sort((a, b) => a[1].localeCompare(b[1]));


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
  function anotar(id: string, campo: "telefono" | "notas" | "descripcion", valor: string) {
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

  /* Sin asignar → Valentina → Juan → sin asignar, como el pago: un clic y
     no un select, para que los dos sellos de la tarjeta se manejen igual. */
  function siguienteResp(id: string) {
    const t = tarjetas.find((x) => x.id === id);
    if (!t) return;
    const orden: (Responsable | null)[] = [null, ...RESPONSABLES.map((r) => r.id)];
    asignar(id, orden[(orden.indexOf(t.responsable) + 1) % orden.length]);
  }

  function archivar(id: string, archivada: boolean) {
    const antes = tarjetas;
    setTarjetas(tarjetas.map((x) => (x.id === id ? { ...x, archivada } : x)));
    guardar(id, { archivada }, () => setTarjetas(antes));
  }

  /**
   * Una muestra del catálogo, dibujada.
   *
   * El iframe es la invitación real renderizada a 390 px —ancho de móvil— y
   * escalada, igual que en la galería de diseños: una captura envejecería en
   * cuanto alguien retocara la muestra, y una muestra que no se parece a lo
   * que se entrega no sirve para enseñar nada.
   */
  function muestra(t: Tarjeta) {
    return (
      <article
        key={t.id}
        className={styles.muestra}
        draggable
        data-arrastrando={arrastrando === t.id || undefined}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", t.id);
          e.dataTransfer.effectAllowed = "move";
          setArrastrando(t.id);
        }}
        onDragEnd={() => { setArrastrando(null); setEncima(null); }}
      >
        <Link href={`/editor/${t.id}`} className={styles.marco} title={`Abrir ${t.titulo}`}>
          <iframe
            className={styles.lienzo}
            src={`/api/invitations/${t.id}/vista`}
            title={`Vista previa · ${t.titulo}`}
            loading="lazy"
            scrolling="no"
            tabIndex={-1}
          />
          {/* Encima del iframe: sin esto el clic se lo come él y la tarjeta
              deja de poder abrirse ni arrastrarse. */}
          <span className={styles.velo} aria-hidden />
        </Link>

        <div className={styles.muestraPie}>
          <p className={styles.muestraNombre}>{t.titulo}</p>

          <button
            type="button"
            className={styles.descripcion}
            data-vacia={!t.descripcion || undefined}
            onClick={() => setAbierta(abierta === t.id ? null : t.id)}
            title="Clic para escribir o editar la descripción"
          >
            {t.descripcion || "Sin descripción · clic para escribirla"}
          </button>

          <div className={styles.pie}>
            {t.publicada ? (
              <button
                type="button"
                className={styles.copiar}
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}/${t.slug}`);
                  setCopiado(t.id);
                  setTimeout(() => setCopiado((x) => (x === t.id ? null : x)), 1800);
                }}
                title={`Copiar el enlace /${t.slug}`}
              >
                {copiado === t.id ? "¡Copiada!" : "Copiar URL"}
              </button>
            ) : (
              <span className={styles.aviso}>Publícala para compartirla</span>
            )}
            <button
              type="button"
              className={styles.archivar}
              onClick={() => mover(t.id, "borrador")}
              title="Sacarla del catálogo (vuelve a Borrador)"
            >
              Sacar
            </button>
          </div>

          {abierta === t.id && (
            <label className={styles.campo}>
              <span>Descripción</span>
              <textarea
                rows={4}
                defaultValue={t.descripcion}
                placeholder="Temas, personajes, colores, ambiente… p. ej. «Rapunzel: torre, cabello largo, flores silvestres, lila y dorado»"
                onBlur={(e) => anotar(t.id, "descripcion", e.target.value)}
              />
            </label>
          )}
        </div>
      </article>
    );
  }

  function tarjeta(t: Tarjeta) {
    const respLabel = RESPONSABLES.find((r) => r.id === t.responsable)?.label;
    const catalogo = t.estado === "catalogo";
    const cuanto = !catalogo && faltan(t.fecha);
    return (
      <li
        key={t.id}
        className={styles.tarjeta}
        draggable
        data-arrastrando={arrastrando === t.id || undefined}
        data-urgente={urge(t.fecha, t.estado) || undefined}
        data-archivada={t.archivada || undefined}
        data-menu={menu === t.id || undefined}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", t.id);
          e.dataTransfer.effectAllowed = "move";
          setArrastrando(t.id);
        }}
        onDragEnd={() => { setArrastrando(null); setEncima(null); }}
      >
        <div className={styles.fila}>
          <Link href={`/editor/${t.id}`} className={styles.nombre}>
            {t.titulo}
          </Link>
          <button
            type="button"
            className={styles.mas}
            aria-label={`Más acciones de ${t.titulo}`}
            aria-expanded={menu === t.id}
            onClick={() => setMenu(menu === t.id ? null : t.id)}
          >
            ⋯
          </button>
        </div>

        <p className={styles.cuando}>
          {t.tipoLabel} · {t.fechaTexto}
          {cuanto && <span className={styles.faltan}> · {cuanto}</span>}
        </p>

        {/* La descripción de una muestra: es lo que la distingue de las demás
            de un vistazo, y lo que lee el servidor MCP para elegirla. */}
        {catalogo && (
          <button
            type="button"
            className={styles.descripcion}
            data-vacia={!t.descripcion || undefined}
            onClick={() => setAbierta(abierta === t.id ? null : t.id)}
            title="Clic para escribir o editar la descripción"
          >
            {t.descripcion || "Sin descripción · clic para escribirla"}
          </button>
        )}

        {/* Lo único que se ve siempre además del nombre: cómo va el cobro y
            quién la lleva, con el mismo tamaño y el mismo gesto. */}
        {!catalogo && (
          <div className={styles.pie}>
            <button
              type="button"
              className={styles.pago}
              data-pago={t.pago}
              onClick={() => pagar(t.id)}
              title={`Clic para: ${PAGO_POR_ID[siguientePago(t.pago)].label}`}
            >
              {PAGO_POR_ID[t.pago].label}
            </button>
            <button
              type="button"
              className={styles.responsable}
              data-asignada={t.responsable || undefined}
              onClick={() => siguienteResp(t.id)}
              title={respLabel ? `La lleva ${respLabel}. Clic para cambiar` : "Sin asignar. Clic para asignar"}
              aria-label={respLabel ? `Responsable: ${respLabel}` : "Sin responsable"}
            >
              {respLabel ? letraInicial(respLabel) : "?"}
            </button>
            {(t.telefono || t.notas) && (
              <span className={styles.rastro} title="Tiene ficha de cliente">
                {t.notas ? "nota" : "tel."}
              </span>
            )}
          </div>
        )}

        {catalogo && (
          <div className={styles.pie}>
            {t.publicada ? (
              <button
                type="button"
                className={styles.copiar}
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}/${t.slug}`);
                  setCopiado(t.id);
                  setTimeout(() => setCopiado((x) => (x === t.id ? null : x)), 1800);
                }}
                title={`Copiar el enlace /${t.slug}`}
              >
                {copiado === t.id ? "¡Copiada!" : "Copiar URL"}
              </button>
            ) : (
              <span className={styles.aviso}>Publícala para poder compartirla</span>
            )}
          </div>
        )}

        {menu === t.id && (
          <>
            <button
              type="button"
              className={styles.velo}
              aria-label="Cerrar el menú"
              onClick={() => setMenu(null)}
            />
            <div className={styles.menu} role="menu">
              {t.publicada && (
                <a href={`/${t.slug}`} target="_blank" rel="noopener" role="menuitem">
                  Ver invitación ↗
                </a>
              )}
              {t.telefono && whatsapp(t.telefono) && (
                <a href={whatsapp(t.telefono)} target="_blank" rel="noopener" role="menuitem">
                  WhatsApp ↗
                </a>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => { setAbierta(abierta === t.id ? null : t.id); setMenu(null); }}
              >
                {catalogo ? "Descripción" : "Ficha del cliente"}
              </button>
              {!catalogo && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { archivar(t.id, !t.archivada); setMenu(null); }}
                >
                  {t.archivada ? "Sacar del archivo" : "Archivar"}
                </button>
              )}
              {/* El paso entre el trabajo y el catálogo, sin abrir el selector:
                  son pestañas distintas y no se puede arrastrar de una a otra. */}
              <button
                type="button"
                role="menuitem"
                onClick={() => { mover(t.id, catalogo ? "borrador" : "catalogo"); setMenu(null); }}
              >
                {catalogo ? "Sacar del catálogo" : "Pasar al catálogo"}
              </button>
              {/* Mover: arrastrar no existe con el dedo, y con ratón también
                  es más corto elegir que cruzar el tablero. */}
              <label className={styles.mover}>
                <span>Mover a</span>
                <select
                  value={t.estado}
                  onChange={(e) => { mover(t.id, e.target.value as Estado); setMenu(null); }}
                >
                  {ESTADOS.map((e) => (
                    <option key={e.id} value={e.id}>{e.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        {abierta === t.id && (
          <div className={styles.fichaCuerpo}>
            {catalogo ? (
              <label className={styles.campo}>
                <span>Descripción</span>
                <textarea
                  rows={5}
                  defaultValue={t.descripcion}
                  placeholder="Temas, personajes, colores, ambiente… p. ej. «Rapunzel: torre, cabello largo, flores silvestres, lila y dorado»"
                  onBlur={(e) => anotar(t.id, "descripcion", e.target.value)}
                />
              </label>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className={styles.envoltorio}>
      <div className={styles.resumen}>
        <span className={styles.dato}>
          <strong>{resumen.total}</strong> invitaciones
        </span>
        {ocultas > 0 && (
          <span className={styles.dato} title="Hechas con el constructor visual, que se retiró">
            <strong>{ocultas}</strong> de una versión anterior, sin poder abrir
          </span>
        )}
        {resumen.urgentes > 0 && (
          <button
            type="button"
            className={`${styles.dato} ${styles.chip} ${styles.urgente}`}
            aria-pressed={soloUrgentes}
            onClick={() => { setSoloUrgentes((v) => !v); setVista("trabajo"); }}
            title="Clic para ver sólo estas"
          >
            <strong>{resumen.urgentes}</strong>{" "}
            {resumen.urgentes === 1 ? "se celebra" : "se celebran"} en menos de dos
            semanas y no {resumen.urgentes === 1 ? "está entregada" : "están entregadas"}
          </button>
        )}
        {resumen.sinCobrar > 0 && (
          <button
            type="button"
            className={`${styles.dato} ${styles.chip} ${styles.cobro}`}
            aria-pressed={soloSinCobrar}
            onClick={() => { setSoloSinCobrar((v) => !v); setVista("trabajo"); }}
            title="Clic para ver sólo estas"
          >
            <strong>{resumen.sinCobrar}</strong>{" "}
            {resumen.sinCobrar === 1 ? "entregada sin cobrar" : "entregadas sin cobrar"}
          </button>
        )}

        <input
          type="search"
          className={styles.buscar}
          placeholder="Buscar por nombre o teléfono…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          type="button"
          className={styles.toggleArchivadas}
          aria-expanded={verFiltros}
          onClick={() => setVerFiltros((v) => !v)}
        >
          Filtros{filtrosActivos > 0 ? ` · ${filtrosActivos}` : ""}
        </button>
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

      {verFiltros && (
        <div className={styles.filtros}>
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
          {filtrosActivos > 0 && (
            <button
              type="button"
              className={styles.limpiar}
              onClick={() => { setFiltroTipo(""); setFiltroPago(""); setFiltroResp(""); }}
            >
              Quitar filtros
            </button>
          )}
        </div>
      )}

      <div className={styles.pestanas} role="tablist">
        <button
          type="button" role="tab" aria-selected={vista === "trabajo"}
          onClick={() => setVista("trabajo")}
        >
          Trabajo
        </button>
        <button
          type="button" role="tab" aria-selected={vista === "catalogo"}
          onClick={() => setVista("catalogo")}
        >
          Catálogo <span className={styles.cuenta}>{muestrasN}</span>
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {/* Mientras se arrastra una tarjeta aparece el destino de la otra
          pestaña: sin él, al estar separadas, no habría dónde soltarla. */}
      {arrastrando && (
        <div
          className={styles.puente}
          data-encima={encima === puente.estado || undefined}
          onDragOver={(e) => { e.preventDefault(); setEncima(puente.estado); }}
          onDragLeave={() => setEncima((x) => (x === puente.estado ? null : x))}
          onDrop={(e) => {
            e.preventDefault();
            setEncima(null);
            const id = e.dataTransfer.getData("text/plain") || arrastrando;
            setArrastrando(null);
            if (id) mover(id, puente.estado);
          }}
        >
          {puente.texto}
        </div>
      )}

      {/* El catálogo no es una columna más: es un muestrario.
          Lo que se hace aquí es **elegir** una muestra para enseñársela a un
          cliente, y eso no se hace leyendo nombres. Se agrupa por ocasión
          —nadie busca «una muestra», busca «una de quince»— y cada una se
          dibuja de verdad, con el mismo iframe escalado que ya usa la
          galería de diseños. */}
      {vista === "catalogo" ? (
        muestrasPorTipo.length === 0 ? (
          <p className={styles.vacio}>
            No hay muestras todavía. Pasa una invitación al catálogo desde su
            menú «⋯» y aparecerá aquí.
          </p>
        ) : (
          <div className={styles.galeria}>
            {muestrasPorTipo.map(([tipo, label, suyas]) => (
              <section key={tipo}>
                <h2 className={styles.grupoTitulo}>
                  {label}
                  <span className={styles.cuenta}>{suyas.length}</span>
                </h2>
                <div className={styles.rejilla}>{suyas.map(muestra)}</div>
              </section>
            ))}
          </div>
        )
      ) : (
      <div
        className={styles.columnas}
        data-vista={vista}
        /* Una columna vacía no necesita el ancho de una llena: se queda
           como una tira con su cabecera y deja el espacio a las que tienen
           trabajo. */
        style={
          vista === "trabajo"
            ? {
                gridTemplateColumns: columnas
                  .map((c) =>
                    visibles.some((t) => t.estado === c.id)
                      ? "minmax(230px, 1fr)"
                      : "minmax(150px, .45fr)"
                  )
                  .join(" "),
              }
            : undefined
        }
      >
        {columnas.map((col) => {
          const ordenadas = ordenar(visibles.filter((t) => t.estado === col.id));
          const recorta = col.id === "entregada" && !todasEntregadas && ordenadas.length > ENTREGADAS_VISIBLES;
          const suyas = recorta ? ordenadas.slice(0, ENTREGADAS_VISIBLES) : ordenadas;
          return (
            <section
              key={col.id}
              className={styles.columna}
              data-encima={encima === col.id || undefined}
              data-vacia={!ordenadas.length || undefined}
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
                <span className={styles.cuenta}>{ordenadas.length}</span>
              </header>
              {ordenadas.length > 0 && <p className={styles.pista}>{col.hint}</p>}

              <ul className={styles.pila}>
                {suyas.map(tarjeta)}
                {!ordenadas.length && <li className={styles.vacia}>Nada aquí</li>}
              </ul>

              {col.id === "entregada" && ordenadas.length > ENTREGADAS_VISIBLES && (
                <button
                  type="button"
                  className={styles.verMas}
                  onClick={() => setTodasEntregadas((v) => !v)}
                >
                  {recorta
                    ? `Ver las ${ordenadas.length - ENTREGADAS_VISIBLES} anteriores`
                    : "Ver sólo las últimas"}
                </button>
              )}
            </section>
          );
        })}
      </div>
      )}
    </div>
  );
}
