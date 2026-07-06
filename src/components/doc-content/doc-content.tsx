import Markdown from "marked-react";
import { CodeBlock } from "../code-block";
import type { GuideDoc } from "../../generated/guide-data";
import styles from "./doc-content.module.css";

interface DocContentProps {
  currentDoc: GuideDoc;
  isRendering: boolean;
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
      return null; // hide H1 header since it is rendered in Topbar
    }
    const Tag = `h${level}` as any;
    return <Tag>{text}</Tag>;
  },
});

export function DocContent({ currentDoc, isRendering }: DocContentProps) {
  // Remove the first H1 header line from markdown body to avoid duplication with Topbar title
  const cleanBody = currentDoc.body.replace(/^#\s+.+$/m, "");
  const toc = extractToc(cleanBody);
  const renderer = createRenderer();

  return (
    <article aria-busy={isRendering} className="doc-content">
      {toc.length > 0 && (
        <div className={styles.tocBox}>
          <h4 className={styles.tocTitle}>On this page</h4>
          <ul className={styles.tocList}>
            {toc.map((item) => (
              <li
                key={item.id}
                className={`${styles.tocItem} ${item.level === 3 ? styles.level3 : styles.level2}`}
              >
                <a href={`#${item.id}`} className={styles.tocLink}>
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Markdown value={cleanBody} renderer={renderer} />
    </article>
  );
}
