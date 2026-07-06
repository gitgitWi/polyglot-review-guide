import { createBundledHighlighter, createSingletonShorthands } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const bundledLanguages = {
  go: () => import("@shikijs/langs/go"),
  javascript: () => import("@shikijs/langs/javascript"),
  json: () => import("@shikijs/langs/json"),
  jsx: () => import("@shikijs/langs/jsx"),
  kotlin: () => import("@shikijs/langs/kotlin"),
  markdown: () => import("@shikijs/langs/markdown"),
  shellscript: () => import("@shikijs/langs/shellscript"),
  tsx: () => import("@shikijs/langs/tsx"),
  typescript: () => import("@shikijs/langs/typescript"),
  yaml: () => import("@shikijs/langs/yaml"),
} as const;

const bundledThemes = {
  "github-dark": () => import("@shikijs/themes/github-dark"),
} as const;

const createHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createJavaScriptRegexEngine(),
});

const { codeToHtml } = createSingletonShorthands(createHighlighter);

type SupportedLanguage = keyof typeof bundledLanguages | "text";

const languageAliases: Record<string, SupportedLanguage> = {
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

async function renderCodeBlock(code: string, rawLanguage: string) {
  const language = languageAliases[rawLanguage.trim().toLowerCase()] ?? "text";
  const highlighted = await codeToHtml(code, {
    lang: language,
    theme: "github-dark",
  });

  return `<div class="code-frame"><div class="code-label"><span>${escapeHtml(rawLanguage || "text")}</span></div>${highlighted}</div>`;
}

export async function renderMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let listOpen = false;
  let tableLines: string[] = [];

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const rows = tableLines
      .filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
      .map((line) =>
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim()),
      );
    if (rows.length > 0) {
      const [head, ...body] = rows;
      html.push('<div class="table-wrap"><table><thead><tr>');
      html.push(head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join(""));
      html.push("</tr></thead><tbody>");
      for (const row of body) {
        html.push("<tr>");
        html.push(row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join(""));
        html.push("</tr>");
      }
      html.push("</tbody></table></div>");
    }
    tableLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushTable();
      closeList();
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        html.push(await renderCodeBlock(codeLines.join("\n"), codeLang));
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.trim().startsWith("|") && line.includes("|")) {
      closeList();
      tableLines.push(line);
      continue;
    }
    flushTable();

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (/^- /.test(line)) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      closeList();
      html.push(`<p class="numbered">${inlineMarkdown(line)}</p>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  flushTable();
  closeList();
  return html.join("\n");
}
