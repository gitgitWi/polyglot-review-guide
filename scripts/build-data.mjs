import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { codeToHtml } from "shiki";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs");
const outDir = path.join(root, "src", "generated");
const outFile = path.join(outDir, "guide-data.ts");
const bodiesDir = path.join(outDir, "bodies");

const SHIKI_THEME = "github-dark";
const LANG_ALIASES = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  kt: "kotlin",
  kotlin: "kotlin",
  go: "go",
  golang: "go",
  sh: "shellscript",
  shell: "shellscript",
  bash: "shellscript",
  yaml: "yaml",
  yml: "yaml",
  json: "json",
  md: "markdown",
  markdown: "markdown",
};

// --- front matter -----------------------------------------------------------

function parseTags(raw) {
  if (!raw) {
    return [];
  }
  const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  return inner
    .split(",")
    .map((tag) => tag.trim().replace(/^["']|["']$/g, "").trim().toLowerCase())
    .filter(Boolean);
}

function parseFrontMatter(raw, file) {
  if (!raw.startsWith("---\n")) {
    throw new Error(`${file}: missing front matter`);
  }
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error(`${file}: unterminated front matter`);
  }

  const front = raw.slice(4, end).trim();
  const body = raw.slice(end + "\n---\n".length).trim();
  const meta = {};

  for (const line of front.split("\n")) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new Error(`${file}: invalid front matter line: ${line}`);
    }
    const [, key, value] = match;
    meta[key] = value.replace(/^"(.*)"$/, "$1");
  }

  const required = ["title", "category", "language", "order", "summary"];
  for (const key of required) {
    if (!meta[key]) {
      throw new Error(`${file}: missing ${key}`);
    }
  }
  meta.order = Number(meta.order);
  if (!Number.isFinite(meta.order)) {
    throw new Error(`${file}: order must be numeric`);
  }
  meta.tags = parseTags(meta.tags);

  return { meta, body };
}

// --- markdown → HTML (build time) -------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Match the heading-id logic the client ToC used: strip inline markers then slug.
function headingId(rawText) {
  return slugify(rawText.replace(/[*_`]/g, ""));
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A Marked instance that highlights code with Shiki at build time and wraps it
// in the same `.code-frame` / `.code-label` markup the runtime component used,
// so the existing CSS keeps working. Headings get slug ids; the leading H1 is
// dropped (the Topbar renders the document title).
function createMarked() {
  const marked = new Marked({
    async: true,
    async walkTokens(token) {
      if (token.type !== "code") {
        return;
      }
      // Mermaid diagrams render client-side (see MermaidRenderer). Leave the
      // source untouched so the `code` renderer can emit a diagram container
      // instead of a Shiki-highlighted block.
      if ((token.lang || "").trim().toLowerCase() === "mermaid") {
        return;
      }
      const lang = LANG_ALIASES[(token.lang || "").trim().toLowerCase()] ?? "text";
      try {
        token.highlighted = await codeToHtml(token.text, { lang, theme: SHIKI_THEME });
      } catch {
        token.highlighted = `<pre class="shiki"><code>${escapeHtml(token.text)}</code></pre>`;
      }
    },
    renderer: {
      code(token) {
        // Mermaid: emit an empty container carrying the source in a data
        // attribute. MermaidRenderer decodes it and swaps in the rendered SVG
        // client-side, so no raw diagram markup flashes before hydration.
        if ((token.lang || "").trim().toLowerCase() === "mermaid") {
          return `<div class="mermaid-diagram" data-mermaid="${encodeURIComponent(token.text)}"></div>`;
        }
        const label = (token.lang || "text").trim() || "text";
        const body = token.highlighted ?? `<pre class="shiki"><code>${escapeHtml(token.text)}</code></pre>`;
        return `<div class="code-frame"><div class="code-label"><span>${escapeHtml(label)}</span></div>${body}</div>`;
      },
      heading(token) {
        if (token.depth === 1) {
          return ""; // hidden: shown in the Topbar
        }
        const inner = this.parser.parseInline(token.tokens);
        return `<h${token.depth} id="${headingId(token.text)}">${inner}</h${token.depth}>`;
      },
    },
    // Wrap tables for the existing `.table-wrap` overflow container CSS.
    hooks: {
      postprocess(html) {
        return html
          .replace(/<table>/g, '<div class="table-wrap"><table>')
          .replace(/<\/table>/g, "</table></div>");
      },
    },
  });
  return marked;
}

function extractToc(body) {
  const toc = [];
  for (const line of body.split("\n")) {
    const match = line.match(/^(##|###)\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim().replace(/[*_`]/g, "");
      toc.push({ text: rawText, id: slugify(rawText), level });
    }
  }
  return toc;
}

