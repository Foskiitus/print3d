import { CheckCircle } from "lucide-react";
import { SpoolIQLogo } from "@/components/ui/logo";

interface Purchase {
  qrCodeId: string;
  initialWeight: number;
  currentWeight: number;
  tareWeight: number;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
}

export function SpoolPublicView({ purchase }: { purchase: Purchase }) {
  const usable = purchase.initialWeight - purchase.tareWeight;
  const remaining = Math.max(0, purchase.currentWeight - purchase.tareWeight);
  const pct = usable > 0 ? Math.round((remaining / usable) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <SpoolIQLogo />
        </div>

        <div className="card text-center space-y-4">
          {/* Indicador válido */}
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Rolo Válido</span>
          </div>

          {/* Cor */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full border-4 border-white/10"
              style={{
                backgroundColor: purchase.item.colorHex,
                boxShadow: `0 0 24px ${purchase.item.colorHex}66`,
              }}
            />
          </div>

          {/* Identificação */}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-theme">
              {purchase.item.material} · {purchase.item.colorName}
            </p>
            <p className="text-sm text-navy-400">{purchase.item.brand}</p>
            <p className="text-xs font-mono text-dark-subtle">
              #{purchase.qrCodeId}
            </p>
          </div>

          {/* Barra de peso */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-navy-400">
              <span>{remaining}g restantes</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-theme/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor:
                    pct > 50
                      ? purchase.item.colorHex
                      : pct > 20
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-dark-subtle">
          Gerido com SpoolIQ · spooliq.app
        </p>
      </div>
    </div>
  );
}
