---
name: section
description: "새 docs 서브카테고리(섹션) 추가. DOCS_GROUPS 그룹 배치, 색상 hue, sidebar, index.mdx까지 모든 동기화 지점을 한 번에 일관되게 처리. 사용자가 '새 섹션', '새 카테고리', '새 서브카테고리', '새 항목 추가', '새 도큐 카테고리' 등을 언급하거나 docs/<key>/ 디렉토리를 새로 만들려는 의도가 보일 때 반드시 사용. 단일 문서 추가는 `/add`, 학습 로드맵 설계는 `/roadmap`."
---

# /section - 새 docs 서브카테고리 추가

## Triggers

- `/section` 호출 시
- "새 섹션", "새 카테고리", "새 서브카테고리", "섹션 추가", "카테고리 추가" 등 키워드 언급 시
- 새 docs 토픽 영역(예: postgresql, opentelemetry)을 시작하려는 의도가 보일 때
- 기존 docs 영역에 없는 새 기술의 첫 진입점이 필요할 때

> 단일 문서 추가는 `/add`, 학습 로드맵 스펙(`*_SPEC.md`) 작성은 `/roadmap`. 본 스킬은 **빈 서브카테고리 뼈대**를 만들 때 사용.

## Arguments

`$ARGUMENTS` — 서브카테고리 키 또는 라벨 (예: "elk", "PostgreSQL"). 생략 시 인터뷰로 결정.

---

## 왜 이 스킬이 필요한가

새 서브카테고리는 **4개 파일**에 동시 등록되어야 정상 동작함. 한 곳이라도 누락되면:

| 누락 | 증상 |
|------|------|
| `docsGroups.ts` 미등록 | `/docs/` DocsTree에 표시 안 됨 |
| `tagColors.ts` 미등록 | 태그 색상이 해시 기반으로 결정되어 의도와 무관한 색상 |
| `astro.config.mjs` sidebar 미등록 | 사이드바 자동 생성 누락, 문서 페이지에서 좌측 네비게이션 깨짐 |
| `index.mdx` 미생성 | DocsTree에서 항목 자체가 표시 안 됨 (가시성 판단 기준) |

본 스킬은 이 4지점을 한 번에 일관되게 처리하여 누락 사고를 방지함.

---

## 인터뷰 항목

대화 맥락에 이미 답이 있으면 활용하고, 빠진 부분만 질문.

| 항목 | 형식 | 예시 |
|------|------|------|
| key | kebab-case 영문 | `elk`, `postgresql`, `open-telemetry` |
| label | 표시명 (제목 컨벤션 준수) | `ELK`, `PostgreSQL`, `OpenTelemetry` |
| group | 기존 그룹 또는 새 그룹 | `Streaming & Observability` |
| hue | 0~360 정수 | `175` |
| tag | frontmatter `tags` 값 (대개 label과 동일) | `ELK` |

### key vs label vs tag 구분

- **key**: 디렉토리명·docsGroups의 key·sidebar autogenerate 경로용. 영문 소문자·하이픈만.
- **label**: 사용자에게 보이는 표시명. 대문자·공백 허용. CLAUDE.md 제목 컨벤션 준수 (약어는 풀네임 괄호).
- **tag**: 문서 frontmatter `tags` 배열 값. 일반적으로 label과 동일.

---

## 처리 절차

### Step 1. Discovery — 현황 파악

다음 파일을 읽어 현재 상태 파악:

- `src/data/docsGroups.ts` — 기존 그룹·서브카테고리 목록
- `src/data/tagColors.ts` — 기존 hue 분포
- `astro.config.mjs` sidebar 배열 — 기존 sidebar 엔트리
- `src/content/docs/docs/<key>/` — 디렉토리 존재 여부

### Step 2. Group Placement — 그룹 결정

#### 기존 그룹에 추가하는 경우

`docsGroups.ts`의 그룹 라벨 목록을 사용자에게 제시하고 적합한 그룹 선택. 의미적으로 명확하면 추천을 먼저 제시.

예: "ELK는 Streaming & Observability 그룹이 맞을 것 같음. 동의?"

#### 새 그룹 신설이 필요한 경우

기존 그룹 어디에도 의미적으로 맞지 않으면 신설 제안. 다음을 사용자와 확정:

- 새 그룹 라벨 (영문, 2~3 단어)
- DOCS_GROUPS 배열 내 위치 (의미적 인접 그룹 옆 권장)

신설 가이드:
- 라벨은 도구 카테고리·관심사 단위 (예: `Database`, `Framework`, `Observability`)
- 너무 좁은 라벨 회피 (`Spring Modules` 같은 단일 기술 전용 라벨 X)
- 향후 같은 그룹에 들어올 후보가 1~2개 이상 예상되어야 신설 가치 있음

### Step 3. Hue Selection — 색상 결정

기존 `TAG_HUES` 값들 사이의 빈 구간(gap)을 분석해 추천.

#### 추천 알고리즘

1. 기존 hue 값들을 정렬
2. 인접 hue 사이 간격(gap) 계산
3. 가장 큰 gap의 중앙값을 1차 후보로 제시
4. 토픽의 브랜드 컬러가 명확하면 그쪽을 우선 검토 (단, 인접 hue와 최소 10° 이상 간격 유지)

#### 토픽 브랜드 컬러 참고

