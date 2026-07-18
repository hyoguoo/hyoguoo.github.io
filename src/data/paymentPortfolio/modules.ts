// payment-platform 포트폴리오 데이터 — 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const LAYER_EX = {
    domain:["PaymentEvent","PaymentOrder","PaymentEventStatus"],
    application:["*UseCase","port/in · port/out","PaymentTransactionCoordinator"],
    presentation:["PaymentController","dto"],
    infrastructure:["Kafka publisher · consumer","Redis 어댑터","JPA repository","스케줄러 워커"],
    core:["LogFmt","VT executor 설정"]
  };

export const LAYER_META = [
    {k:"domain",name:"domain",dep:"의존 없음",desc:"순수 도메인 — 외부 의존성 없이 핵심 비즈니스 규칙과 상태를 정의한다."},
    {k:"application",name:"application",dep:"→ domain",desc:"use case + 입력/출력 포트 + 보조 서비스. 흐름의 조율을 담당한다."},
    {k:"presentation",name:"presentation",dep:"→ port.in",desc:"HTTP 진입 — Controller + request/response DTO"},
    {k:"infrastructure",name:"infrastructure",dep:"→ port.out (구현)",desc:"출력 포트 어댑터 — JPA·Kafka·HTTP·Redis·스케줄러·채널·벤더 게이트웨이"},
    {k:"core",name:"core",dep:"횡단",desc:"횡단 관심사 — 로깅(LogFmt)·설정·VT executor·응답 래퍼"}
  ];
