import { useEffect, type RefObject } from "react";

/**
 * Client-side Mermaid rendering.
 *
 * The document HTML is rendered to a string at build time (see
 * scripts/build-data.mjs) and injected via dangerouslySetInnerHTML, so Mermaid
 * diagrams cannot be React children. Instead the build emits empty
 * `<div class="mermaid-diagram" data-mermaid="<encoded source>">` placeholders,
 * and this component walks the injected DOM after mount and swaps each one for
 * its rendered SVG.
 *
 * Mermaid itself is a large dependency, so it is dynamically imported the first
 * time a page actually contains a diagram — pages without one never pull the
 * chunk, keeping the main bundle free of a runtime rendering engine (the same
 * principle the Shiki/marked build-time pipeline follows).
 */

// Site palette (dark-only theme, crimson accent) mirrored into Mermaid so
// diagrams sit in the same visual language as the rest of the guide.
const THEME_VARIABLES = {
  darkMode: true,
  background: "#06060a",
  fontFamily:
    'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  primaryColor: "#101012",
  primaryBorderColor: "#e8637a",
  primaryTextColor: "#fcfdff",
  secondaryColor: "#0a0a0c",
  secondaryBorderColor: "#2a2a30",
  secondaryTextColor: "#fcfdff",
  tertiaryColor: "#0a0a0c",
  tertiaryBorderColor: "#2a2a30",
  tertiaryTextColor: "rgba(252, 253, 255, 0.86)",
  lineColor: "#8a8a94",
  textColor: "rgba(252, 253, 255, 0.86)",
  mainBkg: "#101012",
  nodeBorder: "#e8637a",
  clusterBkg: "#06060a",
  clusterBorder: "#2a2a30",
  titleColor: "#fcfdff",
  edgeLabelBackground: "#0a0a0c",
  labelBoxBkgColor: "#101012",
  labelBoxBorderColor: "#2a2a30",
  noteBkgColor: "#1a1416",
  noteBorderColor: "#e8637a",
  noteTextColor: "#fcfdff",
} as const;

// Load + configure Mermaid exactly once, then reuse the ready instance across
// every diagram and every page navigation.
let mermaidReady: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        // Diagram source is authored in our own docs at build time (never user
        // input), so "loose" is safe here and lets labels use <br/> line breaks
        // and richer markup that "strict" would HTML-encode into literal text.
        securityLevel: "loose",
        fontFamily: THEME_VARIABLES.fontFamily,
        themeVariables: THEME_VARIABLES,
      });
      return mermaid;
    });
  }
  return mermaidReady;
}

// Unique, DOM-safe ids for mermaid.render() without relying on Date.now/random.
let renderSeq = 0;

interface MermaidRendererProps {
  /** Ref to the element whose innerHTML holds the injected document markup. */
  containerRef: RefObject<HTMLElement | null>;
  /** Rerun rendering whenever the injected HTML changes (i.e. on navigation). */
  html: string;
}

export function MermaidRenderer({ containerRef, html }: MermaidRendererProps) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(".mermaid-diagram:not([data-rendered])"),
    );
    if (targets.length === 0) {
      return;
    }

    let cancelled = false;

    loadMermaid()
      .then(async (mermaid) => {
        for (const el of targets) {
          if (cancelled) {
            return;
          }
          const source = decodeURIComponent(el.dataset.mermaid ?? "");
          if (!source) {
            continue;
          }
          try {
            const { svg } = await mermaid.render(`mermaid-${(renderSeq += 1)}`, source);
            if (cancelled) {
              return;
            }
            el.innerHTML = svg;
            el.dataset.rendered = "true";
          } catch (error) {
            // Keep a readable fallback rather than an empty box if a diagram
            // fails to parse — surfaces the source and the reason in dev.
            if (cancelled) {
              return;
            }
            el.dataset.rendered = "error";
            el.innerHTML = `<pre class="mermaid-error"><code>${escapeSource(source)}</code></pre>`;
            console.error("Mermaid render failed:", error);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load Mermaid:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [containerRef, html]);

  return null;
}

function escapeSource(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