// --- build ------------------------------------------------------------------

const files = (await readdir(docsDir)).filter((file) => file.endsWith(".md")).sort();

const docs = [];
for (const file of files) {
  const raw = await readFile(path.join(docsDir, file), "utf8");
  const { meta, body } = parseFrontMatter(raw, file);
  docs.push({
    id: file.replace(/^\d+-/, "").replace(/\.md$/, ""),
    file,
    title: meta.title,
    category: meta.category,
    language: meta.language,
    order: meta.order,
    summary: meta.summary,
    tags: meta.tags,
    body,
    wordCount: body.split(/\s+/).filter(Boolean).length,
  });
}

docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

const marked = createMarked();

await mkdir(outDir, { recursive: true });
await rm(bodiesDir, { recursive: true, force: true });
await mkdir(bodiesDir, { recursive: true });

for (const doc of docs) {
  const html = await marked.parse(doc.body);
  const toc = extractToc(doc.body);
  await writeFile(
    path.join(bodiesDir, `${doc.id}.ts`),
    `// AUTO-GENERATED content for ${doc.file}. Do not edit by hand.\n` +
      `import type { DocContent } from "../guide-data";\n` +
      `export default ${JSON.stringify({ html, toc })} satisfies DocContent;\n`,
    "utf8",
  );
}

const meta = docs.map((doc) => ({
  id: doc.id,
  file: doc.file,
  title: doc.title,
  category: doc.category,
  language: doc.language,
  order: doc.order,
  summary: doc.summary,
  tags: doc.tags,
  wordCount: doc.wordCount,
}));

const loaderLines = docs
  .map((doc) => `  ${JSON.stringify(doc.id)}: () => import("./bodies/${doc.id}"),`)
  .join("\n");

const output = `// AUTO-GENERATED by scripts/build-data.mjs. Do not edit by hand.
// Run \`bun scripts/build-data.mjs\` (or \`bun run dev\`) to regenerate.
//
// Markdown is rendered to HTML with Shiki-highlighted code at BUILD time. Only
// metadata is bundled eagerly; each document's rendered { html, toc } lives in
// ./bodies/<id>.ts and is loaded on demand via loadDocContent() — served
// prerendered by TanStack Start, or fetched as a lazy chunk on client nav.

export interface GuideDoc {
  id: string;
  file: string;
  title: string;
  category: string;
  language: string;
  order: number;
  summary: string;
  tags: string[];
  wordCount: number;
}

export interface TocItem {
  text: string;
  id: string;
  level: number;
}

export interface DocContent {
  html: string;
  toc: TocItem[];
}

export const guideDocs: GuideDoc[] = ${JSON.stringify(meta, null, 2)};

const contentLoaders: Record<string, () => Promise<{ default: DocContent }>> = {
${loaderLines}
};

/** Lazily load a document's prerendered HTML + ToC. Resolves to empty for unknown ids. */
export function loadDocContent(id: string): Promise<DocContent> {
  const loader = contentLoaders[id];
  return loader ? loader().then((mod) => mod.default) : Promise.resolve({ html: "", toc: [] });
}
`;

await writeFile(outFile, output, "utf8");

const tagSet = new Set(docs.flatMap((doc) => doc.tags));
console.log(
  `Generated ${path.relative(root, outFile)} + ${docs.length} prerendered body chunks (${tagSet.size} unique tags)`,
);
