// payment-platform 포트폴리오 데이터 · 부하 테스트(k6) 결과.
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro
//
// ⚠️ 데이터 시점: 2026-04-03 측정 (Phase 5 · 모놀리스 단일 JVM).
//    동기 vs 비동기 전환 검증용이며, MSA 분리(Phase 6) 이후 재측정은 미실시 · 현재 토폴로지 성능 아님.
//    출처: GitHub Wiki · Benchmark-Report (Round 4 "Golden Ratio", 고지연 환경, 3회 평균).

export const BENCH_META = {
    when: "2026-04 측정 · Phase 5",
    note: "※ Phase 5(모놀리스) 아키텍처 기준 3회 반복 측정한 평균값. MSA로 전환된 현재(Phase 6) 구조의 최신 벤치마크는 측정 예정.",
};

// higher-is-better 는 처리량뿐 · 나머지는 값이 작을수록 우수. 막대는 값 크기, 색은 async 강조로 통일.
export const BENCH_BARS = [
    {k:"처리량",   sub:"TPS",         sync:54.1, async:79.8, unit:"/s", tag:"+47.5%"},
    {k:"응답성",   sub:"Confirm med", sync:6157, async:5.3,  unit:"ms", tag:"즉시 반환"},
    {k:"가용성",   sub:"부하 미수용",  sync:1945, async:0,    unit:"건", tag:"유실 0"},
    {k:"완료 지연", sub:"E2E p95",     sync:9343, async:3423, unit:"ms", tag:"2.7× 빠름"},
];
