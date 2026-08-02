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
  date: string;
  time: string;
  cancelUrl: string;
}): string {
  return [
    "Olá! 👋",
    "",
    `Novo agendamento na ${opts.barbershop}. 💈`,
    "",
    `🧔 Cliente: ${opts.clientName}`,
    `✂️ Serviço: ${opts.serviceName}`,
    `📅 Data: ${formatDateBR(opts.date)}`,
    `⏰ Horário: ${opts.time}`,
    "",
    "Caso precise cancelar, acesse:",
    opts.cancelUrl,
    "",
    "Obrigado!",
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
