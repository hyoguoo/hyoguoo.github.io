# /structure - 사이트 구조 & 컴포넌트 역할

## Triggers
- 사이트 구조, 컴포넌트 역할, CSS 아키텍처 파악이 필요할 때
- 새 기능 추가 전 현황 파악
- 특정 파일의 역할 확인
- Starlight 업그레이드 영향도 검토 시

---

## 레이아웃 시스템 (2가지)

| 영역 | URL | 레이아웃 | 파일 |
|------|-----|---------|------|
| Landing | `/` | 순수 커스텀 HTML | `src/pages/index.astro` |
| About | `/about/` | 순수 커스텀 HTML | `src/pages/about/index.astro` |
| Blog 목록 | `/blog/` | Starlight (hasSidebar=false) | `src/pages/blog/index.astro` |
| Blog 포스트 | `/blog/<slug>/` | Starlight + starlight-blog | content collection |
| Docs 목록 | `/docs/` | Starlight | `src/content/docs/docs/index.mdx` |
| Docs 서브카테고리 | `/docs/<cat>/` | Starlight | `src/content/docs/docs/<cat>/index.mdx` |
| Docs 문서 | `/docs/<cat>/<slug>/` | Starlight (사이드바) | content collection |

**Landing/About**: `PageLayout.astro`를 공유 HTML 쉘로 사용 (Starlight 없음)
**Blog/Docs**: Starlight 레이아웃 + 9개의 컴포넌트 오버라이드

---

## CSS 아키텍처 (3계층)

```
src/styles/tokens.css   (--t-*)     ← 원시값, 단일 진실 원천
    ↓ @import
src/styles/custom.css   (--sl-*)    ← Starlight 변수 매핑 (Docs/Blog에 적용)
src/styles/pages.css    (--color-*) ← Landing/About 변수 매핑
    ↓ import in
src/components/PageLayout.astro     ← Landing/About 공유 레이아웃에서 로드
```

**테마 변경 방법**: `src/styles/tokens.css` 한 곳만 수정하면 전체 반영.

| 접두사 | 파일 | 사용 위치 |
|--------|------|---------|
| `--t-*` | `tokens.css` | 내부 참조 전용 (다른 곳에서 직접 사용 금지) |
| `--sl-*` | `custom.css` | Starlight 컴포넌트 (Docs/Blog) |
| `--color-*` | `pages.css` | Landing/About 페이지 |

---

## 컴포넌트 카탈로그

### Starlight 오버라이드 (9개, `astro.config.mjs` → `components:` 등록)

| 파일 | 역할 | 주의사항 |
|------|------|---------|
| `Header.astro` | Starlight 헤더 + `/blog/` 모바일 메뉴 조건부 추가 | `isBlogList` 분기로 `BlogMobileMenu` 렌더 |
| `Sidebar.astro` | `/about/*` 숨김, `/blog*` MobileMenuFooter만, 나머지 기본 | `sl-sidebar-restore` 커스텀 엘리먼트 버그 패치 포함 |
| `PageTitle.astro` | 뒤로가기 버튼 + 백틱→`<code>` 변환 + EntryMeta | `Astro.locals.starlightRoute` 내부 API 사용 |
| `Pagination.astro` | **의도적으로 빈 파일** — Docs prev/next 완전 제거 | starlight-blog의 PrevNextLinks가 별도 처리 |
| `SocialIcons.astro` | 상단 네비 (Blog/Docs/About/GitHub), 현재 섹션 accent 색상 | — |
| `ThemeSelect.astro` | 기본 Starlight ThemeSelect passthrough | **⚠️ 절대 astro.config.mjs에서 제거 금지**: starlight-blog가 ThemeSelect를 오버라이드해 "Blog" 링크를 주입하는 것을 차단 |
| `SiteTitle.astro` | 로고 + 사이트명 링크 | — |
| `Footer.astro` | Docs tags 뱃지 + Giscus 댓글 조건부 | `showGiscus` 조건, `Astro.locals.starlightRoute?.entry` 내부 API |
| `MobileMenuFooter.astro` | 모바일 사이드바 ThemeSelect 위치 조정 | `is:global`로 Starlight 내부 클래스 직접 참조 → **업그레이드 시 취약** |

### 커스텀 컴포넌트 (9개)

| 파일 | 역할 | Props / 의존 |
|------|------|------------|
| `PageLayout.astro` | Landing/About 공통 HTML 쉘 (head meta, header/nav, footer, ThemeSelect JS) | `title`, `description`, `activePage?`, OG tags, `sitemap?` / **`<style is:global>` 필수** |
| `BlogMobileMenu.astro` | `/blog/` 전용 모바일 메뉴 Web Component | — |
| `EntryMeta.astro` | 날짜(최초 작성일/수정일) + 작성자 표시 | Blog 포스트·Docs 문서 공통 사용 |
| `Giscus.astro` | Giscus 댓글 스크립트 | `src/data/giscusConfig.ts`에서 설정 로드 |
| `BlogTree.astro` | `/blog/` 카테고리별 포스트 그루핑 목록 | `TreeSection.astro`, `src/data/tagColors.ts` (CATEGORY_ORDER) |
| `DocsTree.astro` | `/docs/` 그룹별 서브카테고리 트리 | `TreeSection.astro`, `LinkList.astro`, `src/data/docsGroups.ts` |
| `SubcategoryPage.astro` | `/docs/<cat>/` 섹션별 문서 목록 | `subcategory: string` / `LinkList.astro`, `src/data/docsSections.ts` |
| `TreeSection.astro` | 카드 컨테이너 (border + radius + bg-nav) + 섹션 레이블 | `label: string`, `labelVariant?: 'accent' \| 'muted'` |
| `LinkList.astro` | 링크 리스트 (→ 화살표, hover accent, disabled 지원) | `items: { title: string; url: string \| null }[]`, `label?: string` |

