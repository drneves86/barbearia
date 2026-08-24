import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const serviceId = formData.get("serviceId") as string | null;

  if (!file || !serviceId) {
    return Response.json(
      { error: "Arquivo e serviceId são obrigatórios." },
      { status: 400 }
    );
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: "Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF." },
      { status: 400 }
    );
  }

  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return Response.json(
      { error: "Arquivo muito grande. Máximo 2MB." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `service-images/${serviceId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin()
    .storage
    .from("service-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return Response.json(
      { error: `Erro ao enviar imagem: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin()
    .storage
    .from("service-images")
    .getPublicUrl(path);

  return Response.json({ url: urlData.publicUrl });
}
