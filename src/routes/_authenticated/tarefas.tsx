import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({
    meta: [
      { title: "Minhas tarefas — Feito" },
      { name: "description", content: "Sua lista de tarefas." },
      { property: "og:title", content: "Minhas tarefas — Feito" },
      { property: "og:description", content: "Sua lista de tarefas." },
    ],
  }),
  component: Tarefas,
});

function Tarefas() {
  const { user } = Route.useRouteContext();
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));
  }, [user.id]);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <h1 className="font-display text-3xl text-foreground">Olá{name ? `, ${name}` : ""}!</h1>
        <Button variant="outline" onClick={sair}>Sair</Button>
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-muted-foreground">
        Suas tarefas aparecerão aqui em breve.
      </p>
    </main>
  );
}
