import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const tabs = [
  { to: "/admin/aulas", label: "Aulas", icon: PlayCircle },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<"loading" | "ok" | "forbidden">("loading");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data, error } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (error || !data) setState("forbidden");
      else setState("ok");
    })();
  }, [navigate]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-muted-foreground">Você não tem permissão para acessar o painel administrativo.</p>
        <Link to="/" className="mt-6 inline-block text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie aulas e usuários.</p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => {
          const active = pathname === t.to || (t.to === "/admin/aulas" && pathname === "/admin");
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
