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
  cancelUrl: string;
}): string {
  return [
    `💈 ${opts.barbershop} 💈`,
    "",
    "Confirmação de Agendamento",
    "",
    "",
    `👥 Olá, ${opts.clientName}!`,
    "",
    "",
    "━━━━━━━━━━━━━━━",
    "",
    "",
    "Detalhes do agendamento:",
    `💇🏽‍♂️ PROFISSIONAL: ${opts.barberName}`,
    `🧰 SERVIÇO: ${opts.serviceName}`,
    `💰 VALOR: ${opts.price}`,
    `📌 DIA: ${formatDateBR(opts.date)}`,
    `⌚ HORÁRIO: ${opts.time}`,
    "",
    "",
    "━━━━━━━━━━━━━━━",
    "",
    "",
    "✅ Seu horário já foi confirmado automaticamente.",
    "",
    "",
    "━━━━━━━━━━━━━━━",
    "",
    "",
    "❌ Cancelar horário:",
    opts.cancelUrl,
    "━━━━━━━━━━━━━━━",
    "",
    "",
    "⏰ O cancelamento pode ser feito até 30 minuto(s) antes do horário agendado.",
    "",
    "",
    "COMPROVANTE DE AGENDAMENTO",
  ].join("\n");
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
