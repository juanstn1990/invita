/**
 * El contenido de muestra de cada diseño.
 *
 * No es relleno: es lo que ve quien abre el selector de diseños y lo que trae
 * la invitación recién creada, así que está escrito para leerse bien y para
 * que el diseño se entienda antes de que nadie escriba nada.
 *
 * Cambia con la ocasión y, en los infantiles, con la versión: la de niño dice
 * "Martín" y "faltan para conocer**lo**", la de niña "Emilia" y "conocer**la**".
 */

import type { Layout, Occasion } from "./theme";

export interface Content {
  name: string;
  /** El segundo nombre, separado por el `&` del diseño. Sólo en bodas. */
  name2?: string;
  dateIso: string;
  dateLabel: string;
  splash: { label: string; subtitle: string; cta1: string; cta2: string };
  hero: {
    label: string; sub: string; quote: string; cta: string;
    /**
     * Lo que sólo dibuja la portada de acta: los nombres completos, la
     * bendición, los padres de cada lado y la línea de cierre.
     *
     * En los demás diseños van vacíos, y un campo vacío no deja hueco — el
     * renderer borra su elemento. El marcado sí está en los 49, porque el
     * esqueleto es uno solo y el contrato dice que todo campo del esquema
     * tiene su `data-inv` en todos.
     */
    nombresCompletos?: string;
    bendicion?: string;
    padresA?: string; padresANombres?: string;
    padresB?: string; padresBNombres?: string;
    cierre?: string;
  };
  countdown: { label: string; title: string; body: string };
  guests: {
    label: string;
    title: string;
    text: string;
    text2: string;
    address: string;
    cards: { name: string; role: string }[];
  };
  events: {
    label: string;
    title: string;
    body: string;
    items: {
      icon: string;
      kind: string;
      title: string;
      time: string;
      place: string;
      address: string;
      note: string;
    }[];
  };
  confirm: {
    label: string;
    title: string;
    text: string;
    deadline: string;
    note: string;
    cta: string;
  };
  gallery: { label: string; title: string; text: string };
  features: {
    label: string;
    title: string;
    items: { icon: string; title: string; text: string }[];
  };
  gifts: {
    label: string;
    title: string;
    text: string;
    bankLabel: string;
    account: string;
    note: string;
    cards: { icon: string; title: string; text: string }[];
  };
  social: { label: string; title: string; text: string; tag: string; ig: string };
  footer: string;
}

/* ── Piezas que se repiten ─────────────────────────────────── */

const CONFIRMA = {
  label: "¿Nos acompañas?",
  title: "Confirma tu asistencia",
  cta: "Confirmar asistencia",
};

const GALERIA = {
  label: "Nuestra historia",
  title: "Momentos juntos",
  text: "Unas cuantas fotos de lo que nos trajo hasta aquí.",
};

const gifts = (texto: string) => ({
  bankLabel: "Transferencia",
  account: "Bancolombia · 000-000000-00",
  note: `Concepto: ${texto}`,
});

/* ────────────────────────────────────────────────────────────────
   Boda
   ──────────────────────────────────────────────────────────────── */

