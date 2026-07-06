import { create } from "zustand";

export type LanguageFilter = "all" | "kotlin" | "go" | "both";

type GuideState = {
  query: string;
  language: LanguageFilter;
  setQuery: (query: string) => void;
  setLanguage: (language: LanguageFilter) => void;
};

export const useGuideStore = create<GuideState>((set) => ({
  query: "",
  language: "all",
  setQuery: (query) => set({ query }),
  setLanguage: (language) => set({ language }),
}));
