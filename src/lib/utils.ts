import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT").format(new Date(date));
}

/**
 * Cálculos de Produção 3D
 */

// Preço médio do kWh em Portugal (pode ser movido para .env no futuro)
const ELECTRICITY_KWH_PRICE = 0.26; // €/kWh

interface ProductionCostsParams {
  printTimeMinutes: number;
  weightGrams: number;
  spoolPrice: number;
  spoolWeightGrams: number;
  printerWattage: number;
  printerHourlyCost: number; // Este é o valor da tua amortização (ex: 0.26)
}

export function calculateProductionCosts({
  printTimeMinutes,
  weightGrams,
  spoolPrice,
  spoolWeightGrams,
  printerWattage,
  printerHourlyCost,
}: ProductionCostsParams) {
  const hours = printTimeMinutes / 60;

  // 1. Custo do Filamento: (Preço da Bobine / Peso da Bobine) * Gramas Usadas
  const filamentCost = (spoolPrice / spoolWeightGrams) * weightGrams;

  // 2. Custo de Energia: (W / 1000) * Horas * Preço kWh
  const energyCost = (printerWattage / 1000) * hours * ELECTRICITY_KWH_PRICE;

  // 3. Custo de Amortização/Manutenção: Horas * Custo Horário da Máquina
  const maintenanceCost = hours * printerHourlyCost;

  const totalCost = filamentCost + energyCost + maintenanceCost;

  return {
    filamentCost: Number(filamentCost.toFixed(4)),
    energyCost: Number(energyCost.toFixed(4)),
    maintenanceCost: Number(maintenanceCost.toFixed(4)),
    totalCost: Number(totalCost.toFixed(2)), // Arredondamos o total para cêntimos
  };
}
