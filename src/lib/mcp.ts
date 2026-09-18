/**
 * Lo que un asistente necesita saber para armar una invitación.
 *
 * Aquí no hay servidor ni base de datos: sólo el catálogo de diseños, la
 * proyección del esquema y la fusión de un parche con los datos de una
 * invitación. El transporte vive en `scripts/mcp.ts` y la auditoría en
 * `scripts/audit-mcp.ts`, que prueba todo esto sin levantar nada.
 *
 * La separación no es ceremonia. Un servidor MCP es un proceso que habla por
 * la entrada estándar: probarlo entero obliga a arrancarlo, hablarle en JSON
 * y leerle la respuesta, y eso convierte cualquier prueba en una prueba de
 * integración lenta que nadie corre. Lo que de verdad puede estar mal —qué
 * campos admite un diseño, qué hace un parche con un campo que no existe— es
 * esto, y esto es una función.
 *
 * ── La decisión de diseño que manda sobre las demás ──────────────
 *
 * **Un parche con un campo desconocido se rechaza y se explica; no se
 * ignora.** Es lo contrario de lo que suele hacer una API, y es deliberado:
 * al otro lado hay un modelo que no puede ver el resultado. Si escribir en
 * `hero.titulo` —que no existe, el campo es `hero.title`— se traga en
 * silencio, el modelo cree que quedó puesto, sigue adelante y la invitación
 * sale con media portada vacía sin que nadie sepa por qué. Devolver el error
 * con los nombres que sí existen lo deja corregirse solo en el siguiente
 * turno. Un silencio es una mentira que se descubre tarde.
 */

import { SECTIONS, SECTION_BY_KEY, type FieldSpec, type SectionSpec } from "./schema";
import { TEMPLATES, TEMPLATE_BY_ID } from "./templates";
import { templateSupport } from "./support";
import { KIND_LABEL } from "./templates";

/* ── El catálogo ─────────────────────────────────────────────── */

export interface DisenoResumen {
  id: string;
  nombre: string;
  ocasion: string;
  /** Una línea sobre el estilo, que es lo que de verdad ayuda a elegir. */
  estilo: string;
  colores: string[];
  /** Cuántas paletas admite: la misma invitación en otro color. */
  paletas: number;
}

/**
 * Los diseños, agrupados por ocasión.
 *
 * Se devuelve el `mood` y no sólo el nombre porque «Vintage» y «Bruma» no
 * dicen nada por sí solos, y elegir diseño es lo único de este flujo que no
 * se puede deducir de los datos: la fecha y los nombres vienen dados, pero
 * si la boda es de campo o de salón lo sabe la persona, no el modelo.
 */
export function catalogo(): Record<string, DisenoResumen[]> {
  const out: Record<string, DisenoResumen[]> = {};
  for (const t of TEMPLATES) {
    const grupo = KIND_LABEL[t.kind] || t.kind;
    (out[grupo] ||= []).push({
      id: t.id,
      nombre: t.name,
      ocasion: grupo,
      estilo: t.mood,
      colores: t.palette,
      paletas: t.palettes.length,
    });
  }
  return out;
}

/* ── El esquema, tal y como lo admite un diseño ──────────────── */

export interface CampoResumen {
  campo: string;
  etiqueta: string;
  tipo: string;
  /** Sólo en los `select`: lo único que se acepta ahí. */
  opciones?: { valor: string; etiqueta: string }[];
  ayuda?: string;
  ejemplo?: string;
}

export interface SeccionResumen {
  seccion: string;
  etiqueta: string;
  /** Si es false no se puede apagar: la portada y el pie siempre están. */
  opcional: boolean;
  nota?: string;
  campos: CampoResumen[];
  lista?: {
    clave: string;
    etiqueta: string;
    minimo: number;
    maximo: number;
    campos: CampoResumen[];
  };
}