| 토픽 유형 | 대표 hue 범위 |
|---------|--------------|
| 데이터베이스 | 다양 (브랜드별) |
| 메시징·스트리밍 | 핑크·마젠타 (~310-340) |
| 관측성·모니터링 | 청록 (~170-200) |
| 인프라·배포 | 파랑·청록 (~200-230) |
| 보안 | 빨강 (~340-360) |

#### 같은 그룹 내 시각 구분

같은 그룹의 다른 서브카테고리와 색상이 너무 비슷하면 (15° 이내) 의도적으로 다른 영역 선택. BlogTree·DocsTree에서 색상으로 구분하기 위함.

#### 사용자 확인

추천 hue를 제시하고 사용자가 다른 값을 선호하면 변경. 색상 미리보기는 어렵지만 hue 값과 색상 영역(예: "175 = 청록")을 함께 안내.

### Step 4. Apply Changes — 동기화

확정된 정보로 4개 파일을 한 번에 수정. 각 변경 사항을 사용자에게 미리보기 후 진행.

#### 4-1. `src/data/docsGroups.ts`

기존 그룹에 추가:
```ts
{ label: '<group label>', items: [
  ...,
  { key: '<key>', label: '<label>' },
]},
```

새 그룹 신설:
```ts
{ label: '<new group label>', items: [
  { key: '<key>', label: '<label>' },
]},
```
→ 의미적으로 인접한 그룹 옆에 삽입.

#### 4-2. `src/data/tagColors.ts`

`TAG_HUES` 객체에 추가:
```ts
'<tag>': <hue>,
```
→ 마지막 항목 뒤에 추가.

#### 4-3. `astro.config.mjs`

`sidebar` 배열에 추가:
```js
{
  label: '<label>',
  collapsed: true,
  autogenerate: { directory: 'docs/<key>', collapsed: true },
},
```
→ 같은 그룹의 인접 서브카테고리 옆 또는 알파벳·의미 순으로 배치.

#### 4-4. `src/content/docs/docs/<key>/index.mdx`

```mdx
---
title: <label>
tags: [<tag>]
description: "<한 문장 요약>"
---

import SubcategoryPage from '../../../../components/SubcategoryPage.astro';

<SubcategoryPage subcategory="<key>" />
```

description 작성은 `/description` 가이드라인 준수. 작성 시점에 본문이 없으므로 카테고리 전체를 요약하는 1문장 (예: "Kafka의 핵심 아키텍처부터 프로듀서·컨슈머 내부 동작, 복제 메커니즘, 메시지 전달 보장, KRaft까지 정리한다.").

### Step 5. Verify — 검증

다음 자가 점검 후 결과 보고:

| 항목 | 확인 |
|------|------|
| `docsGroups.ts`에 key 추가됨 | ✅ |
| `tagColors.ts`에 tag·hue 추가됨 | ✅ |
| `astro.config.mjs` sidebar에 엔트리 추가됨 | ✅ |
| `<key>/index.mdx` 생성됨 | ✅ |
| 새 그룹 신설 시 적절한 위치에 삽입 | ✅ (해당 시) |
| description 1문장 작성됨 | ✅ |

---

## Output Format

```
## 새 섹션 추가 완료

서브카테고리: <label> (key: <key>)
그룹: <group label>  [신설 / 기존]
색상 hue: <hue>
태그: <tag>

변경 파일:
- src/data/docsGroups.ts (그룹 멤버십)
- src/data/tagColors.ts (hue 등록)
- astro.config.mjs (sidebar 엔트리)
- src/content/docs/docs/<key>/index.mdx (랜딩 페이지)

다음 단계:
- [ ] 첫 문서 작성 (`/add docs/<key>` 또는 `/writing` 컨벤션)
- [ ] 문서 추가 시 `docsSections.ts`에 슬러그 등록 (선택)
- [ ] 학습 로드맵이 필요하면 `/roadmap <기술명>`으로 SPEC 파일 작성
```

---

## Behavioral Flow

1. `$ARGUMENTS` 또는 사용자 메시지에서 토픽 추출
2. **Step 1 (Discovery)** — 4개 동기화 지점 현황 읽기
3. **Step 2 (Group Placement)** — 기존 그룹 추천 또는 새 그룹 신설 협의
4. **Step 3 (Hue Selection)** — gap 분석 + 브랜드 컬러 고려해 hue 추천
5. 사용자에게 Step 2~3 결정 사항 확인 (group, hue, tag 최종 확정)
6. **Step 4 (Apply Changes)** — 4파일 동시 수정. 각 변경 미리보기 제시 후 진행
7. **Step 5 (Verify)** — 자가 점검 후 결과 출력

---

## 참고

### 동기화 지점 누락 시 영향

`/structure` skill의 데이터 레이어 표 참조. 본 스킬은 그 표의 모든 항목을 한 번에 일관되게 갱신함.

### 관련 스킬

- `/add` — 단일 문서 추가 (Mode 2의 새 카테고리 분기는 본 스킬 호출로 위임 가능)
- `/roadmap` — 학습 로드맵 스펙 파일 작성 (서브카테고리 신설 직후 흔히 이어지는 작업)
- `/writing` — 문서 콘텐츠 작성 컨벤션
- `/description` — index.mdx의 description 작성 가이드라인
