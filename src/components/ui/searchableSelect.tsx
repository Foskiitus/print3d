"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Conteúdo JSX opcional — se não for fornecido usa o label */
  render?: React.ReactNode;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  /** Texto quando não há resultados */
  emptyText?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Pesquisar...",
  disabled = false,
  className,
  emptyText = "Nenhum resultado.",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Focar o input ao abrir e fazer scroll para o campo em mobile
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        // Em mobile — fazer scroll para o input para não ficar atrás do teclado
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* ── Trigger ── */}
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground transition-colors",
            "hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary/60",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selected ? (selected.render ?? selected.label) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
        </button>
      </PopoverPrimitive.Trigger>

      {/* ── Dropdown ── */}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          side="bottom"
          avoidCollisions={true}
          collisionPadding={16}
          className={cn(
            "z-50 rounded-lg border border-border bg-card text-foreground shadow-lg",
            "w-[var(--radix-popover-trigger-width)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Input de pesquisa — sticky para ficar sempre visível */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border sticky top-0 bg-card z-10 rounded-lg ">
            <Search size={13} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Lista de opções */}
          <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "disabled:pointer-events-none disabled:opacity-50",
                    option.value === value && "bg-accent/60",
                  )}
                >
                  {/* Check mark */}
                  <span className="w-4 flex-shrink-0">
                    {option.value === value && (
                      <Check size={13} className="text-primary" />
                    )}
                  </span>
                  <span className="flex-1 truncate">
                    {option.render ?? option.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
