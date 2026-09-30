import { prisma } from "@/lib/prisma";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import { coupleName, resolvedDateLabel, type InvitationData } from "@/lib/schema";
import { eventoLlego, fechaActivacionDe } from "@/lib/disponibilidadEvento";
import { configFotos } from "@/lib/fotosEvento";
import { sesionActual } from "@/lib/auth";
import { Galeria } from "../../editor/[id]/fotos/Galeria";
import { Camara } from "./Camara";
import { GaleriaPropia } from "./GaleriaPropia";
import styles from "./fotos.module.css";

export const dynamic = "force-dynamic";

/**
 * La página de la cámara: a donde lleva el botón «Comparte tus fotos» de la
 * invitación, y el QR que se enseña impreso en el evento.
 *
 * Página propia y no un modal dentro de la invitación: en el celular de un
 * invitado, entrar aquí desde el QR de una mesa tiene que funcionar igual que
 * entrar desde el botón — y un modal no tiene dirección propia que un QR
 * pueda apuntar.
 *
 * Quien tiene sesión —el organizador— ve esto aunque la invitación no esté
 * publicada o el evento no haya llegado, con un aviso arriba y, debajo de la
 * cámara, el álbum entero para mirar y descargar: es lo que hace posible
 * probarlo desde la vista previa del editor, y lo que le permite a quien
 * organiza sin cuenta ver sus fotos con su enlace privado (`?t=` con el
 * `manageToken` de la invitación), sin tener que iniciar sesión.
 */
export default async function FotosPage({
  params, searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string };
}) {
  const invitation = await prisma.invitation.findUnique({ where: { slug: params.slug } });
  const esOrganizador = !!(await sesionActual());
  const token = String(searchParams?.t || "");
  const esCliente = !!invitation?.manageToken && !!token && invitation.manageToken === token;
  const accesoCompleto = esOrganizador || esCliente;

  if (!invitation || (!invitation.published && !accesoCompleto)) {
    return (
      <main className={styles.pageAviso}>
        <p>
          {invitation
            ? "Esta invitación todavía no está publicada."
            : "No encontramos esta invitación."}
        </p>
      </main>
    );
  }

  const tpl = TEMPLATE_BY_ID[invitation.templateId];
  const data = JSON.parse(invitation.data) as InvitationData;
  const nombre = coupleName(data) || invitation.title;
  const acento = tpl?.palette?.[1] || "#8a6a2f";
  const fecha = fechaActivacionDe(data, "fotos");

  /* Una foto del salón vacío tres semanas antes no es lo que esto pide: se
     abre el día del evento y no vuelve a cerrarse. Ver `eventoLlego`. */
  if (!eventoLlego(fecha) && !accesoCompleto) {
    return (
      <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
        <div className={styles.tarjeta}>
          <p className={styles.eyebrow}>{nombre}</p>
          <h1 className={styles.titulo}>Todavía no</h1>
          <p className={styles.texto}>
            Esto se abre el día del evento{resolvedDateLabel(data) ? `, el ${resolvedDateLabel(data)}` : ""}.
            Vuelve entonces para dejar tus fotos.
          </p>
        </div>
      </main>
    );
  }

  const avisoAcceso = accesoCompleto && (!invitation.published || !eventoLlego(fecha));
  const { visibilidad } = configFotos(data);
  /* Quien organiza ve siempre el álbum entero, decida lo que decida para
     los invitados: "privado"/"propias"/"público" es sobre lo que ve un
     invitado, no sobre si tú puedes verlo. */
  const verTodas = accesoCompleto || visibilidad === "publico";

  let fotos: { id: string; url: string; autor: string | null; kb: number }[] = [];
  if (verTodas) {
    const registros = await prisma.eventPhoto.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "desc" },
    });
    /* Al enlace privado le hace falta el token en cada foto: la ruta que las
       sirve pide sesión, ese mismo `manageToken` por `?t=`, o un álbum que
       ya no sea privado. Con sesión, o con el álbum público, no hace falta
       —el token queda vacío y la ruta lo acepta igual—. */
    const sufijo = esCliente ? `?t=${encodeURIComponent(token)}` : "";
    fotos = registros.map((f) => ({
      id: f.id,
      url: `/api/fotos-evento/${f.url}${sufijo}`,
      autor: f.autor,
      kb: Math.round(f.bytes / 1024),
    }));
  }

  return (
    <main className={styles.page} style={{ "--acento": acento } as React.CSSProperties}>
      <div className={styles.tarjeta}>
        {avisoAcceso && (
          <p className={styles.avisoOrganizador}>
            Estás viendo el panel completo — los invitados todavía no ven esto.
          </p>
        )}
        <p className={styles.eyebrow}>{nombre}</p>
        <h1 className={styles.titulo}>Comparte tus fotos</h1>
        <p className={styles.texto}>
          Ayúdanos a guardar cada momento del día: toma una foto y déjanosla aquí.
        </p>
        <Camara slug={invitation.slug} />
      </div>

      {(accesoCompleto || visibilidad !== "privado") && (
        <div className={styles.tarjetaAncha}>
          <h2 className={styles.tituloAlbum}>
            {accesoCompleto ? "El álbum completo" : visibilidad === "publico" ? "El álbum" : "Mis fotos"}
          </h2>
          <p className={styles.texto}>
            {accesoCompleto
              ? "Mira y descarga todas las fotos que han dejado."
              : visibilidad === "publico"
                ? "Mira y descarga las fotos que han dejado todos."
                : "Las que tú has subido — cada quien ve sólo las suyas."}
          </p>
          {verTodas ? (
            <Galeria invitationId={invitation.id} inicial={fotos} puedeBorrar={esOrganizador} />
          ) : (
            <GaleriaPropia slug={invitation.slug} />
          )}
        </div>
      )}
    </main>
  );
}
