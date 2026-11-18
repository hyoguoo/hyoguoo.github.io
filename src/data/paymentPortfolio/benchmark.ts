// payment-platform 포트폴리오 데이터 · 부하 테스트(k6) 결과.
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro
//
// ⚠️ 데이터 시점: 2026-04-03 측정 (Phase 5 · 모놀리스 단일 JVM).
//    동기 vs 비동기 전환 검증용이며 현재 토폴로지 성능이 아님. MSA(Phase 6) 구조의 처리 한계는
//    index.astro의 "MSA · 결제 처리 병목 개선" 카드에 정적으로 있다(2026-11-16 측정, 측정 방식이 달라 이 차트와 비교하지 않음).
//    출처: GitHub Wiki · Benchmark-Report (Round 4 "Golden Ratio", 고지연 환경, 3회 평균).

export const BENCH_META = {
    when: "2026-04 측정 · Phase 5",
    note: "※ Phase 5(모놀리스) 아키텍처 기준 3회 반복 측정한 평균값. 4서비스로 나뉜 현재 구조의 처리 한계는 아래 '결제 처리 병목 개선' 카드에 정리했다.",
};

// higher-is-better 는 처리량뿐 · 나머지는 값이 작을수록 우수. 막대는 값 크기, 색은 async 강조로 통일.
export const BENCH_BARS = [
    {k:"처리량",   sub:"TPS",         sync:54.1, async:79.8, unit:"/s", tag:"+47.5%"},
    {k:"응답성",   sub:"Confirm med", sync:6157, async:5.3,  unit:"ms", tag:"즉시 반환"},
    {k:"가용성",   sub:"부하 미수용",  sync:1945, async:0,    unit:"건", tag:"유실 0"},
    {k:"완료 지연", sub:"E2E p95",     sync:9343, async:3423, unit:"ms", tag:"2.7× 빠름"},
];

// MSA(Phase 6) · pg_inbox 인덱스 교체 전후 전체 결제 측정 (2026-08 말, 초당 40건 · 결제 2대 · PG 2대, 각 1회).
// 출처: payment-platform docs/archive/shared-resource-scaleout/SHARED-RESOURCE-SCALEOUT-INVESTIGATION.md "4. 결과".
// 렌더: panels.ts의 전후 막대(블로그 PgCompletionComparison과 같은 표현). max·ticks는 지표마다 따로 쓰는 0 기준 축이다.
export const DEADLOCK_COMPARE = [
    {k:"결제 완료 시간 p99", before:73.10, after:9.28, unit:"초", max:80, ticks:[0,20,40,60,80], tag:"약 8분의 1"},
    {k:"승인 결과 저장 데드락", before:163, after:0, unit:"건", max:180, ticks:[0,60,120,180], tag:"전부 해소"},
];

// MSA(Phase 6) · 결제 처리 한계 구간의 이동 (요청 속도마다 3분, 20건 단위 탐색). 2026-11-06 ~ 11-16 측정.
// kept = 부하 중 밀린 결제가 줄어든 가장 높은 속도(안정 처리), piled = 계속 늘어난 가장 낮은 속도(적체 누적).
// 출처: payment-platform docs/archive/payment-throughput/BRIEF.md "문제와 결과", EXPERIMENTS.md 판단 표.
// 렌더: panels.ts의 구간 막대(블로그 ThroughputBoundary와 같은 표현).
export const CAPACITY_AXIS = {max:220, ticks:[0,40,80,120,160,200]};
export const CAPACITY_STAGES = [
    {label:"변경 전", change:"결과 반영 스레드 1개", kept:120, piled:140},
    {label:"결과 반영 개선 뒤", change:"결과 반영 스레드 3개", kept:140, piled:160},
    {label:"최종", change:"+ 명령 수신 스레드 3개 · 승인 워커 64개 · 결과 발행 워커 8개", kept:180, piled:200},
];
