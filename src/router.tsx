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
import { useEffect } from "react";
import { guideDocs, type GuideDoc } from "./generated/guide-data";
import { useGuideStore, type LanguageFilter } from "./store/guide-store";

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
  const query = useGuideStore((state) => state.query);
  const language = useGuideStore((state) => state.language);
  const renderedHtml = useGuideStore((state) => state.renderedHtml);
  const isRendering = useGuideStore((state) => state.isRendering);
  const setQuery = useGuideStore((state) => state.setQuery);
  const setLanguage = useGuideStore((state) => state.setLanguage);
  const renderDocument = useGuideStore((state) => state.renderDocument);
  const visibleDocs = filterDocs(query, language);

  const currentDoc = visibleDocs.some((doc) => doc.id === selectedDoc.id)
    ? selectedDoc
    : visibleDocs[0] ?? selectedDoc;

  useEffect(() => {
    void renderDocument(currentDoc);
  }, [currentDoc, renderDocument]);

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
              onClick={() => setLanguage(value as LanguageFilter)}
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
          aria-busy={isRendering}
          className="doc-content"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </main>
    </div>
  );
}

function filterDocs(query: string, language: LanguageFilter) {
  const normalized = query.trim().toLowerCase();
  return guideDocs.filter((doc) => {
    const languageMatches =
      language === "all" || doc.language === language || doc.language === "both";
    const text = `${doc.title} ${doc.summary} ${doc.category} ${doc.body}`.toLowerCase();
    return languageMatches && text.includes(normalized);
  });
}