/**
 * Los campos de texto y de elección, que son los que un asistente puede
 * rellenar de verdad.
 *
 * Fuera quedan los de archivo —foto, vídeo, música— y no por pereza: **no
 * los puede aportar**. Ofrecerlos sería invitarle a inventarse una ruta que
 * no existe, y una invitación con una foto rota es peor que una sin foto,
 * porque parece terminada. Las fotos las sube una persona desde el editor.
 */
const NO_RELLENABLES = new Set(["image", "video", "audio", "medio", "gallery"]);

/**
 * Las paletas de un diseño, que el esquema no puede saber.
 *
 * `event.paleta` es un desplegable con la lista de opciones **vacía**: cuáles
 * hay depende del diseño, y el esquema es uno solo para los 50. El editor las
 * rellena en cada render a partir del diseño elegido; aquí hace falta lo
 * mismo, y por una razón peor que la del editor: con la lista vacía, la
 * comprobación de opciones de `fusionar` rechazaría **cualquier** paleta,
 * incluida una buena. El campo habría quedado no ya invisible, sino
 * imposible de escribir.
 */
function conOpciones(f: FieldSpec, templateId: string): FieldSpec {
  if (f.key !== "paleta" || f.type !== "select") return f;
  const paletas = TEMPLATE_BY_ID[templateId]?.palettes || [];
  if (!paletas.length) return f;
  return {
    ...f,
    options: [
      { value: "", label: `La de por defecto (${paletas[0].nombre})` },
      ...paletas.map((p) => ({ value: p.id, label: p.nombre })),
    ],
  };
}

function resumirCampo(f: FieldSpec, templateId: string): CampoResumen {
  const campo = conOpciones(f, templateId);
  const c: CampoResumen = { campo: campo.key, etiqueta: campo.label, tipo: campo.type };
  if (campo.type === "select" && campo.options) {
    c.opciones = campo.options.map((o) => ({ valor: o.value, etiqueta: o.label }));
  }
  if (campo.help) c.ayuda = campo.help;
  if (campo.placeholder) c.ejemplo = campo.placeholder;
  return c;
}

/**
 * Qué se puede escribir en un diseño concreto.
 *
 * Por diseño y no en general porque no todos traen el mismo marcado: un campo
 * que un diseño no dibuja no aparece aquí, y así el modelo no gasta un turno
 * escribiendo algo que nunca se vería. Es la misma fuente que decide qué
 * controles enseña el editor, así que no hay dos verdades que mantener.
 */
export function esquemaDe(templateId: string): SeccionResumen[] {
  if (!TEMPLATE_BY_ID[templateId]) throw new Error(`Diseño desconocido: ${templateId}`);
  const admite = new Set(templateSupport(templateId).fields);

  const out: SeccionResumen[] = [];
  for (const spec of SECTIONS) {
    const campos = spec.fields
      .filter((f) => admite.has(`${spec.key}.${f.key}`) && !NO_RELLENABLES.has(f.type))
      .map((f) => resumirCampo(f, templateId));

    const listaCampos = spec.list
      ? spec.list.fields
          .filter((f) => !NO_RELLENABLES.has(f.type))
          .map((f) => resumirCampo(f, templateId))
      : [];

    if (!campos.length && !listaCampos.length) continue;

    const s: SeccionResumen = {
      seccion: spec.key,
      etiqueta: spec.label,
      opcional: spec.optional,
      campos,
    };
    if (spec.hint) s.nota = spec.hint;
    if (spec.list && admite.has(`${spec.key}.items`)) {
      s.lista = {
        clave: "items",
        etiqueta: spec.list.label,
        minimo: spec.list.min,
        maximo: spec.list.max,
        campos: listaCampos,
      };
    }
    out.push(s);
  }
  return out;
}

/* ── Fusionar un parche ──────────────────────────────────────── */

export interface Resultado {
  /** Los datos ya fusionados. Sólo se usan si no hay errores. */
  datos: Record<string, unknown>;
  /** Qué se escribió, para poder decirlo sin adivinar. */
  escritos: string[];
  /** Lo que no se pudo escribir, con el motivo y la alternativa. */
  errores: string[];
}

