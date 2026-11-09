import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Feito — Suas tarefas em ordem" },
      { name: "description", content: "Organize suas tarefas de forma simples." },
      { property: "og:title", content: "Feito — Suas tarefas em ordem" },
      { property: "og:description", content: "Organize suas tarefas de forma simples." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
