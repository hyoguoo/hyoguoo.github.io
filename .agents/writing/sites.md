# blog 저장소 작성 정보

작성 규칙은 사용자 수준 `writing` 스킬(agent-kits 저장소)에 있다. 이 파일은 이 저장소에서 글을 쓸 때 필요한 위치, 형식, 확인 방법만 담는다.

## 글 위치와 장르

| 경로 | 장르 |
|---|---|
| `src/content/docs/blog/` | blog |
| `src/content/docs/docs/` | docs |
| `src/pages/payment-platform-portfolio/`, `src/data/paymentPortfolio/` | portfolio(인터랙티브). 편집 위치는 `portfolio` 스킬 |

- 글을 추가하는 절차(slug, frontmatter, 카테고리 등록)는 `add` 스킬, frontmatter·태그·내부 링크 규칙은 `AGENTS.md`에 있다.

## 형식

- 수정한 글의 `lastUpdated`를 갱신한다.
- 표는 가운데 정렬(`:---:`)을 기본으로 하고, 긴 설명 열은 왼쪽 정렬을 쓸 수 있다. 셀 너비를 맞추려고 공백이나 구분선 길이를 조정하지 않는다.
- 본문은 마크다운으로 쓴다. 일반 설명이나 Mermaid 노드에 `<b>`, `<div>` 같은 HTML을 직접 넣지 않고, Blog의 볼드는 `**`로 쓴다.
- Astro 컴포넌트를 쓰는 글은 `.mdx`로 쓴다. 본문에서 컴포넌트를 불러오고, HTML·SVG·CSS는 `src/components/blog/`의 별도 컴포넌트에 둔다. 그림 컴포넌트는 다크 테마 색을 따로 정한다.
- MDX에서 한 줄에 `~`가 둘 있으면 그 사이가 취소선이 된다. 범위는 `\~`로 쓴다. 같은 폴더의 `banned.md`가 이 경우를 검사한다.

## 그림 컴포넌트

새 그림을 만들기 전에 `src/components/blog/`에 재사용할 컴포넌트가 있는지 본다.

| 보여 줄 것 | 컴포넌트 |
|---|---|
| 흐름도를 재사용하고 해당 단계만 강조 | `ThroughputPipeline`(`highlight` 속성) |
| 적체·대기 | `ThroughputPipeline`의 큐 표시, `ThroughputWorkerModel`, `ThroughputWorkerQueue` |
| 시간 구간 겹침 | `ThroughputTxScope` |
| 막대 + 기준선 + 상태 | `ThroughputThreadCompare`, `ThroughputWorkerRounds`, `ThroughputRateDrop` |
| 전후 카드 | `ThroughputLoopFix` |
| 순환 | `ThroughputFeedbackLoop` |
| 인과 연쇄 | `ThroughputSlowdownChain` |

## 확인

- 문법, 컴포넌트, 설정에 영향을 주는 변경은 `npm run check`(정적 검사)와 `npm run build`로 확인한다. 빌드 통과로 내용 검증을 대신하지 않는다.
- 그림을 새로 만들거나 바꿨으면 `npm run dev`로 미리보기를 띄워 그 그림만 확인한다. 범위는 `AGENTS.md`의 "화면 검증 범위"를 따른다.
