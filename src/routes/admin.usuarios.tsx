import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminListAdmins,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/usuarios")({
  ssr: false,
  component: AdminUsuarios,
});

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  completed: number;
};

function AdminUsuarios() {
  const createFn = useServerFn(adminCreateUser);
  const updateFn = useServerFn(adminUpdateUser);
  const deleteFn = useServerFn(adminDeleteUser);
  const listAdminsFn = useServerFn(adminListAdmins);

  const [rows, setRows] = useState<Row[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<Row | null>(null);

  async function load() {
    const [{ data: profiles, error: pErr }, { count }, { data: progress, error: prErr }, adminIds] =
      await Promise.all([
        supabase.from("profiles").select("id,name,email,avatar").order("name"),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("lesson_progress").select("user_id,completed").eq("completed", true),
        listAdminsFn().catch(() => [] as string[]),
      ]);
    if (pErr) toast.error(pErr.message);
    if (prErr) toast.error(prErr.message);
    const counts = new Map<string, number>();
    (progress ?? []).forEach((p: { user_id: string }) =>
      counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1)
    );
    setRows((profiles ?? []).map((p) => ({ ...p, completed: counts.get(p.id) ?? 0 })));
    setTotalLessons(count ?? 0);
    setAdmins(new Set(adminIds));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleDelete(u: Row) {
    if (!confirm(`Excluir ${u.email}? Esta ação é permanente.`)) return;
    try {
      await deleteFn({ data: { userId: u.id } });
      toast.success("Usuário excluído.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Usuários</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <UserDialog
            mode="create"
            onSubmit={async (v) => {
              await createFn({ data: v });
              toast.success("Usuário criado.");
              setCreateOpen(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((u) => {
            const pct = totalLessons ? Math.round((u.completed / totalLessons) * 100) : 0;
            const isAdmin = admins.has(u.id);
            return (
              <Card key={u.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      (u.name?.[0] ?? "?").toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {u.name || "Sem nome"}
                      {isAdmin && (
                        <span className="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="w-64 max-w-[40%]">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {u.completed} / {totalLessons} aulas
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditUser(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(u)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {rows.length === 0 && <p className="text-muted-foreground">Nenhum usuário.</p>}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        {editUser && (
          <UserDialog
            mode="edit"
            initial={{
              email: editUser.email ?? "",
              name: editUser.name ?? "",
              isAdmin: admins.has(editUser.id),
            }}
            onSubmit={async (v) => {
              await updateFn({
                data: {
                  userId: editUser.id,
                  email: v.email,
                  name: v.name,
                  password: v.password || undefined,
                  isAdmin: v.isAdmin,
                },
              });
              toast.success("Usuário atualizado.");
              setEditUser(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function UserDialog({
  mode,
  initial,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: { email: string; name: string; isAdmin: boolean };
  onSubmit: (v: { email: string; password: string; name: string; isAdmin: boolean }) => Promise<void>;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(initial?.isAdmin ?? false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ email, password, name, isAdmin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Novo usuário" : "Editar usuário"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>{mode === "edit" ? "Nova senha (opcional)" : "Senha"}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === "create"}
            minLength={6}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isAdmin} onCheckedChange={(v) => setIsAdmin(!!v)} />
          Administrador
        </label>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
