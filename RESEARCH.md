# Site Structure Research

> 목적: 페이지 리팩토링 및 코드 클렌징을 위한 현행 구조 세밀 분석
> 작성일: 2026-02-27

---

## 1. 아키텍처 개요

사이트는 **두 가지 레이아웃 시스템**이 혼재한다.

| 영역 | 레이아웃 | 경로 |
|------|---------|------|
| Landing (`/`) | 순수 커스텀 HTML (Starlight 없음) | `src/pages/index.astro` |
| About (`/about/`) | 순수 커스텀 HTML (Starlight 없음) | `src/pages/about/index.astro` |
| Blog (`/blog/`, `/blog/<slug>/`) | Starlight + starlight-blog | content collection |
| Docs (`/docs/`, `/docs/<cat>/`, `/docs/<cat>/<slug>/`) | Starlight (sidebar autogenerate) | content collection |

콘텐츠는 단일 `docs` 컬렉션(`src/content/docs/`)으로 관리된다.
`docsLoader()` ID 포맷: 확장자 없음, `blog/<slug>` / `docs/<cat>/<slug>`.

---

## 2. 파일 맵

```
astro.config.mjs              ← Starlight 설정, 플러그인, 컴포넌트 오버라이드, sidebar config
src/
├── content.config.ts         ← 컬렉션 정의 (단일 docs 컬렉션)
├── data/
│   └── docsSections.ts       ← Docs 서브카테고리별 섹션 그루핑 config
├── styles/
│   └── custom.css            ← Starlight CSS 변수 오버라이드 + 글로벌 픽스
├── pages/
│   ├── index.astro           ← 랜딩 페이지 (독립 HTML, ~714줄)
│   ├── blog/
│   │   └── index.astro       ← /blog/ 라우트 오버라이드 (StarlightPage 래퍼)
│   └── about/
│       └── index.astro       ← About 페이지 (독립 HTML, ~599줄)
└── components/               ← Starlight 오버라이드 컴포넌트
    ├── SiteTitle.astro        ← 로고 + 사이트명 링크
    ├── Header.astro           ← 헤더 + /blog/용 모바일 메뉴 (Web Component)
    ├── SocialIcons.astro      ← 상단 네비게이션 링크 (Blog/Docs/About/GitHub)
    ├── ThemeSelect.astro      ← Default 위임 (passthrough)
    ├── Sidebar.astro          ← 라우트별 사이드바 분기 + sidebar 복원 스크립트
    ├── MobileMenuFooter.astro ← 모바일 sidebar 헤더 위치 조정
    ├── PageTitle.astro        ← 제목 + 뒤로가기 버튼 + 메타데이터 표시
    ├── Pagination.astro       ← 빈 파일 (prev/next 제거)
    ├── Footer.astro           ← Giscus 댓글 + docs 태그 표시 제어
    ├── Giscus.astro           ← Giscus 스크립트 컴포넌트
    ├── EntryMeta.astro        ← 날짜·작성자 메타데이터 표시
    ├── BlogTree.astro         ← /blog/ 목록 (카테고리별 그루핑)
    ├── DocsTree.astro         ← /docs/ 목록 (그룹별 서브카테고리)
    └── SubcategoryPage.astro  ← /docs/<cat>/ 서브카테고리 목록
```

---

## 3. 컴포넌트별 상세 분석

### 3-1. `astro.config.mjs`

**역할**: Starlight 통합 설정 전체.

**등록된 컴포넌트 오버라이드 (9개)**:
```
Footer, Header, MobileMenuFooter, Sidebar, PageTitle,
Pagination, SocialIcons, ThemeSelect, SiteTitle
```

**sidebar**: `docs/*` 하위 디렉토리를 `autogenerate`로 등록.
→ `DocsTree.astro`의 `groups` 배열과 **이중 관리** (아래 문제점 참고).

**head 스크립트 (4개)**:
1. Pretendard 폰트 CSS
2. Google Analytics (`gtag.js`)
3. `/blog` 경로에서 `data-no-sidebar` 속성 주입 (동기 실행, 레이아웃 전에 실행)
4. Mermaid 다이어그램 렌더링 (ESM import)

---

### 3-2. `pages/index.astro` (랜딩)

