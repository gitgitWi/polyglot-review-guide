import { Link } from "@tanstack/react-router";
import { Search, Tag, X } from "lucide-react";
import type { GuideDoc } from "../../generated/guide-data";
import { useGuideStore, type LanguageFilter } from "../../store/guide-store";
import styles from "./sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  visibleDocs: GuideDoc[];
  currentDoc: GuideDoc;
}

export function Sidebar({ isOpen, onClose, visibleDocs, currentDoc }: SidebarProps) {
  const query = useGuideStore((state) => state.query);
  const language = useGuideStore((state) => state.language);
  const setQuery = useGuideStore((state) => state.setQuery);
  const setLanguage = useGuideStore((state) => state.setLanguage);

  // Group docs by category/language
  const docGroups = [
    {
      title: "Common Fundamentals",
      docs: visibleDocs.filter(
        (d) => d.language === "both" && d.id !== "ai-code-review-checklist",
      ),
    },
    {
      title: "Kotlin & Spring",
      docs: visibleDocs.filter((d) => d.language === "kotlin"),
    },
    {
      title: "Go & Systems",
      docs: visibleDocs.filter((d) => d.language === "go"),
    },
    {
      title: "AI Code Audit",
      docs: visibleDocs.filter((d) => d.id === "ai-code-review-checklist"),
    },
  ].filter((g) => g.docs.length > 0);

  const handleLangBtnClick = (lang: LanguageFilter) => {
    setLanguage(lang);
  };

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.isOpen : ""}`}
      aria-label="Guide navigation"
    >
      <div className={styles.sidebarHeader}>
        <Link to="/" className={styles.brand} onClick={() => setLanguage("all")}>
          <h1 className={styles.brandTitle}>Polyglot Guide</h1>
        </Link>
        <button
          className={styles.sidebarCloseBtn}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <label className={styles.searchBox}>
        <span>
          <Search size={14} /> Search
        </span>
        <input
          type="search"
          placeholder="가이드 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className={styles.filters} role="group" aria-label="Language Filters">
        <button
          className={`${styles.isActive && language === "all" ? styles.isActive : ""}`}
          type="button"
          onClick={() => handleLangBtnClick("all")}
        >
          All
        </button>
        <button
          className={`${styles.isActive && language === "kotlin" ? styles.isActive : ""}`}
          type="button"
          onClick={() => handleLangBtnClick("kotlin")}
        >
          Kotlin
        </button>
        <button
          className={`${styles.isActive && language === "go" ? styles.isActive : ""}`}
          type="button"
          onClick={() => handleLangBtnClick("go")}
        >
          Go
        </button>
        <button
          className={`${styles.isActive && language === "both" ? styles.isActive : ""}`}
          type="button"
          onClick={() => handleLangBtnClick("both")}
        >
          Both
        </button>
      </div>

      <Link
        to="/tags"
        onClick={onClose}
        className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--mute)] no-underline transition-colors hover:text-[var(--orange)]"
      >
        <Tag size={13} /> Browse by tag
      </Link>

      <nav className={styles.docNavigation}>
        {docGroups.length > 0 ? (
          docGroups.map((group) => (
            <div key={group.title} className={styles.groupContainer}>
              <h2 className={styles.groupTitle}>{group.title}</h2>
              <div className={styles.docList}>
                {group.docs.map((doc) => {
                  const isSelected = currentDoc.id === doc.id;
                  return (
                    <Link
                      key={doc.id}
                      to="/guide/$docId"
                      params={{ docId: doc.id }}
                      className={`${styles.docLink} ${isSelected ? styles.isSelected : ""}`}
                    >
                      <span className={styles.docLinkTitle}>{doc.title}</span>
                      <span className={styles.docLinkSummary}>{doc.summary}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>검색 결과가 없습니다.</p>
        )}
      </nav>
    </aside>
  );
}
