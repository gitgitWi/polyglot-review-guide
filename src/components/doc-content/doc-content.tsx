import React from "react";
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
  return (
    <article aria-busy={isRendering} className="doc-content">
      <Markdown value={currentDoc.body} renderer={renderer} />
    </article>
  );
}
