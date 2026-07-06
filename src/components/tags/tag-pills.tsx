import { Link } from "@tanstack/react-router";
import { Tag as TagIcon } from "lucide-react";

interface TagPillsProps {
  tags: string[];
  /** When set, the pill matching this tag is highlighted (used on the tag detail page). */
  activeTag?: string;
  onNavigate?: () => void;
}

/** A row of clickable tag chips that link to the per-tag page. */
export function TagPills({ tags, activeTag, onNavigate }: TagPillsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isActive = tag === activeTag;
        return (
          <Link
            key={tag}
            to="/tags/$tag"
            params={{ tag }}
            onClick={onNavigate}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] no-underline transition-colors ${
              isActive
                ? "border-[var(--orange)] bg-[var(--orange-glow)] text-[var(--orange)]"
                : "border-[var(--hairline-strong)] bg-[var(--surface-card)] text-[var(--charcoal)] hover:border-[var(--orange)] hover:text-[var(--orange)]"
            }`}
          >
            <TagIcon size={11} />
            {tag}
          </Link>
        );
      })}
    </div>
  );
}
