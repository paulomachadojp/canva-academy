import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableRow } from "./admin.modulos";

export const Route = createFileRoute("/admin/aulas")({
  component: AdminAulas,
});

type Course = { id: string; name: string };
type Module = { id: string; name: string; course_id: string };
type Lesson = {
  id: string;
  module_id: string;
  name: string;
  youtube_url: string | null;
  description: string | null;
  material_url: string | null;
  duration: string | null;
  order_number: number;
};

function AdminAulas() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("courses").select("id,name").order("name").then(({ data }) => {
      setCourses(data ?? []);
      if (data?.length) setCourseId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    supabase.from("modules").select("id,name,course_id").eq("course_id", courseId).order("order_number")
      .then(({ data }) => {
        setModules(data ?? []);
        setModuleId(data?.[0]?.id ?? "");
      });
  }, [courseId]);

  async function load() {
    if (!moduleId) { setLessons([]); return; }
    const { data, error } = await supabase.from("lessons").select("*").eq("module_id", moduleId).order("order_number");
    if (error) toast.error(error.message);
    else setLessons(data ?? []);
  }
  useEffect(() => { load(); }, [moduleId]);

  function startNew() {
    setEditing({
      id: "", module_id: moduleId, name: "", youtube_url: "", description: "",
      material_url: "", duration: "", order_number: lessons.length + 1,
    });
    setOpen(true);
  }
  function startEdit(l: Lesson) { setEditing(l); setOpen(true); }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Nome obrigatório");
    const payload = {
      module_id: moduleId,
      name: editing.name,
      youtube_url: editing.youtube_url,
      description: editing.description,
      material_url: editing.material_url,
      duration: editing.duration,
      order_number: editing.order_number,
    };
    const { error } = editing.id
      ? await supabase.from("lessons").update(payload).eq("id", editing.id)
      : await supabase.from("lessons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); setOpen(false); load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir aula?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída"); load();
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = lessons.findIndex((l) => l.id === active.id);
    const newIdx = lessons.findIndex((l) => l.id === over.id);
    const next = arrayMove(lessons, oldIdx, newIdx).map((l, i) => ({ ...l, order_number: i + 1 }));
    setLessons(next);
    await Promise.all(next.map((l) => supabase.from("lessons").update({ order_number: l.order_number }).eq("id", l.id)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label>Curso</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
              <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Módulo</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger className="w-60"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={startNew} disabled={!moduleId}><Plus className="h-4 w-4" /> Nova aula</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {lessons.map((l) => (
              <SortableRow key={l.id} id={l.id}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{l.order_number}. {l.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.duration || "—"} · {l.youtube_url || "Sem vídeo"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(l)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(l.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </SortableRow>
            ))}
            {lessons.length === 0 && moduleId && <p className="text-muted-foreground">Nenhuma aula. Crie uma nova.</p>}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nova"} aula</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1"><Label>Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1"><Label>URL do vídeo (YouTube)</Label>
                <Input value={editing.youtube_url ?? ""} placeholder="https://youtube.com/watch?v=..." onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })} />
              </div>
              <div className="space-y-1"><Label>Descrição</Label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="space-y-1"><Label>Material complementar (URL)</Label>
                <Input value={editing.material_url ?? ""} placeholder="https://..." onChange={(e) => setEditing({ ...editing, material_url: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Duração</Label>
                  <Input value={editing.duration ?? ""} placeholder="10:30" onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
                </div>
                <div className="space-y-1"><Label>Ordem</Label>
                  <Input type="number" value={editing.order_number} onChange={(e) => setEditing({ ...editing, order_number: Number(e.target.value) })} />
                </div>
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
