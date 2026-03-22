import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const messages: Record<string, { title: string; description: string }> = {
    confirm: {
      title: "Link inválido ou expirado",
      description:
        "O link de confirmação já não é válido. Por favor solicita um novo.",
    },
    default: {
      title: "Ocorreu um erro",
      description:
        "Algo correu mal durante a autenticação. Por favor tenta novamente.",
    },
  };

  const content = messages[error ?? "default"] ?? messages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 p-8 rounded-xl border border-border bg-card text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">
            {content.title}
          </h1>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/sign-in"
            className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors text-center"
          >
            Voltar ao login
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
