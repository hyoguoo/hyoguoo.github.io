# /structure - 사이트 구조 상세 참조

## Triggers
- "구조가 어떻게 돼", "파일이 어디 있어", "어떤 컴포넌트가 뭘 담당해" 등
- 새 기능 추가 전 아키텍처 파악이 필요할 때
- 컴포넌트 역할이 헷갈릴 때

---

## 섹션별 라우트 & 레이아웃

| 섹션 | URL | 레이아웃 | 진입점 |
|------|-----|---------|--------|
| 랜딩 | `/` | 완전 커스텀 (Starlight 없음) | `src/pages/index.astro` |
| Blog 목록 | `/blog/` | Starlight (StarlightPage) | `src/pages/blog/index.astro` |
| Blog 포스트 | `/blog/<slug>/` | Starlight (starlight-blog) | `src/content/docs/blog/<slug>.md` |
| Docs 목록 | `/docs/` | Starlight | `src/content/docs/docs/index.mdx` |
| Docs 서브카테고리 | `/docs/<name>/` | Starlight | `src/content/docs/docs/<name>/index.mdx` |
| Docs 문서 | `/docs/<name>/<slug>/` | Starlight | `src/content/docs/docs/<name>/<slug>.md` |
| About | `/about/` | 완전 커스텀 (Starlight 없음) | `src/pages/about/index.astro` |

> 랜딩(`/`)과 About(`/about/`)은 Starlight 레이아웃을 사용하지 않는 독립 Astro 페이지.

---

## 파일 구조

```
src/
├── pages/
│   ├── index.astro          ← 랜딩 페이지 (커스텀, Starlight 없음)
│   ├── blog/
│   │   └── index.astro      ← /blog/ 라우트 오버라이드 (starlight-blog 기본 대체)
│   └── about/
│       └── index.astro      ← About 페이지 (커스텀, Starlight 없음)
│
├── content/
│   └── docs/                ← Starlight 단일 'docs' 컬렉션 루트
│       ├── index.mdx        ← Starlight 루트 (현재 미사용, /는 pages/index.astro가 처리)
│       ├── blog/            ← Blog 포스트 콘텐츠
│       │   └── <slug>.md
│       └── docs/            ← Docs 콘텐츠
│           ├── index.mdx    ← /docs/ 페이지 (DocsTree 렌더)
│           └── <name>/
│               ├── index.mdx       ← /docs/<name>/ 페이지 (SubcategoryPage 렌더)
│               └── <slug>.md       ← 개별 문서
│
├── components/
│   ├── BlogTree.astro        ← Blog 목록: 태그별 그룹핑 카드 뷰
│   ├── DocsTree.astro        ← Docs 목록: group → subcategory 2단계 계층
│   ├── SubcategoryPage.astro ← Docs 서브카테고리: section별 문서 목록
│   ├── Footer.astro          ← [Starlight 오버라이드] Giscus 댓글 제어
│   ├── Giscus.astro          ← Giscus 댓글 컴포넌트
│   ├── PageTitle.astro       ← [Starlight 오버라이드] 뒤로가기 버튼 추가
│   ├── Pagination.astro      ← [Starlight 오버라이드] 비어 있음 (docs prev/next 제거)
│   ├── Sidebar.astro         ← [Starlight 오버라이드] 커스텀 사이드바
│   ├── SocialIcons.astro     ← [Starlight 오버라이드] Blog/Docs/About/GitHub 네비게이션
│   ├── ThemeSelect.astro     ← [Starlight 오버라이드] starlight-blog "Blog" 링크 주입 차단
│   └── EntryMeta.astro       ← 문서 메타 정보 표시
│
├── data/
│   └── docsSections.ts       ← Docs 서브카테고리별 섹션 config
│
└── styles/
    └── custom.css            ← 전역 커스텀 CSS
```

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

### Blog / Docs 구분
```ts
id.startsWith('blog/')  → Blog 포스트
id.startsWith('docs/')  → Docs 문서 (index 포함)
```

---

## Starlight 컴포넌트 오버라이드

`astro.config.mjs`의 `components:` 섹션에 정의:

| 컴포넌트 | 파일 | 역할                                        |
|---------|------|-------------------------------------------|
| `Footer` | `Footer.astro` | Giscus 표시 조건 제어                           |
| `Sidebar` | `Sidebar.astro` | 커스텀 사이드바, `/blog/*`, `/about/*`에서 사이드바 숨김 |
| `PageTitle` | `PageTitle.astro` | 상위 페이지 뒤로가기 버튼                            |
| `Pagination` | `Pagination.astro` | 비어 있음 → docs 하단 prev/next 제거              |
| `SocialIcons` | `SocialIcons.astro` | 헤더 우측: Blog/Docs/About/GitHub 링크          |
| `ThemeSelect` | `ThemeSelect.astro` | starlight-blog의 "Blog" 링크 주입 우회           |

---

## starlight-blog 플러그인 독립 시스템

starlight-blog는 Starlight의 `Pagination` 오버라이드와 **무관하게** 자체 컴포넌트를 주입한다.

| 항목 | 위치 | 제어 방법 |
|------|------|----------|
| Blog 포스트 prev/next | `.post-footer .pagination` | `custom.css`에서 `display: none` |
| "Blog" 고정 링크 (헤더) | ThemeSelect 내 주입 | `ThemeSelect.astro` 오버라이드로 우회 |
| `/blog/` 기본 라우트 | starlight-blog 내부 | `src/pages/blog/index.astro`로 오버라이드 |

---

## Giscus 댓글 활성화 조건

`Footer.astro`에서 결정:

| 페이지 | Giscus |
|--------|--------|
| 랜딩 (`/`) | ❌ (Starlight 레이아웃 밖) |
| `/blog/` | ❌ (isIndexPage) |
| `/docs/` | ❌ (isIndexPage) |
| `/about/` | ❌ (isAbout) |
| Blog 포스트 | ✅ |
| Docs 문서 | ✅ |

```ts
const isIndexPage = /^\/(blog|docs)\/?$/.test(Astro.url.pathname);
const showGiscus = !isSplash && !isAbout && !isIndexPage;
```

---

## DocsTree 카테고리 구조

`src/components/DocsTree.astro`의 `groups` 배열이 표시 계층을 정의.
실제 콘텐츠가 있는 서브카테고리만 자동 필터링해서 표시.

```
Computer Science: computer-architecture, operating-system, network, secure
Database: mysql, redis
Language: java
Framework: spring
Messaging & Streaming: kafka
Software Engineering: test, ai-assisted-development
DevOps & Infra: docker
System Architecture: large-scale-system
Design Pattern: oop
ETC: setting
```

---

## docsSections.ts 역할

`src/data/docsSections.ts`는 각 서브카테고리 페이지(`SubcategoryPage.astro`)에서
문서를 섹션별로 그룹핑할 때 사용한다.

```ts
export const docsSections: Record<string, SectionConfig> = {
  java: [
    { label: 'JVM', slugs: ['jvm', 'jvm-execution-and-optimization', 'garbage-collection'] },
    // ...
  ],
  // 새 서브카테고리 추가 시 여기에 추가
};
```

config에 없는 slug는 자동으로 "기타" 섹션에 분류됨.
config 자체가 없는 서브카테고리는 알파벳 순 flat list로 표시됨.
