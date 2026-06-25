import { supabase } from "@/integrations/supabase/client";

export function withTimeout<T>(promise: PromiseLike<T>, ms = 8_000, message = "Tempo de resposta excedido") {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export async function getCurrentSession() {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    8_000,
    "Não foi possível recuperar sua sessão. Recarregue e tente novamente."
  );

  if (error) throw error;
  return data.session;
}

export async function userIsAdmin(userId: string) {
  const request = supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  const { data, error } = await withTimeout(
    Promise.resolve(request),
    8_000,
    "Não foi possível verificar sua permissão de administrador."
  );

  if (error) throw error;
  return data === true;
}