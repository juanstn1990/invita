"use client";

import { useRef, useState } from "react";
import {
  ADDABLE, BLOCK_BY_TYPE, blockDefaults, newBlockId,
  type Block, type BlockSpec,
} from "@/lib/blocks";
import { SECTION_BY_KEY, type InvitationData, type SectionData, type SectionSpec } from "@/lib/schema";
import type { TemplateSupport } from "@/lib/support";
import { Biblioteca } from "./Biblioteca";
import { SectionEditor } from "./SectionEditor";
import styles from "./editor.module.css";

interface Props {
  blocks: Block[];
  /** Datos de las secciones del esquema, para los bloques que las usan. */
  sections: Record<string, SectionData>;
  /** Diseño en uso: la biblioteca dibuja cada opción con su paleta. */
  templateId: string;
  support?: TemplateSupport;
  open: string | null;
  onOpen: (id: string | null) => void;
  onBlocks: (blocks: Block[]) => void;
  /** Cambiar los datos de una sección del esquema. */
  onSection: (key: string, patch: Partial<SectionData>) => void;
}

/**
 * La lista de bloques: el orden de la invitación.
 *
 * Cada bloque puede usar el marcado del propio diseño o una variante nuestra.
 * El primero de cada tipo edita la sección del esquema; los que se agregan
 * después llevan sus datos encima.
 */
