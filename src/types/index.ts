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

export interface SalesChartData {
  date: string;
  revenue: number;
}

export interface TopProductData {
  name: string;
  totalSold: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface FilamentType {
  id: number;
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
}

export interface ProductFilamentUsage {
  id: number;
  productId: number;
  filamentTypeId: number;
  weight: number;
  filamentType?: FilamentType;
}

export interface Extra {
  id: number;
  name: string;
  price: number;
  unit?: string | null;
}

export interface ProductExtra {
  id: number;
  productId: number;
  extraId: number;
  quantity: number;
  extra?: Extra;
}
