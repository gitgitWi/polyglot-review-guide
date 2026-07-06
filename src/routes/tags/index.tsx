import { createFileRoute } from "@tanstack/react-router";
import { TagsIndex } from "../../components/tags";

export const Route = createFileRoute("/tags/")({
  head: () => ({ meta: [{ title: "태그로 찾아보기 · Polyglot Guide" }] }),
  component: TagsIndex,
});
