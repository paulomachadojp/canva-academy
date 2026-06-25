import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getCurrentSession, userIsAdmin, withTimeout } from "@/lib/admin-access";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then(async (session) => {
        if (!active || !session?.user) return;
        const admin = await userIsAdmin(session.user.id).catch(() => false);
        if (active) navigate({ to: admin ? "/admin/aulas" : "/" });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFormMessage(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: cleanEmail, password }),
        15_000,
        "O login demorou demais. Recarregue a página e tente novamente."
      );
      if (error) {
        const message = translateAuthError(error.message);
        setFormMessage({ type: "error", text: message });
        toast.error(message);
        return;
      }
      toast.success("Bem-vindo!");
      const admin = data.user ? await userIsAdmin(data.user.id).catch(() => false) : false;
      navigate({ to: admin ? "/admin/aulas" : "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível entrar.";
      setFormMessage({ type: "error", text: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setFormMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormMessage({ type: "error", text: "Informe seu nome para criar a conta." });
      return;
    }
    if (password.length < 6) {
      const message = "A senha deve ter ao menos 6 caracteres.";
      setFormMessage({ type: "error", text: message });
      toast.error(message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: cleanName },
          },
        }),
        20_000,
        "O cadastro demorou demais. Tente novamente."
      );
      if (error) {
        const message = translateAuthError(error.message);
        setFormMessage({ type: "error", text: message });
        toast.error(message);
        return;
      }
      // Auto-confirm está ativo: tenta logar imediatamente
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (signInError) {
        setFormMessage({ type: "success", text: "Conta criada! Faça login para continuar." });
        toast.success("Conta criada! Faça login.");
        return;
      }
      toast.success("Conta criada com sucesso!");
      const admin = signInData.user ? await userIsAdmin(signInData.user.id).catch(() => false) : false;
      navigate({ to: admin ? "/admin/aulas" : "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível cadastrar.";
      setFormMessage({ type: "error", text: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Academy</CardTitle>
        </CardHeader>
        <CardContent>
          {formMessage ? (
            <div
              role="status"
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                formMessage.type === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-primary/40 bg-primary/10 text-primary"
              }`}
            >
              {formMessage.text}
            </div>
          ) : null}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? "Entrando..." : "Entrar"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? "Criando..." : "Criar conta"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Este e-mail já possui uma conta. Use a opção Entrar ou cadastre um e-mail diferente.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "A criação de contas está temporariamente indisponível.";
  }

  if (normalized.includes("password")) {
    return "A senha informada não atende aos requisitos. Use pelo menos 6 caracteres.";
  }

  return message || "Não foi possível concluir a ação.";
}
