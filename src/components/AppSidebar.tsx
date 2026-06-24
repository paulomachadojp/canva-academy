import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Award, Shield, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const baseItems = [
  { title: "Início", url: "/" as const, icon: Home },
  { title: "Certificado", url: "/certificado" as const, icon: Award },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<null | { id: string; email?: string }>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (active) { setIsAdmin(false); setUser(null); }
        return;
      }
      if (active) setUser({ id: u.user.id, email: u.user.email });
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (active) setIsAdmin(!!data);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const items = isAdmin
    ? [...baseItems, { title: "Admin", url: "/admin" as const, icon: Shield }]
    : baseItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
            C
          </div>
          <span className="font-display text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Canva<span className="text-primary">Academy</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {user ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => supabase.auth.signOut()}
                    tooltip="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/auth"} tooltip="Entrar">
                    <Link to="/auth">
                      <LogIn className="h-4 w-4" />
                      <span>Entrar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
