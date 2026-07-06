import { Link } from "@tanstack/react-router";
import { ArrowRight, Tag } from "lucide-react";
import type { GuideDoc } from "../../generated/guide-data";
import { useGuideStore } from "../../store/guide-store";
import styles from "./home-view.module.css";

interface HomeViewProps {
  docs: GuideDoc[];
}

export function HomeView({ docs }: HomeViewProps) {
  const setLanguage = useGuideStore((state) => state.setLanguage);

  // Find first overview doc to link "Get Started"
  const overviewDoc = docs.find((d) => d.id.includes("overview")) ?? docs[0];

  return (
    <div className={styles.homeContainer}>
      <section className={styles.heroSection}>
        <div className={styles.accentGlow} />
        <div className={styles.heroContent}>
          <h2 className={styles.displayHeadline}>Read backend code with confidence.</h2>
          <p className={styles.heroSub}>
            TypeScript 개발자 관점에서 Kotlin과 Go의 런타임 모델, 트랜잭션, 동시성 구조를 비교
            분석하고, 프로덕션 환경의 리스크를 식별하기 위한 코드 리뷰 가이드북.
          </p>
          <div className={styles.ctaGroup}>
            <Link
              to="/guide/$docId"
              params={{ docId: overviewDoc.id }}
              onClick={() => setLanguage("all")}
              className={styles.primaryBtn}
            >
              가이드 읽기 시작
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/tags"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline-strong)] px-[18px] text-[14px] font-medium text-[var(--body)] no-underline transition-colors hover:border-[var(--orange)] hover:text-[var(--orange)]"
            >
              <Tag size={15} /> 태그로 탐색
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.roadmapSection}>
        <h3 className={styles.sectionTitle}>Review Roadmaps</h3>
        <div className={styles.grid}>
          {/* Kotlin Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLangBadge}>Kotlin / Spring</span>
            </div>
            <h4>엔터프라이즈 서버 아키텍처</h4>
            <p>
              JVM 멀티 스레드 모델, 데이터베이스 트랜잭션 범위 제어, 그리고 JPA 지연 로딩과 프록시의
              성능 위험 요소를 리뷰합니다.
            </p>
            <Link
              to="/guide/$docId"
              params={{ docId: "kotlin-spring-review" }}
              onClick={() => setLanguage("kotlin")}
              className={styles.cardLink}
            >
              Kotlin 리뷰 핵심 보기
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Go Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLangBadge}>Go / Systems</span>
            </div>
            <h4>명시적 흐름과 병렬성</h4>
            <p>
              경량 고루틴 누수, 채널 송수신 교착(데드락), Context를 통한 명시적 취소 신호 전파 및
              에러 래핑 구조를 리뷰합니다.
            </p>
            <Link
              to="/guide/$docId"
              params={{ docId: "go-service-review" }}
              onClick={() => setLanguage("go")}
              className={styles.cardLink}
            >
              Go 리뷰 핵심 보기
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* AI Check Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLangBadge}>AI Code Audit</span>
            </div>
            <h4>AI 생성 코드 교차 진단</h4>
            <p>
              생성형 AI가 놓치기 쉬운 영속 계층 롤백 무산, 널 강제 단언(!!), 에러 삼킴, 웹 핸들러의
              조기 리턴 누락을 방어합니다.
            </p>
            <Link
              to="/guide/$docId"
              params={{ docId: "ai-code-review-checklist" }}
              onClick={() => setLanguage("both")}
              className={styles.cardLink}
            >
              AI 체크리스트 보기
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
