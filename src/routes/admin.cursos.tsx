import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cursos")({
  component: AdminCursos,
});

type Course = { id: string; name: string; description: string | null; banner: string | null };

function AdminCursos() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Course | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("courses").select("*").order("created_at");
    if (error) toast.error(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startNew() { setEditing({ id: "", name: "", description: "", banner: "" }); setOpen(true); }
  function startEdit(c: Course) { setEditing(c); setOpen(true); }

  async function save() {
    if (!editing) return;
    const payload = { name: editing.name, description: editing.description, banner: editing.banner };
    if (!payload.name?.trim()) return toast.error("Nome obrigatório");
    const { error } = editing.id
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Curso salvo");
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este curso?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cursos</h2>
        <Button onClick={startNew}><Plus className="h-4 w-4" /> Novo curso</Button>
      </div>
      {loading ? <p className="text-muted-foreground">Carregando...</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description || "Sem descrição"}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}><Pencil className="h-3 w-3" /> Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3" /> Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-muted-foreground">Nenhum curso cadastrado.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar curso" : "Novo curso"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>URL do banner</Label>
                <Input value={editing.banner ?? ""} onChange={(e) => setEditing({ ...editing, banner: e.target.value })} placeholder="https://..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
