/**
 * Dispara um evento global que faz o AlertsHeader recarregar imediatamente.
 * Chama esta função após qualquer ação que altere stock:
 * - ajuste de bobine
 * - registo de produção
 * - registo de venda
 * - edição de filamento
 */
export function refreshAlerts() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("refresh-alerts"));
  }
}
