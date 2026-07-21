---
name: portfolio
description: "payment-platform-portfolio 페이지(/payment-platform-portfolio/)의 파일 맵과 편집 위치 안내. 결제 플랫폼 포트폴리오의 문구·수치·다이어그램·시나리오·표·상태 머신·설계 결정을 수정하거나, 어느 파일·어느 상수를 고쳐야 하는지 파악해야 할 때 반드시 먼저 사용한다. '포트폴리오', '히어로 문구', '시나리오 추가', '벤치마크 수치', '설계 결정', '상태 머신', '경합 표', '알람 표' 등 포트폴리오 관련 편집·질문이 나오면, 사용자가 파일명을 명시하지 않아도 이 스킬을 참조해 4계층(astro/css/scripts/data) 중 올바른 파일로 라우팅한다."
---

# /portfolio — 결제 플랫폼 포트폴리오 파일 맵 & 편집 라우팅

`/payment-platform-portfolio/` 한 페이지를 이루는 파일들의 위치·역할·수정 지점을 안내한다.
목적은 **"이걸 고치려면 어느 파일을 열어야 하나"** 를 즉시 판단하는 것.

## Triggers
- 포트폴리오의 문구·수치·다이어그램·시나리오·표를 수정할 때
- "어느 파일을 고쳐야 하나", "이 값은 어디서 오나" 를 파악할 때
- 새 시나리오·설계 결정·경합 항목·알람 규칙 등을 추가할 때
- 포트폴리오 섹션 구조나 렌더링 방식을 이해해야 할 때

---

## 핵심 원리: 데이터 주도 vs 정적

이 페이지는 **마크업 / 스타일 / 로직 / 콘텐츠** 4계층으로 분리돼 있다.
편집 위치를 가르는 가장 중요한 기준은 **그 부분이 데이터 주도인가, 정적인가**:

- **데이터 주도** — `index.astro`에는 빈 컨테이너(`<div id="...">`)만 있고, 스크립트가 `src/data/paymentPortfolio/`의 상수를 읽어 런타임에 그린다. → **데이터 파일을 고친다.**
- **정적** — 히어로·명세서·설명 문단 등은 `index.astro`에 HTML로 직접 박혀 있다. → **`index.astro`를 고친다.**

이 구분을 틀리면 데이터 파일에서 아무리 찾아도 없는 문구를 찾거나, astro에서 다이어그램 값을 못 찾아 헤맨다. 항상 아래 표로 어느 쪽인지 먼저 확인.

---

## 파일 계층

```
src/pages/payment-platform-portfolio/index.astro   ← 마크업(정적 문구 + 빈 컨테이너) · 633줄
src/styles/payment-portfolio.css                   ← 스타일 전부 · 829줄
src/scripts/portfolio/                              ← 렌더 로직 (7개)
   ├─ main.ts        엔트리. import 순서 = 실행 순서
   ├─ diagrams.ts    아키텍처맵·스윔레인·단계·트레이스·결제상태머신·PG플로우·헥사고날
   ├─ scenario.ts    시나리오 지도·타임라인·재생 컨트롤
   ├─ panels.ts      벤치차트·PG상태머신·매트릭스·결정·경합·알람·정리 + 스크롤/nav
   ├─ interactions.ts  노드 클릭·툴팁·상태머신 토글·URL 공유
   ├─ motion.ts      스크롤 progress·reveal 애니메이션
   └─ util.ts        공용 헬퍼(esc·SVG 빌더·색 토큰 CV)
src/data/paymentPortfolio/                          ← 콘텐츠 상수 (12개, index.ts 배럴)
```

스크립트는 `src/data/paymentPortfolio/index.ts` 배럴을 통해 상수를 import한다. 데이터 파일을 새로 만들면 배럴에 `export * from './...'` 추가 필요(기존 파일 수정은 배럴 손댈 필요 없음).

---

## 섹션 ↔ 렌더러 ↔ 데이터 매핑 (핵심)

`index.astro`의 섹션 순서대로. "데이터 파일"이 있으면 그 파일을, 없으면 명시된 곳을 고친다.