const boda = (): Content => ({
  name: "Juan",
  name2: "María",
  dateIso: "2027-11-15T16:00:00",
  dateLabel: "15 · Noviembre · 2027",
  splash: {
    label: "Te invitamos a nuestra boda",
    subtitle: "Nos casamos",
    cta1: "Abrir invitación",
    cta2: "Cómo llegar",
  },
  hero: {
    label: "Nos casamos",
    sub: "Y queremos celebrarlo contigo",
    quote: "El amor no se mira: se vive juntos mirando en la misma dirección.",
    cta: "Ver la invitación",
  },
  countdown: {
    label: "El gran día",
    title: "Falta muy poco",
    body: "Estamos contando los días para verte allí.",
  },
  guests: {
    label: "Con todo nuestro amor",
    title: "Queridos invitados",
    text: "Queremos compartir con ustedes el día más importante de nuestras vidas. Su presencia lo hará inolvidable.",
    text2: "Los esperamos con los brazos abiertos.",
    address: "Bogotá · Colombia",
    cards: [
      { name: "Familia Gómez", role: "Padres de la novia" },
      { name: "Familia Rojas", role: "Padres del novio" },
      { name: "Ana y Carlos", role: "Padrinos" },
    ],
  },
  events: {
    label: "El programa",
    title: "Cómo será el día",
    body: "Dos momentos y el mismo día. Aquí los detalles de cada uno.",
    items: [
      {
        icon: "💒",
        kind: "Ceremonia",
        title: "La ceremonia",
        time: "16:00 h",
        place: "Iglesia de Santa María",
        address: "Plaza de la Catedral 5",
        note: "Llega quince minutos antes, por favor.",
      },
      {
        icon: "🥂",
        kind: "Recepción",
        title: "La celebración",
        time: "18:30 h",
        place: "Hacienda El Cortijo",
        address: "Carretera de Sopó km 8",
        note: "Habrá transporte desde la iglesia.",
      },
    ],
  },
  confirm: {
    ...CONFIRMA,
    text: "Por favor confirma tu asistencia. Nos ayudará a planear el mejor día posible para todos.",
    deadline: "Antes del 15 de octubre",
    note: "Si vienes con alguien, cuéntanos aquí mismo.",
  },
  gallery: GALERIA,
  features: {
    label: "Información útil",
    title: "Todo lo que necesitas saber",
    items: [
      { icon: "👗", title: "Código de vestimenta", text: "Formal. Los tonos claros son bienvenidos; el blanco, reservado para la novia." },
      { icon: "🚗", title: "Cómo llegar", text: "Hay parqueadero en el lugar y transporte desde la iglesia hasta la recepción." },
      { icon: "🏨", title: "Alojamiento", text: "Tenemos tarifa preferencial en el hotel de la esquina. Escríbenos por el código." },
    ],
  },
  gifts: {
    label: "Con mucho cariño",
    title: "Mesa de regalos",
    text: "Su presencia es nuestro mejor regalo. Si desean acompañarnos con un detalle, aquí dejamos los datos.",
    ...gifts("tu nombre"),
    cards: [
      { icon: "✈️", title: "Luna de miel", text: "Ayúdanos a llegar más lejos." },
      { icon: "🏠", title: "Nuestra casa", text: "Para lo que falta del nuevo hogar." },
    ],
  },
  social: {
    label: "Compártelo",
    title: "Sube tus fotos",
    text: "Etiquétalas con nuestro hashtag para que no se pierda ninguna.",
    tag: "#JuanYMaria2027",
    ig: "@juanymaria",
  },
  footer: "Con amor · Juan & María",
});

/* ────────────────────────────────────────────────────────────────
   Quince años
   ──────────────────────────────────────────────────────────────── */

