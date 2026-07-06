import { TagPills } from "../tags/tag-pills";
import type { DocContent as DocContentData, GuideDoc } from "../../generated/guide-data";

interface DocContentProps {
  doc: GuideDoc;
  content: DocContentData;
}

/**
 * Renders a document. The markdown + Shiki highlighting are rendered to HTML at
 * build time (see scripts/build-data.mjs), so this just injects the prebuilt
 * HTML and the build-time ToC — no markdown/highlight engine ships to the client.
 */
export function DocContent({ doc, content }: DocContentProps) {
  return (
    <article className="doc-content">
      {doc.tags.length > 0 && (
        <div className="mb-5">
          <TagPills tags={doc.tags} />
        </div>
      )}

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
    </article>
  );
}
