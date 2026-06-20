import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/admin/modulos")({
  component: AdminModulos,
});

type Course = { id: string; name: string };
type Module = { id: string; name: string; order_number: number; course_id: string };

function AdminModulos() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [editing, setEditing] = useState<Module | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("courses").select("id,name").order("name").then(({ data }) => {
      setCourses(data ?? []);
      if (data && data.length && !courseId) setCourseId(data[0].id);
    });
  }, []);

  async function load() {
    if (!courseId) return;
    const { data, error } = await supabase
      .from("modules").select("*").eq("course_id", courseId).order("order_number");
    if (error) toast.error(error.message);
    else setModules(data ?? []);
  }
  useEffect(() => { load(); }, [courseId]);

  function startNew() {
    setEditing({ id: "", name: "", order_number: modules.length + 1, course_id: courseId });
    setOpen(true);
  }
  function startEdit(m: Module) { setEditing(m); setOpen(true); }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Nome obrigatório");
    const payload = { name: editing.name, order_number: editing.order_number, course_id: courseId };
    const { error } = editing.id
      ? await supabase.from("modules").update(payload).eq("id", editing.id)
      : await supabase.from("modules").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); setOpen(false); load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir módulo e suas aulas?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído"); load();
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    const next = arrayMove(modules, oldIdx, newIdx).map((m, i) => ({ ...m, order_number: i + 1 }));
    setModules(next);
    await Promise.all(next.map((m) => supabase.from("modules").update({ order_number: m.order_number }).eq("id", m.id)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Label>Curso</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={startNew} disabled={!courseId}><Plus className="h-4 w-4" /> Novo módulo</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {modules.map((m) => (
              <SortableRow key={m.id} id={m.id}>
                <span className="font-medium">{m.order_number}. {m.name}</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(m)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(m.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </SortableRow>
            ))}
            {modules.length === 0 && courseId && <p className="text-muted-foreground">Nenhum módulo. Crie um novo.</p>}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} módulo</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Ordem</Label>
                <Input type="number" value={editing.order_number} onChange={(e) => setEditing({ ...editing, order_number: Number(e.target.value) })} />
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

export function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground" aria-label="Arrastar">
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}
