/**
 * Auditoría de la lista de regalos por MCP.
 *
 *   npm run audit:regalos-mcp
 *
 * A diferencia de `audit:regalos`, que mide la carrera por un mismo regalo,
 * esto prueba el camino de quien reparte: crear, cargar la lista, asignarle
 * a cada familia la suya y deshacerlo. Y lo prueba **por el protocolo**, con
 * un cliente MCP de verdad hablando con el servidor por un transporte en
 * memoria, no llamando a las funciones por dentro: lo que puede estar mal es
 * justo lo que hay entre medias —el esquema de entrada, lo que se serializa,
 * lo que el modelo lee de vuelta— y eso una llamada directa no lo toca.
 *
 * Lo que se vigila, y por qué:
 *
 * · **Que los nombres basten.** Regalos e invitados se nombran por su nombre
 *   y no por su id, porque los ids no salen en ninguna pantalla y lo que se
 *   tiene a mano es «la cuna es de Jhon y Edith». Si el emparejado por nombre
 *   falla, la herramienta no sirve para lo único que hace.
 * · **Que un nombre que no existe no escriba nada** y vuelva dicho cuál era:
 *   repartiendo veinticinco de una vez, el que falla tiene que ser el único
 *   que falle, y hay que poder verlo sin comparar listas a mano.
 * · **Que el cupo se respete al asignar.** Comprobarlo sólo en el desplegable
 *   del panel dejaba la puerta abierta por aquí.
 * · **Que avise cuando no hay bloque.** Veinticinco regalos cargados en una
 *   invitación donde nadie puede verlos es el error caro.
 *
 * Toca la base de datos: crea una invitación de usar y tirar y la borra al
 * final, pase lo que pase.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { construirServidor } from "../src/lib/mcp-servidor";
import { prisma } from "../src/lib/prisma";

let malos = 0;
const decir = (ok: boolean, nombre: string, detalle = "") => {
  if (!ok) malos++;
  console.log(`${ok ? "✓" : "✗"} ${nombre}${!ok && detalle ? `  ${detalle}` : ""}`);
};

/** Lo que devuelve una herramienta, ya desenvuelto. */
interface Respuesta { texto: string; datos: any; error: boolean }