const quince = (): Content => ({
  name: "Valentina",
  dateIso: "2027-08-21T19:00:00",
  dateLabel: "21 · Agosto · 2027",
  splash: {
    label: "Te invito a celebrar",
    subtitle: "Mis quince años",
    cta1: "Abrir invitación",
    cta2: "Cómo llegar",
  },
  hero: {
    label: "Mis quince años",
    sub: "Y quiero celebrarlos contigo",
    quote: "Hoy dejo de contar los años y empiezo a contar los momentos.",
    cta: "Ver la invitación",
  },
  countdown: {
    label: "Ya casi",
    title: "Faltan para mi fiesta",
    body: "Cuento los días para verte llegar.",
  },
  guests: {
    label: "Con todo mi cariño",
    title: "Mis personas favoritas",
    text: "Quiero que este día esté lleno de la gente que me acompañó a llegar hasta aquí.",
    text2: "Los espero para bailar hasta el final.",
    address: "Bogotá · Colombia",
    cards: [
      { name: "Familia Ríos", role: "Mis papás" },
      { name: "Abuelos Ríos", role: "Los consentidores" },
      { name: "Tía Sara", role: "Mi madrina" },
    ],
  },
  events: {
    label: "El programa",
    title: "Cómo será la noche",
    body: "Empezamos con la misa y seguimos con la fiesta.",
    items: [
      {
        icon: "⛪",
        kind: "Misa",
        title: "Misa de acción de gracias",
        time: "19:00 h",
        place: "Parroquia de la Inmaculada",
        address: "Carrera 7 · 45-20",
        note: "Llega quince minutos antes, por favor.",
      },
      {
        icon: "🎉",
        kind: "Fiesta",
        title: "La celebración",
        time: "21:00 h",
        place: "Salón Los Almendros",
        address: "Avenida 19 · 108-30",
        note: "El vals es a las diez en punto.",
      },
    ],
  },
  confirm: {
    ...CONFIRMA,
    text: "Confírmame si vienes, así aparto tu puesto en la mesa.",
    deadline: "Antes del 21 de julio",
    note: "Si vienes con alguien, cuéntame aquí mismo.",
  },
  gallery: { label: "Mis años", title: "De niña a quinceañera", text: "Un repaso rápido por estos quince años." },
  features: {
    label: "Información útil",
    title: "Todo lo que necesitas saber",
    items: [
      { icon: "👗", title: "Código de vestimenta", text: "Elegante. Reservo el rosa para mí, si no les importa." },
      { icon: "🚗", title: "Cómo llegar", text: "Hay parqueadero en el salón y transporte desde la parroquia." },
      { icon: "🎁", title: "Regalos", text: "Tu presencia es lo que más quiero. Si insistes, hay mesa de regalos." },
    ],
  },
  gifts: {
    label: "Con mucho cariño",
    title: "Mesa de regalos",
    text: "Tu compañía es mi mejor regalo. Si quieres acompañarme con un detalle, aquí dejo los datos.",
    ...gifts("tu nombre"),
    cards: [
      { icon: "🎒", title: "Mi viaje", text: "Estoy ahorrando para el viaje de grado." },
      { icon: "📚", title: "Mis estudios", text: "Para los libros que vienen." },
    ],
  },
  social: {
    label: "Compártelo",
    title: "Sube tus fotos",
    text: "Etiquétalas con mi hashtag para que no se pierda ninguna.",
    tag: "#ValentinaXV",
    ig: "@valentina",
  },
  footer: "Con cariño · Valentina",
});

/* ────────────────────────────────────────────────────────────────
   Primera comunión
   ──────────────────────────────────────────────────────────────── */

