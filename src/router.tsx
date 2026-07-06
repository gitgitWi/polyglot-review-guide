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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "quiz">("guide");

  const query = useGuideStore((state) => state.query);
  const language = useGuideStore((state) => state.language);
  const visibleDocs = filterDocs(query, language);

  const currentDoc = visibleDocs.some((doc) => doc.id === selectedDoc.id)
    ? selectedDoc
    : visibleDocs[0] ?? selectedDoc;

  // Close sidebar and reset tab to guide when route/doc changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setActiveTab("guide");
  }, [selectedDoc]);

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
        />

        {activeTab === "guide" ? (
          <>
            <section className="summary-band">
              <div>
                <span className="text-orange-500 mr-2">✏️</span>
                <p>{currentDoc.summary}</p>
              </div>
            </section>

            <DocContent currentDoc={currentDoc} isRendering={false} />
          </>
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
