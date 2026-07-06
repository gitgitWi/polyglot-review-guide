import Markdown from "marked-react";
import { CodeBlock } from "../code-block";
import type { GuideDoc } from "../../generated/guide-data";

interface DocContentProps {
  currentDoc: GuideDoc;
  isRendering: boolean;
}

const renderer = {
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
};

export function DocContent({ currentDoc, isRendering }: DocContentProps) {
  // Remove the first H1 header line from markdown body to avoid duplication with Topbar title
  const cleanBody = currentDoc.body.replace(/^#\s+.+$/m, "");

  return (
    <article aria-busy={isRendering} className="doc-content">
      <Markdown value={cleanBody} renderer={renderer} />
    </article>
  );
}
