"use client";

import { useState } from "react";
import { Plus, Trash2, Shield, Eye } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { format } from "date-fns";
import type { AdminUser } from "../AdminPageClient";
import UserAvatar from "@/components/ui/userAvatar";

const PLAN_LABELS: Record<string, string> = {
  hobby: "Hobby",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
};

export function UsersTab({
  users,
  onUpdate,
}: {
  users: AdminUser[];
  onUpdate: (u: AdminUser[]) => void;
}) {
  const c = useIntlayer("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    avatar: "",
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  function reset() {
    setForm({ avatar: "", name: "", email: "", password: "", role: "user" });
  }

  async function handleCreate() {
    if (!form.email.trim() || !form.password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate([
        ...users,
        { ...data, createdAt: data.createdAt ?? new Date().toISOString() },
      ]);
      toast({ title: c.users.toast.created.value });
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({
        title: c.users.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(c.users.toast.confirmDelete.value)) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      onUpdate(users.filter((u) => u.id !== id));
      toast({ title: c.users.toast.deleted.value });
    } catch {
      toast({ title: c.users.toast.error.value, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          {c.users.addButton.value}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Avatar",
                c.users.name.value,
                c.users.email.value,
                c.users.role.value,
                c.users.plan.value,
                c.users.createdAt.value,
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {c.users.empty.value}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <UserAvatar
                      name={u.name}
                      avatarUrl={u.avatar ?? null}
                      isPro={u.plan === "pro"}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        u.role === "admin" || u.role === "superadmin"
                          ? "default"
                          : "secondary"
                      }
                      className="gap-1 text-[10px]"
                    >
                      {u.role === "admin" || u.role === "superadmin" ? (
                        <Shield size={9} />
                      ) : (
                        <Eye size={9} />
                      )}
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {PLAN_LABELS[u.plan] ?? u.plan}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{c.users.dialogTitle.value}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{c.users.name.value}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{c.users.email.value}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{c.users.password.value}</Label>
              <Input
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{c.users.role.value}</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? c.users.submitting.value : c.users.submit.value}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
