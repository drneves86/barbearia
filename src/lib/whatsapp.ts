export function formatDateBR(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/55${phoneDigits(phone)}?text=${encodeURIComponent(message)}`;
}

export function confirmationMessage(opts: {
  barbershop: string;
  barberName: string;
  clientName: string;
  serviceName: string;
  price: string;
  date: string;
  time: string;
  location: string;
  cancelUrl: string;
}): string {
  const sep = "__________";
  const lines = [
    `💈 ${opts.barbershop} 💈`,
    "",
    "CONFIRMAÇÃO DE AGENDAMENTO",
    "",
    `👥 Olá, ${opts.barberName}!`,
    sep,
    "Detalhes do agendamento:",
    `💇🏻‍♂️ CLIENTE: ${opts.clientName}`,
    `✂️ PROFISSIONAL: ${opts.barberName}`,
    `💼 SERVIÇO: ${opts.serviceName}`,
    `💵 VALOR: ${opts.price}`,
    `📌 DIA: ${formatDateBR(opts.date)}`,
    `🕜 HORÁRIO: ${opts.time}`,
  ];
  if (opts.location) {
    lines.push(`📍LOCAL: ${opts.location}`);
  }
  lines.push(
    sep,
    "✅ Seu horário já foi confirmado automaticamente.",
    sep,
    "❌ Cancelar horário:",
    opts.cancelUrl,
    sep,
    "⏰ O cancelamento pode ser feito até 30 minuto(s) antes do horário agendado.",
    sep
  );
  return lines.join("\n");
}

export function cancellationMessage(opts: {
  barbershop: string;
  barberName: string;
  clientName: string;
  date: string;
  time: string;
}): string {
  return [
    "Olá! 👋",
    "",
    `Um horário na ${opts.barbershop} foi cancelado.`,
    "",
    `🧔 Cliente: ${opts.clientName}`,
    `📅 Data: ${formatDateBR(opts.date)}`,
    `⏰ Horário: ${opts.time}`,
    "",
    "Até a próxima!",
  ].join("\n");
}
