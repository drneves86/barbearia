export function formatDateBR(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWaLink(phone: string, message: string): string {
  return `whatsapp://send?phone=55${phoneDigits(phone)}&text=${encodeURIComponent(message)}`;
}

export function confirmationMessage(opts: {
  barbershop: string;
  barberName: string;
  clientName: string;
  serviceName: string;
  price: string;
  date: string;
  time: string;
  address: string;
  location: string;
  cancelUrl: string;
}): string {
  const sep = "────────────";
  const lines = [
    `Olá, ${opts.barberName}!`,
    `Novo agendamento em *${opts.barbershop}*`,
    "",
    sep,
    `Cliente: *${opts.clientName}*`,
    `Serviço: ${opts.serviceName}`,
    `Valor: ${opts.price}`,
    `Data: ${formatDateBR(opts.date)}`,
    `Horário: ${opts.time}`,
  ];
  if (opts.address) {
    lines.push(`Local: ${opts.address}`);
  }
  if (opts.location) {
    lines.push(`Mapa: ${opts.location}`);
  }
  lines.push(
    sep,
    `Cancelar: ${opts.cancelUrl}`,
    sep,
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
    `Olá!`,
    "",
    `Um horário na ${opts.barbershop} foi cancelado.`,
    "",
    `Cliente: ${opts.clientName}`,
    `Data: ${formatDateBR(opts.date)}`,
    `Horário: ${opts.time}`,
    "",
    "Até a próxima!",
  ].join("\n");
}
