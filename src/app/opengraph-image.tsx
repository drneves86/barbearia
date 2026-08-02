import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/db";

export const alt = "Minha Barbearia";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  let settings: Record<string, string> = {};
  try {
    settings = await getSettings();
  } catch {
    settings = {};
  }
  const shopName = settings.barbershop_name || "Minha Barbearia";
  const shopIcon = settings.barbershop_icon || "💈";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d0d",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60%",
            background:
              "radial-gradient(800px 450px at 50% -20%, rgba(212,175,55,0.28), transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 170,
              height: 170,
              borderRadius: 42,
              border: "3px solid rgba(212,175,55,0.4)",
              backgroundColor: "#1b1b1b",
              marginBottom: 44,
            }}
          >
            <div style={{ fontSize: 120, lineHeight: 1 }}>{shopIcon}</div>
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#f2e8d5",
              textAlign: "center",
            }}
          >
            {shopName}
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 32,
              color: "#a1a1a1",
              textAlign: "center",
            }}
          >
            Agende seu corte em segundos, sem ligação e sem fila.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      emoji: "twemoji",
    }
  );
}
