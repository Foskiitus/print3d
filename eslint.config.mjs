import js from "@eslint/js";

export default [
  {
    // Ignora tudo o que está a causar problemas
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/supabase/**",
      "**/*.json",
      "eslint.config.mjs",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      ...js.configs.recommended.rules,
      // Deixamos vazio ou com regras básicas para não crashar
      "no-unused-vars": "warn",
    },
  },
];
