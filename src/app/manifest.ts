import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings().catch(() => ({} as Record<string, string>));
  const shopName = settings.barbershop_name || "Minha Barbearia";
  return {
    name: shopName,
    short_name: "Barbearia",
    description: "Agende seu horário com apenas alguns toques.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0d0d",
    theme_color: "#0d0d0d",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
