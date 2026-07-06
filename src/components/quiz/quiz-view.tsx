import React from "react";
import { ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import styles from "./quiz-view.module.css";

interface QuizViewProps {
  onBackToGuide: () => void;
}

export function QuizView({ onBackToGuide }: QuizViewProps) {
  return (
    <section className={styles.quizContainer}>
      <div className={styles.quizHero}>
        <div className={styles.quizBadge}>
          <Sparkles size={14} />
          Interactive Practice
        </div>
        <h2>Review Readiness Quiz</h2>
        <p>
          가이드 문서의 핵심 개념을 복습하고, 실제 코드 리뷰 상황에서 감지해야 할 리스크를 퀴즈로 검증해보세요.
        </p>
      </div>

      <div className={styles.quizCardStack}>
        <div className={styles.quizPreviewCard}>
          <div className={styles.quizCardHeader}>
            <span className={styles.quizQNum}>QUESTION 1 / 3</span>
            <span className={styles.quizDifficulty}>Kotlin / JPA</span>
          </div>
          <h3 className={styles.quizQTitle}>
            다음 코틀린 서비스 메서드에서 발생할 수 있는 아키텍처 관점의 가장 심각한 위험 요인은 무엇인가요?
          </h3>
          <div className={styles.quizCodeSnip}>
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
          <div className={styles.quizOptions}>
            <button className={styles.quizOptBtn} type="button" disabled>
              <span className={styles.optMarker}>A</span>
              <span>authorize 호출 시 NullPointerException 발생 가능성</span>
            </button>
            <button className={`${styles.quizOptBtn} ${styles.isCorrectHint}`} type="button" disabled>
              <span className={styles.optMarker}>B</span>
              <span>트랜잭션 범위 내 장시간 PG API 호출로 인한 DB 커넥션 고갈 위험</span>
            </button>
            <button className={styles.quizOptBtn} type="button" disabled>
              <span className={styles.optMarker}>C</span>
              <span>val 변수로 선언된 order 객체 상태 수정 불가에 따른 컴파일 에러</span>
            </button>
          </div>
        </div>

        <div className={styles.quizComingSoonOverlay}>
          <div className={styles.comingSoonContent}>
            <div className={styles.comingSoonIcon}>
              <HelpCircle size={32} />
            </div>
            <h3>Quiz Coming Soon</h3>
            <p>
              TypeScript 개발자를 위한 맞춤형 코드 리뷰 모의 퀴즈 기능이 곧 제공됩니다.
              상세 퀴즈 셋업 및 채점 로직이 탑재될 예정입니다.
            </p>
            <button className={styles.comingSoonBtn} type="button" onClick={onBackToGuide}>
              가이드 독서로 돌아가기
              <ArrowRight size={14} style={{ marginLeft: "6px" }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
