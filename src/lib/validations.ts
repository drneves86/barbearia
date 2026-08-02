import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(1, "Informe o telefone")
  .regex(
    /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
    "Telefone inválido. Ex.: (11) 98765-4321"
  );

export const userSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  lastName: z.string().trim().min(2, "Informe o sobrenome"),
  email: z.email("E-mail inválido"),
  phone: phoneSchema,
});

export const appointmentSchema = userSchema.extend({
  serviceId: z.uuid("Serviço inválido"),
  barberId: z.uuid("Barbeiro inválido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .refine((d) => !Number.isNaN(Date.parse(`${d}T12:00:00Z`)), "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
});

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
