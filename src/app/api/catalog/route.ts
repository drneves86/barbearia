import { listBarbers, listServices } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [services, barbers] = await Promise.all([
      listServices(true),
      listBarbers(true),
    ]);
    return Response.json({ services, barbers });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