const comunion = (): Content => ({
  name: "Mateo",
  dateIso: "2027-05-16T11:00:00",
  dateLabel: "16 · Mayo · 2027",
  splash: {
    label: "Te invito a acompañarme",
    subtitle: "Mi primera comunión",
    cta1: "Abrir invitación",
    cta2: "Cómo llegar",
  },
  hero: {
    label: "Mi primera comunión",
    sub: "Y quiero compartirla contigo",
    quote: "Dejen que los niños se acerquen a mí.",
    cta: "Ver la invitación",
  },
  countdown: {
    label: "Ya casi",
    title: "Faltan para el día",
    body: "Estoy contando los días para verte allí.",
  },
  guests: {
    label: "Con todo mi cariño",
    title: "Mi familia y mis amigos",
    text: "Quiero que este día tan importante esté rodeado de la gente que quiero.",
    text2: "Los espero a todos en la misa y después en el almuerzo.",
    address: "Bogotá · Colombia",
    cards: [
      { name: "Familia Torres", role: "Mis papás" },
      { name: "Abuelos Torres", role: "Los consentidores" },
      { name: "Tío Andrés", role: "Mi padrino" },
    ],
  },
  events: {
    label: "El programa",
    title: "Cómo será el día",
    body: "La misa por la mañana y el almuerzo después, en el mismo barrio.",
    items: [
      {
        icon: "⛪",
        kind: "Ceremonia",
        title: "La misa",
        time: "11:00 h",
        place: "Parroquia de San Antonio",
        address: "Calle 60 · 12-15",
        note: "Llega quince minutos antes, por favor.",
      },
      {
        icon: "🍽️",
        kind: "Celebración",
        title: "El almuerzo",
        time: "13:30 h",
        place: "Casa de los abuelos",
        address: "Calle 62 · 10-40",
        note: "Hay mesa de niños y jardín.",
      },
    ],
  },
  confirm: {
    ...CONFIRMA,
    text: "Confírmanos si vienes, así apartamos tu puesto en la mesa.",
    deadline: "Antes del 16 de abril",
    note: "Cuéntanos si vienes con más gente de la familia.",
  },
  gallery: { label: "Estos años", title: "Cómo he crecido", text: "Unas fotos de estos años." },
  features: {
    label: "Información útil",
    title: "Todo lo que necesitas saber",
    items: [
      { icon: "👔", title: "Código de vestimenta", text: "Elegante y cómodo. Es a media mañana y hay jardín." },
      { icon: "🚗", title: "Cómo llegar", text: "Hay parqueadero en la parroquia y la casa está a dos cuadras." },
      { icon: "🎁", title: "Regalos", text: "Tu compañía es lo que importa. Si insistes, hay mesa de regalos." },
    ],
  },
  gifts: {
    label: "Con mucho cariño",
    title: "Mesa de regalos",
    text: "Tu compañía es el mejor regalo. Si quieres dejarme un detalle, aquí están los datos.",
    ...gifts("tu nombre"),
    cards: [
      { icon: "📚", title: "Mis libros", text: "Los que vienen para el colegio." },
      { icon: "⚽", title: "Mi equipo", text: "Estoy juntando para el uniforme." },
    ],
  },
  social: {
    label: "Compártelo",
    title: "Sube tus fotos",
    text: "Etiquétalas con mi hashtag para que no se pierda ninguna.",
    tag: "#PrimeraComunionMateo",
    ig: "@familiatorres",
  },
  footer: "Con cariño · Mateo",
});

/* ────────────────────────────────────────────────────────────────
   Grado
   ──────────────────────────────────────────────────────────────── */

/**
 * Un grado no es una boda con birrete.
 *
 * Lo que se celebra es un logro propio, no una unión ni una bendición, y el
 * contenido lo dice: aquí quien invita da las gracias a quien lo sostuvo, no
 * pide una bendición ni presenta a una pareja. El tono es de orgullo y de
 * cierre — "lo logramos", en plural, porque nadie se gradúa solo.
 */
