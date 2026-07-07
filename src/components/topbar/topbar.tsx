import { BookOpen, Menu } from "lucide-react";
import type { ShellDoc } from "../app-shell";
import styles from "./topbar.module.css";

interface TopbarProps {
  currentDoc: ShellDoc;
  onMenuOpen: () => void;
  isShrunk?: boolean;
}

export function Topbar({ currentDoc, onMenuOpen, isShrunk = false }: TopbarProps) {
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
    </header>
  );
}
