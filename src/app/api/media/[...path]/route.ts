import { NextResponse } from "next/server";
import { readImage } from "@/lib/storage";

/** Sirve una imagen subida. El nombre es aleatorio, así que se cachea para siempre. */
export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  const file = await readImage(params.path.join("/"));
  if (!file) return new NextResponse("No encontrada", { status: 404 });

  return new NextResponse(file.bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
