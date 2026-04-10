export const BLOG_SERIES = {
  payment: {
    title: "Payment Platform Project",
    posts: [
      { id: "blog/payment-system-with-toss", title: "결제 정보 검증을 통한 안전한 결제 연동 시스템 구현" },
      { id: "blog/minimize-transaction-scope", title: "트랜잭션 범위 최소화를 통한 성능 및 안정성 향상" },
      { id: "blog/payment-status-with-retry", title: "결제 상태 전환 관리와 재시도 로직을 통한 결제 복구 시스템 구축" },
      { id: "blog/payment-system-test", title: "외부 의존성 제어를 통한 결제 프로세스 다양한 시나리오 검증" },
      { id: "blog/log-structure-and-performance", title: "Logger 성능 저하 방지와 구조화된 로깅 설계" },
      { id: "blog/payment-history-and-metrics", title: "결제 이력 추적 및 핵심 지표 모니터링 시스템 구현" },
      { id: "blog/payment-compensation-transaction", title: "보상 트랜잭션 실패 상황 극복 가능한 결제 플로우 설계" },
      { id: "blog/payment-gateway-strategy-pattern", title: "전략 패턴을 통한 PG 독립성 확보 및 확장 가능한 결제 시스템 설계" },
      { id: "blog/checkout-idempotency", title: "Checkout API 멱등성 보장 — Caffeine 캐시와 TOCTOU 경쟁 조건 해결" },
      { id: "blog/async-payment-flow", title: "비동기 결제 처리 플로우 구현 — Outbox 패턴부터 LinkedBlockingQueue Worker까지" },
      { id: "blog/payment-recovery-state-design", title: "결제 복구 상태 모델 설계 — 장애 내성을 갖춘 상태 전이" },
    ]
  }
} as const;

export type SeriesKey = keyof typeof BLOG_SERIES;
