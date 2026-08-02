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
  serviceName: string;
  date: string;
  time: string;
  cancelUrl: string;
}): string {
  return [
    "Olá! 👋",
    "",
    `Passando para confirmar o seu horário na ${opts.barbershop}. 💈`,
    `Seu atendimento está reservado com o barbeiro ${opts.barberName} para o dia ${formatDateBR(opts.date)}, às ${opts.time} (${opts.serviceName}).`,
    "",
    "Caso precise remarcar ou cancelar, é só nos avisar com antecedência.",
    "",
    `Para cancelar, acesse: ${opts.cancelUrl}`,
    "",
    "Esperamos você! Até breve! 😎",
  ].join("\n");
}

export function cancellationMessage(opts: {
  barbershop: string;
  barberName: string;
  date: string;
  time: string;
}): string {
  return [
    "Olá! 👋",
    "",
    `Recebemos a solicitação de cancelamento e o seu horário na ${opts.barbershop} foi removido da agenda com sucesso.`,
    `Era o atendimento com o barbeiro ${opts.barberName} no dia ${formatDateBR(opts.date)}, às ${opts.time}.`,
    "",
    "Se desejar agendar um novo horário futuramente, será um prazer atendê-lo(a). 💈",
    "Até a próxima!",
  ].join("\n");
}
