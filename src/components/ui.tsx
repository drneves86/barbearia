import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<string, string> = {
    primary:
      "bg-gold text-ink shadow-[0_8px_30px_rgba(212,175,55,0.25)] hover:bg-gold/90",
    secondary:
      "border border-line bg-panel text-cream hover:border-gold/50 hover:text-gold",
    ghost: "text-muted hover:bg-panel hover:text-cream",
    danger:
      "bg-crimson/90 text-white hover:bg-crimson",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs text-muted/70">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs text-crimson">{error}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full rounded-xl border border-line bg-panel px-4 text-cream outline-none transition placeholder:text-muted/50 focus:border-gold/60 focus:ring-2 focus:ring-gold/20 ${className}`}
      {...props}
    />
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-red-200">
      <span className="text-lg leading-none">⚠</span>
      <span>{message}</span>
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
