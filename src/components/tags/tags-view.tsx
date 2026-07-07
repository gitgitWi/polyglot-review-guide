import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Tag as TagIcon } from "lucide-react";
import { guideDocs, type GuideDoc } from "../../generated/guide-data";
import { TagPills } from "./tag-pills";

/** Build a `tag -> docs` index once per render. The dataset is tiny (a dozen docs). */
function buildTagIndex(): Map<string, GuideDoc[]> {
  const index = new Map<string, GuideDoc[]>();
  for (const doc of guideDocs) {
    for (const tag of doc.tags) {
      const list = index.get(tag);
      if (list) {
        list.push(doc);
      } else {
        index.set(tag, [doc]);
      }
    }
  }
  return index;
}

const displayFont = { fontFamily: "var(--font-display)" } as const;

/** `/tags` — the full tag directory, sorted by frequency then alphabetically. */
export function TagsIndex() {
  const index = buildTagIndex();
  const entries = [...index.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  const totalTagged = guideDocs.filter((doc) => doc.tags.length > 0).length;

  return (
    <div className="doc-content">
      <h1 className="m-0 mb-3 text-[42px] font-normal leading-[1.05] text-[var(--ink)]" style={displayFont}>
        Browse by Tag
      </h1>
      <p className="m-0 mb-8 max-w-[640px] text-[15px] leading-[1.6] text-[var(--charcoal)]">
        주제 태그로 관련 문서를 모아 볼 수 있습니다. {entries.length}개의 태그가 {totalTagged}개
        문서에 걸쳐 있으며, 자주 쓰이는 태그일수록 앞에 표시됩니다.
      </p>

      <div className="flex flex-wrap gap-2.5">
        {entries.map(([tag, docs]) => (
          <Link
            key={tag}
            to="/tags/$tag"
            params={{ tag }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-card)] py-2 pl-3.5 pr-2.5 text-[13.5px] text-[var(--body)] no-underline transition-colors hover:border-[var(--crimson)] hover:text-[var(--crimson)]"
          >
            <TagIcon size={13} className="text-[var(--ash)]" />
            {tag}
            <span className="grid min-w-[20px] place-items-center rounded-full bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--ash)]">
              {docs.length}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** `/tags/$tag` — every document carrying a given tag, plus related tags. */
export function TagDetail({ tag }: { tag: string }) {
  const index = buildTagIndex();
  const docs = (index.get(tag) ?? []).slice().sort((a, b) => a.order - b.order);

  // Tags that co-occur with this one, for lateral navigation.
  const related = new Map<string, number>();
  for (const doc of docs) {
    for (const other of doc.tags) {
      if (other !== tag) {
        related.set(other, (related.get(other) ?? 0) + 1);
      }
    }
  }
  const relatedTags = [...related.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);

  return (
    <div className="doc-content">
      <Link
        to="/tags"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--mute)] no-underline transition-colors hover:text-[var(--crimson)]"
      >
        <ArrowLeft size={14} /> 전체 태그
      </Link>

      <h1 className="m-0 flex items-center gap-2.5 text-[40px] font-normal leading-[1.05] text-[var(--ink)]" style={displayFont}>
        <TagIcon size={30} className="text-[var(--crimson)]" />
        {tag}
      </h1>
      <p className="m-0 mb-8 mt-3 text-[15px] text-[var(--charcoal)]">
        {docs.length > 0
          ? `이 태그가 달린 문서 ${docs.length}개`
          : "이 태그가 달린 문서가 없습니다."}
      </p>

      <div className="flex flex-col gap-3">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            to="/guide/$docId"
            params={{ docId: doc.id }}
            className="group flex flex-col gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-5 no-underline transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-elevated)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[16px] font-semibold text-[var(--ink)]">{doc.title}</span>
              <ChevronRight
                size={16}
                className="shrink-0 text-[var(--stone)] transition-colors group-hover:text-[var(--crimson)]"
              />
            </div>
            <span className="text-[13.5px] leading-[1.5] text-[var(--mute)]">{doc.summary}</span>
            <div className="mt-1">
              <TagPills tags={doc.tags} activeTag={tag} />
            </div>
          </Link>
        ))}
      </div>

      {relatedTags.length > 0 && (
        <div className="mt-12 border-t border-[var(--hairline)] pt-7">
          <h2 className="m-0 mb-4 text-[11px] font-bold uppercase tracking-wider text-[var(--stone)]">
            연관 태그
          </h2>
          <TagPills tags={relatedTags} />
        </div>
      )}
    </div>
  );
}