**특징**: Starlight을 전혀 사용하지 않는 독립 HTML 파일 (약 714줄).

**포함 내용**:
- 전체 CSS 변수 정의 (dark/light 모드)
- 커스텀 네비게이션 헤더 (로고 + 링크 + ThemeSelect)
- Hero 섹션
- Explore 카드 (Blog / Docs)
- Recently Updated Blog 목록 (최대 6개)
- Recently Updated Docs 목록 (최대 6개)
- 독립 ThemeSelect 로직 (JS)
- 독립 footer

**TAG_HUES 맵** (태그별 색상):
```ts
const TAG_HUES: Record<string, number> = {
  'Java': 25, 'Spring': 120, 'Spring & JPA': 120,
  'MySQL': 200, 'AI': 270, 'AI-Assisted Development': 270, ...
}
```
→ `BlogTree.astro`의 카테고리명과 별도로 관리됨.

---

### 3-3. `pages/about/index.astro` (About)

**특징**: 랜딩과 동일한 독립 HTML 방식 (약 599줄).

**포함 내용**:
- `pages/index.astro`와 거의 동일한 CSS 변수 / 헤더 / footer 코드
- Profile 섹션 (이미지 + 소개)
- Skills 섹션
- Stats 섹션 (GitHub Streak, solved.ac 배지)
- Study Log 링크
- Writing 목록

**독립 ThemeSelect 로직**: `pages/index.astro`와 동일한 JS 복사본.

---

### 3-4. `pages/blog/index.astro`

```astro
<StarlightPage frontmatter={{ title: 'Blog' }} hasSidebar={false}>
  <BlogTree />
</StarlightPage>
```
starlight-blog의 기본 `/blog/` 라우트를 오버라이드해 `BlogTree` 컴포넌트를 표시.

---

### 3-5. `components/Header.astro`

**역할**: Starlight 기본 헤더 위에 `/blog/` 전용 모바일 메뉴를 조건부 추가.

**복잡도 원인**: `/blog/`는 `hasSidebar={false}`이므로 Starlight의 기본 모바일 hamburger가 없음.
→ `BlogMobileMenu` Web Component를 직접 구현하여 주입.

**분기 로직**:
```ts
const isBlogList = Astro.url.pathname === '/blog/' || Astro.url.pathname === '/blog';
```

---

### 3-6. `components/Sidebar.astro`

**역할**: 라우트에 따라 3가지 다른 동작.

| 조건 | 동작 |
|------|------|
| `/about/*` | sidebar 완전 숨김 (CSS `display:none`) |
| `/blog*` | sidebar 없음, MobileMenuFooter만 표시 |
| 나머지 (Docs) | 기본 Starlight Sidebar 표시 |

**sidebar 복원 스크립트**: Docs 페이지에서 `<sl-sidebar-restore>` 커스텀 엘리먼트가
sessionStorage의 상태를 복원할 때 현재 페이지의 `<details>`를 닫는 버그를 수동으로 픽스.

---

### 3-7. `components/PageTitle.astro`

**역할**: 세 가지 기능 통합.

1. **Back 버튼**: Blog 포스트 → `/blog/`, Docs 문서 → 상위 경로
2. **제목 렌더링**: 백틱 감싼 텍스트 → `<code>` 변환
3. **EntryMeta 표시**: Blog 포스트 / Docs 문서에만 날짜·작성자 표시

**Author 해석 로직**: `starlight-blog-config`의 `authors`를 참조, string/array/object 모두 처리.

---

### 3-8. `components/Footer.astro`

**역할**: 두 가지 조건부 요소 추가.

1. **Docs 태그**: Docs 문서 페이지에만 `tags` 뱃지 표시
2. **Giscus**: splash/About/인덱스 페이지 제외, 나머지 모두 표시

**표시 조건**:
```ts
const isSplash = entry?.data?.template === 'splash';
const isAbout = Astro.url.pathname.startsWith('/about');
const isIndexPage = /^\/(blog|docs)\/?$/.test(Astro.url.pathname);
const showGiscus = !isSplash && !isAbout && !isIndexPage;
```

---

### 3-9. `components/BlogTree.astro`

