"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { Plus, Trash2, Upload, X, FileBox } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { useUploadLimit } from "@/hooks/useUploadLimit";

// Função auxiliar para fazer o upload direto para o R2 (ignora limite da Vercel)
async function executeDirectUpload(file: File, bucket: "images" | "models") {
  // 1. Pede a URL assinada
  const signRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      bucket: bucket,
    }),
  });

  if (!signRes.ok) throw new Error("Falha ao gerar link de upload");

  const { url, key } = await signRes.json();

  // 2. Faz o upload diretamente para a Cloudflare R2
  const uploadRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) throw new Error("Falha no upload para o storage");

  return key; // Retornamos a key para guardar na base de dados
}

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { limitMb, limitBytes } = useUploadLimit();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para os ficheiros
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [threemfFile, setThreemfFile] = useState<File | null>(null);

  // Exemplo de estado para os dados do formulário
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });

  const handleThreemfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > limitBytes) {
        toast({
          title: "Ficheiro demasiado grande",
          description: `O limite é ${limitMb}MB`,
          variant: "destructive",
        });
        return;
      }
      setThreemfFile(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageKey = "";
      let modelKey = "";

      // 1. Upload direto da imagem
      if (imageFile) {
        imageKey = await executeDirectUpload(imageFile, "images");
      }

      // 2. Upload direto do ficheiro .3mf / .stl
      if (threemfFile) {
        modelKey = await executeDirectUpload(threemfFile, "models");
      }

      // 3. Enviar os dados finais para a sua API de criação
      const productData = {
        ...formData,
        image: imageKey, // Guardamos apenas a key do R2
        modelFile: modelKey,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok)
        throw new Error("Erro ao guardar o produto na base de dados");

      toast({ title: "Produto criado com sucesso!" });
      setOpen(false);
      onCreated();

      // Limpar formulário
      setFormData({ name: "", description: "", price: "" });
      setImageFile(null);
      setThreemfFile(null);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Novo Produto
        </Button>
      </DialogTrigger>

      {/* A classe max-h-[90vh] overflow-y-auto pb-[30vh] garante que o modal 
        tem scroll interno e espaço de sobra no fundo para quando o teclado 
        mobile abrir e empurrar o conteúdo.
      */}
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto pb-[30vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* --- DADOS BÁSICOS --- */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Suporte para Auscultadores"
              />
            </div>
          </div>

          {/* --- UPLOAD DE IMAGEM --- */}
          <div className="space-y-2">
            <Label>Imagem de Destaque</Label>
            <div className="flex items-center gap-4">
              {imageFile ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span>{imageFile.name}</span>
                  <button type="button" onClick={() => setImageFile(null)}>
                    <X size={14} className="text-destructive" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border rounded-md px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
                  <Upload size={16} />
                  Escolher Imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* --- UPLOAD DO MODELO (3MF/STL) --- */}
          <div className="space-y-2">
            <Label>Ficheiro do Modelo (Opcional)</Label>
            <div className="p-4 border rounded-lg bg-muted/10">
              {threemfFile ? (
                <div className="flex items-center justify-between bg-background p-3 rounded-md border">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {threemfFile.name}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {(threemfFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThreemfFile(null)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 w-fit cursor-pointer border border-dashed rounded-lg px-4 py-2 text-xs text-muted-foreground hover:border-primary/40 transition-colors">
                  <FileBox size={14} />
                  Escolher .3mf ou .stl
                  <input
                    type="file"
                    accept=".3mf,.stl"
                    className="hidden"
                    onChange={handleThreemfChange}
                  />
                </label>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Limite máximo: {limitMb} MB · Formatos aceites: .3mf, .stl
              </p>
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A criar o produto..." : "Criar Produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