> **`PageLayout.astro` `is:global` 이유**: Astro 스코프 CSS는 슬롯 콘텐츠에 scope hash가 붙지 않아 `.container` 등의 스타일이 미적용됨. `is:global`로만 해결 가능. Landing/About 전용이므로 전역 오염 위험 없음.

> **`TreeSection` labelVariant**: `accent` = Blog 카테고리 (accent 색상, 일반 크기), `muted` = Docs 그룹 레이블 (gray, uppercase, 소형)

> **`LinkList` disabled**: `url === null` → `<span>`(disabled)으로 렌더. DocsTree에서 미마이그레이션 서브카테고리에 사용.

---

## 데이터 레이어 (`src/data/`)

| 파일 | exports | 사용처 |
|------|---------|--------|
| `tagColors.ts` | `TAG_HUES: Record<string, number>` (태그→HSL hue, 18개), `CATEGORY_ORDER: string[]` (카테고리 표시 순서) | `src/pages/index.astro` (랜딩 태그 색상), `BlogTree.astro` (카테고리 정렬) |
| `docsGroups.ts` | `DOCS_GROUPS: DocsGroup[]` (10개 그룹, 16개 서브카테고리) | `DocsTree.astro` |
| `docsSections.ts` | `docsSections: Record<string, SectionConfig>` (15개 서브카테고리) | `SubcategoryPage.astro` |
| `giscusConfig.ts` | `repo`, `repoId`, `category`, `categoryId` | `Giscus.astro` |

> **새 Blog 카테고리 추가**: `tagColors.ts`에 hue 추가
> **새 Docs 서브카테고리 추가**: `docsGroups.ts` + `docsSections.ts` + `astro.config.mjs` sidebar 모두 업데이트
> **⚠️ `astro.config.mjs` sidebar는 별도 관리** — `docsGroups.ts`와 동기화 필요

---

## Astro Content Collection 구조

컬렉션은 `docs` 단 하나. Blog와 Docs가 같은 컬렉션을 공유.

```ts
// src/content.config.ts
collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: (context) => blogSchema(context) }),
  }),
};
```

### ID 포맷 (확장자 없음)
```
blog/null-overloading           → /blog/null-overloading/
docs/java                       → /docs/java/           (java/index.mdx의 ID)
docs/java/class                 → /docs/java/class/
```

### docsLoader ID 포맷 — getCollection 쿼리 패턴
```ts
// 일반 docs 문서 (index 제외)
({ id }) => id.split('/').length >= 3 && id.split('/')[0] === 'docs'

// subcategory index 페이지만
({ id }) => id.split('/').length === 2 && id.split('/')[0] === 'docs'
```

**이 포맷을 잘못 가정하면 DocsTree에서 링크가 `<a>` 대신 `<span>`으로 렌더링된다.**

---

## Giscus 표시 조건 (`Footer.astro`)

```ts
const isIndexPage = /^\/(blog|docs)\/?$/.test(Astro.url.pathname);
const showGiscus = !isSplash && !isAbout && !isIndexPage;
```

- ❌ 비활성: splash 페이지, `/about/*`, `/blog/`, `/docs/`
- ✅ 활성: Blog 포스트, Docs 문서 페이지

---

## starlight-blog 독립 시스템

starlight-blog는 Starlight의 `Pagination` 오버라이드와 **무관하게** 자체 컴포넌트를 주입한다.

| 항목 | 위치 | 제어 방법 |
|------|------|----------|
| Blog 포스트 prev/next | `.post-footer .pagination` | `custom.css`에서 `display: none` |
| "Blog" 고정 링크 (헤더) | ThemeSelect 내 주입 | `ThemeSelect.astro` 오버라이드로 우회 |
| `/blog/` 기본 라우트 | starlight-blog 내부 | `src/pages/blog/index.astro`로 오버라이드 |

---

## Blog 사이드바 없음 처리 메커니즘

`astro.config.mjs`의 `<head>` 인라인 스크립트 (동기 실행):
```js
if (window.location.pathname.startsWith('/blog')) {
  document.documentElement.setAttribute('data-no-sidebar', '');
  document.documentElement.removeAttribute('data-has-sidebar');
}
```
→ `custom.css`에서 `[data-no-sidebar]`로 레이아웃 픽스 적용.

---

## Starlight 업그레이드 취약점

버전 업 시 반드시 확인:

| 파일 | 의존 대상 | 위험도 |
|------|---------|--------|
| `MobileMenuFooter.astro` | `.sidebar-content`, `.mobile-preferences` 클래스명 | 높음 |
| `Sidebar.astro` | `#starlight__sidebar`, `sl-sidebar-restore` 커스텀 엘리먼트 | 높음 |
| `custom.css` | `.posts article.preview .sl-markdown-content`, `.post-footer .pagination` | 중간 |
| `PageTitle.astro` | `Astro.locals.starlightRoute` 내부 API | 중간 |
| `Footer.astro` | `Astro.locals.starlightRoute?.entry` 내부 API | 중간 |
