import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TagPills } from "../tags/tag-pills";
import {
  guideDocs,
  type DocContent as DocContentData,
  type GuideDoc,
} from "../../generated/guide-data";

interface DocContentProps {
  doc: GuideDoc;
  content: DocContentData;
}

// Documents in reading order — used to derive the previous/next links.
const orderedDocs = [...guideDocs].sort((a, b) => a.order - b.order);

/**
 * Renders a document. The markdown + Shiki highlighting are rendered to HTML at
 * build time (see scripts/build-data.mjs), so this just injects the prebuilt
 * HTML and the build-time ToC — no markdown/highlight engine ships to the client.
 */
export function DocContent({ doc, content }: DocContentProps) {
  const currentIndex = orderedDocs.findIndex((d) => d.id === doc.id);
  const prevDoc = currentIndex > 0 ? orderedDocs[currentIndex - 1] : null;
  const nextDoc =
    currentIndex >= 0 && currentIndex < orderedDocs.length - 1
      ? orderedDocs[currentIndex + 1]
      : null;

  return (
    <article className="doc-content">
      {content.toc.length > 0 && (
        <div className="border border-[var(--hairline)] bg-[var(--surface-card)] rounded-xl p-5 mb-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--stone)] m-0 mb-3.5">
            On this page
          </h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {content.toc.map((item) => (
              <li
                key={item.id}
                className={`leading-normal m-0 p-0 ${
                  item.level === 3 ? "pl-4 border-l border-[var(--hairline-strong)] ml-0.5" : "pl-0"
                }`}
              >
                <a
                  href={`#${item.id}`}
                  className="text-[13.5px] text-[var(--charcoal)] no-underline transition-colors duration-150 hover:text-[var(--orange)]"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: content.html }}
        suppressHydrationWarning
      />

      {doc.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[var(--hairline)]">
          <TagPills tags={doc.tags} />
        </div>
      )}

      {(prevDoc || nextDoc) && (
        <nav
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2"
          aria-label="Document navigation"
        >
          {prevDoc ? (
            <Link
              to="/guide/$docId"
              params={{ docId: prevDoc.id }}
              className="group flex flex-col gap-1.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 no-underline transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-elevated)]"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--mute)] transition-colors group-hover:text-[var(--orange)]">
                <ArrowLeft size={13} /> 이전 페이지
              </span>
              <span className="text-[14px] font-medium leading-snug text-[var(--ink)]">
                {prevDoc.title}
              </span>
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}

          {nextDoc && (
            <Link
              to="/guide/$docId"
              params={{ docId: nextDoc.id }}
              className="group flex flex-col items-end gap-1.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 text-right no-underline transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-elevated)]"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--mute)] transition-colors group-hover:text-[var(--orange)]">
                다음 페이지 <ArrowRight size={13} />
              </span>
              <span className="text-[14px] font-medium leading-snug text-[var(--ink)]">
                {nextDoc.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
