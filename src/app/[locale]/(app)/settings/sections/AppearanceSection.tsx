"use client";

import { useTheme } from "next-themes";
import { useIntlayer } from "next-intlayer";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const c = useIntlayer("settings");
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">
        {c.appearance.heading.value}
      </h2>

      <div className="border-border card">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <p className="text-sm font-medium text-foreground">
              {c.appearance.themeLabel.value}
            </p>
            <p className="text-xs text-muted-foreground">
              {c.appearance.themeDescription.value}
            </p>
          </div>
          <div className="flex gap-2">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  theme === t
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground",
                )}
              >
                {t === "dark" ? (
                  <>
                    <Moon size={14} /> {c.appearance.dark.value}
                  </>
                ) : (
                  <>
                    <Sun size={14} /> {c.appearance.light.value}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
