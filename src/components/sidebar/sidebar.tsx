import React from "react";
import { Link } from "@tanstack/react-router";
import { Languages, Search, X } from "lucide-react";
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

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.isOpen : ""}`} aria-label="Guide navigation">
      <div className={styles.sidebarHeader}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            <Languages size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className={styles.brandKicker}>Alan presents</p>
            <h1 className={styles.brandTitle}>Polyglot Guide</h1>
          </div>
        </div>
        <button
          className={styles.sidebarCloseBtn}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.heroPanel}>
        <p className={styles.eyebrow}>Kotlin · Go · field guide</p>
        <p>
          TypeScript 개발자 관점에서 대형 언어 생태계 코드를 읽고 분석하기 위한 전문 기술 백서.
        </p>
      </div>

      <label className={styles.searchBox}>
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

      <div className={styles.filters} aria-label="Language filters">
        {[
          ["all", "All"],
          ["kotlin", "Kotlin"],
          ["go", "Go"],
          ["both", "Both"],
        ].map(([value, label]) => (
          <button
            className={language === value ? styles.isActive : ""}
            key={value}
            type="button"
            onClick={() => setLanguage(value as LanguageFilter)}
          >
            {label}
          </button>
        ))}
      </div>

      <nav className={styles.docList} aria-label="Documents">
        {visibleDocs.map((doc) => (
          <Link
            className={`${styles.docLink} ${doc.id === currentDoc.id ? styles.isSelected : ""}`}
            key={doc.id}
            params={{ docId: doc.id }}
            to="/guide/$docId"
          >
            <span className={styles.docLinkTitle}>{doc.title}</span>
            <span className={styles.docLinkSummary}>{doc.summary}</span>
          </Link>
        ))}
        {visibleDocs.length === 0 ? <p className={styles.empty}>No matching documents.</p> : null}
      </nav>
    </aside>
  );
}
