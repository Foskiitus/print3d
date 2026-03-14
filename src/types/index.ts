export interface Printer {
  id: number;
  name: string;
  model?: string | null;
  hourlyCost: number;
  electricity: number; // Nome corrigido (estava electricityW)
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  productionTime?: number | null;
  price: number; // Nome corrigido (no schema é 'price')
  margin: number;
  categoryId?: number | null;

  // Relações
  category?: Category | null;
  filamentUsage?: ProductFilamentUsage[];
  extras?: ProductExtra[];

  // Campos virtuais (calculados pela API)
  stockLevel?: number;
  calculatedCosts?: {
    filament: number;
    extras: number;
    machine: number;
    total: number;
    suggestedPrice: number;
  };
}
