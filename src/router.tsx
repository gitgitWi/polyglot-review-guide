import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { guideDocs, type GuideDoc } from "./generated/guide-data";
import { useGuideStore, type LanguageFilter } from "./store/guide-store";

// Eager shell chrome (present on every route).
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { HomeView } from "./components/home-view";

// Route views are code-split so each page's rendering code — and heavy deps like
// marked-react + Shiki that only documents need — loads only when that page opens.
const DocContent = lazy(() =>
  import("./components/doc-content").then((m) => ({ default: m.DocContent })),
);
const QuizView = lazy(() => import("./components/quiz").then((m) => ({ default: m.QuizView })));
const TagsIndex = lazy(() => import("./components/tags").then((m) => ({ default: m.TagsIndex })));
const TagDetail = lazy(() => import("./components/tags").then((m) => ({ default: m.TagDetail })));

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

const tagsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tags",
  component: TagsIndexPage,
});

const tagDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tags/$tag",
  component: TagDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  docRoute,
  tagsIndexRoute,
  tagDetailRoute,
]);

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
  return <GuideShell isHome={true} />;
}

function GuideDetail() {
  const { docId } = useParams({ from: "/guide/$docId" });
  const selectedDoc = guideDocs.find((doc) => doc.id === docId) ?? guideDocs[0];
  return <GuideShell selectedDoc={selectedDoc} isHome={false} />;
}

function TagsIndexPage() {
  return <GuideShell tagView={<TagsIndex />} tagTitle="Tags" />;
}

function TagDetailPage() {
  const { tag } = useParams({ from: "/tags/$tag" });
  return <GuideShell tagView={<TagDetail tag={tag} />} tagTitle={`#${tag}`} />;
}

const homeMetaDoc: GuideDoc = {
  id: "home",
  file: "",
  title: "Polyglot Guide",
  summary: "TypeScript 개발자를 위한 Kotlin/Go 코드 리뷰 가이드북",
  category: "Guidebook",
  language: "both",
  order: -1,
  tags: [],
  wordCount: guideDocs.reduce((acc, d) => acc + d.wordCount, 0),
};

/** Loading placeholder shown while a lazily-imported view chunk is fetched. */
function ContentFallback() {
  return (
    <div className="doc-content" aria-busy="true">
      <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-elevated)]" />
    </div>
  );
}

interface GuideShellProps {
  selectedDoc?: GuideDoc;
  isHome?: boolean;
  /** When provided, the main content renders this node (used for tag pages) instead of a document. */
  tagView?: ReactNode;
  tagTitle?: string;
}

function GuideShell({ selectedDoc, isHome = false, tagView, tagTitle }: GuideShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "quiz">("guide");
  const [isShrunk, setIsShrunk] = useState(false);

  const query = useGuideStore((state) => state.query);
  const language = useGuideStore((state) => state.language);
  const visibleDocs = filterDocs(query, language);

  const isTagView = tagView != null;

  const currentDoc: GuideDoc = isTagView
    ? { ...homeMetaDoc, id: "tags", title: tagTitle ?? "Tags", summary: "", wordCount: 0 }
    : isHome
      ? homeMetaDoc
      : selectedDoc && visibleDocs.some((doc) => doc.id === selectedDoc.id)
        ? selectedDoc
        : (visibleDocs[0] ?? selectedDoc ?? homeMetaDoc);

  // Track window scroll to shrink topbar
  useEffect(() => {
    const handleWindowScroll = () => {
      setIsShrunk(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, []);

  // Reset scroll to top and state when route/doc/tag changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setActiveTab("guide");
    setIsShrunk(false);
    window.scrollTo(0, 0);
  }, [selectedDoc, isHome, tagTitle]);

  return (
    <div className="app-shell">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        visibleDocs={visibleDocs}
        currentDoc={currentDoc}
      />

      {/* Main Content Workspace */}
      <main className="content-shell">
        <Topbar
          currentDoc={currentDoc}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuOpen={() => setIsSidebarOpen(true)}
          isShrunk={isShrunk}
        />

        <Suspense fallback={<ContentFallback />}>
          {isTagView ? (
            tagView
          ) : isHome ? (
            <HomeView docs={guideDocs} />
          ) : activeTab === "guide" ? (
            <DocContent currentDoc={currentDoc} />
          ) : (
            <QuizView onBackToGuide={() => setActiveTab("guide")} />
          )}
        </Suspense>
      </main>
    </div>
  );
}

function filterDocs(query: string, language: LanguageFilter) {
  const normalized = query.trim().toLowerCase();
  return guideDocs.filter((doc) => {
    const languageMatches =
      language === "all" || doc.language === language || doc.language === "both";
    const text =
      `${doc.title} ${doc.summary} ${doc.category} ${doc.tags.join(" ")}`.toLowerCase();
    return languageMatches && text.includes(normalized);
  });
}
