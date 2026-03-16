import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

// ─── Spool icon (inline SVG — sem dependências) ───────────────────────────────
function SpoolIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
      <circle
        cx="20"
        cy="20"
        r="7"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
      <line
        x1="20"
        y1="13"
        x2="20"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="26.9"
        y1="16"
        x2="33"
        y2="7.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="26.9"
        y1="24"
        x2="33"
        y2="32.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="27"
        x2="20"
        y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13.1"
        y1="24"
        x2="7"
        y2="32.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13.1"
        y1="16"
        x2="7"
        y2="7.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 20 2 A 18 18 0 0 1 38 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* ── Logo + wordmark ── */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
            <SpoolIcon />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Spool<span className="text-primary">IQ</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Smart filament management
            </p>
          </div>
        </div>

        {/* ── Card do formulário ── */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">
              Entrar na conta
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Introduz as tuas credenciais para continuar.
            </p>
          </div>
          <LoginForm />
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          SpoolIQ · Print smarter, not harder.
        </p>
      </div>
    </div>
  );
}
