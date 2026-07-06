import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { guideDocs, type GuideDoc } from "./generated/guide-data";
import { useGuideStore, type LanguageFilter } from "./store/guide-store";

// Import modular components
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { DocContent } from "./components/doc-content";
import { QuizView } from "./components/quiz";
import { HomeView } from "./components/home-view";

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
  return <GuideShell isHome={true} />;
}

function GuideDetail() {
  const { docId } = useParams({ from: "/guide/$docId" });
  const selectedDoc = guideDocs.find((doc) => doc.id === docId) ?? guideDocs[0];
  return <GuideShell selectedDoc={selectedDoc} isHome={false} />;
}

const homeMetaDoc: GuideDoc = {
  id: "home",
  title: "Polyglot Guide",
  summary: "TypeScript 개발자를 위한 Kotlin/Go 코드 리뷰 가이드북",
  category: "Guidebook",
  language: "Overview",
  wordCount: guideDocs.reduce((acc, d) => acc + d.wordCount, 0),
  body: "",
};

function GuideShell({ selectedDoc, isHome = false }: { selectedDoc?: GuideDoc; isHome?: boolean }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "quiz">("guide");
  const [isShrunk, setIsShrunk] = useState(false);

  const query = useGuideStore((state) => state.query);
  const language = useGuideStore((state) => state.language);
  const visibleDocs = filterDocs(query, language);

  const currentDoc = isHome
    ? homeMetaDoc
    : selectedDoc && visibleDocs.some((doc) => doc.id === selectedDoc.id)
      ? selectedDoc
      : (visibleDocs[0] ?? selectedDoc ?? homeMetaDoc);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setIsShrunk(e.currentTarget.scrollTop > 24);
  };

  // Reset scroll to top and state when route/doc changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setActiveTab("guide");
    setIsShrunk(false);
    const contentShell = document.querySelector(".content-shell");
    if (contentShell) {
      contentShell.scrollTop = 0;
    }
  }, [selectedDoc, isHome]);

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
      <main className="content-shell" onScroll={handleScroll}>
        <Topbar
          currentDoc={currentDoc}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuOpen={() => setIsSidebarOpen(true)}
          isShrunk={isShrunk}
        />

        {isHome ? (
          <HomeView docs={guideDocs} />
        ) : activeTab === "guide" ? (
          <DocContent currentDoc={currentDoc} isRendering={false} />
        ) : (
          <QuizView onBackToGuide={() => setActiveTab("guide")} />
        )}
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
