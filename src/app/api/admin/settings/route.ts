import { getAdminSession } from "@/lib/auth";
import { saveSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const patch = (body as Record<string, unknown>) ?? {};
  const ALLOWED = ["barbershop_name", "barbershop_icon", "barbershop_location", "barbershop_address", "footer_copyright", "footer_credit"];
  const entries = Object.entries(patch).filter(
    ([key, value]) => ALLOWED.includes(key) && typeof value === "string"
  );
  if (entries.length === 0) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const toSave = Object.fromEntries(entries) as Record<string, string>;
  try {
    await saveSettings(toSave);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
