// payment-platform 포트폴리오 데이터 · 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const RACES = [
    {t:"아웃박스 이벤트 중복 발행",haz:"즉시 발행기와 폴링 워커가 같은 아웃박스 레코드를 동시에 선점해 중복 발행할 위험",def:"레코드가 PENDING일 때만 IN_FLIGHT로 바꾸는 조건부 갱신으로, 먼저 성공한 한 건만 발행하고 갱신 0건인 쪽은 즉시 포기해 중복 발행 차단",mech:"조건부 선점 갱신"},
    {t:"재고 차감 동시성 경합",haz:"동시 결제 요청이 같은 상품 재고를 함께 차감하려 할 때의 초과 판매 위험",def:"Redis Lua 스크립트로 재고를 원자적으로 차감하고, 결제건별 고유 식별자를 남겨 이중 차감 방지",mech:"Redis Lua 원자 차감"},
    {t:"confirm 중복 요청 멱등",haz:"같은 orderId로 confirm이 중복 진입(더블클릭·클라이언트 재시도)해 재고를 이중 차감하거나 확정 명령을 이중 발행할 위험",def:"도메인 상태 가드(READY·IN_PROGRESS만 진입), Redis decrement:done 멱등 키(이미 차감된 주문은 재차감 생략), outbox order_id UNIQUE(동시 진입 시 하나만 커밋·나머지 롤백), 수신 서비스(pg·product)의 자체 멱등 처리",mech:"4중 멱등 (상태·선차감·UNIQUE·수신측)"},
    {t:"동일 주문 건 다중 처리",haz:"여러 워커가 같은 결제 요청을 동시에 처리해 PG 결제망에 중복 승인을 낼 위험",def:"배타적 락(SKIP LOCKED)으로 한 워커만 행을 선점하고, 현재 상태가 기대값일 때만 갱신해 이중 처리 차단",mech:"SKIP LOCKED + 조건부 갱신"},
    {t:"컨슈머 멱등성 및 재전송",haz:"Kafka의 At-Least-Once 특성상 같은 결과 메시지가 여러 번 수신돼 상태가 이중 갱신될 위험",def:"서비스마다 특성에 맞는 3중 방어선(Payment는 DB 이력, PG는 Redis TTL, Product는 UNIQUE 제약)으로 멱등성을 보장",mech:"서비스별 멱등성 (3중 방어)"},
    {t:"종결 후 재전송 메시지 유입",haz:"이미 종결된 결제에 같은 이벤트가 Kafka 재전송(at-least-once)으로 다시 유입돼 종결 상태를 재전이시킬 위험",def:"결제가 이미 종결 상태면 종결 가드(Terminal Guard)가 이후의 전이 시도를 무시",mech:"Terminal Guard (종결 가드)"}];
