/**
 * Contenido de ejemplo por tipo de evento.
 *
 * Se usa en tres lados: al crear una invitación, en la vista previa del
 * selector de diseños y en las capturas. Antes estaba duplicado en dos rutas.
 */

import { defaultData, type InvitationData } from "./schema";
import type { TemplateInfo } from "./templates";

/**
 * Lo que el preset necesita saber del diseño: su ocasión y, en los
 * infantiles, la paleta — que es donde quedó la elección de niña o niño.
 */
type Target = Pick<TemplateInfo, "kind"> & { paleta?: string };

export function presetFor(target: Target | TemplateInfo["kind"]): InvitationData {
  const { kind, paleta } =
    typeof target === "string" ? { kind: target, paleta: undefined } : target;
  /* Las paletas frías son las que antes eran la versión de niño. */
  const nino = ["azul", "cielo", "pizarra", "petroleo", "indigo"].includes(paleta || "");
  const d = defaultData();

  if (kind === "quince") {
    Object.assign(d.event, {
      type: "quince", name1: "Florencia", name2: "",
      quote: "Hoy dejo de ser niña para empezar a escribir mi propia historia.",
    });
    Object.assign(d.splash, { label: "Con mucha alegría te invito a", subtitle: "Mis 15 años" });
    Object.assign(d.hero, { label: "Te invito a celebrar", subtitle: "Mis 15 años" });
    Object.assign(d.guests, {
      title: "Personas especiales",
      text: "Quiero compartir esta noche con las personas que han estado conmigo desde el principio.",
      textSecondary: "Gracias por acompañarme.",
    });
    d.events.items = [
      { icon: "⛪", kind: "Ceremonia religiosa", title: "Misa de acción de gracias", time: "6:00 p. m.", place: "Parroquia Sagrada Familia", address: "Av. Libertad 450", note: "", mapUrl: "" },
      { icon: "🌹", kind: "Fiesta", title: "Gran celebración", time: "8:00 p. m.", place: "Salón Versalles", address: "Calle Rosas 1200", note: "Vals a las 9:00", mapUrl: "" },
    ];
    d.features.items = [
      { icon: "🎶", title: "Música en vivo", text: "Orquesta y DJ para bailar toda la noche." },
      { icon: "🍽️", title: "Cena", text: "Menú de tres tiempos servido a la mesa." },
      { icon: "corbatin", title: "Dresscode", text: "Formal. Por favor evitar el color de la quinceañera." },
    ];
    return d;
  }

  if (kind === "comunion") {
    Object.assign(d.event, {
      type: "comunion", name1: "Martina", name2: "",
      quote: "Dejen que los niños vengan a mí, porque de ellos es el reino de los cielos.",
    });
    Object.assign(d.splash, { label: "Con fe y alegría te invito a", subtitle: "Mi Primera Comunión" });
    Object.assign(d.hero, { label: "Te invito a acompañarme en", subtitle: "Mi Primera Comunión" });
    Object.assign(d.guests, {
      title: "Invitados de honor",
      text: "Gracias por acompañarme en un día tan importante para mí y para mi familia.",
      textSecondary: "",
    });
    d.events.items = [
      { icon: "⛪", kind: "Ceremonia", title: "Santa Misa", time: "11:00 a. m.", place: "Parroquia San Nicolás", address: "Calle Flores 234", note: "Llegar 15 minutos antes", mapUrl: "" },
      { icon: "🕊️", kind: "Celebración", title: "Almuerzo de festejo", time: "1:30 p. m.", place: "Salón La Gracia", address: "Av. Centenario 560", note: "", mapUrl: "" },
    ];
    d.features.items = [
      { icon: "🕊️", title: "Ceremonia", text: "Una misa íntima para celebrar este primer sacramento." },
      { icon: "🎂", title: "Almuerzo", text: "Celebramos en familia justo después de la misa." },
      { icon: "📸", title: "Recuerdos", text: "Habrá fotógrafo y souvenirs para todos." },
    ];
    return d;
  }

  if (kind === "primer-ano") {
    Object.assign(d.event, {
      type: "primer-ano", name1: nino ? "Martín" : "Emilia", name2: "",
      quote: "Un año lleno de primeras veces, y la más linda fue conocerte.",
    });
    Object.assign(d.splash, { label: "Te invito a celebrar", subtitle: "Mi primer añito" });
    Object.assign(d.hero, { label: "Cumplo un año y quiero festejarlo contigo", subtitle: "Mi primer añito", cta: "Ver la invitación" });
    Object.assign(d.countdown, { label: "Ya casi", title: "Faltan para mi fiesta", text: "El primer añito se celebra a lo grande." });
    Object.assign(d.guests, {
      label: "Con todo el corazón", title: "Mis personas favoritas",
      text: "Mi primer año pasó volando y fue increíble gracias a ustedes.",
      textSecondary: "¡Los espero para soplar la velita!",
    });
    d.guests.items = [
      { name: "Abuelos Pérez", role: "Los consentidores" },
      { name: "Tía Sara", role: "La de los mimos" },
    ];
    Object.assign(d.events, { label: "El plan", title: "Cómo será la fiesta" });
    d.events.items = [
      { icon: "🎈", kind: "Bienvenida", title: "Llegada y juegos", time: "3:00 p. m.", place: "Salón Arcoíris", address: "Calle 45 #12-30", note: "Habrá zona de juegos", mapUrl: "" },
      { icon: "🎂", kind: "El momento", title: "Torta y velita", time: "5:00 p. m.", place: "Salón Arcoíris", address: "", note: "No te lo pierdas", mapUrl: "" },
    ];
    Object.assign(d.features, { label: "Para tener en cuenta", title: "Detalles de la fiesta" });
    d.features.items = [
      { icon: "🎨", title: "Temática", text: "Colores pastel y globos por todas partes." },
      { icon: "🧁", title: "Mesa de dulces", text: "Habrá postres para grandes y chiquitos." },
      { icon: "👶", title: "Vengan con los niños", text: "La fiesta es para toda la familia." },
    ];
    Object.assign(d.gallery, { label: "Mi primer año", title: "Cómo crecí" });
    Object.assign(d.confirm, { text: "Ayúdame a organizar todo confirmando tu asistencia antes del", note: "¡Te espero!" });
    Object.assign(d.gifts, {
      label: "Si quieres consentirme", title: "Ideas de regalo",
      text: "Tu presencia es lo más importante. Si quieres traerme algo, aquí van algunas ideas.",
    });
    d.gifts.items = [
      { icon: "📚", title: "Cuentos", text: "Para seguir leyendo antes de dormir.", url: "" },
      { icon: "🧸", title: "Juguetes", text: "Cualquier cosa para armar y desarmar.", url: "" },
    ];
    Object.assign(d.social, {
      title: "Sube tus fotos", text: "Etiquétalas con nuestro hashtag para que no se pierda ninguna.",
      hashtag: nino ? "#MartinCumple1" : "#EmiliaCumple1",
    });
    return d;
  }

  if (kind === "baby-shower") {
    const nombre = nino ? "Martín" : "Emilia";
    Object.assign(d.event, {
      type: "baby-shower", name1: nombre, name2: "",
      quote: "Te esperamos con el corazón lleno de amor.",
    });
    Object.assign(d.splash, { label: "Estamos esperando a", subtitle: "Nuestro Baby Shower" });
    Object.assign(d.hero, { label: "Estamos esperando a", subtitle: "Baby shower", cta: "Ver la invitación" });
    Object.assign(d.countdown, {
      label: "Ya viene",
      title: `Faltan para conocer${nino ? "lo" : "la"}`,
      text: "Cada día que pasa estamos más cerca.",
    });
    Object.assign(d.guests, {
      label: "Gracias por venir", title: "Nuestros invitados",
      text: "Queremos celebrar su llegada rodeados de las personas que más queremos.",
      textSecondary: "Su compañía hace que la espera sea más linda.",
    });
    d.guests.items = [];
    Object.assign(d.events, { label: "El plan", title: "Cómo será la tarde" });
    d.events.items = [
      { icon: "🎀", kind: "Bienvenida", title: "Recepción", time: "4:00 p. m.", place: "Casa de los abuelos", address: "Carrera 12 #80-45", note: "", mapUrl: "" },
      { icon: "🍰", kind: "Merienda", title: "Juegos y torta", time: "5:00 p. m.", place: "Casa de los abuelos", address: "", note: "Habrá premios", mapUrl: "" },
    ];
    Object.assign(d.features, { label: "Para tener en cuenta", title: "Detalles" });
    d.features.items = [
      { icon: "🎨", title: "Temática", text: "Tonos suaves. Ven cómoda y con ropa clara." },
      { icon: "🎁", title: "Trae un pañal", text: "Talla 1 o 2, y participas en la rifa." },
      { icon: "💌", title: "Deja un consejo", text: `Habrá una libreta para escribirle a${nino ? "l bebé" : " la bebé"}.` },
    ];
    Object.assign(d.gallery, { label: "La espera", title: "Nuestros momentos" });
    Object.assign(d.confirm, { text: "Confírmanos si nos acompañas antes del", note: "¡Nos vemos pronto!" });
    Object.assign(d.gifts, {
      label: "Con mucho cariño", title: "Lista de regalos",
      text: "Lo más importante es tenerte ahí. Si quieres traer algo, esto es lo que más necesitamos.",
    });
    d.gifts.items = [
      { icon: "🍼", title: "Lo básico", text: "Pañales, toallitas y cremas.", url: "" },
      { icon: "👶", title: "Ropita", text: "Talla 0 a 6 meses.", url: "" },
    ];
    Object.assign(d.social, {
      title: "Sube tus fotos", text: "Etiquétalas con nuestro hashtag para que no se pierda ninguna.",
      hashtag: `#Esperando${nino ? "AMartin" : "AEmilia"}`,
    });
    return d;
  }

  return d;
}
