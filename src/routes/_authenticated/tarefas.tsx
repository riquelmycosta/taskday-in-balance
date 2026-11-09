import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({
    meta: [
      { title: "Minhas tarefas — Feito" },
      { name: "description", content: "Crie, edite e conclua suas tarefas." },
      { property: "og:title", content: "Minhas tarefas — Feito" },
      { property: "og:description", content: "Crie, edite e conclua suas tarefas." },
    ],
  }),
  component: Tarefas,
});

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
};

function Tarefas() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "pendente" | "concluida">("todas");

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
      return data?.name ?? "";
    },
  });

  const tasks = useQuery({
    queryKey: ["tasks", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,description,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks", user.id] });

  const save = useMutation({
    mutationFn: async (v: { id?: string | undefined; title: string; description: string }) => {
      const { error } = v.id
        ? await supabase.from("tasks").update({ title: v.title, description: v.description }).eq("id", v.id)
        : await supabase.from("tasks").insert({ title: v.title, description: v.description, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.id ? "Tarefa atualizada" : "Tarefa criada");
      setFormOpen(false);
      refresh();
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: t.status === "concluida" ? "pendente" : "concluida" })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa excluída");
      setToDelete(null);
      refresh();
    },
  });

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const all = tasks.data ?? [];
  const pendentes = all.filter((t) => t.status !== "concluida").length;
  const termo = search.trim().toLowerCase();
  const list = all.filter(
    (t) =>
      (statusFilter === "todas" || t.status === statusFilter) &&
      (!termo || t.title.toLowerCase().includes(termo)),
  );

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl text-primary">Feito.</p>
            <h1 className="mt-4 font-display text-3xl text-foreground sm:text-4xl">
              Olá{profile.data ? `, ${profile.data}` : ""}!
            </h1>
            <p className="mt-1 text-muted-foreground">
              {pendentes === 0 ? "Nenhuma tarefa pendente." : `${pendentes} tarefa(s) pendente(s).`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={sair}>Sair</Button>
        </header>

        <Button
          className="mt-8 h-11 w-full"
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          <Plus /> Nova tarefa
        </Button>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar pelo título..."
              aria-label="Buscar pelo título"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 rounded-lg border bg-card p-1">
            {(["todas", "pendente", "concluida"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "ghost"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "todas" ? "Todas" : s === "pendente" ? "Pendentes" : "Concluídas"}
              </Button>
            ))}
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {tasks.isLoading && <li className="text-muted-foreground">Carregando...</li>}
          {!tasks.isLoading && list.length === 0 && (
            <li className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              Você ainda não tem tarefas. Crie a primeira!
            </li>
          )}
          {list.map((t) => {
            const done = t.status === "concluida";
            return (
              <li key={t.id} className="flex gap-3 rounded-xl border bg-card p-4">
                <Checkbox
                  className="mt-1"
                  checked={done}
                  onCheckedChange={() => toggle.mutate(t)}
                  aria-label={done ? "Marcar como pendente" : "Marcar como concluída"}
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium text-card-foreground ${done ? "line-through opacity-60" : ""}`}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{t.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className={done ? "text-primary" : ""}>{done ? "Concluída" : "Pendente"}</span>
                    {" · "}criada em {new Date(t.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => { setEditing(t); setFormOpen(true); }}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setToDelete(t)}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        saving={save.isPending}
        onSave={(v) => save.mutate({ ...v, id: editing?.id })}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" será excluída permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function TaskForm({
  open, onOpenChange, task, saving, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task: Task | null;
  saving: boolean;
  onSave: (v: { title: string; description: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        {open && (
          <form
            key={task?.id ?? "new"}
            className="space-y-4"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const title = String(f.get("title") ?? "").trim();
              if (!title) return;
              onSave({ title, description: String(f.get("description") ?? "").trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required maxLength={200} defaultValue={task?.title} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={4} maxLength={2000} defaultValue={task?.description} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