/** Distancia de edición, para poder sugerir el campo que se quiso escribir. */
function parecido(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return d[m][n];
}

/**
 * El nombre más cercano, si hay uno lo bastante cerca.
 *
 * El umbral va con la longitud: en una palabra de cuatro letras dos cambios
 * ya es otra palabra, y en una de veinte no. Sin umbral, sugerir «el campo
 * más parecido» acaba proponiendo cualquier cosa y confunde más que callar.
 */
function sugerencia(malo: string, candidatos: string[]): string {
  let mejor = "";
  let dist = Infinity;
  for (const c of candidatos) {
    const d = parecido(malo.toLowerCase(), c.toLowerCase());
    if (d < dist) { dist = d; mejor = c; }
  }
  return dist <= Math.max(2, Math.floor(malo.length / 3)) ? mejor : "";
}

function conSugerencia(malo: string, candidatos: string[]): string {
  const s = sugerencia(malo, candidatos);
  return s ? ` ¿Querías "${s}"?` : ` Los que hay: ${candidatos.join(", ")}.`;
}

/**
 * Comprueba un valor contra su campo y devuelve el motivo si no encaja.
 *
 * Los `select` son los que importan: su valor va a una clase CSS o a una
 * rama del renderer, y uno inventado no rompe nada visiblemente — se cae al
 * caso por defecto y la invitación sale con la animación que no se pidió,
 * sin un solo error. Es el fallo silencioso que más cuesta encontrar.
 */
function revisarValor(f0: FieldSpec, valor: unknown, templateId: string): string {
  const f = conOpciones(f0, templateId);
  if (valor === null || valor === undefined) return "";
  const v = String(valor);

  if (f.type === "select") {
    const validas = (f.options || []).map((o) => o.value);
    if (!validas.includes(v)) {
      return `"${v}" no es una opción de "${f.label}". Las que hay: ${validas
        .map((x) => (x === "" ? '"" (la de por defecto)' : `"${x}"`))
        .join(", ")}.`;
    }
  }

  if (f.type === "color" && v.trim() && !/^#[0-9a-fA-F]{6}$/.test(v.trim())) {
    return `"${v}" no es un color. Se escriben en hexadecimal de seis cifras, como "#8a7248". Vacío = el del diseño.`;
  }

  if (f.type === "range") {
    const n = Number(v);
    if (v.trim() && (!Number.isFinite(n) || (f.min !== undefined && n < f.min) ||
        (f.max !== undefined && n > f.max))) {
      return `"${v}" está fuera de "${f.label}" (${f.min}–${f.max}).`;
    }
  }

  if (f.type === "datetime" && v.trim() && Number.isNaN(Date.parse(v))) {
    return `"${v}" no es una fecha. Se escriben como "2026-11-15T17:00".`;
  }

  return "";
}

/**
 * Mete un parche en los datos de una invitación.
 *
 * No muta: devuelve una copia. Y no escribe nada si algo falla, porque lo
 * contrario —escribir lo que se pudo y avisar del resto— deja la invitación
 * a medias y al modelo sin saber en qué estado quedó.
 */
