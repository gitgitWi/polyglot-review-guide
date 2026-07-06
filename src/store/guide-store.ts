import { create } from "zustand";
import type { GuideDoc } from "../generated/guide-data";

export type LanguageFilter = "all" | "kotlin" | "go" | "both";

type GuideState = {
  query: string;
  language: LanguageFilter;
  renderedDocId: string | null;
  renderedHtml: string;
  isRendering: boolean;
  setQuery: (query: string) => void;
  setLanguage: (language: LanguageFilter) => void;
  renderDocument: (doc: GuideDoc) => Promise<void>;
};

export const useGuideStore = create<GuideState>((set, get) => ({
  query: "",
  language: "all",
  renderedDocId: null,
  renderedHtml: "",
  isRendering: false,
  setQuery: (query) => set({ query }),
  setLanguage: (language) => set({ language }),
  renderDocument: async (doc) => {
    if (get().renderedDocId === doc.id && get().renderedHtml) {
      return;
    }

    set({ isRendering: true, renderedDocId: doc.id });
    const { renderMarkdown } = await import("../lib/markdown");
    const renderedHtml = await renderMarkdown(doc.body);

    if (get().renderedDocId === doc.id) {
      set({ renderedHtml, isRendering: false });
    }
  },
}));
