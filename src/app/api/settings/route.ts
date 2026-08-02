import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ settings: await getSettings() });
}
