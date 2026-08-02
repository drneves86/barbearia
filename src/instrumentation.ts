export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const baseUrl = (process.env.BASE_URL || "https://barbearia-qosa.onrender.com").replace(/\/+$/, "");

  const timer = setInterval(() => {
    fetch(`${baseUrl}/api/health`)
      .then((res) => {
        if (!res.ok) {
          console.warn(`[keepalive] health check retornou status ${res.status}`);
        }
      })
      .catch((err) => {
        console.warn(`[keepalive] falha ao pingar: ${err.message}`);
      });
  }, 5 * 60 * 1000);

  timer.unref?.();
}
