import { t, type DeclarationContent } from "intlayer";

const usersContent = {
  key: "users",
  content: {
    // ── Page header ──────────────────────────────────────────────
    page: {
      title: t({ en: "Users", pt: "Utilizadores" }),
      heading: t({ en: "Users", pt: "Utilizadores" }),
      description: t({
        en: "System access management.",
        pt: "Gestão de acessos ao sistema.",
      }),
    },

    // ── Create dialog ────────────────────────────────────────────
    dialog: {
      triggerButton: t({ en: "New User", pt: "Novo Utilizador" }),
      title: t({ en: "Create User", pt: "Criar Utilizador" }),
      fields: {
        name: t({ en: "Name", pt: "Nome" }),
        email: t({ en: "Email", pt: "Email" }),
        password: t({ en: "Password", pt: "Password" }),
        role: t({ en: "Role", pt: "Role" }),
      },
      submitButton: t({ en: "Create User", pt: "Criar Utilizador" }),
      submitting: t({ en: "Creating...", pt: "A criar..." }),
    },

    // ── Table ────────────────────────────────────────────────────
    table: {
      name: t({ en: "Name", pt: "Nome" }),
      email: t({ en: "Email", pt: "Email" }),
      role: t({ en: "Role", pt: "Role" }),
      createdAt: t({ en: "Created at", pt: "Criado em" }),
      empty: t({
        en: "No users found.",
        pt: "Nenhum utilizador encontrado.",
      }),
    },

    // ── Fallback name ────────────────────────────────────────────
    noName: t({ en: "No Name", pt: "Sem Nome" }),

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      created: t({ en: "User created!", pt: "Utilizador criado!" }),
      deleted: t({ en: "User deleted.", pt: "Utilizador apagado." }),
      createError: t({
        en: "Error creating user",
        pt: "Erro ao criar utilizador",
      }),
      confirmDelete: t({
        en: "Are you sure you want to delete this user?",
        pt: "Tens a certeza que queres apagar este utilizador?",
      }),
    },
  },
} satisfies DeclarationContent;

export default usersContent;
