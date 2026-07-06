import { useEffect, useState } from "react";
import Markdown from "marked-react";
import { CodeBlock } from "../code-block";
import { TagPills } from "../tags/tag-pills";
import { loadDocBody, type GuideDoc } from "../../generated/guide-data";

interface DocContentProps {
  currentDoc: GuideDoc;
  isRendering?: boolean;
}

interface TocItem {
  text: string;
  id: string;
  level: 2 | 3;
}

// Extract H2 and H3 headers for Table of Contents
function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const toc: TocItem[] = [];

  lines.forEach((line) => {
    // Matches "## Title" or "### Title"
    const match = line.match(/^(##|###)\s+(.+)$/);
    if (match) {
      const level = match[1].length as 2 | 3;
      const text = match[2].trim().replace(/\*|_|`/g, ""); // clean formatting symbols
      const id = text
        .toLowerCase()
        .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]+/g, "-") // replace spaces and symbols with hyphen
        .replace(/^-+|-+$/g, ""); // strip leading/trailing hyphens
      toc.push({ text, id, level });
    }
  });

  return toc;
}

const createRenderer = () => ({
  code(code: any, lang: any) {
    const codeString = Array.isArray(code) ? code.join("") : String(code);
    return <CodeBlock key={Math.random()} code={codeString} language={lang} />;
  },
  table(children: any) {
    return (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    );
  },
  heading(text: any, level: number) {
    const textString = Array.isArray(text) ? text.join("") : String(text);
    const id = textString
      .toLowerCase()
      .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (level === 2) {
      return <h2 id={id}>{text}</h2>;
    }
    if (level === 3) {
      return <h3 id={id}>{text}</h3>;
    }
    if (level === 1) {
      return <></>; // hide H1 header since it is rendered in Topbar
    }
    const Tag = `h${level}` as any;
    return <Tag>{text}</Tag>;
  },
});

/** Skeleton shown while a document body chunk is being fetched. */
function BodySkeleton() {
  return (
    <div className="markdown-body flex flex-col gap-4" aria-hidden="true">
      <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-card)]" />
      <div className="h-4 w-[92%] animate-pulse rounded bg-[var(--surface-card)]" />
      <div className="h-4 w-[78%] animate-pulse rounded bg-[var(--surface-card)]" />
      <div className="mt-6 h-6 w-1/3 animate-pulse rounded bg-[var(--surface-elevated)]" />
      <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-card)]" />
      <div className="h-4 w-[85%] animate-pulse rounded bg-[var(--surface-card)]" />
    </div>
  );
}

export function DocContent({ currentDoc, isRendering = false }: DocContentProps) {
  const [body, setBody] = useState<string | null>(null);

  // Bodies are code-split; fetch the chunk for the active document on demand.
  useEffect(() => {
    let alive = true;
    setBody(null);
    loadDocBody(currentDoc.id).then((loaded) => {
      if (alive) {
        setBody(loaded);
      }
    });
    return () => {
      alive = false;
    };
  }, [currentDoc.id]);

  const isLoading = body === null;
  // Remove the first H1 header line from markdown body to avoid duplication with Topbar title
  const cleanBody = isLoading ? "" : body.replace(/^#\s+.+$/m, "");
  const toc = isLoading ? [] : extractToc(cleanBody);
  const renderer = createRenderer();

  return (
    <article aria-busy={isRendering || isLoading} className="doc-content">
      {currentDoc.tags.length > 0 && (
        <div className="mb-5">
          <TagPills tags={currentDoc.tags} />
        </div>
      )}

      {toc.length > 0 && (
        <div className="border border-[var(--hairline)] bg-[var(--surface-card)] rounded-xl p-5 mb-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--stone)] m-0 mb-3.5">
            On this page
          </h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {toc.map((item) => (
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

      {isLoading ? (
        <BodySkeleton />
      ) : (
        <div className="markdown-body">
          <Markdown value={cleanBody} renderer={renderer} />
        </div>
      )}
    </article>
  );
}
