/**
 * Bloqueia teclas não numéricas em campos <input type="number">.
 *
 * Uso:
 *   <Input type="number" {...numericInputProps} value={...} onChange={...} />
 *
 * Permite: dígitos (0-9), Backspace, Delete, Tab, Enter, setas, Home, End,
 * Ctrl/Cmd+A/C/V/X, e o ponto/vírgula decimal (se allowDecimal=true).
 */
export function numericInputProps(allowDecimal = false) {
  return {
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowed = [
        "Backspace",
        "Delete",
        "Tab",
        "Enter",
        "Escape",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];

      // Ctrl/Cmd shortcuts (select all, copy, paste, cut)
      if (e.ctrlKey || e.metaKey) return;

      // Teclas de controlo permitidas
      if (allowed.includes(e.key)) return;

      // Dígitos
      if (/^\d$/.test(e.key)) return;

      // Decimal (ponto ou vírgula) — apenas um por campo
      if (allowDecimal && (e.key === "." || e.key === ",")) {
        const value = (e.currentTarget as HTMLInputElement).value;
        if (!value.includes(".") && !value.includes(",")) return;
      }

      // Bloquear tudo o resto
      e.preventDefault();
    },
    // Impede colar texto não numérico
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      const pattern = allowDecimal ? /^-?\d*[.,]?\d*$/ : /^\d+$/;
      if (!pattern.test(text)) e.preventDefault();
    },
  };
}