export function fusionar(
  templateId: string,
  datos: Record<string, unknown>,
  parche: Record<string, Record<string, unknown>>
): Resultado {
  const errores: string[] = [];
  const escritos: string[] = [];
  const copia: Record<string, unknown> = JSON.parse(JSON.stringify(datos));

  if (!TEMPLATE_BY_ID[templateId]) {
    return { datos, escritos, errores: [`Diseño desconocido: ${templateId}`] };
  }
  const admite = new Set(templateSupport(templateId).fields);
  const secciones = SECTIONS.map((s) => s.key);

  for (const [clave, campos] of Object.entries(parche || {})) {
    const spec: SectionSpec | undefined = SECTION_BY_KEY[clave];
    if (!spec) {
      errores.push(`No existe la sección "${clave}".${conSugerencia(clave, secciones)}`);
      continue;
    }
    if (!campos || typeof campos !== "object" || Array.isArray(campos)) {
      errores.push(`"${clave}" tiene que ser un objeto de campo → valor.`);
      continue;
    }

    const destino = { ...((copia[clave] as Record<string, unknown>) || {}) };
    const nombres = spec.fields
      .filter((f) => admite.has(`${clave}.${f.key}`))
      .map((f) => f.key);

    for (const [campo, valor] of Object.entries(campos)) {
      /* La lista de una sección: el programa, las tarjetas de información. */
      if (campo === "items") {
        const malo = revisarLista(spec, clave, admite, valor, escritos, templateId);
        if (malo) errores.push(malo);
        else destino.items = valor;
        continue;
      }
      /* `enabled` no está en los campos del esquema —es del editor— pero es
         lo único que enciende y apaga una sección, así que tiene que poder
         escribirse o las secciones opcionales quedan fuera de alcance. */
      if (campo === "enabled") {
        if (typeof valor !== "boolean") {
          errores.push(`"${clave}.enabled" es sí o no (true / false).`);
        } else if (!spec.optional && valor === false) {
          errores.push(`"${spec.label}" no se puede apagar: sin ella la invitación no se sostiene.`);
        } else {
          destino.enabled = valor;
          escritos.push(`${clave}.enabled`);
        }
        continue;
      }

      const f = spec.fields.find((x) => x.key === campo);
      if (!f) {
        errores.push(
          `No existe el campo "${campo}" en "${spec.label}".${conSugerencia(campo, nombres)}`
        );
        continue;
      }
      if (!admite.has(`${clave}.${campo}`)) {
        errores.push(
          `Este diseño no dibuja "${f.label}" (${clave}.${campo}), así que escribirlo no se vería.`
        );
        continue;
      }
      if (NO_RELLENABLES.has(f.type)) {
        errores.push(
          `"${f.label}" es un archivo (${f.type}) y lo sube una persona desde el editor. ` +
            `Una ruta inventada deja la invitación rota y con aspecto de terminada.`
        );
        continue;
      }
      const mal = revisarValor(f, valor, templateId);
      if (mal) { errores.push(mal); continue; }

      destino[campo] = valor;
      escritos.push(`${clave}.${campo}`);
    }

    copia[clave] = destino;
  }

  return errores.length
    ? { datos, escritos: [], errores }
    : { datos: copia, escritos, errores };
}

function revisarLista(
  spec: SectionSpec,
  clave: string,
  admite: Set<string>,
  valor: unknown,
  escritos: string[],
  templateId: string
): string {
  if (!spec.list) return `"${spec.label}" no tiene lista.`;
  if (!admite.has(`${clave}.items`)) return `Este diseño no dibuja la lista de "${spec.label}".`;
  if (!Array.isArray(valor)) return `"${clave}.items" tiene que ser una lista.`;
  if (valor.length > spec.list.max) {
    return `"${spec.list.label}" admite ${spec.list.max} como mucho, y llegaron ${valor.length}.`;
  }

  const nombres = spec.list.fields.map((f) => f.key);
  for (const [i, item] of valor.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return `El elemento ${i + 1} de "${spec.list.label}" tiene que ser un objeto.`;
    }
    for (const [campo, v] of Object.entries(item as Record<string, unknown>)) {
      const f = spec.list.fields.find((x) => x.key === campo);
      if (!f) {
        return `El elemento ${i + 1} de "${spec.list.label}" no tiene campo "${campo}".${conSugerencia(campo, nombres)}`;
      }
      if (NO_RELLENABLES.has(f.type)) {
        return `"${f.label}" es un archivo y lo sube una persona desde el editor.`;
      }
      const mal = revisarValor(f, v, templateId);
      if (mal) return `Elemento ${i + 1}: ${mal}`;
    }
  }
  escritos.push(`${clave}.items (${valor.length})`);
  return "";
}