export function BlockList({
  blocks, sections, templateId, support, open, onOpen, onBlocks, onSection,
}: Props) {
  const [agregando, setAgregando] = useState(false);
  /** Bloque cuya biblioteca está abierta. */
  const [biblioteca, setBiblioteca] = useState<Block | null>(null);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  const filas = useRef<(HTMLDivElement | null)[]>([]);

  /** Saca el bloque de `desde` y lo mete en `hasta`. */
  const reubicar = (desde: number, hasta: number) => {
    if (desde === hasta || desde < 0 || hasta < 0) return;
    const next = [...blocks];
    const [fila] = next.splice(desde, 1);
    next.splice(hasta, 0, fila);
    onBlocks(next);
  };

  const soltar = () => {
    setArrastrando(null);
    setSobre(null);
  };

  /** Con el teclado se mueve igual: arrastrar solo no es accesible. */
  const teclas = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" && i > 0) { e.preventDefault(); reubicar(i, i - 1); }
    if (e.key === "ArrowDown" && i < blocks.length - 1) { e.preventDefault(); reubicar(i, i + 1); }
  };

  const vistos = new Set<string>();

  return (
    <div>
      {blocks.map((block, i) => {
        const spec = BLOCK_BY_TYPE[block.type];
        if (!spec) return null;

        const primero = !vistos.has(block.type);
        vistos.add(block.type);
        const usaSeccion = primero && !!spec.section;

        const data = (usaSeccion ? sections[spec.section!] : block.data) || {};
        const cambiar = (patch: Partial<SectionData>) =>
          usaSeccion
            ? onSection(spec.section!, patch)
            : onBlocks(blocks.map((b) => (b.id === block.id ? { ...b, data: { ...b.data, ...patch } } : b)));

        // Los bloques sintetizados no dependen de que el diseño traiga la
        // sección: el marcado lo ponemos nosotros.
        const enDiseno =
          !spec.section || !support || support.sections.includes(spec.section);
        const sintetizado = !usaSeccion || !!block.variant;

        return (
          <div
            key={block.id}
            className={styles.block}
            ref={(el) => { filas.current[i] = el; }}
            data-dragging={arrastrando === i}
            data-over={sobre === i && arrastrando !== null && arrastrando !== i}
            data-dir={arrastrando !== null && sobre === i ? (i > arrastrando ? "abajo" : "arriba") : undefined}
            onDragOver={(e) => {
              if (arrastrando === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (sobre !== i) setSobre(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (arrastrando !== null) reubicar(arrastrando, i);
              soltar();
            }}
          >
            <div className={styles.blockBar}>
              <span
                className={styles.blockGrip}
                draggable
                role="button"
                tabIndex={0}
                aria-label={`Mover ${spec.label}. Arrastra, o usa las flechas del teclado.`}
                title="Arrastra para reordenar"
                onKeyDown={teclas(i)}
                onDragStart={(e) => {
                  setArrastrando(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(i));
                  const fila = filas.current[i];
                  if (fila) e.dataTransfer.setDragImage(fila, 24, 18);
                }}
                onDragEnd={soltar}
              >
                <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
                  <circle cx="2" cy="3" r="1.4" /><circle cx="8" cy="3" r="1.4" />
                  <circle cx="2" cy="8" r="1.4" /><circle cx="8" cy="8" r="1.4" />
                  <circle cx="2" cy="13" r="1.4" /><circle cx="8" cy="13" r="1.4" />
                </svg>
              </span>
              <span className={styles.blockName}>
                {spec.label}
                {!primero && <span className={styles.blockDup}>extra</span>}
              </span>
              {spec.variants.length > 1 && (
                <button
                  className={`${styles.blockVariant} ${styles.blockBiblioteca}`}
                  onClick={() => setBiblioteca(block)}
                  title={`Ver las ${spec.variants.length} formas de ${spec.label.toLowerCase()}`}
                >
                  {spec.variants.find((v) => v.id === block.variant)?.name || "La del diseño"}
                  <span aria-hidden> ▾</span>
                </button>
              )}
              {!primero && (
                <button
                  className={`btn btn-ghost btn-sm ${styles.blockDel}`}
                  title="Quitar bloque"
                  onClick={() => onBlocks(blocks.filter((b) => b.id !== block.id))}
                >✕</button>
              )}
            </div>

            <SectionEditor
              spec={specFor(spec, primero)}
              data={data}
              support={support}
              inTemplate
              open={open === block.id}
              onToggleOpen={() => onOpen(open === block.id ? null : block.id)}
              onChange={cambiar}
              /* Con marcado nuestro no dependemos de lo que traiga el diseño. */
              ignoreSupport={sintetizado}
              compact
            />
          </div>
        );
      })}

      {agregando ? (
        <div className={styles.addPanel}>
          <p className={styles.addTitle}>¿Qué bloque agregas?</p>
          {ADDABLE.map((spec) => (
            <button
              key={spec.type}
              className={styles.addItem}
              onClick={() => {
                const variante = spec.variants.find((v) => v.id !== "")?.id || "";
                const nuevo: Block = {
                  id: newBlockId(spec.type),
                  type: spec.type,
                  variant: variante,
                  data: blockDefaults(spec),
                };
                onBlocks([...blocks, nuevo]);
                onOpen(nuevo.id);
                setAgregando(false);
              }}
            >
              <span className={styles.addIcon}>{spec.icon}</span>
              <span>
                <b>{spec.label}</b>
                <span className={styles.addHint}>
                  {spec.type === "paragraph"
                    ? "Un texto libre en cualquier parte"
                    : spec.type === "photo"
                    ? "Una sola foto, a sangre o con marco"
                    : "Otra galería, con su propio diseño"}
                </span>
              </span>
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setAgregando(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button className={styles.addBtn} onClick={() => setAgregando(true)}>
          + Agregar bloque
        </button>
      )}

      {biblioteca && (() => {
        const spec = BLOCK_BY_TYPE[biblioteca.type];
        if (!spec) return null;
        const primero = blocks.find((b) => b.type === biblioteca.type)?.id === biblioteca.id;
        return (
          <Biblioteca
            spec={spec}
            actual={biblioteca.variant}
            templateId={templateId}
            data={{ ...(sections as InvitationData), layout: { blocks } }}
            blockId={biblioteca.id}
            enDiseno={
              primero &&
              (!spec.section || !support || support.sections.includes(spec.section))
            }
            onElegir={(variant) =>
              onBlocks(blocks.map((b) => (b.id === biblioteca.id ? { ...b, variant } : b)))
            }
            onClose={() => setBiblioteca(null)}
          />
        );
      })()}
    </div>
  );
}

/**
 * El formulario de un bloque. Si usa una sección del esquema, son sus campos;
 * si es un bloque agregado, los que declara el propio bloque.
 */
function specFor(spec: BlockSpec, primero: boolean): SectionSpec {
  const base = spec.section ? SECTION_BY_KEY[spec.section] : undefined;
  if (base && primero) return base;
  return {
    key: spec.section || spec.type,
    label: spec.label,
    icon: spec.icon,
    optional: true,
    fields: spec.fields || base?.fields || [],
    list: spec.list || base?.list,
  };
}
