import React from "react";
import { BookOpen, Menu, Sparkles } from "lucide-react";
import type { GuideDoc } from "../../generated/guide-data";
import styles from "./topbar.module.css";

interface TopbarProps {
  currentDoc: GuideDoc;
  activeTab: "guide" | "quiz";
  onTabChange: (tab: "guide" | "quiz") => void;
  onMenuOpen: () => void;
}

export function Topbar({ currentDoc, activeTab, onTabChange, onMenuOpen }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button
          className={styles.hamburgerBtn}
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbCategory}>{currentDoc.category}</span>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbLang}>{currentDoc.language}</span>
        </div>
      </div>

      <div className={styles.topbarRight}>
        <div className={styles.tabSwitcher} role="tablist" aria-label="Content Mode">
          <button
            className={`${styles.tabBtn} ${activeTab === "guide" ? styles.isActive : ""}`}
            role="tab"
            aria-selected={activeTab === "guide"}
            type="button"
            onClick={() => onTabChange("guide")}
          >
            <BookOpen size={14} />
            Guide
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "quiz" ? styles.isActive : ""}`}
            role="tab"
            aria-selected={activeTab === "quiz"}
            type="button"
            onClick={() => onTabChange("quiz")}
          >
            <Sparkles size={14} />
            Quiz
            <span className={styles.tabBadge}>Beta</span>
          </button>
        </div>

        <div className={styles.metaPills} aria-label="Document metadata">
          <span>
            <BookOpen size={14} /> {currentDoc.wordCount.toLocaleString()} words
          </span>
        </div>
      </div>
    </header>
  );
}