const grado = (): Content => ({
  name: "Camila",
  dateIso: "2027-11-26T17:00:00",
  dateLabel: "26 · Noviembre · 2027",
  splash: {
    label: "Te invito a celebrar",
    subtitle: "Mi grado",
    cta1: "Abrir invitación",
    cta2: "Cómo llegar",
  },
  hero: {
    label: "Me gradúo",
    sub: "Y quiero celebrarlo contigo",
    quote: "Cinco años, muchas noches largas y una sola meta. Hoy la alcanzo.",
    cta: "Ver la invitación",
  },
  countdown: {
    label: "Ya casi",
    title: "Faltan para el día",
    body: "Después de tanto esperar, ya se cuenta en días.",
  },
  guests: {
    label: "Con toda mi gratitud",
    title: "Los que me sostuvieron",
    text: "Este título no es sólo mío: es de quienes me aguantaron los exámenes, las trasnochadas y las dudas.",
    text2: "Los espero para celebrarlo como se debe.",
    address: "Bogotá · Colombia",
    cards: [
      { name: "Familia Ospina", role: "Mis papás" },
      { name: "Abuelos Ospina", role: "Los que siempre creyeron" },
      { name: "Daniel y Sofía", role: "Mis compañeros de estudio" },
    ],
  },
  events: {
    label: "El programa",
    title: "Cómo será el día",
    body: "La ceremonia en la universidad y la celebración después.",
    items: [
      {
        icon: "🎓",
        kind: "Ceremonia",
        title: "Entrega de diplomas",
        time: "17:00 h",
        place: "Auditorio Principal",
        address: "Universidad · Carrera 7 · 40-62",
        note: "Entrada a las 16:30. Cada graduando tiene cupos limitados.",
      },
      {
        icon: "🥂",
        kind: "Celebración",
        title: "El brindis",
        time: "20:00 h",
        place: "Casa Bonita",
        address: "Calle 70 · 5-24",
        note: "Aquí ya no hay cupos limitados: vengan todos.",
      },
    ],
  },
  confirm: {
    ...CONFIRMA,
    text: "Confírmame si vienes, así aparto tu puesto en el brindis.",
    deadline: "Antes del 12 de noviembre",
    note: "Si vienes acompañado, cuéntamelo aquí mismo.",
  },
  gallery: {
    label: "Estos años",
    title: "El camino hasta aquí",
    text: "Del primer día de clase a la última entrega.",
  },
  features: {
    label: "Información útil",
    title: "Todo lo que necesitas saber",
    items: [
      { icon: "👔", title: "Código de vestimenta", text: "Formal. La ceremonia es en el auditorio y se toman fotos." },
      { icon: "🎟️", title: "Cupos de la ceremonia", text: "La universidad da un número limitado por graduando. Escríbeme y te confirmo." },
      { icon: "🚗", title: "Cómo llegar", text: "Hay parqueadero en el campus y la casa queda a diez minutos." },
    ],
  },
  gifts: {
    label: "Con mucho cariño",
    title: "Si quieres regalarme algo",
    text: "Tu compañía ya es bastante. Si insistes, aquí dejo los datos.",
    ...gifts("mi grado"),
    cards: [
      { icon: "✈️", title: "Mi viaje", text: "El que me prometí cuando entregara la tesis." },
      { icon: "💻", title: "Mis herramientas", text: "Para lo que viene ahora." },
    ],
  },
  social: {
    label: "Compártelo",
    title: "Sube tus fotos",
    text: "Etiquétalas con mi hashtag para que no se pierda ninguna.",
    tag: "#CamilaSeGradua",
    ig: "@camilaospina",
  },
  footer: "Con gratitud · Camila",
});

/* ────────────────────────────────────────────────────────────────
   Primer añito y baby shower
   ──────────────────────────────────────────────────────────────── */

/**
 * El nombre de muestra de los infantiles.
 *
 * Antes salía de la variante (niña/niño). Ahora sale de la **paleta**, que es
 * donde quedó esa elección: con la paleta azul el ejemplo dice "Martín" y con
 * el resto "Emilia". Es sólo contenido de muestra —lo que se ve en el
 * selector— y se reemplaza en cuanto alguien escribe su nombre.
 */
const MASCULINAS = new Set(["azul", "cielo", "pizarra", "petroleo", "indigo"]);
const nombreDe = (paletaId: string) => (MASCULINAS.has(paletaId) ? "Martín" : "Emilia");

