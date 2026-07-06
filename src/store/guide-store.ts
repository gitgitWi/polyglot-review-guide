import { create } from "zustand";
import { guideDocs, type GuideDoc } from "../generated/guide-data";

export type LanguageFilter = "all" | "kotlin" | "go" | "both";
export type ContentTab = "guide" | "quiz";

type GuideState = {
  query: string;
  language: LanguageFilter;
  activeTab: ContentTab;
  isSidebarOpen: boolean;
  setQuery: (query: string) => void;
  setLanguage: (language: LanguageFilter) => void;
  setActiveTab: (tab: ContentTab) => void;
  setSidebarOpen: (open: boolean) => void;
};

// Cross-component UI state. The shell (Sidebar/Topbar) lives at the route root
// while page content renders in the <Outlet/>, so search/language/tab/drawer
// state is shared here rather than threaded through props.
export const useGuideStore = create<GuideState>((set) => ({
  query: "",
  language: "all",
  activeTab: "guide",
  isSidebarOpen: false,
  setQuery: (query) => set({ query }),
  setLanguage: (language) => set({ language }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));

/** Filter documents by search query (title/summary/category/tags) and language. */
export function filterDocs(query: string, language: LanguageFilter): GuideDoc[] {
  const normalized = query.trim().toLowerCase();
  return guideDocs.filter((doc) => {
    const languageMatches =
      language === "all" || doc.language === language || doc.language === "both";
    const text = `${doc.title} ${doc.summary} ${doc.category} ${doc.tags.join(" ")}`.toLowerCase();
    return languageMatches && text.includes(normalized);
  });
}
