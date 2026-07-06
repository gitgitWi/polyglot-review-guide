import { BookOpen, Menu, Sparkles } from "lucide-react";
import type { ShellDoc } from "../app-shell";
import styles from "./topbar.module.css";

interface TopbarProps {
  currentDoc: ShellDoc;
  activeTab: "guide" | "quiz";
  onTabChange: (tab: "guide" | "quiz") => void;
  onMenuOpen: () => void;
  isShrunk?: boolean;
}

export function Topbar({
  currentDoc,
  activeTab,
  onTabChange,
  onMenuOpen,
  isShrunk = false,
}: TopbarProps) {
  // Hide the tab switcher on non-document views (home overview, tag pages) since there's no quiz there.
  const showTabs = currentDoc.id !== "home" && currentDoc.id !== "tags";

  return (
    <header className={`${styles.topbar} ${isShrunk ? styles.isShrunk : ""}`}>
      <div className={styles.topbarLeft}>
        <button
          className={styles.hamburgerBtn}
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>{currentDoc.title}</h1>
          {currentDoc.wordCount > 0 && (
            <div className={styles.metaPills} aria-label="Document metadata">
              <span>
                <BookOpen size={12} /> {currentDoc.wordCount.toLocaleString()} words
              </span>
            </div>
          )}
        </div>
      </div>

      {showTabs && (
        <div className={styles.topbarRight}>
          <div className={styles.tabSwitcher} role="tablist" aria-label="Content Mode">
            <button
              className={`${styles.tabBtn} ${activeTab === "guide" ? styles.isActive : ""}`}
              role="tab"
              aria-selected={activeTab === "guide"}
              type="button"
              onClick={() => onTabChange("guide")}
            >
              <BookOpen size={13} />
              Guide
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "quiz" ? styles.isActive : ""}`}
              role="tab"
              aria-selected={activeTab === "quiz"}
              type="button"
              onClick={() => onTabChange("quiz")}
            >
              <Sparkles size={13} />
              Quiz
              <span className={styles.tabBadge}>Beta</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
