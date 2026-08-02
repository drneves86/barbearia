export const BARBERSHOP_NAME = "Minha Barbearia";

export const CURRENCY_SYMBOL = "$";

// Dia útil da semana (getDay()): 0 = domingo, 1 = segunda ... 6 = sábado
// Atendimento de segunda a sexta.
export const WORKING_DAYS = [1, 2, 3, 4, 5] as const;

// Datas fechadas excepcionais no formato 'YYYY-MM-DD' (ex.: feriados)
export const DAYS_OFF: string[] = [];

export const OPEN_TIME = "08:00";
export const CLOSE_TIME = "18:00";
export const SLOT_MINUTES = 30;
export const LUNCH_BREAK = { start: "12:00", end: "13:00" };

// Quantos dias à frente o calendário permite agendar
export const MAX_FUTURE_DAYS = 45;

export const TIMEZONE = "America/Sao_Paulo";

export function formatPrice(cents: number): string {
  return `${CURRENCY_SYMBOL}${(cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