**데이터**: `getCollection('docs', id => id.startsWith('blog/'))` 로 Blog 포스트 전체 조회.

**카테고리 정렬 순서** (하드코딩):
```ts
const categoryOrder = ['Payment Platform Project', 'Java', 'Spring & JPA', 'MySQL'];
```

**날짜 기준**: `lastUpdated` 우선, 없으면 `date`.

---

### 3-10. `components/DocsTree.astro`

**데이터**: 두 번의 `getCollection` 호출.
1. 일반 docs (`parts.length >= 3`) → 마이그레이션된 서브카테고리 추출
2. index 페이지 (`parts.length === 2`) → 링크 가능 여부 판별

**groups 배열** (하드코딩):
```ts
const groups = [
  { label: 'Computer Science', items: ['computer-architecture', 'operating-system', 'network', 'secure'] },
  { label: 'Database', items: ['mysql', 'redis'] },
  { label: 'Language', items: ['java'] },
  ...
]
```
→ `astro.config.mjs`의 sidebar 배열과 **구조가 중복**.

---

### 3-11. `components/SubcategoryPage.astro`

**역할**: `/docs/<cat>/index.mdx`에서 호출, 해당 카테고리의 문서 목록 표시.

**데이터**: `docsSections.ts`의 섹션 config를 참조해 그루핑.
섹션 config 없는 경우 알파벳순 flat list.

**depth 필터**: `parts.length === 3` (직접 자식만, 중첩 경로 제외).

---

### 3-12. `data/docsSections.ts`

Docs 서브카테고리별 섹션 그루핑 config.
현재 정의된 서브카테고리: `java`, `mysql`, `ai-assisted-development`, `computer-architecture`,
`docker`, `kafka`, `large-scale-system`, `network`, `oop`, `operating-system`,
`redis`, `secure`, `setting`, `spring`, `test` (15개).

---

### 3-13. `styles/custom.css`

**역할**: Starlight CSS 변수 오버라이드 + 레이아웃 픽스.

**주요 내용**:
- accent 색상 및 배경색 변수 (`--sl-color-bg`, `--sl-color-bg-nav` 등)
- RSS 아이콘 숨김
- blog metadata 중복 숨김 (`PageTitle`에서 이미 렌더링)
- `[data-no-sidebar]` 레이아웃 픽스 (Blog 페이지)
- Blog 모바일 헤더 padding 보상
- Blog 포스트 prev/next 숨김
- Blog 목록 미리보기 텍스트 클리핑

---

## 4. 데이터 흐름

```
src/content/docs/
  blog/<slug>.md    → BlogTree (카테고리 목록)
                    → pages/index.astro (Recent Posts)
                    → starlight-blog (포스트 라우팅)
  docs/<cat>/<slug>.md → DocsTree (카테고리 목록)
                       → SubcategoryPage (섹션별 목록)
                       → pages/index.astro (Recent Docs)
                       → Starlight sidebar (autogenerate)
```

---

## 5. 식별된 문제점 (리팩토링 대상)

### [P1] 코드 중복 - 랜딩/About 레이아웃

`pages/index.astro`와 `pages/about/index.astro`가 아래 코드를 완전히 중복 보유:

| 중복 내용 | 규모 |
|----------|------|
| CSS 변수 정의 (dark/light) | ~20줄 × 2 |
| body/container/header/nav CSS | ~80줄 × 2 |
| ThemeSelect 마크업 (SVG 포함) | ~25줄 × 2 |
| ThemeSelect JS 로직 | ~30줄 × 2 |
| mobile nav CSS | ~50줄 × 2 |
| `.btn` 스타일 | ~10줄 × 2 |
| footer 마크업 | ~5줄 × 2 |

→ 공통 레이아웃 컴포넌트로 추출 가능.

---

### [P2] 이중 카테고리 관리 - DocsTree vs sidebar config

`DocsTree.astro`의 `groups` 배열과 `astro.config.mjs`의 `sidebar` 배열이 동일한 카테고리 목록을 각각 관리.
새 카테고리 추가 시 두 곳을 모두 수동 업데이트해야 함.

```
astro.config.mjs  → sidebar[].label + autogenerate.directory
DocsTree.astro    → groups[].label + items[].key
docsSections.ts   → SubcategoryPage 섹션 config (3번째 config)
```

