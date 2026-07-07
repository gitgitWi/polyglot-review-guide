import { createFileRoute } from "@tanstack/react-router";
import { QuizView } from "../components/quiz";

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "Review Quiz · Polyglot Guide" }] }),
  component: QuizPage,
});

function QuizPage() {
  return <QuizView />;
}