const primerAno = (paletaId: string): Content => {
  const name = nombreDe(paletaId);
  const ella = name === "Emilia";
  return {
    name,
    dateIso: "2027-03-14T15:00:00",
    dateLabel: "14 · Marzo · 2027",
    splash: {
      label: "Te invito a celebrar",
      subtitle: "Mi primer añito",
      cta1: "Abrir invitación",
      cta2: "Cómo llegar",
    },
    hero: {
      label: "Cumplo un año",
      sub: "Y quiero festejarlo contigo",
      quote: `Un año lleno de primeras veces, y la más linda fue conocerte.`,
      cta: "Ver la invitación",
    },
    countdown: {
      label: "Ya casi",
      title: "Faltan para mi fiesta",
      body: "El primer añito se celebra a lo grande, y no sería lo mismo sin ti.",
    },
    guests: {
      label: "Con todo el corazón",
      title: "Mis personas favoritas",
      text: "Mi primer año pasó volando y fue increíble gracias a ustedes.",
      text2: `${ella ? "Los" : "Los"} espero para soplar la velita.`,
      address: "Bogotá · Colombia",
      cards: [
        { name: "Familia Pérez", role: "Mis papás" },
        { name: "Abuelos Pérez", role: "Los consentidores" },
        { name: "Tía Sara", role: "La de los mimos" },
      ],
    },
    events: {
      label: "El programa",
      title: "Cómo será la tarde",
      body: "Una tarde corta, para que los chiquitos aguanten.",
      items: [
        {
          icon: "🎂",
          kind: "La fiesta",
          title: "Torta y velita",
          time: "15:00 h",
          place: "Salón Arcoíris",
          address: "Calle 85 · 14-20",
          note: "La velita se sopla a las cuatro.",
        },
        {
          icon: "🎈",
          kind: "Juegos",
          title: "Hora de jugar",
          time: "16:00 h",
          place: "El jardín del salón",
          address: "Al fondo, a la derecha",
          note: "Hay piscina de pelotas y sombra.",
        },
      ],
    },
    confirm: {
      ...CONFIRMA,
      text: "Confírmanos si vienes, así apartamos tu silla y tu porción de torta.",
      deadline: "Antes del 7 de marzo",
      note: "Cuéntanos cuántos chiquitos vienen, para los recuerdos.",
    },
    gallery: { label: "Mi primer año", title: "Cómo he crecido", text: "De recién nacid" + (ella ? "a" : "o") + " a caminar en doce meses." },
    features: {
      label: "Información útil",
      title: "Todo lo que necesitas saber",
      items: [
        { icon: "👕", title: "Cómo vestir", text: "Cómodos: hay juegos, jardín y piso para gatear." },
        { icon: "🚗", title: "Cómo llegar", text: "Hay parqueadero en el salón y entrada por la calle 85." },
        { icon: "🍰", title: "La comida", text: "Hay mesa de dulces, y opciones sin azúcar para los chiquitos." },
      ],
    },
    gifts: {
      label: "Con mucho cariño",
      title: "Mesa de regalos",
      text: "Tu compañía es el mejor regalo. Si quieres dejarme un detalle, aquí están los datos.",
      ...gifts(`el añito de ${name}`),
      cards: [
        { icon: "🧸", title: "Mis juguetes", text: "Todo lo que se pueda morder." },
        { icon: "👚", title: "Mi ropa", text: "Talla 18 meses, que crezco rápido." },
      ],
    },
    social: {
      label: "Compártelo",
      title: "Sube tus fotos",
      text: "Etiquétalas con mi hashtag para que no se pierda ninguna.",
      tag: `#${name}Cumple1`,
      ig: "@familiaperez",
    },
    footer: `Con amor · ${name}`,
  };
};

