import { getAdminSession } from "@/lib/auth";
import { createService, listServices, supabaseAdmin } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ services: await listServices(false) });
}

export async function POST(request: Request) {
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

  const { name, price, emoji, imageUrl } = body as { name?: string; price?: number; emoji?: string; imageUrl?: string };
  const priceCents = Math.round(Number(price ?? NaN));
  if (!name || name.trim().length < 2 || Number.isNaN(priceCents) || priceCents < 0) {
    return Response.json(
      { error: "Informe nome e preço válidos." },
      { status: 400 }
    );
  }

  try {
    const service = await createService({
      name: name.trim(),
      priceCents,
      emoji: emoji || "💈",
      imageUrl: imageUrl || undefined,
    });
    return Response.json({ service }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}

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

  const { positions } = body as { positions?: { id: string; position: number }[] };
  if (!positions || !Array.isArray(positions)) {
    return Response.json({ error: "Positions inválidas." }, { status: 400 });
  }

  try {
    for (const { id, position } of positions) {
      await supabaseAdmin()
        .from("services")
        .update({ position })
        .eq("id", id);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
