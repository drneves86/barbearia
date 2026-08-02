import { getAdminSession } from "@/lib/auth";
import { createBarber, listBarbers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ barbers: await listBarbers(false) });
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

  const name = (body as { name?: string })?.name?.trim();
  if (!name || name.length < 2) {
    return Response.json({ error: "Informe o nome do barbeiro." }, { status: 400 });
  }

  try {
    const barber = await createBarber(name);
    return Response.json({ barber }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