| 섹션 (id) | 화면 요소 | 렌더러 | **편집 위치** |
|-----------|-----------|--------|--------------|
| 히어로 | 제목·부제·구축 여정(PHASE 1~7) | 정적 | `index.astro` (`<header class="hero">`) |
| 명세서 (`#overview`) | 프로젝트 명세서·기술스택·지표 3개·트레이스 요약 | 정적 | `index.astro` (`.spec-overview`) |
| 아키텍처 (`#arch`) | `#archWrap` 서비스 맵 | `diagrams.ts` | **`arch.ts`** (`ARCH_NODES`, `ARCH_EDGES`) |
| 결제 흐름 (`#journey`) | `#swimWrap` 스윔레인 + `#stages` 22단계 카드 | `diagrams.ts` | **`stages.ts`** (`PAYMENT`) · 비동기 설계의도 문단은 `index.astro`(`.why-async`) |
| 트레이싱 (`#tracing`) | `#traceFlow` 흐름도 | `diagrams.ts` | **`trace.ts`** (`FLOW_LANES`, `FLOW_STEPS`) · 3장치 설명 카드는 `index.astro`(`.tr3-grid`) |
| 부하 테스트 (`#benchmark`) | `#benchChart` 막대 차트 | `panels.ts` | **`benchmark.ts`** (`BENCH_META`, `BENCH_BARS`) |
| 시나리오 (`#scenario`) | `#scnMap` 지도·`#scnTimeline` 타임라인·`#scn-matrix` 비교표 | `scenario.ts`(지도·타임라인), `panels.ts`(매트릭스) | **`scenarios.ts`** (`SCN_NODES`, `SCN_EDGES`, `SCENARIOS`, `SCN_WHEN`, `SCN_OBS`, `SCN_MATRIX`) |
| 상태 머신 (`#states`) | `#smWrap` 결제 상태머신 · `#pgSmWrap` PG 상태머신 | `diagrams.ts`(결제), `panels.ts`(PG) | **`states.ts`** (결제: `STATES`/`NPOS`/`SEDGES`, PG: `PG_STATES`/`PG_NPOS`/`PG_SEDGES`) |
| PG 재시도 (`#pgretry`) | `#pgFlow` 파이프라인 흐름도 | `diagrams.ts` | ⚠️ **다이어그램은 데이터 파일 없음** — `diagrams.ts`에 SVG 좌표 하드코딩. 설계의도·백오프 문구는 `index.astro`(`.why-async`) |
| 내부 구조 (`#modules`) | `#hexlayers` 헥사곤 · `#layerCards` 레이어 카드 | `diagrams.ts` | **`modules.ts`** (`LAYER_EX`, `LAYER_META`) |
| 설계 결정 (`#decisions`) | `#decisions-grid` 카드 | `panels.ts` | **`decisions.ts`** (`DECISIONS`) |
| 경합 방어 (`#races`) | `#races-table` 표 | `panels.ts` | **`races.ts`** (`RACES`) · 운영 상수 5개는 `index.astro`(`.const-panel`) |
| 워크플로우 (`#workflow`) | 4단계 개발 흐름 | 정적 | `index.astro` (`.wf-flow`) |
| 관측·알람 (`#alerting`) | `#alerts-table` 표 | `panels.ts` | **`alerts.ts`** (`ALERTS`) · 검증/운영관점 문단은 `index.astro`(`.meas-note`) |
| 정리 (`#summary`) | `#solves-grid` 해결과제 · `#limits-grid` 남은과제 | `panels.ts` | **`summary.ts`** (`SOLVES`, `LIMITS`) |

> **한 섹션에 정적 + 데이터가 섞인 경우가 많다.** 예: 결제 흐름 섹션은 22단계 카드(데이터: `stages.ts`)와 "비동기 처리 설계 의도" 문단(정적: `index.astro`)이 공존한다. 고치려는 대상이 다이어그램/카드/표인지, 설명 문단인지부터 구분할 것.

---

## 작업별 빠른 라우팅

- 히어로 제목·부제·PHASE 카드 → `index.astro`
- 명세서(기간·인원·About·기술스택·지표 3개) → `index.astro`
- **벤치마크 수치**(TPS·응답시간 등) → `benchmark.ts` (숫자는 `index.astro`의 `.why-async`, `.sr-only` 요약에도 중복 표기되니 함께 갱신)
- **시나리오 추가/수정** → `scenarios.ts` (경로 지도·타임라인·비교표가 한 파일에서 나옴)
- 상태·전이 추가 → `states.ts`
- 설계 결정 카드 → `decisions.ts`
- 경합 표 행 → `races.ts` / 운영 상수 값 → `index.astro`(`.const-panel`)
- 알람 규칙 → `alerts.ts`
- 해결/남은 과제 → `summary.ts`
- 색상·간격·타이포 등 스타일 → `payment-portfolio.css`
- 클릭·툴팁·재생 등 동작 → `interactions.ts` / `scenario.ts`

---

## 주의사항

- **수치 이중화**: 일부 지표는 데이터 파일과 `index.astro`(설명 문단·`.sr-only` 접근성 요약)에 **둘 다** 들어 있다. 하나만 고치면 화면과 낭독기 내용이 어긋난다. 수치 수정 시 `index.astro`에서 같은 값을 grep해 함께 갱신.
- **빈 컨테이너 오해 금지**: `index.astro`의 `<div id="benchChart">` 등은 비어 있는 게 정상. 내용은 스크립트가 그린다.
- **배럴 갱신**: 데이터 **파일 신설** 시에만 `index.ts`에 export 추가. 기존 파일의 상수 값 수정은 배럴 무관.
- **스크립트는 vanilla JS 이식본**(`@ts-nocheck`, `var`/함수 표현식). 스타일 통일보다 기존 패턴에 맞추는 걸 우선.
- 색 토큰(`--svc-*` 서비스별, `--st-*` 상태별)은 `payment-portfolio.css`에 정의, 스크립트는 `util.ts`의 `CV` 맵으로 참조.