→ 카테고리 등록 포인트가 3개.

---

### [P3] 태그/색상 관리 분산

Blog 카테고리 관련 정보가 분산:

| 위치 | 내용 |
|------|------|
| `BlogTree.astro:37` | `categoryOrder` 배열 (표시 순서) |
| `pages/index.astro:39` | `TAG_HUES` 맵 (태그별 색상) |

→ 두 곳의 카테고리명이 동기화되지 않으면 색상 오류 발생.

---

### [P4] ThemeSelect.astro - passthrough만 하는 파일

```astro
---
import Default from '@astrojs/starlight/components/ThemeSelect.astro';
---
<Default><slot /></Default>
```

실질적 역할 없음. `astro.config.mjs`의 오버라이드 목록에서 제거 가능.
(원래 starlight-blog가 ThemeSelect를 오버라이드해 "Blog" 링크를 주입하는 것을 막기 위해 존재했으나, 현재 구현에서는 실제 override 필요성 재검토 필요)

---

### [P5] Pagination.astro - 빈 파일

```astro
---
// Hide previous/next navigation links at the bottom of content
---
```

실제 기능이 없는 empty override. 빈 파일로 override하는 것이 현재 동작(prev/next 제거)에 의도적인 선택이나,
주석만으로 의도가 충분히 전달되지 않음. 문서화 필요.

---

### [P6] pages/index.astro 크기 및 책임 과다

약 714줄의 단일 파일에:
- CSS 전체
- 데이터 페칭 로직 (getCollection 2회)
- TAG_HUES 맵
- 4개 섹션 HTML
- ThemeSelect JS

→ 컴포넌트 분리 및 스타일 외부화 가능.

---

### [P7] 불일치 - "Backend Developer" vs "Backend Engineer"

| 위치 | 표기 |
|------|------|
| `pages/index.astro:73` | "Backend Developer, Java & Spring" (meta description) |
| `pages/index.astro:548` | "Backend Developer" (hero eyebrow) |
| `pages/about/index.astro:11` | "Backend Engineer, Java & Spring" (meta description) |
| `pages/about/index.astro:456` | "Backend Engineer" (profile eyebrow) |
| `astro.config.mjs:13` | "Backend Developer, Java & Spring" (Starlight description) |
| `Giscus.astro:3` | (무관) |

---

### [P8] Sidebar.astro의 복잡한 조건 분기

Sidebar가 라우트에 따라 완전히 다른 역할을 수행:
- About → CSS로 숨김
- Blog → MobileMenuFooter만 렌더
- Docs → Default Sidebar

단일 컴포넌트에 너무 많은 책임이 있음.

---

### [P9] Header.astro - Blog 전용 Web Component 내장

`BlogMobileMenu` 커스텀 엘리먼트 전체 구현이 Header.astro 내부에 포함됨.
별도 컴포넌트로 분리하면 Header.astro가 더 간결해짐.

---

### [P10] MobileMenuFooter.astro - `is:global` 스타일

```astro
<style is:global>
  @media (max-width: 49.999rem) {
    .sidebar-content > div:has(> .mobile-preferences) { order: -1; }
  }
  .mobile-preferences { align-items: center !important; ... }
</style>
```

글로벌 스타일로 Starlight 내부 클래스에 직접 접근. Starlight 버전 업 시 깨질 가능성 있음.

---

### [P11] Giscus 설정 하드코딩

```ts
const repo = 'hyoguoo/hyoguoo.github.io';
const repoId = 'R_kgDORYqasg';
const category = 'General';
const categoryId = 'DIC_kwDORYqass4C3Mb3';
```

`astro.config.mjs`나 환경 변수로 이동 가능.

---

## 6. 컴포넌트 의존 관계

