import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Background } from "@/components/background";
import ServiceWorkerRegister from "@/components/sw-register";
import { getSettings } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => ({} as Record<string, string>));
  const shopName = settings.barbershop_name || "Minha Barbearia";
  return {
    metadataBase: new URL(
      process.env.BASE_URL || "https://barbearia-qosa.onrender.com"
    ),
    title: {
      default: shopName,
      template: `%s | ${shopName}`,
    },
    description: "Agende seu horário com apenas alguns toques.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: shopName,
    },
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Background />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
