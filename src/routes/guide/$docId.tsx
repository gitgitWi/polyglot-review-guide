import { createFileRoute, notFound } from "@tanstack/react-router";
import { guideDocs, loadDocContent } from "../../generated/guide-data";
import { DocContent } from "../../components/doc-content";

export const Route = createFileRoute("/guide/$docId")({
  loader: async ({ params }) => {
    const doc = guideDocs.find((d) => d.id === params.docId);
    if (!doc) {
      throw notFound();
    }
    const content = await loadDocContent(doc.id);
    return { doc, content };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `${loaderData.doc.title} · Polyglot Guide` }] }
      : {},
  component: DocPage,
});

function DocPage() {
  const { doc, content } = Route.useLoaderData();
  return <DocContent doc={doc} content={content} />;
}
