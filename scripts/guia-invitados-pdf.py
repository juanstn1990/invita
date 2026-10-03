"""
Genera la guía de invitados en PDF, para quien reparte la invitación.

    python3 scripts/guia-invitados-pdf.py [salida.pdf]

Es para el cliente, no para nosotros: no habla del editor, ni del tablero, ni
de diseños. Sólo de lo que ve quien recibe el enlace del panel. Por eso va
aparte del manual de capacitación y no como un capítulo suyo — el que invita
a una boda no debería tener que saltarse treinta páginas que no le tocan.

Los textos de los botones y los estados salen de la pantalla de verdad
(`src/app/g/[token]/PanelInvitados.tsx`): una guía que llama a las cosas por
otro nombre es peor que ninguna.
"""

import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, ListFlowable, ListItem, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

SALIDA = sys.argv[1] if len(sys.argv) > 1 else "Guia-Invitados.pdf"

TINTA = colors.HexColor("#2e2a26")
SUAVE = colors.HexColor("#7d746a")
ACENTO = colors.HexColor("#7b5228")
LINEA = colors.HexColor("#e2dad0")
FONDO = colors.HexColor("#faf7f2")
AVISO = colors.HexColor("#fdf1ec")
AVISO_B = colors.HexColor("#e8c9ba")
VERDE = colors.HexColor("#eaf3ec")
VERDE_B = colors.HexColor("#bcd9c3")


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
NOTA = est("NOTA", fontSize=9.4, leading=13.6, alignment=TA_JUSTIFY)
CELDA = est("CELDA", fontSize=9.2, leading=12.8)
CELDA_B = est("CELDA_B", fontSize=9.2, leading=12.8, fontName="Helvetica-Bold")
PASO_N = est("PASO_N", fontName="Times-Bold", fontSize=19, leading=20,
             textColor=ACENTO, alignment=TA_CENTER)


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
    dentro = [Paragraph(f"<b>{titulo}</b>", NOTA), Spacer(1, 3), Paragraph(texto, NOTA)]
    t = Table([[dentro]], colWidths=[166 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("BOX", (0, 0), (-1, -1), 0.6, borde),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def paso(numero, titulo, cuerpo):
    """
    Un paso numerado, con el número en su propia columna.

    Va en tabla y no como lista numerada porque cada paso lleva dentro varios
    párrafos, a veces una tabla, y una lista de ReportLab sólo admite un
    flowable por punto sin pelearse con la sangría.
    """
    dentro = [Paragraph(titulo, H3)] + cuerpo
    t = Table([[Paragraph(str(numero), PASO_N), dentro]],
              colWidths=[13 * mm, 153 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (0, 0), "TOP"),
        ("VALIGN", (1, 0), (1, 0), "TOP"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 4),
        ("LEFTPADDING", (1, 0), (1, 0), 4),
        ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return KeepTogether(t)


def lista(puntos):
    return ListFlowable(
        [ListItem(Paragraph(p, LI), leftIndent=13) for p in puntos],
        # La viñeta se baja: a 7 pt sobre un renglón de 10 queda flotando
        # sobre la línea y parece un apóstrofo, no un punto. 
        bulletType="bullet", bulletFontSize=7, bulletOffsetY=-1.5,
        leftIndent=11, spaceAfter=6,
    )


def numerar(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SUAVE)
    if doc.page > 1:
        canvas.drawString(22 * mm, 13 * mm, "Invita · Guía del panel de invitados")
        canvas.drawRightString(A4[0] - 22 * mm, 13 * mm, str(doc.page))
        canvas.setStrokeColor(LINEA)
        canvas.setLineWidth(0.4)
        canvas.line(22 * mm, 17 * mm, A4[0] - 22 * mm, 17 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(
    SALIDA, pagesize=A4,
    leftMargin=22 * mm, rightMargin=22 * mm,
    topMargin=20 * mm, bottomMargin=22 * mm,
    title="Invita · Guía del panel de invitados",
    author="Invita",
    subject="Cómo crear los enlaces de tus invitados y ver quién confirma",
)
marco = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="cuerpo")
doc.addPageTemplates([PageTemplate(id="normal", frames=[marco], onPage=numerar)])

h = []

# ── Portada ───────────────────────────────────────────────────

h += [
    Spacer(1, 52 * mm),
    Paragraph("Invita", est("PT", alignment=TA_CENTER, fontName="Times-Italic",
                            fontSize=13, textColor=SUAVE)),
    Spacer(1, 5),
    Paragraph("Tus invitados, paso a paso",
              est("PT", alignment=TA_CENTER, fontName="Times-Bold",
                  fontSize=30, leading=34)),
    Spacer(1, 9),
    Paragraph("Cómo crear el enlace de cada familia y ver quién confirma",
              est("PT", alignment=TA_CENTER, fontSize=11.5, leading=16, textColor=SUAVE)),
    Spacer(1, 16 * mm),
    caja(
        "Antes de empezar",
        "Necesitas una sola cosa: <b>el enlace del panel</b> que te pasó quien armó "
        "tu invitación. Es una dirección que termina en <font face='Courier'>/g/</font> "
        "y una clave larga. Guárdalo donde no se te pierda —no hay usuario ni "
        "contraseña que recuperar: ese enlace <b>es</b> la llave.",
    ),
    PageBreak(),
]

# ── Qué es esto ───────────────────────────────────────────────

h += [
    Paragraph("Qué es el panel de invitados", H1),
    Paragraph(
        "Tu invitación es una página en internet. Podrías mandarle a todo el mundo "
        "la misma dirección y ya está — pero entonces quien la abre ve una "
        "invitación genérica y, para confirmar, tiene que escribir su nombre a mano.",
        P),
    Paragraph(
        "El panel sirve para algo mejor: crear <b>un enlace por familia</b>. Cada "
        "enlace lleva los nombres dentro, así que quien lo abre se ve nombrado y "
        "confirma de un toque. Y como cada enlace es distinto, el panel te dice "
        "exactamente quién abrió, quién contestó y quién sigue sin dar señales.",
        P),

    Paragraph("Lo que vas a poder hacer", H2),
    lista([
        "Crear un enlace para cada familia, pareja o grupo que invites.",
        "Reservarles un número de <b>pases</b>, para que no confirmen de más.",
        "Copiar cada enlace y mandarlo por WhatsApp.",
        "Ver quién lo abrió, cuándo, y qué contestó.",
        "Saber a quién hay que insistirle: los que la vieron y no han contestado.",
    ]),

    caja(
        "No necesitas crear una cuenta",
        "El panel se abre con el enlace y nada más. Eso lo hace cómodo y también "
        "delicado: <b>quien tenga ese enlace ve los datos de tus invitados</b>, "
        "incluidos los teléfonos que dejen al confirmar. Mándaselo sólo a quien "
        "vaya a repartir contigo.",
        AVISO, AVISO_B),
    PageBreak(),
]

# ── El paso a paso ────────────────────────────────────────────

h += [
    Paragraph("Paso a paso", H1),
    Paragraph(
        "Son cinco pasos. Los tres primeros se hacen una vez por familia; los dos "
        "últimos, cuando quieras saber cómo va la cosa.", P),
    Spacer(1, 6),

    paso(1, "Abre el panel", [
        Paragraph(
            "Pega en el navegador el enlace que te pasaron, el que termina en "
            "<font face='Courier'>/g/…</font>. Se abre una página con el nombre de "
            "tu evento arriba y, debajo, una caja que dice <b>«Crear un enlace»</b>.",
            P),
        Paragraph(
            "Funciona igual en el celular que en el computador. Para escribir muchos "
            "nombres se trabaja más cómodo en computador.", P),
        caja(
            "Si ves un aviso de que la invitación no está publicada",
            "Puedes ir creando los enlaces con tranquilidad, pero <b>todavía no "
            "abren</b>. Espera a que quien la está armando le dé a Publicar antes "
            "de repartirlos; si los mandas antes, tus invitados verán un error.",
            AVISO, AVISO_B),
    ]),

    paso(2, "Escribe quiénes van juntos", [
        Paragraph(
            "En el campo <b>Nombres</b>, escribe los nombres de quienes van a venir "
            "juntos, <b>separados por coma</b>. Una familia, una pareja, un grupo de "
            "amigos: lo que para ti es «una invitación».", P),
        tabla([
            ["Si quieres invitar a…", "Escribe"],
            ["Un matrimonio", "Ana Gómez, Carlos Gómez"],
            ["Una persona sola", "Marcela Ruiz"],
            ["Una familia con hijos", "Ana Gómez, Carlos Gómez, Sofía Gómez"],
        ], [62 * mm, 91 * mm]),
        Spacer(1, 5),
        Paragraph(
            "Debajo verás cómo va a quedar: <i>«Se verá como Ana Gómez y Carlos "
            "Gómez»</i>. Eso es exactamente lo que leerá quien abra el enlace.", P),
        Paragraph(
            "Caben hasta <b>12 nombres</b> en un mismo enlace. Si una familia es más "
            "grande, hazle dos.", P),
    ]),

    paso(3, "Reserva los pases y crea el enlace", [
        Paragraph(
            "En <b>Pases</b> pon cuántas personas pueden ir con ese enlace. La "
            "invitación se lo dice —«Hemos reservado 4 pases para ti»— y no deja "
            "confirmar más de esa cantidad. Es lo que evita que una pareja llegue "
            "con tres acompañantes.", P),
        lista([
            "Si lo dejas <b>vacío</b>, no hay límite: confirman los que quieran.",
            "El máximo por enlace es <b>50</b>.",
        ]),
        Paragraph(
            "<b>Para acordarte</b> es opcional y sólo lo ves tú: «Familia de la "
            "novia», «Trabajo de Juan». Sirve para encontrar el enlace después, "
            "cuando tengas sesenta en la lista.", P),
        Paragraph(
            "Dale a <b>Crear enlace</b>. Aparecerá de inmediato en la lista de abajo.", P),
    ]),

    paso(4, "Manda el enlace", [
        Paragraph(
            "Busca la familia en la lista y toca <b>Copiar enlace</b>. Luego pégalo "
            "en WhatsApp y mándalo.", P),
        Paragraph(
            "Si quieres ver antes qué les va a llegar, toca <b>Abrir</b>: se abre la "
            "invitación tal como la verán ellos, con sus nombres puestos.", P),
        caja(
            "Cada familia lleva su propio enlace",
            "No reenvíes el mismo a dos familias distintas: las respuestas se "
            "sumarían todas al mismo grupo y no sabrías quién contestó qué. "
            "Un enlace, una familia.",
            AVISO, AVISO_B),
    ]),

    paso(5, "Mira quién va confirmando", [
        Paragraph(
            "Arriba de la lista hay un resumen que se actualiza solo: cuántos "
            "enlaces hay, cuántos pases reservaste, cuántas familias confirmaron y "
            "cuántas siguen sin responder.", P),
        Paragraph(
            "Si no ves un cambio que esperabas, baja del todo y toca "
            "<b>Actualizar</b>.", P),
    ]),
    # Sin salto: el paso 4 no cabe en su página y empuja al 5, así que un
    # salto aquí dejaba media hoja en blanco. Lo que sigue la llena.
    Spacer(1, 4),
]

# ── Cómo leer la lista ────────────────────────────────────────

h += [
    Paragraph("Cómo leer la lista", H1),
    Paragraph(
        "Cada familia es una fila. A la derecha hay dos cosas que no significan lo "
        "mismo y conviene no confundir: <b>si contestaron</b> y <b>si abrieron</b>.",
        P),

    Paragraph("Si contestaron", H2),
    tabla([
        ["Lo que dice", "Qué significa"],
        ["Sin respuesta", "No han contestado todavía."],
        ["Confirmado", "Vienen."],
        ["No asiste", "No van a poder."],
        ["Vienen algunos", "Unos sí y otros no, dentro de la misma familia."],
    ], [40 * mm, 113 * mm]),
    Spacer(1, 4),
    Paragraph(
        "Si pusiste pases, al lado verás cuántos de ellos se usaron: "
        "<i>«Confirmado · 3 de 4»</i>.", P),

    Paragraph("Si abrieron", H2),
    tabla([
        ["Lo que dice", "Qué significa"],
        ["Sin abrir", "Nadie de esa familia ha abierto la invitación."],
        ["Vista hace…", "La abrieron, y cuándo fue la última vez."],
    ], [40 * mm, 113 * mm]),
    Spacer(1, 6),

    caja(
        "La cuenta que de verdad te sirve",
        "Arriba aparece <b>«la vieron y no han contestado»</b>. Esa es la lista a la "
        "que hay que insistirle: ya tienen el enlace y funciona, sólo les falta "
        "responder. Los que están <b>«sin abrir»</b> necesitan otra cosa —que les "
        "vuelvas a mandar el enlace—, porque puede que ni les haya llegado.",
        VERDE, VERDE_B),

    # Encabezado y párrafo juntos: suelto, el título se quedaba al pie de una
    # página y su explicación empezaba en la siguiente.
    KeepTogether([
        Paragraph("Las respuestas, una por una", H2),
        Paragraph(
            "Cuando una familia contesta, debajo de su fila aparece quién respondió "
            "qué: <b>Asiste</b>, <b>No asiste</b> o <b>Tal vez</b>. Si dejaron "
            "teléfono, puedes tocarlo para llamar, y si escribieron un mensaje lo "
            "verás ahí mismo entre comillas.", P),
    ]),

    KeepTogether([
        Paragraph("«Confirmaron sin un enlace»", H2),
        Paragraph(
            "Si al final de la página aparece esta sección, son personas que entraron "
            "a la invitación por su cuenta —sin usar uno de tus enlaces— y escribieron "
            "su nombre. Cuentan igual, pero no hay a qué familia sumarlos. Suele pasar "
            "cuando alguien reenvía la dirección general en vez del enlace personal.",
            P),
    ]),
    Spacer(1, 4),
]

# ── Dudas ─────────────────────────────────────────────────────

h += [
    Paragraph("Dudas que salen siempre", H1),

    Paragraph("Me equivoqué en un nombre", H3),
    Paragraph(
        "Borra el enlace con la <b>✕</b> y crea otro con el nombre bien. Si ya lo "
        "habías mandado, manda el nuevo: el viejo deja de funcionar.", P),

    Paragraph("¿Puedo borrar un enlace que ya contestaron?", H3),
    Paragraph(
        "Puedes, pero perderías su respuesta. Si sólo quieres corregir el nombre y "
        "ya confirmaron, déjalo como está y anótalo aparte.", P),

    Paragraph("Confirmaron de menos y ahora viene uno más", H3),
    Paragraph(
        "Que vuelvan a abrir su mismo enlace y confirmen otra vez. La respuesta "
        "nueva reemplaza a la anterior, no se suma — así que no van a quedar "
        "contados dos veces.", P),

    Paragraph("¿Cuántos enlaces puedo crear?", H3),
    Paragraph("Los que necesites. No hay límite.", P),

    Paragraph("¿Se enteran de que los estoy viendo?", H3),
    Paragraph(
        "No. Que sepas si abrieron o no es sólo para ti; en la invitación no "
        "aparece nada de eso.", P),

    Paragraph("Perdí el enlace del panel", H3),
    Paragraph(
        "Pídeselo otra vez a quien armó tu invitación: lo tiene a mano y te lo "
        "puede volver a pasar.", P),

    Spacer(1, 8),
    caja(
        "Un consejo antes de repartir",
        "Créate <b>un enlace de prueba con tu propio nombre</b> y ábrelo desde tu "
        "celular. Vas a ver la invitación exactamente como la verán tus invitados, y "
        "puedes confirmar para comprobar que la respuesta llega al panel. Luego "
        "bórralo con la ✕ y empieza con los de verdad.",
        VERDE, VERDE_B),
]

doc.build(h)
print(f"Listo: {SALIDA}")
