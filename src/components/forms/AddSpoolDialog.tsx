"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { toast } from "@/components/ui/toaster";
import { CalendarIcon, Plus } from "lucide-react";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { pt, enGB } from "date-fns/locale";
import { useIntlayer } from "next-intlayer";

export function AddSpoolDialog({
  types,
  onAdded,
  trigger,
  onOpenChange: onOpenChangeProp,
  locale,
}: {
  types: any[];
  onAdded: () => void;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  locale?: string;
}) {
  const c = useIntlayer("dialogs");
  const d = c.spool;

  const today = new Date().toISOString().split("T")[0];
  const dateLocale = locale === "en" ? enGB : pt;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    filamentTypeId: "",
    spoolWeight: "1000",
    price: "",
    quantity: "1",
    purchaseDate: today,
  });

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    onOpenChangeProp?.(v);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!form.filamentTypeId || !form.price) return;

    if (form.purchaseDate > today) {
      toast({
        title: d.invalidDate.value,
        description: d.invalidDateDesc.value,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/filaments/spools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filamentTypeId: form.filamentTypeId,
          spoolWeight: Number(form.spoolWeight),
          price: Number(form.price),
          quantity: Number(form.quantity),
          purchaseDate: (() => {
            const now = new Date();
            const [year, month, day] = form.purchaseDate.split("-").map(Number);
            return new Date(
              year,
              month - 1,
              day,
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
            ).toISOString();
          })(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast({ title: `${form.quantity} ${d.successToast.value}` });
      setForm({
        filamentTypeId: "",
        spoolWeight: "1000",
        price: "",
        quantity: "1",
        purchaseDate: today,
      });
      setOpen(false);
      refreshAlerts();
      onAdded();
    } catch (error: any) {
      toast({
        title: c.common.error.value,
        description: error.message || d.errorDefault.value,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const typeOptions = types.map((t) => ({
    value: t.id,
    label: `${t.brand} ${t.material} (${t.colorName})`,
    render: (
      <div className="flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: t.colorHex,
            boxShadow: `0 0 5px ${t.colorHex}99`,
          }}
        />
        <span>
          {t.brand} {t.material} — {t.colorName}
        </span>
      </div>
    ),
  }));

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              {d.triggerLabel}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{d.materialType}</Label>
              <SearchableSelect
                options={typeOptions}
                value={form.filamentTypeId}
                onValueChange={(v) => setForm({ ...form, filamentTypeId: v })}
                placeholder={d.materialPlaceholder.value}
                searchPlaceholder={d.materialSearch.value}
                emptyText={d.materialEmpty.value}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="weight">{d.weight}</Label>
                <Input
                  id="weight"
                  type="number"
                  value={form.spoolWeight}
                  onChange={(e) =>
                    setForm({ ...form, spoolWeight: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">{d.price}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="1"
                  max="1000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">{d.quantity}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 flex flex-col mt-2">
              <Label htmlFor="date">{d.purchaseDate}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.purchaseDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.purchaseDate ? (
                      format(new Date(form.purchaseDate), "PPP", {
                        locale: dateLocale,
                      })
                    ) : (
                      <span>{d.pickDate}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-card border shadow-md"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={new Date(form.purchaseDate)}
                    onSelect={(date) => {
                      if (date) {
                        const adjusted = new Date(
                          date.getTime() - date.getTimezoneOffset() * 60000,
                        );
                        setForm({
                          ...form,
                          purchaseDate: adjusted.toISOString().split("T")[0],
                        });
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? d.submitting : d.submit}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
