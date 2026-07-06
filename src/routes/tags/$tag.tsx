import { createFileRoute } from "@tanstack/react-router";
import { TagDetail } from "../../components/tags";

export const Route = createFileRoute("/tags/$tag")({
  head: ({ params }) => ({ meta: [{ title: `#${params.tag} · Polyglot Guide` }] }),
  component: TagRoute,
});

function TagRoute() {
  const { tag } = Route.useParams();
  return <TagDetail tag={tag} />;
}
