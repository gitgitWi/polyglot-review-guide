import {
  BookOpen,
  Code2,
  Languages,
  Search,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { guideDocs, type GuideDoc } from "./generated/guide-data";
import { useGuideStore, type LanguageFilter } from "./store/guide-store";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GuideIndex,
});

const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guide/$docId",
  component: GuideDetail,
});

const routeTree = rootRoute.addChildren([indexRoute, docRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function RootLayout() {
  return <Outlet />;
}

function GuideIndex() {
  const first = guideDocs[0];
  return <GuideShell selectedDoc={first} />;
}

function GuideDetail() {
  const { docId } = useParams({ from: "/guide/$docId" });
  const selectedDoc = guideDocs.find((doc) => doc.id === docId) ?? guideDocs[0];
  return <GuideShell selectedDoc={selectedDoc} />;
}

function GuideShell({ selectedDoc }: { selectedDoc: GuideDoc }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "quiz">("guide");

  const query = useGuideStore((state) => state.query);
  const language = useGuideStore((state) => state.language);
  const renderedHtml = useGuideStore((state) => state.renderedHtml);
  const isRendering = useGuideStore((state) => state.isRendering);
  const setQuery = useGuideStore((state) => state.setQuery);
  const setLanguage = useGuideStore((state) => state.setLanguage);
  const renderDocument = useGuideStore((state) => state.renderDocument);
  const visibleDocs = filterDocs(query, language);

  const currentDoc = visibleDocs.some((doc) => doc.id === selectedDoc.id)
    ? selectedDoc
    : visibleDocs[0] ?? selectedDoc;

  useEffect(() => {
    void renderDocument(currentDoc);
  }, [currentDoc, renderDocument]);

  // Close sidebar and reset tab to guide when route/doc changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setActiveTab("guide");
  }, [selectedDoc]);

  return (
    <div className="app-shell">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "is-open" : ""}`} aria-label="Guide navigation">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <Languages size={22} strokeWidth={1.8} />
            </div>
            <div>
              <p className="brand-kicker">Alan presents</p>
              <h1>Polyglot Guide</h1>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="hero-panel">
          <p className="eyebrow">Kotlin · Go · field guide</p>
          <p>
            TypeScript 개발자 관점에서 대형 언어 생태계 코드를 읽고 분석하기 위한 전문 기술 백서.
          </p>
        </div>

        <label className="search-box">
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

        <div className="filters" aria-label="Language filters">
          {[
            ["all", "All"],
            ["kotlin", "Kotlin"],
            ["go", "Go"],
            ["both", "Both"],
          ].map(([value, label]) => (
            <button
              className={language === value ? "is-active" : ""}
              key={value}
              type="button"
              onClick={() => setLanguage(value as LanguageFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        <nav className="doc-list" aria-label="Documents">
          {visibleDocs.map((doc) => (
            <Link
              className={`doc-link ${doc.id === currentDoc.id ? "is-selected" : ""}`}
              key={doc.id}
              params={{ docId: doc.id }}
              to="/guide/$docId"
            >
              <span className="doc-link-title">{doc.title}</span>
              <span className="doc-link-summary">{doc.summary}</span>
            </Link>
          ))}
          {visibleDocs.length === 0 ? <p className="empty">No matching documents.</p> : null}
        </nav>
      </aside>

      {/* Main Content Workspace */}
      <main className="content-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="breadcrumbs">
              <span className="breadcrumb-category">{currentDoc.category}</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-lang">{currentDoc.language}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Guide/Quiz Tabs Switcher */}
            <div className="tab-switcher" role="tablist" aria-label="Content Mode">
              <button
                className={`tab-btn ${activeTab === "guide" ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === "guide"}
                type="button"
                onClick={() => setActiveTab("guide")}
              >
                <BookOpen size={14} />
                Guide
              </button>
              <button
                className={`tab-btn ${activeTab === "quiz" ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === "quiz"}
                type="button"
                onClick={() => setActiveTab("quiz")}
              >
                <Sparkles size={14} />
                Quiz
                <span className="tab-badge">Beta</span>
              </button>
            </div>

            <div className="meta-pills" aria-label="Document metadata">
              <span>
                <BookOpen size={14} /> {currentDoc.wordCount.toLocaleString()} words
              </span>
            </div>
          </div>
        </header>

        {activeTab === "guide" ? (
          <>
            <section className="summary-band">
              <div>
                <Code2 size={18} />
                <p>{currentDoc.summary}</p>
              </div>
            </section>

            <article
              aria-busy={isRendering}
              className="doc-content"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </>
        ) : (
          <section className="quiz-container">
            <div className="quiz-hero">
              <div className="quiz-badge">
                <Sparkles size={14} />
                Interactive Practice
              </div>
              <h2>Review Readiness Quiz</h2>
              <p>
                가이드 문서의 핵심 개념을 복습하고, 실제 코드 리뷰 상황에서 감지해야 할 리스크를 퀴즈로 검증해보세요.
              </p>
            </div>

            {/* Quiz Preview Layout (Disabled placeholder) */}
            <div className="quiz-card-stack">
              <div className="quiz-preview-card">
                <div className="quiz-card-header">
                  <span className="quiz-q-num">QUESTION 1 / 3</span>
                  <span className="quiz-difficulty">Kotlin / JPA</span>
                </div>
                <h3 className="quiz-q-title">
                  다음 코틀린 서비스 메서드에서 발생할 수 있는 아키텍처 관점의 가장 심각한 위험 요인은 무엇인가요?
                </h3>
                <div className="quiz-code-snip">
                  <pre>
                    <code>{`@Transactional
fun processOrder(orderId: UUID) {
    val order = orderRepository.findByIdOrNull(orderId) ?: throw NotFoundException()
    order.status = OrderStatus.PROCESSING
    
    // 외부 결제사 PG API 호출
    paymentGatewayClient.authorize(order.amount)
}`}</code>
                  </pre>
                </div>
                <div className="quiz-options">
                  <button className="quiz-opt-btn" type="button" disabled>
                    <span className="opt-marker">A</span>
                    <span>authorize 호출 시 NullPointerException 발생 가능성</span>
                  </button>
                  <button className="quiz-opt-btn is-correct-hint" type="button" disabled>
                    <span className="opt-marker">B</span>
                    <span>트랜잭션 범위 내 장시간 PG API 호출로 인한 DB 커넥션 고갈 위험</span>
                  </button>
                  <button className="quiz-opt-btn" type="button" disabled>
                    <span className="opt-marker">C</span>
                    <span>val 변수로 선언된 order 객체 상태 수정 불가에 따른 컴파일 에러</span>
                  </button>
                </div>
              </div>

              <div className="quiz-coming-soon-overlay">
                <div className="coming-soon-content">
                  <div className="coming-soon-icon">
                    <HelpCircle size={32} />
                  </div>
                  <h3>Quiz Coming Soon</h3>
                  <p>
                    TypeScript 개발자를 위한 맞춤형 코드 리뷰 모의 퀴즈 기능이 곧 제공됩니다.
                    상세 퀴즈 셋업 및 채점 로직이 탑재될 예정입니다.
                  </p>
                  <button className="coming-soon-btn" type="button" onClick={() => setActiveTab("guide")}>
                    가이드 독서로 돌아가기
                    <ArrowRight size={14} style={{ marginLeft: "6px" }} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function filterDocs(query: string, language: LanguageFilter) {
  const normalized = query.trim().toLowerCase();
  return guideDocs.filter((doc) => {
    const languageMatches =
      language === "all" || doc.language === language || doc.language === "both";
    const text = `${doc.title} ${doc.summary} ${doc.category} ${doc.body}`.toLowerCase();
    return languageMatches && text.includes(normalized);
  });
}
