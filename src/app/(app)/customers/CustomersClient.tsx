"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Pencil,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { CustomerDialog } from "@/components/forms/CustomerDialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: any[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/customers");
    if (res.ok) setCustomers(await res.json());
  };

  const startEdit = (customer: any) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      nif: customer.nif ?? "",
      notes: customer.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async (id: string) => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null,
          nif: editForm.nif.trim() || null,
          notes: editForm.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Cliente atualizado" });
      cancelEdit();
      refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Eliminar este cliente? As vendas associadas não serão apagadas.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Cliente eliminado" });
      refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q),
    );
  }, [customers, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CustomerDialog onCreated={refresh} />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg py-16 text-center">
          <User size={32} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "Nenhum cliente encontrado."
              : "Nenhum cliente adicionado ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => {
            const isEditing = editingId === customer.id;

            return (
              <Card
                key={customer.id}
                className={cn(
                  "transition-colors",
                  isEditing
                    ? "border-primary/40 bg-primary/5"
                    : "hover:border-primary/20",
                )}
              >
                <CardContent className="p-4">
                  {isEditing ? (
                    /* ── Modo edição ── */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: "name", label: "Nome *", placeholder: "" },
                          {
                            key: "email",
                            label: "Email",
                            placeholder: "email@exemplo.com",
                          },
                          {
                            key: "phone",
                            label: "Telefone",
                            placeholder: "9XX XXX XXX",
                          },
                          {
                            key: "nif",
                            label: "NIF",
                            placeholder: "123456789",
                          },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                              {label}
                            </label>
                            <Input
                              value={editForm[key]}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  [key]: e.target.value,
                                })
                              }
                              className="h-8 text-sm"
                              placeholder={placeholder}
                            />
                          </div>
                        ))}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs text-muted-foreground">
                            Morada
                          </label>
                          <Input
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                address: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                            placeholder="Rua, cidade, código postal"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs text-muted-foreground">
                            Notas
                          </label>
                          <Input
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                notes: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                            placeholder="Observações..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          <X size={13} className="mr-1" /> Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(customer.id)}
                          disabled={saving || !editForm.name.trim()}
                        >
                          <Check size={13} className="mr-1" />
                          {saving ? "A guardar..." : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Modo visualização ── */
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="font-semibold text-sm hover:text-primary transition-colors"
                            >
                              {customer.name}
                            </Link>
                            {customer.nif && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                NIF {customer.nif}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {customer._count?.sales || 0} venda(s)
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                            {customer.email && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail size={11} /> {customer.email}
                              </span>
                            )}
                            {customer.phone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone size={11} /> {customer.phone}
                              </span>
                            )}
                            {customer.address && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={11} /> {customer.address}
                              </span>
                            )}
                            {customer.notes && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText size={11} /> {customer.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/customers/${customer.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground"
                          >
                            <ChevronRight size={13} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground"
                          onClick={() => startEdit(customer)}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