```
astro.config.mjs
  └─ Starlight 오버라이드 등록
       ├─ Header.astro
       │    ├─ SocialIcons.astro    (모바일 메뉴 내부)
       │    └─ ThemeSelect.astro    (모바일 메뉴 내부)
       ├─ Sidebar.astro
       │    └─ MobileMenuFooter.astro  (/blog/ 전용)
       ├─ PageTitle.astro
       │    └─ EntryMeta.astro
       ├─ Footer.astro
       │    └─ Giscus.astro
       ├─ SiteTitle.astro
       ├─ SocialIcons.astro         (헤더 내부)
       ├─ ThemeSelect.astro         (Default passthrough)
       └─ Pagination.astro          (Empty)

pages/blog/index.astro
  └─ BlogTree.astro

pages/index.astro (독립)
pages/about/index.astro (독립)

Docs index.mdx 파일들
  └─ SubcategoryPage.astro
       └─ docsSections.ts
```

---

## 7. 라우트별 실제 렌더링 흐름

### `/` (랜딩)
```
pages/index.astro → 완전 독립 HTML
  - Astro 빌드 타임: getCollection × 2
  - 클라이언트: ThemeSelect JS
```

### `/blog/`
```
pages/blog/index.astro (StarlightPage)
  └─ Starlight 레이아웃
       ├─ Header.astro (isBlogList=true → 모바일 메뉴 포함)
       ├─ Sidebar.astro (isBlog=true → MobileMenuFooter만)
       ├─ BlogTree.astro (content)
       └─ Footer.astro (showGiscus=false)
```

### `/blog/<slug>/`
```
Starlight (starlight-blog 라우팅)
  └─ Starlight 레이아웃
       ├─ PageTitle.astro (뒤로가기 + EntryMeta)
       ├─ Sidebar.astro (isBlog=true → MobileMenuFooter만)
       └─ Footer.astro (showGiscus=true)
```

### `/docs/`
```
Starlight (autogenerate에서 제외 → 별도 페이지 없음)
  → docs/index.mdx 혹은 404
  (실제로는 별도 docs index 페이지가 없으면 404 → 확인 필요)
```

> **확인 필요**: `/docs/`가 라우트로 어떻게 처리되는지 (Starlight 기본 동작 또는 별도 페이지?).

### `/docs/<cat>/`
```
src/content/docs/docs/<cat>/index.mdx
  └─ SubcategoryPage.astro (docsSections.ts 참조)
```

### `/docs/<cat>/<slug>/`
```
Starlight (content collection 기반)
  └─ PageTitle.astro (뒤로가기 + EntryMeta)
  └─ Footer.astro (showGiscus=true, docs-tags 표시)
```

### `/about/`
```
pages/about/index.astro → 완전 독립 HTML
```

---

## 8. 리팩토링 우선순위 제안

| 순위 | 항목 | 효과 | 위험도 |
|------|------|------|--------|
| 1 | [P1] Landing/About 공통 레이아웃 추출 | 코드량 ↓ 200줄+, 유지보수성 ↑ | 중 |
| 2 | [P7] 직함 불일치 수정 | 콘텐츠 일관성 | 낮 |
| 3 | [P3] TAG_HUES + categoryOrder 통합 | 동기화 리스크 제거 | 낮 |
| 4 | [P4] ThemeSelect.astro 제거 검토 | 파일 정리 | 낮 |
| 5 | [P2] 카테고리 config 단일화 | 관리 포인트 감소 | 높 |
| 6 | [P9] Header의 BlogMobileMenu 분리 | 가독성 ↑ | 낮 |
| 7 | [P6] index.astro 컴포넌트 분리 | 유지보수성 ↑ | 중 |
| 8 | [P11] Giscus 설정 외부화 | 설정 중앙화 | 낮 |
| 9 | [P5] Pagination.astro 문서화 | 의도 명확화 | 낮 |

---

## 9. Starlight 버전 의존 취약점

업그레이드 시 깨질 가능성이 있는 부분:

1. `MobileMenuFooter.astro` - `.sidebar-content`, `.mobile-preferences`, `.social-icons` 클래스명에 의존
2. `Sidebar.astro` - `#starlight__sidebar`, `sl-sidebar-restore` 커스텀 엘리먼트에 의존
3. `custom.css` - `.posts article.preview .sl-markdown-content`, `.post-footer .pagination` 등 Starlight/starlight-blog 내부 클래스 참조
4. `PageTitle.astro` - `Astro.locals.starlightRoute` 내부 API 사용
5. `Footer.astro` - `Astro.locals.starlightRoute?.entry` 내부 API 사용