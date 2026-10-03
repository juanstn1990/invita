"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  HERO_DISPOSICIONES,
  SECTIONS,
  coupleName,
  formatDateLabel,
  type InvitationData,
  type SectionData,
} from "@/lib/schema";
import type { TemplateInfo } from "@/lib/templates";
import type { TemplateSupport } from "@/lib/support";
import { BLOCK_BY_TYPE, readLayout, type Block } from "@/lib/blocks";
import { BlockList } from "./BlockList";
import type { Senalado } from "./SectionEditor";
import { Biblioteca } from "./Biblioteca";
import { Aperturas } from "./Aperturas";
import { GuardarPlantilla } from "./GuardarPlantilla";
import { SectionEditor } from "./SectionEditor";
import { TemplateSwitcher } from "./TemplateSwitcher";
import { PublishDialog } from "./PublishDialog";
import { RsvpList, type RsvpRow } from "./RsvpList";
import styles from "./editor.module.css";

type SaveState = "idle" | "saving" | "saved" | "error" | "caducada";

/**
 * El enlace del panel de invitados, para pasárselo a quien va a invitar.
 *
 * Va aquí, junto a las confirmaciones, porque es lo mismo visto desde el otro
 * lado: allí se crean los enlaces y aquí llegan las respuestas.
 */
function PanelCompartido({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window === "undefined" ? `/g/${token}` : `${window.location.origin}/g/${token}`;

  return (
    <div className={styles.panelInvitados}>
      <p className={styles.panelInvitadosTitulo}>Panel de invitados</p>
      <p className={styles.panelInvitadosTexto}>
        Pásale este enlace a quien vaya a invitar. Desde ahí crea un enlace por
        familia —con los nombres dentro— y ve quién ha confirmado. No hace falta
        que entre aquí.
      </p>
      <div className={styles.panelInvitadosFila}>
        <code className={`mono ${styles.panelInvitadosUrl}`}>/g/{token}</code>
        <button
          className="btn btn-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1800);
            } catch {
              prompt("Copia el enlace:", url);
            }
          }}
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <a className="btn btn-ghost btn-sm" href={`/g/${token}`} target="_blank" rel="noopener">
          Abrir
        </a>
      </div>
    </div>
  );
}

/** Las que no son bloques: estructura de la invitación. */
const FIJAS = ["event", "splash", "hero"];

const DEVICES = [
  { key: "phone", label: "Móvil", width: 390 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "desktop", label: "Escritorio", width: 1180 },
] as const;

export interface EditorProps {
  id: string;
  initialTemplateId: string;
  initialData: InvitationData;
  initialSlug: string;
  initialPublished: boolean;
  /** Llave del panel que se comparte con quien invita. */
  manageToken: string;
  templates: TemplateInfo[];
  supports: Record<string, TemplateSupport>;
  rsvps: RsvpRow[];
  /** Cuántas personas abrieron la invitación publicada. Ver `aperturas.ts`. */
  aperturas: { personas: number; veces: number; ultima: string | null };
  openPanel: "content" | "rsvp";
}

