"use client";

import type { ReactNode } from "react";
import type { FieldSpec, ListSpec, SectionData, SectionSpec } from "@/lib/schema";
import { ADORNOS } from "@/lib/schema";
import type { TemplateSupport } from "@/lib/support";
import { ICONOS, ICONO_POR_CLAVE, ICONO_POR_EMOJI, iconoHtml } from "@/lib/iconos";
import { FontPicker } from "./FontPicker";
import { ImageField, PhotoGrid } from "./ImageField";
import styles from "./editor.module.css";

interface Props {
  spec: SectionSpec;
  data: SectionData;
  support?: TemplateSupport;
  /** Si el diseño elegido ni siquiera tiene esta sección. */
  inTemplate: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (patch: Partial<SectionData>) => void;
  extraHint?: string;
  /** Control propio de la sección, encima de sus campos (la portada). */
  extra?: ReactNode;
  /**
   * El bloque se dibuja con marcado nuestro, así que todos los campos sirven:
   * no hay que consultar qué trae el diseño.
   */
  ignoreSupport?: boolean;
  /** Dentro de la lista de bloques el encabezado lo pone la lista. */
  compact?: boolean;
}

export function SectionEditor({
  spec, data, support, inTemplate, open, onToggleOpen, onChange, extraHint, extra,
  ignoreSupport, compact,
}: Props) {
  const enabled = data.enabled !== false;
  const supports = (path: string) =>
    ignoreSupport || !support || support.fields.includes(path);

  const fonts = (data.fonts || {}) as Record<string, string>;
  const fontFor = (key: string) =>
    supports(`${spec.key}.${key}@font`)
      ? {
          id: fonts[key] || "",
          set: (id: string) => onChange({ fonts: { ...fonts, [key]: id } }),
        }
      : undefined;

  /** Un campo condicionado a otro (ver `showIf`) sólo aparece si toca. */
  const toca = (f: FieldSpec) => {
    if (!f.showIf) return true;
    const actual = String(data[f.showIf.key] ?? "");
    const valores = Array.isArray(f.showIf.value) ? f.showIf.value : [f.showIf.value];
    /* Vacío = el valor por defecto del select, que es su primera opción. */
    const efectivo =
      actual ||
      String(spec.fields.find((o) => o.key === f.showIf!.key)?.options?.[0]?.value ?? "");
    return valores.includes(efectivo);
  };

  const visible = spec.fields.filter(
    (f) => supports(`${spec.key}.${f.key}`) && toca(f)
  );
  const hidden = spec.fields.filter((f) => !supports(`${spec.key}.${f.key}`));
  const listVisible = spec.list && supports(`${spec.key}.items`);

  return (
    <section className={styles.section} data-off={!inTemplate || !enabled} data-compact={compact}>
      <header className={styles.sectionHead}>
        <button className={styles.sectionToggle} onClick={onToggleOpen} disabled={!inTemplate}>
          {!compact && <span className={styles.sectionIcon} aria-hidden>{spec.icon}</span>}
          <span className={styles.sectionLabel}>
            {compact ? (open ? "Ocultar campos" : "Editar contenido") : spec.label}
          </span>
          {inTemplate && <span className={styles.chevron} data-open={open}>›</span>}
        </button>

        {spec.optional && (
          <button
            className="switch"
            role="switch"
            aria-checked={enabled}
            aria-label={`Mostrar ${spec.label}`}
            onClick={() => onChange({ enabled: !enabled })}
          />
        )}
      </header>

      {open && inTemplate && (
        <div className={styles.sectionBody}>
          {spec.hint && <p className={styles.sectionHint}>{spec.hint}</p>}
          {extraHint && <p className={styles.sectionHint}>{extraHint}</p>}
          {extra}

          <div className={styles.fields} data-disabled={!enabled}>
            {visible.map((field) => (
              <Field
                key={field.key}
                field={field}
                value={data[field.key]}
                font={fontFor(field.key)}
                onChange={(v) => onChange({ [field.key]: v })}
              />
            ))}
          </div>

          {listVisible && spec.list && (
            <ListEditor
              list={spec.list}
              fields={spec.list.fields.filter((f) =>
                supports(`${spec.key}.items.${f.key}`)
              )}
              items={(data.items as Record<string, string>[]) || []}
              onChange={(items) => onChange({ items })}
              fontFor={(key) =>
                supports(`${spec.key}.items.${key}@font`)
                  ? {
                      id: fonts[`items.${key}`] || "",
                      set: (id) => onChange({ fonts: { ...fonts, [`items.${key}`]: id } }),
                      shared: true,
                    }
                  : undefined
              }
            />
          )}

          {/* Los adornos: imágenes que el organizador coloca donde quiera.
              Van en su propia lista, aparte de la del esquema, porque una
              sección puede tener las dos —el programa tiene sus momentos y
              además puede llevar una guirnalda en una esquina. */}
          {spec.adornos && (
            <ListEditor
              list={ADORNOS}
              fields={ADORNOS.fields}
              items={(data.adornos as Record<string, string>[]) || []}
              onChange={(adornos) => onChange({ adornos })}
              mediaKind="adorno"
            />
          )}

          {hidden.length > 0 && (
            <p className={styles.notShown}>
              Este diseño no muestra: {hidden.map((f) => f.label.toLowerCase()).join(", ")}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Un campo ─────────────────────────────────────────────── */

/**
 * Elegir el dibujo de un ícono.
 *
 * Antes era un campo de texto donde se pegaba un emoji. El emoji lo pinta el
 * sistema y cambia de un teléfono a otro; los dibujos heredan el color del
 * diseño. Lo guardado sigue siendo compatible: un emoji viejo se reconoce y
 * aparece marcado el dibujo que le corresponde.
 */
function IconoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const actual = ICONO_POR_CLAVE[value] || ICONO_POR_EMOJI[value];

  return (
    <div className={styles.iconos}>
      {ICONOS.map((i) => (
        <button
          key={i.clave}
          type="button"
          className={styles.icono}
          data-activo={actual?.clave === i.clave}
          title={i.nombre}
          aria-label={i.nombre}
          onClick={() => onChange(actual?.clave === i.clave ? "" : i.clave)}
          dangerouslySetInnerHTML={{ __html: iconoHtml(i.clave) }}
        />
      ))}
    </div>
  );
}

function Field({
  field, value, onChange, font, mediaKind,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: string) => void;
  /** Presente sólo si el diseño permite cambiarle la letra a este campo. */
  font?: { id: string; set: (id: string) => void; shared?: boolean };
  /** Con qué clase se cataloga lo que se suba desde este campo. */
  mediaKind?: "foto" | "adorno";
}) {
  const v = value === undefined || value === null ? "" : String(value);
  const common = {
    value: v,
    placeholder: field.placeholder,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };

  const control = (
    <>
      {field.type === "emoji" ? (
        <IconoField value={v} onChange={onChange} />
      ) : field.type === "color" ? (
        <ColorField value={v} onChange={onChange} />
      ) : field.type === "range" ? (
        <RangeField field={field} value={v} onChange={onChange} />
      ) : field.type === "textarea" ? (
        <textarea className="textarea" rows={3} {...common} />
      ) : field.type === "select" ? (
        <select
          className="select"
          {...common}
          // Un valor guardado que ya no existe dejaría el select en blanco.
          value={field.options?.some((o) => o.value === v) ? v : field.options?.[0]?.value ?? ""}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : field.type === "image" ? (
        <ImageField value={v} onChange={onChange} kind={mediaKind} />
      ) : field.type === "video" ? (
        <ImageField value={v} onChange={onChange} kind="video" />
      ) : (
        <input
          className="input"
          type={
            field.type === "datetime" ? "datetime-local"
            : field.type === "url" ? "url"
            : field.type === "tel" ? "tel"
            : "text"
          }
          {...common}
        />
      )}

    </>
  );

  return (
    <div className={styles.field} data-span={field.span ?? 1}>
      <label className="field-label">{field.label}</label>

      {font ? (
        <div className={styles.withFont} data-tall={field.type === "textarea"}>
          <FontPicker value={font.id} onChange={font.set} shared={font.shared} />
          <div className={styles.withFontBody}>{control}</div>
        </div>
      ) : (
        control
      )}

      {field.help && <p className="field-help">{field.help}</p>}
    </div>
  );
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Selector de color: el cuadrito abre el selector del sistema y el campo de
 * al lado deja pegar un hex. Vacío significa "el color que trae el diseño".
 */
function ColorField({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const auto = value === "";
  const malo = !auto && !HEX.test(value);

  return (
    <div className={styles.colorField}>
      <label
        className={styles.swatch}
        data-auto={auto}
        style={auto || malo ? undefined : { background: value }}
        title="Elegir color"
      >
        <input
          type="color"
          value={HEX.test(value) ? value : "#333333"}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <input
        className={`input mono ${styles.hex}`}
        data-bad={malo}
        value={value}
        spellCheck={false}
        placeholder="según el diseño"
        onChange={(e) => onChange(e.target.value.trim())}
      />
      {!auto && (
        <button className={styles.linkBtn} onClick={() => onChange("")}>
          reiniciar
        </button>
      )}
    </div>
  );
}

/**
 * Control deslizante. Vacío significa "lo que trae el diseño", así que el
 * control arranca en su posición sugerida pero lo dice en texto en vez de
 * fingir un valor que no está guardado.
 */
function RangeField({
  field, value, onChange,
}: {
  field: FieldSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  const auto = value === "";
  const shown = auto ? field.fallback ?? 50 : Number(value);

  return (
    <div className={styles.range}>
      <div className={styles.rangeTop}>
        <span className={styles.rangeValue} data-auto={auto}>
          {auto ? "según el diseño" : `${shown}${field.unit ?? ""}`}
        </span>
        {!auto && (
          <button className={styles.linkBtn} onClick={() => onChange("")}>
            reiniciar
          </button>
        )}
      </div>
      <input
        type="range"
        className={styles.slider}
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        value={shown}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ── Lista repetible (invitados, momentos, fotos…) ────────── */

/**
 * Editor de una lista repetible.
 *
 * Recibe la lista y no la sección: así sirve tanto para la lista propia del
 * esquema (momentos del programa, fotos, opciones de regalo) como para los
 * adornos, que son otra lista sobre la misma sección.
 */
function ListEditor({
  list, items, onChange, fields, fontFor, mediaKind,
}: {
  list: ListSpec;
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  /** Los campos que este diseño soporta, ya filtrados. */
  fields: FieldSpec[];
  /**
   * El control de tipografía de un campo, o nada si no lleva. La letra se
   * comparte entre todas las fichas: el selector es el mismo para todas y una
   * tipografía por invitado no tendría sentido.
   */
  fontFor?: (fieldKey: string) => { id: string; set: (id: string) => void; shared: boolean } | undefined;
  /** Con qué clase se catalogan las imágenes de esta lista. */
  mediaKind?: "foto" | "adorno";
}) {

  // Una lista de un solo campo de imagen (la galería) se edita mucho mejor
  // como cuadrícula de miniaturas que como fichas apiladas.
  if (fields.length === 1 && fields[0].type === "image") {
    const key = fields[0].key;
    return (
      <div className={styles.list}>
        <div className={styles.listHead}>
          <span className={styles.listTitle}>{list.label}</span>
        </div>
        <PhotoGrid
          urls={items.map((it) => it[key] || "")}
          max={list.max}
          onChange={(urls) => onChange(urls.map((url) => ({ [key]: url })))}
        />
      </div>
    );
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <div className={styles.list}>
      <div className={styles.listHead}>
        <span className={styles.listTitle}>{list.label}</span>
        <span className={styles.listCount}>
          {items.length}/{list.max}
        </span>
      </div>

      {items.length === 0 && (
        <p className={styles.listEmpty}>
          Sin {list.label.toLowerCase()}. El diseño oculta esta parte.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className={styles.item}>
          <div className={styles.itemBar}>
            <span className={styles.itemIndex}>
              {list.itemLabel} {i + 1}
            </span>
            <span className={styles.itemActions}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                title="Subir"
              >↑</button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                title="Bajar"
              >↓</button>
              <button
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                disabled={items.length <= list.min}
                title="Quitar"
              >✕</button>
            </span>
          </div>

          <div className={styles.fields}>
            {fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                value={item[field.key]}
                font={fontFor?.(field.key)}
                mediaKind={mediaKind}
                onChange={(v) =>
                  onChange(items.map((it, j) => (j === i ? { ...it, [field.key]: v } : it)))
                }
              />
            ))}
          </div>
        </div>
      ))}

      <button
        className="btn btn-sm"
        disabled={items.length >= list.max}
        onClick={() => onChange([...items, { ...list.defaultItem }])}
      >
        + Agregar {list.itemLabel}
      </button>
    </div>
  );
}
