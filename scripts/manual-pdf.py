"""
Genera el manual de capacitación en PDF.

    python3 scripts/manual-pdf.py [salida.pdf]

Las cifras que aparecen —50 diseños, 53 tipografías, 23 paletas— salen de
consultar el código, no de la memoria de nadie. Si cambian, se vuelve a
generar y el manual deja de mentir. Por eso esto es un guion y no un
documento suelto que alguien escribió una vez.
"""

import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, ListFlowable, ListItem, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

SALIDA = sys.argv[1] if len(sys.argv) > 1 else "Manual-Invita.pdf"

TINTA = colors.HexColor("#2e2a26")
SUAVE = colors.HexColor("#7d746a")
ACENTO = colors.HexColor("#7b5228")
LINEA = colors.HexColor("#e2dad0")
FONDO = colors.HexColor("#faf7f2")
AVISO = colors.HexColor("#fdf1ec")
AVISO_B = colors.HexColor("#e8c9ba")

ss = getSampleStyleSheet()


def est(nombre, **kw):
    base = dict(fontName="Helvetica", fontSize=10, leading=15, textColor=TINTA)
    base.update(kw)
    return ParagraphStyle(nombre, **base)


H1 = est("H1", fontName="Times-Bold", fontSize=21, leading=25, spaceBefore=2, spaceAfter=9)
H2 = est("H2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
         spaceBefore=13, spaceAfter=5, textColor=ACENTO)
H3 = est("H3", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
         spaceBefore=9, spaceAfter=3)
P = est("P", alignment=TA_JUSTIFY, spaceAfter=6)
LI = est("LI", alignment=TA_JUSTIFY, spaceAfter=3)
NOTA = est("NOTA", fontSize=9.4, leading=13.6, textColor=TINTA, alignment=TA_JUSTIFY)
PIE = est("PIE", fontSize=8.6, leading=12, textColor=SUAVE)
CELDA = est("CELDA", fontSize=9.2, leading=12.8)
CELDA_B = est("CELDA_B", fontSize=9.2, leading=12.8, fontName="Helvetica-Bold")


def portada_texto(txt, **kw):
    return Paragraph(txt, est("PT", alignment=TA_CENTER, **kw))


def tabla(filas, anchos, cabecera=True):
    datos = []
    for i, fila in enumerate(filas):
        estilo = CELDA_B if (cabecera and i == 0) else CELDA
        datos.append([Paragraph(str(c), CELDA_B if j == 0 and not cabecera else estilo)
                      for j, c in enumerate(fila)])
    t = Table(datos, colWidths=anchos, hAlign="LEFT")
    orden = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINEA),
    ]
    if cabecera:
        orden += [("BACKGROUND", (0, 0), (-1, 0), FONDO),
                  ("LINEBELOW", (0, 0), (-1, 0), 0.8, LINEA)]
    t.setStyle(TableStyle(orden))
    return t


