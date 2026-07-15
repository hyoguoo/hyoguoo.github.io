// payment-platform 포트폴리오 데이터 — 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const LAYER_EX = {
    domain:["PaymentEvent","PaymentOrder","PaymentEventStatus"],
    application:["*UseCase","port/in · port/out","PaymentTransactionCoordinator"],
    presentation:["PaymentController","dto"],
    infrastructure:["Kafka publisher · consumer","Redis 어댑터","JPA repository","스케줄러 워커"],
    core:["LogFmt","VT executor 설정"]
  };

export const SVC_DIFF = [
    {id:"payment",name:"payment-service",role:"결제 오케스트레이션 — 재고 선차감, outbox 발행, EOS 결과 확정의 중심.",chips:["OutboxImmediateEventHandler","StockCacheRedisAdapter · Lua","JdbcPaymentEventDedupeStore","checkout 멱등 (Redis 기본)","admin 복구 화면"]},
    {id:"pg",name:"pg-service",role:"PG 벤더 호출 격리 — inbox/outbox 작업 큐와 재시도 로직이 전부 여기에 있다.",chips:["toss · nicepay Strategy","PgInbox/Outbox 채널","self-loop 재시도 워커","TraceparentExtractor"]},
    {id:"product",name:"product-service",role:"상품·재고의 기준 장부 — stock-committed를 받아 실제 차감을 확정.",chips:["stock-committed consumer","JdbcEventDedupeStore · UNIQUE"]},
    {id:"user",name:"user-service",role:"구매자 정보 조회 — 가장 얇은 서비스.",chips:["repository 조회만"]}
  ];

export const LAYER_META = [
    {k:"domain",name:"domain",dep:"의존 없음",desc:"순수 도메인 — Entity·VO·enums·도메인 예외. 프레임워크 0."},
    {k:"application",name:"application",dep:"→ domain",desc:"use case + 입력/출력 포트 + 보조 서비스. 흐름의 조율을 담당한다."},
    {k:"presentation",name:"presentation",dep:"→ port.in",desc:"HTTP 진입 — Controller(직속) + request/response DTO."},
    {k:"infrastructure",name:"infrastructure",dep:"→ port.out (구현)",desc:"출력 포트 어댑터 — JPA·Kafka·HTTP·Redis·스케줄러·채널·벤더 게이트웨이."},
    {k:"core",name:"core",dep:"횡단",desc:"횡단 관심사 — 로깅(LogFmt)·설정·VT executor·응답 래퍼."}
  ];
