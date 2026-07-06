import { useEffect, useState } from "react";
import { createBundledHighlighter, createSingletonShorthands } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import styles from "./code-block.module.css";

const bundledLanguages = {
  go: () => import("@shikijs/langs/go"),
  javascript: () => import("@shikijs/langs/javascript"),
  json: () => import("@shikijs/langs/json"),
  jsx: () => import("@shikijs/langs/jsx"),
  kotlin: () => import("@shikijs/langs/kotlin"),
  markdown: () => import("@shikijs/langs/markdown"),
  shellscript: () => import("@shikijs/langs/shellscript"),
  tsx: () => import("@shikijs/langs/tsx"),
  typescript: () => import("@shikijs/langs/typescript"),
  yaml: () => import("@shikijs/langs/yaml"),
} as const;

const bundledThemes = {
  "github-dark": () => import("@shikijs/themes/github-dark"),
} as const;

const createHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createJavaScriptRegexEngine(),
});

const { codeToHtml } = createSingletonShorthands(createHighlighter);

const languageAliases: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  kt: "kotlin",
  kotlin: "kotlin",
  go: "go",
  golang: "go",
  sh: "shellscript",
  shell: "shellscript",
  bash: "shellscript",
  yaml: "yaml",
  yml: "yaml",
  json: "json",
  md: "markdown",
  markdown: "markdown",
};

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "text" }: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const cleanLang = language.trim().toLowerCase();
  const matchedLang = languageAliases[cleanLang] ?? "text";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function highlight() {
      try {
        const html = await codeToHtml(code, {
          lang: matchedLang,
          theme: "github-dark",
        });
        if (isMounted) {
          setHighlightedHtml(html);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to highlight code:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void highlight();

    return () => {
      isMounted = false;
    };
  }, [code, matchedLang]);

  return (
    <div className={styles.codeFrame}>
      <div className={styles.codeLabel}>
        <span>{language || "text"}</span>
      </div>
      {isLoading ? (
        <pre className={styles.loadingPre}>
          <code>{code}</code>
        </pre>
      ) : (
        <div
          className={styles.shikiWrapper}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      )}
    </div>
  );
}
