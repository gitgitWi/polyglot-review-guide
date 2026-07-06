import {
  BookOpen,
  Code2,
  Globe2,
  Languages,
  RouteIcon,
  Search,
} from "lucide-react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";
import { guideDocs, type GuideDoc } from "./generated/guide-data";

type GuideSearch = {
  lang: "all" | "kotlin" | "go" | "both";
};

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GuideIndex,
});

const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guide/$docId",
  component: GuideDetail,
});

const routeTree = rootRoute.addChildren([indexRoute, docRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function RootLayout() {
  return <Outlet />;
}

function GuideIndex() {
  const first = guideDocs[0];
  return <GuideShell selectedDoc={first} />;
}

function GuideDetail() {
  const { docId } = useParams({ from: "/guide/$docId" });
  const selectedDoc = guideDocs.find((doc) => doc.id === docId) ?? guideDocs[0];
  return <GuideShell selectedDoc={selectedDoc} />;
}

function GuideShell({ selectedDoc }: { selectedDoc: GuideDoc }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<GuideSearch["lang"]>("all");
  const visibleDocs = filterDocs(query, language);

  const currentDoc = visibleDocs.some((doc) => doc.id === selectedDoc.id)
    ? selectedDoc
    : visibleDocs[0] ?? selectedDoc;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Guide navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Languages size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className="brand-kicker">Alan presents</p>
            <h1>Polyglot Review Guide</h1>
          </div>
        </div>

        <div className="hero-panel">
          <p className="eyebrow">Kotlin · Go · more languages later</p>
          <p>
            A review-first field guide for TypeScript engineers reading server-side
            code across JVM and systems languages.
          </p>
        </div>

        <label className="search-box">
          <span>
            <Search size={14} />
            Search
          </span>
          <input
            type="search"
            value={query}
            placeholder="transaction, goroutine, validation"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="filters" aria-label="Language filters">
          {[
            ["all", "All"],
            ["kotlin", "Kotlin"],
            ["go", "Go"],
            ["both", "Both"],
          ].map(([value, label]) => (
            <button
              className={language === value ? "is-active" : ""}
              key={value}
              type="button"
              onClick={() => setLanguage(value as GuideSearch["lang"])}
            >
              {label}
            </button>
          ))}
        </div>

        <nav className="doc-list" aria-label="Documents">
          {visibleDocs.map((doc) => (
            <Link
              className={`doc-link ${doc.id === currentDoc.id ? "is-selected" : ""}`}
              key={doc.id}
              params={{ docId: doc.id }}
              to="/guide/$docId"
            >
              <span className="doc-link-title">{doc.title}</span>
              <span className="doc-link-summary">{doc.summary}</span>
            </Link>
          ))}
          {visibleDocs.length === 0 ? <p className="empty">No matching documents.</p> : null}
        </nav>
      </aside>

      <main className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentDoc.category} / {currentDoc.language}</p>
            <h2>{currentDoc.title}</h2>
          </div>
          <div className="meta-pills" aria-label="Document metadata">
            <span><BookOpen size={14} /> {currentDoc.wordCount.toLocaleString()} words</span>
            <span><Globe2 size={14} /> public reference</span>
            <span><RouteIcon size={14} /> TanStack Router</span>
          </div>
        </header>

        <section className="summary-band">
          <div>
            <Code2 size={18} />
            <p>{currentDoc.summary}</p>
          </div>
        </section>

        <article
          className="doc-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(currentDoc.body) }}
        />
      </main>
    </div>
  );
}

function filterDocs(query: string, language: GuideSearch["lang"]) {
  const normalized = query.trim().toLowerCase();
  return guideDocs.filter((doc) => {
    const languageMatches =
      language === "all" || doc.language === language || doc.language === "both";
    const text = `${doc.title} ${doc.summary} ${doc.category} ${doc.body}`.toLowerCase();
    return languageMatches && text.includes(normalized);
  });
}

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

function renderMarkdown(markdown: string) {
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
        const label = codeLang ? `<span>${escapeHtml(codeLang)}</span>` : "";
        html.push(
          `<pre><div class="code-label">${label}</div><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
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