const babyShower = (paletaId: string): Content => {
  const name = nombreDe(paletaId);
  const ella = name === "Emilia";
  const la = ella ? "la" : "lo";
  return {
    name,
    dateIso: "2027-06-12T16:00:00",
    dateLabel: "12 · Junio · 2027",
    splash: {
      label: "Te invitamos a celebrar",
      subtitle: `La llegada de ${name}`,
      cta1: "Abrir invitación",
      cta2: "Cómo llegar",
    },
    hero: {
      label: "Estamos esperando",
      sub: "Y queremos celebrarlo contigo",
      quote: "Todavía no ha llegado y ya es lo que más queremos.",
      cta: "Ver la invitación",
    },
    countdown: {
      label: "Ya casi",
      title: `Faltan para conocer${la}`,
      body: "Nos hace mucha ilusión que estés ahí ese día.",
    },
    guests: {
      label: "Con todo el corazón",
      title: "Nuestra gente",
      text: `Queremos celebrar la llegada de ${name} rodeados de quienes nos acompañan.`,
      text2: "Los esperamos para una tarde tranquila y con mucha torta.",
      address: "Bogotá · Colombia",
      cards: [
        { name: "Familia Vargas", role: "Los papás" },
        { name: "Abuelos Vargas", role: "Los que ya compraron todo" },
        { name: "Tía Sara", role: "La madrina" },
      ],
    },
    events: {
      label: "El programa",
      title: "Cómo será la tarde",
      body: "Una tarde tranquila, de las que se pasan volando.",
      items: [
        {
          icon: "🍰",
          kind: "La reunión",
          title: "Torta y juegos",
          time: "16:00 h",
          place: "Casa de los abuelos",
          address: "Carrera 11 · 93-40",
          note: "Hay jardín y sombra.",
        },
        {
          icon: "🎁",
          kind: "Los regalos",
          title: "Abrimos los regalos",
          time: "17:30 h",
          place: "En el jardín",
          address: "Al fondo de la casa",
          note: `Cada regalo con una nota para ${name}.`,
        },
      ],
    },
    confirm: {
      ...CONFIRMA,
      text: "Confírmanos si vienes, así apartamos tu silla.",
      deadline: "Antes del 5 de junio",
      note: "Cuéntanos si vienes con alguien más.",
    },
    gallery: { label: "La espera", title: "Estos meses", text: "Unas fotos de los meses de espera." },
    features: {
      label: "Información útil",
      title: "Todo lo que necesitas saber",
      items: [
        { icon: "👕", title: "Cómo vestir", text: `Cómodos y en tonos ${ella ? "claros" : "claros"}: es de tarde y en el jardín.` },
        { icon: "🚗", title: "Cómo llegar", text: "Hay parqueadero en la calle y la entrada es por la carrera 11." },
        { icon: "🎁", title: "Regalos", text: "Talla recién nacido y 3 meses es lo que más falta." },
      ],
    },
    gifts: {
      label: "Con mucho cariño",
      title: "Mesa de regalos",
      text: "Tu compañía es el mejor regalo. Si quieres dejar un detalle, aquí están los datos.",
      ...gifts(`el baby shower de ${name}`),
      cards: [
        { icon: "🍼", title: "Lo del día a día", text: "Pañales, teteros y lo que se gasta rápido." },
        { icon: "🧸", title: "El cuarto", text: "Nos falta poco para terminarlo." },
      ],
    },
    social: {
      label: "Compártelo",
      title: "Sube tus fotos",
      text: "Etiquétalas con nuestro hashtag para que no se pierda ninguna.",
      tag: `#Esperando${name}`,
      ig: "@familiavargas",
    },
    footer: `Con amor · esperando a ${name}`,
  };
};

/* ────────────────────────────────────────────────────────────────
   Elegir
   ──────────────────────────────────────────────────────────────── */

/**
 * El texto de muestra de la portada de acta.
 *
 * Va aparte y no en el contenido de boda porque **cambiaría los dieciséis
 * diseños de boda a la vez**: los campos existen en los 49, y si el contenido
 * de la ocasión los trajera llenos, todas las portadas de boda saldrían con
 * los padres y la bendición encima. Sólo el slot que sabe dibujarlos los pide.
 */
const ACTA = {
  label: "Un amor tan grande merece ser celebrado",
  nombresCompletos: "Jhon Jarles Roa Garzón  †  Dahiana Insuasti Grajales",
  bendicion: "Con la bendición de Dios\ny nuestros padres",
  padresA: "Padres del novio",
  padresANombres: "Luis Sabino Roa\nMaría Jesús Garzón",
  padresB: "Padres de la novia",
  padresBNombres: "Mauro Antonio Insuasti Rodas\nAdriana Grajales Perez",
  cierre: "Queremos compartir con ustedes este día\ntan especial y esperado, nuestra boda.",
};

export function contenido(
  occasion: Occasion,
  paletaId = "",
  hero?: Layout["hero"]
): Content {
  const c = base(occasion, paletaId);
  /* Sólo la portada de acta dibuja esto; en el resto los campos existen y
     están vacíos, que es lo que hace que no se vean. */
  if (hero === "acta") Object.assign(c.hero, ACTA);
  return c;
}

function base(occasion: Occasion, paletaId: string): Content {
  switch (occasion) {
    case "boda":
      return boda();
    case "quince":
      return quince();
    case "comunion":
      return comunion();
    case "grado":
      return grado();
    case "primer-ano":
      return primerAno(paletaId);
    case "baby-shower":
      return babyShower(paletaId);
  }
}
