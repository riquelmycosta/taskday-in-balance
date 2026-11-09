import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Feito" },
      { name: "description", content: "Entre na sua conta ou crie uma nova para organizar suas tarefas." },
      { property: "og:title", content: "Entrar — Feito" },
      { property: "og:description", content: "Entre na sua conta ou crie uma nova para organizar suas tarefas." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/tarefas", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("E-mail ou senha incorretos.");
      navigate({ to: "/tarefas", replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { name } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      if (data.session) navigate({ to: "/tarefas", replace: true });
      else setSent(true);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-hero p-12 text-hero-foreground lg:flex">
        <span className="font-display text-2xl">Feito.</span>
        <div>
          <h2 className="font-display text-5xl leading-tight">
            Menos lembrar,
            <br />
            mais fazer.
          </h2>
          <p className="mt-4 max-w-sm opacity-80">Uma lista de tarefas simples, só sua.</p>
        </div>
        <span className="text-sm opacity-60">© {new Date().getFullYear()} Feito</span>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <h1 className="font-display text-3xl text-foreground">Confira seu e-mail</h1>
              <p className="mt-3 text-muted-foreground">
                Enviamos um link para <strong className="text-foreground">{email}</strong>. Clique nele para ativar sua conta.
              </p>
              <Button variant="link" className="mt-6" onClick={() => { setSent(false); setMode("entrar"); }}>
                Voltar para entrar
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl text-foreground">
                {mode === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {mode === "entrar" ? "Entre para ver suas tarefas." : "Leva menos de um minuto."}
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {mode === "criar" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "entrar" ? "Não tem conta?" : "Já tem conta?"}{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setMode(mode === "entrar" ? "criar" : "entrar")}
                >
                  {mode === "entrar" ? "Criar uma agora" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
