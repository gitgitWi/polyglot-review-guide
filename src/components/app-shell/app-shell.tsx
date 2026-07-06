import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { guideDocs } from "../../generated/guide-data";
import { filterDocs, useGuideStore } from "../../store/guide-store";
import { Sidebar } from "../sidebar";
import { Topbar } from "../topbar";

const totalWordCount = guideDocs.reduce((acc, doc) => acc + doc.wordCount, 0);

export interface ShellDoc {
  id: string;
  title: string;
  wordCount: number;
}

/** Derive the header/sidebar "current document" from the active pathname. */
function deriveCurrentDoc(pathname: string): ShellDoc {
  if (pathname.startsWith("/guide/")) {
    const id = decodeURIComponent(pathname.slice("/guide/".length).replace(/\/+$/, ""));
    const doc = guideDocs.find((d) => d.id === id);
    if (doc) {
      return { id: doc.id, title: doc.title, wordCount: doc.wordCount };
    }
  }
  if (pathname === "/tags" || pathname.startsWith("/tags/")) {
    const rest = pathname.slice("/tags".length).replace(/^\/+/, "").replace(/\/+$/, "");
    const tag = rest ? decodeURIComponent(rest) : "";
    return { id: "tags", title: tag ? `#${tag}` : "Tags", wordCount: 0 };
  }
  return { id: "home", title: "Polyglot Guide", wordCount: totalWordCount };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const query = useGuideStore((s) => s.query);
  const language = useGuideStore((s) => s.language);
  const isSidebarOpen = useGuideStore((s) => s.isSidebarOpen);
  const setActiveTab = useGuideStore((s) => s.setActiveTab);
  const setSidebarOpen = useGuideStore((s) => s.setSidebarOpen);

  const [isShrunk, setIsShrunk] = useState(false);

  const visibleDocs = filterDocs(query, language);
  const currentDoc = deriveCurrentDoc(pathname);

  // Shrink the topbar once the page scrolls.
  useEffect(() => {
    const onScroll = () => setIsShrunk(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reset transient UI state on navigation; the quiz tab only applies to docs.
  useEffect(() => {
    setSidebarOpen(false);
    setIsShrunk(false);
    if (!pathname.startsWith("/guide/")) {
      setActiveTab("guide");
    }
    window.scrollTo(0, 0);
  }, [pathname, setSidebarOpen, setActiveTab]);

  return (
    <div className="app-shell">
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        visibleDocs={visibleDocs}
        currentDoc={currentDoc}
      />

      <main className="content-shell">
        <Topbar
          currentDoc={currentDoc}
          onMenuOpen={() => setSidebarOpen(true)}
          isShrunk={isShrunk}
        />
        {children}
      </main>
    </div>
  );
}