async function main() {
  const [delCliente, delServidor] = InMemoryTransport.createLinkedPair();
  const servidor = construirServidor({ base: "http://localhost:3000" });
  const cliente = new Client({ name: "audit", version: "1" });
  await Promise.all([servidor.connect(delServidor), cliente.connect(delCliente)]);

  const llamar = async (name: string, args: Record<string, unknown>): Promise<Respuesta> => {
    const r: any = await cliente.callTool({ name, arguments: args });
    const texto = (r.content || []).map((c: any) => c.text || "").join("\n");
    let datos: any = null;
    try { datos = JSON.parse(texto); } catch { /* los errores son texto a secas */ }
    return { texto, datos, error: !!r.isError };
  };

  let id = "";
  try {
    /* ── Una invitación de baby shower, con tres familias ── */

    const creada = await llamar("crear", {
      diseno: "invitacion-bs-nube",
      titulo: "AUDIT regalos (borrar)",
    });
    id = creada.datos?.id || "";
    decir(!!id, "se crea una invitación de baby shower", creada.texto.slice(0, 120));
    if (!id) return;

    await llamar("crear_invitados", {
      id,
      invitados: [
        { nombres: "Jhon, Edith", pases: 2 },
        { nombres: "Marisol" },
        { nombres: "Ana, Luis", pases: 2 },
      ],
    });

    /* ── Sin bloque, avisa ── */

    const sinBloque = await llamar("regalos", { id });
    decir(
      !!sinBloque.datos?.aviso?.includes("bloque"),
      "sin el bloque puesto, avisa de que nadie lo verá",
      JSON.stringify(sinBloque.datos?.aviso)
    );

    const agregado = await llamar("bloques", { id, accion: "agregar", tipo: "regalos" });
    const bloque = agregado.datos?.bloque || "";
    decir(!!bloque, "el bloque «Lista de regalos» se puede agregar", agregado.texto.slice(0, 120));

    /* ── Cargar ── */

    const cargado = await llamar("regalos", {
      id,
      accion: "cargar",
      texto: "Cuna — de madera, blanca\nPañalera\nBody 0-3 meses\n\n  Toldillo  ",
    });
    decir(cargado.datos?.agregados === 4, "carga cuatro regalos, saltándose el renglón vacío", cargado.texto.slice(0, 120));

    const lista = await llamar("regalos", { id });
    const cuna = lista.datos?.regalos?.find((r: any) => r.regalo === "Cuna");
    decir(cuna?.nota === "de madera, blanca", "lo que va tras el guion largo es la nota", JSON.stringify(cuna));
    const body = lista.datos?.regalos?.find((r: any) => r.regalo === "Body 0-3 meses");
    decir(!!body, "el guion corto de «Body 0-3 meses» no parte el nombre", JSON.stringify(lista.datos?.regalos));
    decir(lista.datos?.invitados?.length === 3, "enumera a quién se le puede repartir");

    /* ── Asignar, que es a lo que vino ── */

    const repartido = await llamar("regalos", {
      id,
      accion: "asignar",
      reparto: [
        { regalo: "Cuna", invitado: "Jhon, Edith" },
        /* Tildes y mayúsculas distintas: se resuelve igual. */
        { regalo: "pañalera", invitado: "MARISOL" },
        { regalo: "Mecedora", invitado: "Ana, Luis" },
      ],
    });
    decir(repartido.datos?.asignados === 2, "asigna los dos que existen", repartido.texto.slice(0, 200));
    decir(
      repartido.datos?.sinAsignar?.length === 1 &&
        repartido.datos.sinAsignar[0].includes("Mecedora"),
      "y dice cuál no pudo, por su nombre",
      JSON.stringify(repartido.datos?.sinAsignar)
    );

    const trasReparto = await llamar("regalos", { id });
    const pañalera = trasReparto.datos?.regalos?.find((r: any) => r.regalo === "Pañalera");
    decir(
      pañalera?.de?.[0]?.includes("Marisol") && pañalera.de[0].includes("asignaste"),
      "el reparto queda marcado como asignado, no como elegido",
      JSON.stringify(pañalera)
    );
    decir(trasReparto.datos?.cuentas?.conDueno === 2, "las cuentas cuadran", JSON.stringify(trasReparto.datos?.cuentas));

    /* ── El cupo ── */

    const lleno = await llamar("regalos", {
      id,
      accion: "asignar",
      reparto: [{ regalo: "Cuna", invitado: "Ana, Luis" }],
    });
    decir(
      lleno.datos?.asignados === 0 && !!lleno.datos?.sinAsignar?.[0]?.includes("sitio"),
      "una cuna ya asignada no admite una segunda familia",
      JSON.stringify(lleno.datos)
    );

    /* Repetir el mismo par no es un fallo: el resultado es el que se quería. */
    const otraVez = await llamar("regalos", {
      id,
      accion: "asignar",
      reparto: [{ regalo: "Cuna", invitado: "Jhon, Edith" }],
    });
    decir(otraVez.datos?.asignados === 1, "volver a asignar lo mismo a la misma familia no falla", JSON.stringify(otraVez.datos));

    /* ── Avisa si el bloque no está en «yo asigno» ── */

    decir(
      !!repartido.datos?.aviso?.includes("eligen ellos"),
      "avisa de que el bloque sigue en «eligen ellos»",
      JSON.stringify(repartido.datos?.aviso)
    );

    await llamar("escribir", { id, datos: { [bloque]: { modo: "asignado" } } });
    const yaAsignado = await llamar("regalos", {
      id,
      accion: "asignar",
      reparto: [{ regalo: "Toldillo", invitado: "Ana, Luis" }],
    });
    decir(!yaAsignado.datos?.aviso, "y deja de avisar cuando ya está en «yo asigno»", JSON.stringify(yaAsignado.datos?.aviso));

    /* ── Deshacer ── */

    const liberado = await llamar("regalos", { id, accion: "liberar", regalo: "Cuna" });
    decir(liberado.datos?.liberado === "Cuna", "liberar deja el regalo libre", liberado.texto.slice(0, 120));
    const quitado = await llamar("regalos", { id, accion: "quitar", regalo: "Toldillo" });
    decir(quitado.datos?.quitado === "Toldillo", "quitar se lo lleva de la lista", quitado.texto.slice(0, 120));

    const final = await llamar("regalos", { id });
    decir(final.datos?.regalos?.length === 3, "quedan tres regalos", JSON.stringify(final.datos?.cuentas));
    const cunaFinal = final.datos?.regalos?.find((r: any) => r.regalo === "Cuna");
    decir(cunaFinal?.libres === 1 && !cunaFinal.de.length, "y la cuna vuelve a estar libre", JSON.stringify(cunaFinal));

    /* ── Un nombre ambiguo no se adivina ── */

    await llamar("regalos", { id, accion: "cargar", texto: "Pañalera" });
    const ambiguo = await llamar("regalos", {
      id,
      accion: "asignar",
      reparto: [{ regalo: "Pañalera", invitado: "Ana, Luis" }],
    });
    decir(
      ambiguo.datos?.asignados === 0,
      "con dos regalos llamados igual no elige uno a ciegas",
      JSON.stringify(ambiguo.datos)
    );
  } finally {
    if (id) await prisma.invitation.delete({ where: { id } }).catch(() => {});
    await prisma.$disconnect();
  }

  console.log(malos ? `\n${malos} fallo(s).` : "\nTodo bien.");
  process.exit(malos ? 1 : 0);
}

main();