def caja(titulo, texto, color=FONDO, borde=LINEA):
    """Un aviso destacado. Se usa para lo que cuesta dinero equivocarse."""
    dentro = [Paragraph(f"<b>{titulo}</b>", NOTA), Spacer(1, 3), Paragraph(texto, NOTA)]
    t = Table([[dentro]], colWidths=[165 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("BOX", (0, 0), (-1, -1), 0.6, borde),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def lista_check(puntos):
    """
    Una lista de casillas para marcar.

    La casilla la pone la viñeta y no el texto, con ZapfDingbats —una de las
    catorce fuentes que todo lector de PDF trae— porque el carácter U+2610 no
    existe en Helvetica y sale como un **cuadro negro relleno**, que es
    exactamente lo contrario de una casilla vacía. Se ve en cuanto se mira el
    PDF, y no se ve nunca leyendo el código.
    """
    return ListFlowable(
        [ListItem(Paragraph(p, LI), leftIndent=15) for p in puntos],
        bulletType="bullet", start="q", bulletFontName="ZapfDingbats",
        bulletFontSize=9, bulletOffsetY=-0.5,
        leftIndent=13, spaceAfter=7,
    )


def lista(puntos):
    return ListFlowable(
        [ListItem(Paragraph(p, LI), leftIndent=13) for p in puntos],
        bulletType="bullet", bulletFontSize=7, bulletOffsetY=1,
        leftIndent=11, spaceAfter=6,
    )


# ── El documento ──────────────────────────────────────────────

def numerar(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SUAVE)
    if doc.page > 1:
        canvas.drawString(22 * mm, 13 * mm, "Invita · Manual de capacitación")
        canvas.drawRightString(A4[0] - 22 * mm, 13 * mm, str(doc.page))
        canvas.setStrokeColor(LINEA)
        canvas.setLineWidth(0.4)
        canvas.line(22 * mm, 17 * mm, A4[0] - 22 * mm, 17 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(
    SALIDA, pagesize=A4,
    leftMargin=22 * mm, rightMargin=22 * mm,
    topMargin=20 * mm, bottomMargin=22 * mm,
    title="Invita · Manual de capacitación",
    author="Invita",
    subject="Cómo armar y entregar invitaciones digitales",
)
marco = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="cuerpo")
doc.addPageTemplates([PageTemplate(id="normal", frames=[marco], onPage=numerar)])

h = []

# ── Portada ───────────────────────────────────────────────────

h += [
    Spacer(1, 48 * mm),
    portada_texto("INVITA", fontSize=11, textColor=ACENTO, leading=14),
    Spacer(1, 6),
    portada_texto("Manual de capacitación", fontName="Times-Bold", fontSize=30, leading=35),
    Spacer(1, 8),
    portada_texto("Cómo armar, revisar y entregar una invitación digital",
                  fontSize=12, leading=17, textColor=SUAVE),
    Spacer(1, 30),
    portada_texto("50 diseños · 6 ocasiones · hasta 23 paletas por diseño",
                  fontSize=9.5, textColor=SUAVE),
    Spacer(1, 60 * mm),
    portada_texto(
        "Este manual está escrito para alguien que empieza hoy y que va a "
        "atender clientes reales. No explica cómo está hecho el programa: "
        "explica cómo se hace el trabajo y dónde se pierde el dinero.",
        fontSize=9.5, leading=14, textColor=SUAVE),
    PageBreak(),
]

# ── 1 · El oficio ─────────────────────────────────────────────

h += [
    Paragraph("1 · En qué consiste el trabajo", H1),
    Paragraph(
        "Una invitación es una página web con su propia dirección que se comparte "
        "por WhatsApp. Sustituye a la tarjeta impresa: se abre en el teléfono, "
        "suena, se mueve, tiene mapa y recoge las confirmaciones sola.", P),
    Paragraph(
        "Tu trabajo no es diseñar desde cero — los 50 diseños ya están hechos y "
        "sus colores están verificados para que el texto siempre se lea. Tu trabajo "
        "es <b>recoger bien los datos del cliente, meterlos donde van, revisarlo "
        "en un teléfono y entregarlo a tiempo</b>.", P),

    Paragraph("El recorrido completo", H2),
    tabla([
        ["Paso", "Qué haces", "Dónde"],
        ["1. Recibir", "El cliente manda nombres, fecha, lugar, hora y fotos, casi siempre por WhatsApp y a pedazos.", "WhatsApp"],
        ["2. Crear", "Eliges de qué parte la invitación y la creas.", "+ Nueva invitación"],
        ["3. Llenar", "Escribes los datos sección por sección.", "Editor"],
        ["4. Fotos", "Subes las imágenes que mandó el cliente.", "Editor"],
        ["5. Revisar", "La abres en un teléfono de verdad y la lees entera.", "Vista previa"],
        ["6. Demo", "Se la enseñas al cliente y anotas los cambios.", "Tablero → Demo"],
        ["7. Entregar", "Publicas, le pasas el enlace y marcas el estado.", "Tablero → Entregada"],
        ["8. Cobrar", "Marcas el sello de pago cuando entra la plata.", "Tablero"],
    ], [24 * mm, 92 * mm, 36 * mm]),
    Spacer(1, 10),
    caja("Lo único que no se puede deducir",
         "Los nombres, la fecha y el lugar vienen dados. <b>El diseño no.</b> Que la "
         "boda sea de campo o de salón, que la quinceañera quiera burdeos o lavanda, "
         "eso lo sabe el cliente. Nunca lo elijas por él: enséñale el catálogo y deja "
         "que escoja. Cambiar el diseño al final es el momento más caro para hacerlo."),

    Paragraph("2 · El tablero", H1),
    Paragraph(
        "Está en <b>/tablero</b> y responde a una pregunta que la lista de invitaciones "
        "no contesta: <i>¿cómo voy?</i> La lista ordena por lo último que tocaste; el "
        "tablero ordena por en qué punto está cada trabajo.", P),

    Paragraph("Las cuatro columnas", H2),
    tabla([
        ["Borrador", "Empezada, todavía no se le ha enseñado a nadie."],
        ["Demo", "Enviada al cliente para que la vea."],
        ["En curso", "El cliente pidió cambios y los estás aplicando."],
        ["Entregada", "Terminada y en manos del cliente."],
    ], [30 * mm, 122 * mm], cabecera=False),
    Spacer(1, 8),
    Paragraph(
        "Las tarjetas se arrastran entre columnas. En el teléfono, donde arrastrar no "
        "funciona, cada tarjeta trae un selector de columna.", P),

    Paragraph("«Publicada» no es «entregada»", H2),
    Paragraph(
        "Son dos cosas distintas y confundirlas es lo que desordena todo. "
        "<b>Publicar</b> quiere decir que la dirección pública responde — es cómo se la "
        "enseñas al cliente, y por eso una demo también se publica. <b>Entregada</b> es "
        "el estado del trabajo. Una invitación puede estar publicada y seguir en "
        "borrador, y eso es normal.", P),

    Paragraph("El sello de pago", H2),
    Paragraph(
        "«Pagada» no es una columna, es un sello sobre la tarjeta. No es el final de "
        "la fila: se cobra un anticipo de algo que sigue en curso, y se entrega algo "
        "que todavía no se ha cobrado. Arriba del tablero sale el dato que importa: "
        "<b>cuántas entregadas están sin cobrar</b>.", P),

    Paragraph("La ficha del cliente", H2),
    Paragraph(
        "Cada tarjeta esconde un <b>teléfono</b> y unas <b>notas</b>. Son privados: no "
        "se publican, no se ven en la invitación. Con el teléfono puesto aparece un "
        "enlace directo a WhatsApp. Úsalo siempre: es donde se busca el número cuando "
        "hay que preguntar algo, y las notas son donde se apunta lo que se acordó y "
        "cuánto se cobró.", P),
    Spacer(1, 4),
    caja("Lo urgente se ve solo",
         "Una invitación que se celebra dentro de <b>catorce días</b> y todavía no está "
         "entregada sale con un filo rojo y se cuenta arriba. Catorce y no siete porque "
         "una invitación se reparte con antelación: a siete días de la boda, mandarla "
         "ya llega tarde.", AVISO, AVISO_B),
    PageBreak(),
]

# ── 3 · Crear ─────────────────────────────────────────────────

h += [
    Paragraph("3 · Diseño o plantilla: la confusión más común", H1),
    Paragraph("Son dos cosas distintas y se parecen bastante como para equivocarse.", P),
    tabla([
        ["", "Diseño", "Plantilla propia"],
        ["Qué es", "Uno de los 50 modelos del catálogo. Marcado y estilo, con contenido de ejemplo.", "Una invitación que alguien guardó para volver a usarla."],
        ["Qué trae", "Textos de muestra que hay que reemplazar todos.", "El contenido y los ajustes tal como quedaron al guardarla."],
        ["Cuándo", "Cliente nuevo, estilo nuevo.", "Repetir un montaje que ya funcionó."],
    ], [22 * mm, 65 * mm, 65 * mm]),
    Spacer(1, 10),
    caja("Una plantilla no es un diseño nuevo",
         "Toda plantilla está construida <b>sobre</b> un diseño. Si «boda estelar» se "
         "guardó sobre «Blanco Oro», cada invitación que salga de ella será, por debajo, "
         "Blanco Oro — y el editor mostrará ese nombre. Eso no es un error: es la "
         "plantilla funcionando."),
    Spacer(1, 8),
    caja("Lo que una plantilla arrastra",
         "Copia <b>todo</b> lo que tenía dentro, incluido lo que nadie revisó: textos "
         "del cliente anterior, un resaltado amarillo pegado al copiar de Word, una "
         "frase que ya no viene al caso. Al partir de una plantilla, <b>léela entera</b> "
         "antes de entregar. Lo que no sobrescribas se queda.", AVISO, AVISO_B),

    Paragraph("Los 50 diseños", H2),
    tabla([
        ["Bodas", "13"], ["Quince años", "9"],
        ["Primera comunión y bautizo", "8"], ["Grados", "7"],
        ["Baby shower", "7"], ["Primer añito", "6"],
    ], [60 * mm, 20 * mm], cabecera=False),
    Spacer(1, 8),
    Paragraph(
        "Cada diseño admite varias <b>paletas</b> —hasta 23 en algunos— que cambian los "
        "colores sin cambiar el diseño. Es lo primero que hay que ofrecer cuando el "
        "cliente dice «me gusta, pero en otro color»: casi nunca hace falta cambiar de "
        "diseño.", P),
    PageBreak(),
]

# ── 4 · Las secciones ─────────────────────────────────────────

h += [
    Paragraph("4 · Las secciones, una por una", H1),
    Paragraph(
        "Una invitación se llena de arriba abajo. Las que no apliquen se apagan con su "
        "interruptor; la portada y el pie no se pueden apagar.", P),
    tabla([
        ["Sección", "Qué va ahí"],
        ["Datos del evento", "Nombres, fecha y hora, ciudad, frase, paleta y color de los botones. Lo que se escribe aquí aparece en varios sitios a la vez."],
        ["Pantalla de bienvenida", "El velo que se ve antes de entrar: nombres, botón de abrir, botón de cómo llegar, música y el vídeo de apertura."],
        ["Portada", "La primera pantalla de la invitación: antetítulo, nombres, foto de fondo, y —si el diseño lo trae— padres, bendición y párrafo."],
        ["Cuenta atrás", "Los días que faltan. Se alimenta sola de la fecha del evento."],
        ["Invitados", "El saludo personalizado a quien abre su enlace, y la dirección."],
        ["Programa", "Los momentos del día: hora, qué pasa, dónde y el botón de mapa."],
        ["Confirmación (RSVP)", "El formulario donde los invitados confirman. Se puede cambiar por un botón de WhatsApp."],
        ["Galería", "Las fotos de la pareja, con 13 maneras distintas de mostrarlas."],
        ["Información útil", "Código de vestimenta, cupos, parqueadero, hoteles, recomendaciones."],
        ["Mesa de regalos", "Enlaces a tiendas, datos de cuenta, o lluvia de sobres."],
        ["Redes y hashtag", "El hashtag de la boda y la cuenta de Instagram."],
        ["Pie de página", "Nombres, fecha y una nota final."],
    ], [38 * mm, 114 * mm]),
    Spacer(1, 8),
    Paragraph(
        "Además se pueden <b>agregar bloques</b>: Párrafo, Foto, Vídeo, Ubicación, "
        "Galería y HTML. Sirven para lo que no cabe en las secciones fijas — una "
        "historia de la pareja, un mapa extra, un vídeo de invitación.", P),

    Paragraph("El programa y sus cuatro formas", H2),
    tabla([
        ["Tarjetas", "Una tarjeta por momento, en cuadrícula."],
        ["Línea de tiempo", "Vertical, con hilo y puntos, texto centrado."],
        ["Itinerario", "Medallón con el icono, hilo vertical y a la derecha título, descripción y hora."],
        ["Lista compacta", "Filas de hora, momento y lugar."],
    ], [38 * mm, 114 * mm], cabecera=False),
    Spacer(1, 8),
    Paragraph(
        "Las fichas pueden <b>entrar animadas</b> al asomarse: alternando una por la "
        "derecha y otra por la izquierda, todas por un lado, subiendo, fundiéndose, "
        "creciendo o girando. «Alternan» es la que mejor queda cuando hay varias.", P),
    PageBreak(),
]

# ── 5 · Personalizar ──────────────────────────────────────────

h += [
    Paragraph("5 · Personalizar sin romper nada", H1),

    Paragraph("Texto por texto", H2),
    Paragraph(
        "Cada campo de texto lleva al lado su <b>tipografía</b> (53 disponibles), su "
        "<b>color</b>, su <b>alineación</b>, su <b>tamaño</b> en porcentaje y su "
        "<b>animación</b> de entrada. El antetítulo puede ir en dorado y centrado y el "
        "título en tinta y a la izquierda, dentro de la misma sección.", P),

    Paragraph("Los nombres, sitio por sitio", H2),
    Paragraph(
        "Los nombres salen en tres lugares —el velo, la portada y el pie— y cada uno "
        "tiene su propio campo: <b>Nombres del velo</b>, <b>Nombres de la portada</b> y "
        "<b>Nombres del pie</b>. No hace falta escribir nada en ellos: <b>déjalos "
        "vacíos y usa sólo el cuadradito de color de al lado</b>. Eso es lo que permite "
        "que el nombre se lea sobre una foto oscura en la portada y sobre fondo claro en "
        "el pie.", P),

    Paragraph("La capa detrás del texto", H2),
    Paragraph(
        "Sobre un fondo cargado —una ilustración, una foto con detalle— no hay color de "
        "letra que funcione en toda la superficie: lo que en una zona se lee, en la de "
        "al lado se pierde. Para eso está la <b>capa detrás del texto</b>, que todas las "
        "secciones traen: eliges un color y su transparencia, y el bloque de texto se "
        "separa del fondo sin tapar la imagen.", P),

    Paragraph("Los botones", H2),
    Paragraph(
        "<b>Forma de los botones</b>, en Datos del evento, cambia los seis botones de la "
        "invitación a la vez: rectos, esquinas suaves, redondeados o píldora. Al lado "
        "están su color de fondo y su color de texto.", P),

    Paragraph("Fondos, adornos y partículas", H2),
    lista([
        "<b>Fondo por sección</b>: una imagen, un vídeo o un color sólido, con su opacidad.",
        "<b>Fondo de toda la invitación</b>: una sola imagen continua para todas las secciones.",
        "<b>Adornos</b>: imágenes, GIF o vídeos que se colocan donde quieras, delante o detrás del texto. Un PNG con fondo transparente es lo que mejor queda.",
        "<b>Partículas</b>: pétalos, hojas, nieve, confeti, corazones, notas musicales, burbujas, globos, mariposas, luciérnagas, destellos o estrellas, sobre toda la página.",
    ]),
    caja("Menos es más, y esto es literal",
         "Tres cosas latiendo a la vez no es una invitación animada, es una pantalla "
         "inquieta. Elige <b>un</b> efecto y déjalo respirar. Lo mismo con las "
         "animaciones en bucle de los textos."),
    PageBreak(),
]

# ── 6 · Apertura, RSVP y publicar ─────────────────────────────

h += [
    Paragraph("6 · La apertura, las confirmaciones y el enlace", H1),

    Paragraph("El velo y el vídeo de apertura", H2),
    Paragraph(
        "La invitación no se abre sola: primero se ve un velo con el nombre y un botón. "
        "Ese botón es importante por una razón técnica con consecuencia práctica: "
        "<b>ningún navegador deja que una página empiece a sonar sola</b>, y pulsar el "
        "botón es lo que da permiso. Por eso la música y el vídeo de apertura sólo "
        "suenan si el invitado entra por ahí.", P),
    Paragraph(
        "El vídeo de apertura se corta a los cinco segundos y tiene once maneras de dar "
        "paso a la invitación. Si tarda en cargar, el velo espera; y si a los cuatro "
        "segundos no arranca, se entra sin él. Nunca se queda pegado.", P),

    Paragraph("Confirmaciones", H2),
    Paragraph(
        "El formulario de confirmación recoge las respuestas dentro del sistema; se ven "
        "en el editor, en el panel de confirmaciones. La alternativa es un botón de "
        "WhatsApp, que es lo que piden muchos clientes.", P),
    Paragraph(
        "Se le puede dar a cada invitado <b>su propio enlace</b>. Con él la invitación "
        "lo saluda por su nombre y no le pide escribirlo. Es la diferencia entre una "
        "invitación genérica y una que parece hecha para esa persona.", P),

    Paragraph("Publicar", H2),
    lista([
        "La <b>dirección</b> la eliges tú y debe ser corta y legible: los nombres de los novios funcionan siempre.",
        "En <b>«Al compartir el enlace»</b> se define lo que se ve en la vista previa de WhatsApp. Si se deja vacío, el cliente comparte un enlace que no dice nada.",
        "Publicar no es entregar. Marca el estado en el tablero aparte.",
    ]),
    PageBreak(),
]

# ── 7 · Errores ───────────────────────────────────────────────

h += [
    Paragraph("7 · Los errores que más cuestan", H1),
    Paragraph("Todos estos han pasado de verdad. Ninguno es hipotético.", P),
    tabla([
        ["Error", "Cómo se evita"],
        ["Elegir el diseño por el cliente", "Enséñale el catálogo y que escoja. Es lo único que no se deduce de los datos."],
        ["Partir de una plantilla y no leerla entera", "Arrastra el contenido del cliente anterior. Repásala sección por sección antes de entregar."],
        ["Dar por buena la fecha sin confirmar el día", "Comprueba el día de la semana. Un «19 de diciembre» que cae en martes casi siempre es un dato mal copiado."],
        ["Inventar la hora porque el campo la pide", "Si no la sabe, pregúntala. La cuenta atrás termina en la hora que pongas."],
        ["Poner el lugar sin el enlace de mapa", "Sin enlace no hay botón de «Cómo llegar», que es de lo más usado."],
        ["Revisar sólo en el computador", "Casi nadie la abre ahí. Ábrela en un teléfono de verdad y léela entera."],
        ["Texto claro sobre foto clara", "Usa la capa detrás del texto, o cambia el color de ese texto en concreto."],
        ["Dejar «Al compartir» vacío", "El cliente comparte un enlace mudo por WhatsApp."],
        ["Publicar y olvidar el estado", "El tablero deja de servir en cuanto deja de reflejar la realidad."],
        ["Entregar sin registrar el cobro", "El sello de pago es lo único que dice qué falta por cobrar."],
    ], [52 * mm, 100 * mm]),
    PageBreak(),
]

# ── 8 · Checklist ─────────────────────────────────────────────

h += [
    Paragraph("8 · Antes de entregar", H1),
    Paragraph("Léela en un teléfono, de arriba abajo, con esta lista al lado.", P),
    Spacer(1, 4),
]

for grupo, puntos in [
    ("Los datos", [
        "Nombres bien escritos, con sus tildes.",
        "Fecha y hora correctas — y el día de la semana confirmado.",
        "Lugar completo, con el enlace de mapa puesto y probado.",
        "Ni un texto de ejemplo del diseño ni del cliente anterior.",
    ]),
    ("Cómo se ve", [
        "Todos los textos se leen sobre su fondo.",
        "Las fotos cargan y no salen recortadas por la mitad.",
        "En un teléfono real, sin barra horizontal ni texto que se salga.",
        "La música y el vídeo de apertura arrancan al pulsar el botón.",
    ]),
    ("Lo que tiene que funcionar", [
        "El botón de «Cómo llegar» abre el mapa correcto.",
        "El formulario de confirmación envía y la respuesta llega.",
        "Los enlaces de la mesa de regalos abren donde deben.",
        "La vista previa de WhatsApp muestra título y texto.",
    ]),
    ("El cierre", [
        "La dirección pública es corta y legible.",
        "La tarjeta está en la columna correcta del tablero.",
        "El teléfono del cliente está en la ficha.",
        "El sello de pago refleja la realidad.",
    ]),
]:
    h.append(KeepTogether([Paragraph(grupo, H3), lista_check(puntos)]))

h += [
    Spacer(1, 6),
    caja("La regla que resume todas",
         "Si algo te hace dudar mirándolo, al invitado le va a pasar lo mismo — sólo que "
         "él no puede preguntar. Arréglalo antes de entregar."),

    Paragraph("9 · Glosario", H1),
    tabla([
        ["Diseño", "Uno de los 50 modelos del catálogo."],
        ["Plantilla propia", "Una invitación guardada para volver a partir de ella. Siempre está construida sobre un diseño."],
        ["Paleta", "Un juego de colores dentro de un mismo diseño."],
        ["Sección", "Cada bloque de la invitación: portada, programa, galería…"],
        ["Bloque", "Una sección que se puede agregar y repetir: párrafo, foto, vídeo, ubicación."],
        ["Velo", "La pantalla de bienvenida con el botón de abrir."],
        ["Cortina", "El vídeo que se reproduce al entrar, antes de la invitación."],
        ["Adorno", "Una imagen o vídeo colocado libremente sobre una sección."],
        ["RSVP", "La confirmación de asistencia."],
        ["Enlace de invitado", "Una dirección personal que saluda a esa persona por su nombre."],
        ["Dirección / slug", "La parte final del enlace público."],
        ["Publicada", "Su dirección pública responde. No significa entregada."],
        ["Entregada", "Estado del tablero: está en manos del cliente."],
    ], [38 * mm, 114 * mm], cabecera=False),
    Spacer(1, 14),
    Paragraph(
        "Las cifras de este manual —50 diseños, 53 tipografías, hasta 23 paletas— salen "
        "de consultar el sistema, no de la memoria de nadie. Si cambian, se vuelve a "
        "generar el documento.", PIE),
]

doc.build(h)
print(f"Escrito: {SALIDA}")