export function Editor(props: EditorProps) {
  const [data, setData] = useState<InvitationData>(props.initialData);
  const [templateId, setTemplateId] = useState(props.initialTemplateId);
  const [slug, setSlug] = useState(props.initialSlug);
  const [published, setPublished] = useState(props.initialPublished);

  const [panel, setPanel] = useState<"content" | "rsvp">(props.openPanel);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("phone");
  /* Qué se ve en el marco: la invitación en vivo (el `srcDoc` de siempre,
     con los cambios sin guardar) o una de las páginas aparte —fotos,
     deseos—, que no tienen vista previa propia: se abre la página real,
     con la sesión de quien edita saltándose el candado de "todavía no". */
  const [vista, setVista] = useState<"invitacion" | "bienvenida" | "fotos" | "deseos">("invitacion");
  const [open, setOpen] = useState<string | null>("event");
  /**
   * Qué se puede hacer tocando la vista previa.
   *
   * `ver` no toca nada —es como se le enseña la pantalla a un cliente—,
   * `texto` escribe los textos donde se ven y `mover` es lo único que suelta
   * los adornos. Tenerlos separados es lo que evita mover una filigrana sin
   * querer mientras se lee.
   */
  const [modo, setModo] = useState<"ver" | "texto" | "mover">("ver");
  /**
   * El campo que se acaba de señalar en la vista previa.
   *
   * Lleva el índice porque un campo de ficha —«el título del segundo punto
   * del itinerario»— no se identifica sólo con la ruta: `events.items.title`
   * son todas las fichas a la vez.
   */
  const [senalado, setSenalado] = useState<Senalado | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  /* Por qué falló el último guardado, para poder decirlo en vez de dejar un
     "No se pudo guardar" gris que se pasa por alto. */
  const [porQue, setPorQue] = useState("");
  const [srcDoc, setSrcDoc] = useState("");
  const [rendering, setRendering] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const iframe = useRef<HTMLIFrameElement>(null);
  const scrollY = useRef(0);
  const dirty = useRef(false);

  const support = props.supports[templateId];

  /**
   * Rellena las opciones del selector de paleta.
   *
   * El esquema declara el campo pero no sus opciones: dependen del diseño
   * elegido, y el esquema no sabe cuál es. Cambiar de diseño cambia las
   * paletas disponibles, así que se resuelven aquí, en cada render.
   */
  const paletas = props.templates.find((t) => t.id === templateId)?.palettes || [];
  const conPaletas = (spec: (typeof SECTIONS)[number]) =>
    spec.key !== "event" || !paletas.length
      ? spec
      : {
          ...spec,
          fields: spec.fields.map((f) =>
            f.key !== "paleta"
              ? f
              : { ...f, options: paletas.map((p) => ({ value: p.id, label: p.nombre })) }
          ),
        };
  /** La biblioteca de portadas, abierta o no. */
  const [verPortadas, setVerPortadas] = useState(false);
  const deviceWidth = DEVICES.find((d) => d.key === device)!.width;

  /* ── Actualizar un campo ────────────────────────────────── */

  const patchSection = useCallback((key: string, patch: Partial<SectionData>) => {
    dirty.current = true;
    setData((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  /** El orden y la variante de cada bloque viven en `data.layout.blocks`. */
  const blocks = useMemo(() => readLayout(data), [data]);
  const setBlocks = useCallback(
    (next: Block[]) => patchSection("layout", { blocks: next }),
    [patchSection]
  );

  /* ── Vista previa en vivo ───────────────────────────────── */

  useEffect(() => {
    /* Mientras se escribe sobre la vista previa no se vuelve a renderizar.
       Cada cambio reemplaza el `srcdoc` entero, así que un render a media
       frase se lleva el cursor —y la frase— por delante. Lo escrito ya está
       en `data`; el marco se pone al día al salir del modo. */
    if (modo === "texto") return;
    const timer = setTimeout(async () => {
      scrollY.current = iframe.current?.contentWindow?.scrollY ?? scrollY.current;
      setRendering(true);
      try {
        const res = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, data, verSplash: vista === "bienvenida" }),
        });
        /* Si la sesión caducó mientras se editaba, la API responde JSON y
           volcarlo en el iframe llenaría la vista previa de `{"error":…}`.
           Mejor dejar la última vista buena y avisar arriba. */
        if (res.status === 401) setSave("caducada");
        else setSrcDoc(await res.text());
      } finally {
        setRendering(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [data, templateId, modo, vista]);

  /* ── Arrastrar un adorno sobre la vista previa ──────────── */

  /**
   * El iframe avisa al soltar, no mientras se mueve: cada aviso vuelve a
   * renderizar la invitación entera.
   *
   * Lo que llega se escribe en los mismos campos que mueven los dos
   * deslizadores de «libre», así que arrastrar y ajustar a mano son dos caras
   * de lo mismo y no dos maneras de guardar la posición. Y un adorno anclado
   * que se arrastra pasa a libre donde se soltó, que es lo que se espera al
   * mover algo con el dedo.
   */
  useEffect(() => {
    const alSoltar = (e: MessageEvent) => {
      /* Sólo de nuestro propio iframe: la vista previa vive en un `srcdoc` y
         cualquier otra ventana puede mandar mensajes a esta página. */
      if (e.source !== iframe.current?.contentWindow) return;
      const m = e.data as {
        inv?: string; seccion?: string; i?: number; x?: number; y?: number;
        path?: string; indice?: number; valor?: string; bloque?: string | null;
      };
      if (!m) return;

      /* El marco se rehace en cada render y nace en «ver», así que pide el
         modo al cargar en vez de esperar a que se lo manden. */
      if (m.inv === "listo") {
        iframe.current?.contentWindow?.postMessage({ inv: "modo", modo }, "*");
        return;
      }

      /* Señalar: se abre la sección del campo y se resalta. Es la respuesta a
         «¿dónde se cambia esto?», que es la pregunta que de verdad se hace
         delante de once secciones y ciento y pico controles. */
      if (m.inv === "selecciona" && m.path) {
        /* Los nombres de la pareja son un solo elemento con dos campos
           detrás. Se señala el primero, que es donde se empieza a escribir. */
        const path = m.path === "event.names" ? "event.name1" : m.path;
        const seccion = path.split(".")[0];
        /* Casi todas las secciones se editan desde la lista de bloques, y
           ahí lo que se abre es el **bloque**, cuyo id no es la clave de la
           sección sino `events-0`. Abrir por la clave no encontraba nada y
           el panel se quedaba quieto en todo el cuerpo de la invitación:
           itinerario, galería, confirmación, regalos… */
        const bloques = readLayout(data);
        /* El id lo manda la propia vista previa, que sabe de qué bloque salió
           el elemento. Buscarlo por la sección devolvía el primero de su
           tipo, y con dos párrafos o dos galerías eso es el equivocado la
           mitad de las veces. Se busca por sección sólo si no vino id. */
        const bloque =
          bloques.find((b) => b.id === m.bloque) ??
          bloques.find((b) => (BLOCK_BY_TYPE[b.type]?.section || b.type) === seccion);
        setOpen(bloque?.id ?? seccion);
        setSenalado({
          path,
          indice: typeof m.indice === "number" ? m.indice : -1,
          bloque: bloque?.id ?? null,
        });
        return;
      }

      /* Escribir desde la vista previa. Acaba en los mismos campos que el
         panel: no hay un segundo sitio donde viva el texto. */
      if (m.inv === "texto" && m.path && typeof m.valor === "string") {
        const [seccion, campo, subcampo] = m.path.split(".");
        const valor = m.valor;
        dirty.current = true;
        setData((prev) => {
          const sec = (prev[seccion] || {}) as SectionData;
          /* `events.items.title` con su índice: el campo vive en una ficha. */
          if (campo === "items" && subcampo) {
            const items = (sec.items as Record<string, string>[]) || [];
            if (typeof m.indice !== "number" || m.indice < 0 || !items[m.indice]) return prev;
            const next = items.map((it, k) =>
              k === m.indice ? { ...it, [subcampo]: valor } : it
            );
            return { ...prev, [seccion]: { ...sec, items: next } };
          }
          if (sec[campo] === valor) return prev;
          return { ...prev, [seccion]: { ...sec, [campo]: valor } };
        });
        return;
      }

      if (m.inv !== "adorno" || !m.seccion || typeof m.i !== "number") return;

      const x = Math.round(Math.max(0, Math.min(100, Number(m.x) || 0)));
      const y = Math.round(Math.max(0, Math.min(100, Number(m.y) || 0)));

      dirty.current = true;
      setData((prev) => {
        const sec = (prev[m.seccion!] || {}) as SectionData;
        const items = (sec.adornos as Record<string, string>[]) || [];
        if (!items[m.i!]) return prev;
        const next = items.map((it, k) =>
          k === m.i ? { ...it, sitio: "libre", x: String(x), y: String(y) } : it
        );
        return { ...prev, [m.seccion!]: { ...sec, adornos: next } };
      });
    };

    window.addEventListener("message", alSoltar);
    return () => window.removeEventListener("message", alSoltar);
  }, [modo, data]);

  /* Al cambiar de modo se le dice al marco que ya está cargado. Si acaba de
     renderizarse, él mismo lo pedirá con «listo»; los dos caminos llevan al
     mismo sitio y ninguno depende de quién llegue antes. */
  useEffect(() => {
    iframe.current?.contentWindow?.postMessage({ inv: "modo", modo }, "*");
    if (modo !== "texto") setSenalado(null);
  }, [modo]);

  /* ── Guardado automático ────────────────────────────────── */

  useEffect(() => {
    if (!dirty.current) return;
    setSave("saving");
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/invitations/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          templateId,
          title: coupleName(data) || "Invitación",
        }),
      });
      /* Una sesión caducada no es "no se pudo guardar": tiene arreglo, y lo
         que no se puede es dejar que quien lleva una hora escribiendo se
         entere sólo por un texto gris. `dirty` se queda como está, así que en
         cuanto vuelva a haber sesión el siguiente cambio guarda todo. */
      setSave(res.status === 401 ? "caducada" : res.ok ? "saved" : "error");
      if (res.ok) {
        dirty.current = false;
        setPorQue("");
        /* La dirección acompaña a los nombres mientras no se publique. */
        const j = await res.json().catch(() => null);
        if (j?.slug) setSlug(j.slug);
      } else if (res.status !== 401) {
        /* El motivo que dé la API, y si no da ninguno, el código. Un fallo de
           guardado silencioso es lo peor que puede hacer un editor: se sigue
           escribiendo media hora creyendo que quedó. */
        const j = await res.json().catch(() => ({}));
        setPorQue(String(j.error || `El servidor respondió ${res.status}.`));
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [data, templateId, props.id]);

  /* Avisar si se cierra la pestaña con cambios sin guardar. */
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  /* ── Cambiar de diseño ──────────────────────────────────── */

  function switchTemplate(nextId: string) {
    dirty.current = true;
    setTemplateId(nextId);
    setShowTemplates(false);
  }

  /* ── Etiqueta de fecha sugerida ─────────────────────────── */

  const dateHint = useMemo(
    () => formatDateLabel(String(data.event?.date || "")),
    [data.event?.date]
  );

  const sectionsInTemplate = new Set(support?.sections ?? []);
  /** ¿Hay pantalla de bienvenida que enseñar? Apagada, no hay nada que ver. */
  const hayBienvenida =
    sectionsInTemplate.has("splash") && data.splash?.enabled !== false;

  return (
    <div className={styles.shell}>
      {/* ── Barra superior ──────────────────────────────── */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <Link href="/" className={styles.back} title="Mis invitaciones">
            ←
          </Link>
          <div className={styles.identity}>
            <span className={styles.name}>{coupleName(data) || "Sin nombre"}</span>
            <button
              className={styles.templateBtn}
              onClick={() => setShowTemplates(true)}
            >
              {props.templates.find((t) => t.id === templateId)?.name ?? templateId}
              <span aria-hidden> ▾</span>
            </button>
          </div>
        </div>

        <div className={styles.topRight}>
          <span className={styles.saveState} data-state={save}>
            {save === "saving" && "Guardando…"}
            {save === "saved" && "Guardado"}
            {save === "error" && "No se pudo guardar"}
            {save === "caducada" && "Sesión cerrada"}
          </span>
          <Link href={`/editor/${props.id}/fotos`} className="btn btn-ghost btn-sm">
            Fotos del evento
          </Link>
          <Link href={`/editor/${props.id}/deseos`} className="btn btn-ghost btn-sm">
            Libro de deseos
          </Link>
          <GuardarPlantilla
            id={props.id}
            sugerido={coupleName(data) || "Mi plantilla"}
          />
          {published && (
            <a
              className={`${styles.liveLink} mono`}
              href={`/${slug}`}
              target="_blank"
              rel="noopener"
            >
              /{slug} ↗
            </a>
          )}
          <button className="btn btn-primary" onClick={() => setShowPublish(true)}>
            {published ? "Publicado" : "Publicar"}
          </button>
        </div>
      </header>

      {/* Un diseño retirado no rompe el editor de golpe: lo rompe a pedazos.
          No se puede guardar (la API responde 400), no se pueden ver las
          formas de un bloque, y cada fallo sale por su lado sin decir que la
          causa es una sola. Mejor decirlo arriba y una vez. */}
      {!props.templates.some((t) => t.id === templateId) && (
        <div className={styles.caducada} role="alert">
          <span>
            <strong>Este diseño ya no existe.</strong> Es de una versión
            anterior, y mientras esté puesto no se puede guardar ni cambiar la
            forma de los bloques. Elige otro y no pierdes nada de lo escrito.
          </span>
          <button className="btn btn-sm" onClick={() => setShowTemplates(true)}>
            Elegir diseño
          </button>
        </div>
      )}

      {save === "error" && (
        <div className={styles.caducada} role="alert">
          <span>
            <strong>No se guardó lo último que escribiste.</strong>{" "}
            {porQue} Lo que ves en pantalla sigue aquí, pero no está en el
            servidor: no cierres la pestaña todavía.
          </span>
          <button
            className="btn btn-sm"
            onClick={() => {
              /* Volver a marcarlo como sucio dispara el guardado otra vez. */
              dirty.current = true;
              setSave("saving");
              setData((prev) => ({ ...prev }));
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {save === "caducada" && (
        <div className={styles.caducada} role="alert">
          <span>
            Se cerró tu sesión. <strong>No se ha perdido nada de lo escrito</strong>
            : entra otra vez en la pestaña que se abre y esto vuelve a guardar
            solo con el siguiente cambio.
          </span>
          <a
            className="btn btn-sm"
            href={`/entrar?volver=${encodeURIComponent(`/editor/${props.id}`)}`}
            target="_blank"
            rel="noopener"
          >
            Entrar ↗
          </a>
        </div>
      )}

      <div className={styles.body}>
        {/* ── Panel de edición ──────────────────────────── */}
        <aside className={styles.panel}>
          <div className={styles.tabs}>
            <button
              className={styles.tab}
              data-active={panel === "content"}
              onClick={() => setPanel("content")}
            >
              Contenido
            </button>
            <button
              className={styles.tab}
              data-active={panel === "rsvp"}
              onClick={() => setPanel("rsvp")}
            >
              Confirmaciones
              {props.rsvps.length > 0 && (
                <span className={styles.badge}>{props.rsvps.length}</span>
              )}
            </button>
          </div>

          <div className={styles.panelScroll}>
            {panel === "rsvp" ? (
              <>
                <Aperturas {...props.aperturas} publicada={published} />
                <PanelCompartido token={props.manageToken} />
                <RsvpList rsvps={props.rsvps} published={published} slug={slug} />
              </>
            ) : (
              <>
                {FIJAS.map((key) => {
                  const spec = conPaletas(SECTIONS.find((s) => s.key === key)!);
                  return (
                    <SectionEditor
                      key={spec.key}
                      spec={spec}
                      senalado={senalado}
                      data={data[spec.key] || {}}
                      support={support}
                      inTemplate={spec.key === "event" || sectionsInTemplate.has(spec.key)}
                      open={open === spec.key}
                      onToggleOpen={() => setOpen(open === spec.key ? null : spec.key)}
                      onChange={(patch) => patchSection(spec.key, patch)}
                      extraHint={
                        spec.key === "event" && dateHint
                          ? `Se mostrará como “${
                              String(data.event?.dateLabel || "").trim() || dateHint
                            }”.`
                          : undefined
                      }
                      extra={
                        spec.key === "hero" ? (
                          <button
                            className={`btn btn-sm ${styles.verPortadas}`}
                            onClick={() => setVerPortadas(true)}
                          >
                            Ver las {HERO_DISPOSICIONES.length} formas de portada
                          </button>
                        ) : undefined
                      }
                    />
                  );
                })}

                <div className={styles.blocksHead}>
                  <span>Bloques</span>
                  <span className={styles.blocksHint}>arrástralos para reordenar</span>
                </div>

                <BlockList
                  senalado={senalado}
                  blocks={blocks}
                  sections={data}
                  templateId={templateId}
                  support={support}
                  open={open}
                  onOpen={setOpen}
                  onBlocks={setBlocks}
                  onSection={patchSection}
                />

                {(() => {
                  const pie = SECTIONS.find((s) => s.key === "footer")!;
                  return (
                    <SectionEditor
                      spec={pie}
                      senalado={senalado}
                      data={data.footer || {}}
                      support={support}
                      inTemplate={sectionsInTemplate.has("footer")}
                      open={open === "footer"}
                      onToggleOpen={() => setOpen(open === "footer" ? null : "footer")}
                      onChange={(patch) => patchSection("footer", patch)}
                    />
                  );
                })()}

                {/* Las dos últimas no son secciones de la invitación: una es
                    la capa que va encima de todo y la otra lo que se ve al
                    pegar el enlace. Van después del pie porque se deciden
                    cuando ya está todo lo demás. */}
                {(() => {
                  const fg = SECTIONS.find((s) => s.key === "fondoGlobal")!;
                  return (
                    <SectionEditor
                      spec={fg}
                      senalado={senalado}
                      data={data.fondoGlobal || {}}
                      support={support}
                      inTemplate
                      open={open === "fondoGlobal"}
                      onToggleOpen={() => setOpen(open === "fondoGlobal" ? null : "fondoGlobal")}
                      onChange={(patch) => patchSection("fondoGlobal", patch)}
                    />
                  );
                })()}

                {(() => {
                  const pt = SECTIONS.find((s) => s.key === "particulas")!;
                  return (
                    <SectionEditor
                      spec={pt}
                      senalado={senalado}
                      data={data.particulas || {}}
                      support={support}
                      inTemplate
                      open={open === "particulas"}
                      onToggleOpen={() => setOpen(open === "particulas" ? null : "particulas")}
                      onChange={(patch) => patchSection("particulas", patch)}
                    />
                  );
                })()}

                {(() => {
                  const marca = SECTIONS.find((s) => s.key === "marca")!;
                  return (
                    <SectionEditor
                      spec={marca}
                      senalado={senalado}
                      data={data.marca || {}}
                      support={support}
                      inTemplate
                      open={open === "marca"}
                      onToggleOpen={() => setOpen(open === "marca" ? null : "marca")}
                      onChange={(patch) => patchSection("marca", patch)}
                    />
                  );
                })()}

                {(() => {
                  const comp = SECTIONS.find((s) => s.key === "compartir")!;
                  return (
                    <SectionEditor
                      spec={comp}
                      senalado={senalado}
                      data={data.compartir || {}}
                      support={support}
                      inTemplate
                      open={open === "compartir"}
                      onToggleOpen={() => setOpen(open === "compartir" ? null : "compartir")}
                      onChange={(patch) => patchSection("compartir", patch)}
                    />
                  );
                })()}
              </>
            )}
          </div>
        </aside>

        {/* ── Vista previa ──────────────────────────────── */}
        <section className={styles.stage}>
          <div className={styles.stageBar}>
            <div className={styles.devices}>
              {DEVICES.map((d) => (
                <button
                  key={d.key}
                  className={styles.device}
                  data-active={device === d.key}
                  onClick={() => setDevice(d.key)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {(hayBienvenida ||
              blocks.some((b) => b.type === "fotos") ||
              blocks.some((b) => b.type === "deseos")) && (
              <div className={styles.devices}>
                <button
                  className={styles.device}
                  data-active={vista === "invitacion"}
                  onClick={() => setVista("invitacion")}
                >
                  Invitación
                </button>
                {/* La bienvenida tapa la pantalla entera, así que no puede
                    salir en la vista normal —habría que cerrarla en cada
                    tecleo—. Como vista aparte sí, y deja de ser la única
                    parte de la invitación que se editaba a ciegas. */}
                {hayBienvenida && (
                  <button
                    className={styles.device}
                    data-active={vista === "bienvenida"}
                    onClick={() => setVista("bienvenida")}
                    title="Ver la pantalla de bienvenida como la verá quien abra el enlace"
                  >
                    Bienvenida
                  </button>
                )}
                {blocks.some((b) => b.type === "fotos") && (
                  <button
                    className={styles.device}
                    data-active={vista === "fotos"}
                    onClick={() => setVista("fotos")}
                  >
                    Fotos
                  </button>
                )}
                {blocks.some((b) => b.type === "deseos") && (
                  <button
                    className={styles.device}
                    data-active={vista === "deseos"}
                    onClick={() => setVista("deseos")}
                  >
                    Deseos
                  </button>
                )}
              </div>
            )}
            {vista === "invitacion" && (
              <div className={styles.devices} role="group" aria-label="Qué hace al tocar la vista previa">
                {([
                  ["ver", "Ver", "Sólo mirar: nada se mueve ni se edita"],
                  ["texto", "Editar texto", "Escribe los textos sobre la propia invitación"],
                  ["mover", "Mover", "Arrastra los adornos a donde van"],
                ] as const).map(([id, label, title]) => (
                  <button
                    key={id}
                    className={styles.device}
                    data-active={modo === id}
                    title={title}
                    onClick={() => setModo(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <span
              className={styles.rendering}
              data-on={rendering && (vista === "invitacion" || vista === "bienvenida")}
            >
              actualizando…
            </span>
          </div>

          <div className={styles.stageScroll}>
            <div className={styles.frame} style={{ width: deviceWidth }}>
              {vista === "invitacion" || vista === "bienvenida" ? (
                <iframe
                  ref={iframe}
                  className={styles.previewFrame}
                  title="Vista previa de la invitación"
                  srcDoc={srcDoc}
                  onLoad={() => {
                    iframe.current?.contentWindow?.scrollTo(0, scrollY.current);
                    iframe.current?.contentWindow?.postMessage({ inv: "modo", modo }, "*");
                  }}
                />
              ) : (
                /* Página real y no `srcDoc`: son rutas propias con su propia
                   base de datos —fotos y deseos ya subidos—, no una vista
                   sintética del `data` en memoria. Lleva los cambios
                   guardados, no los que aún no se guardan. */
                <iframe
                  key={vista}
                  className={styles.previewFrame}
                  title={`Vista previa de ${vista}`}
                  src={`/${slug}/${vista}`}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {showTemplates && (
        <TemplateSwitcher
          templates={props.templates}
          supports={props.supports}
          current={templateId}
          data={data}
          onPick={switchTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {verPortadas && (
        <Biblioteca
          spec={{
            type: "hero",
            label: "Portada",
            icon: "❖",
            section: "hero",
            repeatable: false,
            variants: HERO_DISPOSICIONES.map((d) => ({ id: d.id, name: d.name, hint: d.hint })),
          }}
          actual={String(data.hero?.disposicion || "")}
          templateId={templateId}
          data={data}
          blockId="hero"
          enDiseno
          aviso={
            String(data.hero?.backgroundUrl || "").trim()
              ? undefined
              : "Todavía no hay foto de portada, así que las diez se ven igual. Sube una y vuelve."
          }
          onElegir={(disposicion) => patchSection("hero", { disposicion })}
          onClose={() => setVerPortadas(false)}
        />
      )}

      {showPublish && (
        <PublishDialog
          id={props.id}
          slug={slug}
          published={published}
          suggestion={coupleName(data)}
          onClose={() => setShowPublish(false)}
          onDone={(nextSlug, nextPublished) => {
            setSlug(nextSlug);
            setPublished(nextPublished);
          }}
        />
      )}
    </div>
  );
}
