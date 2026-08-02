"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox, Field, Input, Spinner } from "@/components/ui";
import { PhoneInput } from "@/components/phone-input";
import { userSchema } from "@/lib/validations";
import { BARBERSHOP_NAME } from "@/lib/config";

const USER_KEY = "barbearia-user";

type Errors = Partial<Record<"name" | "lastName" | "email" | "phone", string>>;

export function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const result = userSchema.safeParse(form);
    if (!result.success) {
      const errs: Errors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof Errors;
        if (path && !errs[path]) errs[path] = issue.message;
      }
      setErrors(errs);
      setGeneral(errs.name || errs.lastName || errs.email || errs.phone || null);
      return false;
    }
    setErrors({});
    return true;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(form));
      router.push("/agendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <ErrorBox message={general} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="João"
            autoComplete="given-name"
          />
        </Field>
        <Field label="Sobrenome" error={errors.lastName}>
          <Input
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="Silva"
            autoComplete="family-name"
          />
        </Field>
      </div>
      <Field label="E-mail" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="voce@email.com"
          autoComplete="email"
        />
      </Field>
      <Field
        label="Telefone (WhatsApp)"
        hint="Usado para enviar a confirmação do horário."
        error={errors.phone}
      >
        <PhoneInput
          value={form.phone}
          onChange={(v) => set("phone", v)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner className="h-5 w-5" /> : null}
        Agendar meu horário
      </Button>
      <p className="text-center text-xs text-muted/70">
        Você poderá escolher o serviço, o barbeiro, a data e o horário na
        próxima etapa. Bem-vindo à {BARBERSHOP_NAME}.
      </p>
    </form>
  );
}
