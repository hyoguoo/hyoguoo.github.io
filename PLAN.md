# Blog 프로젝트 작업 계획

> 최종 업데이트: 2026-02-27 (Phase 8 추가)

---

## Phase 1: 환경 구성

- [x] Astro + Starlight 프로젝트 초기화
- [x] GitHub Pages 배포 파이프라인 구성 (GitHub Actions)
- [x] Giscus 설정 완료 (repo-id, category-id 적용)

## Phase 2: 기본 구조 구현

- [x] 포트폴리오 랜딩 페이지 (`/`) — `src/pages/index.astro`
- [x] About 섹션 (`/about/`) — `src/pages/about/index.astro`
- [x] Blog 섹션 (`/blog/`, starlight-blog 플러그인)
- [x] Docs 섹션 (`/docs/`, 사이드바 네비게이션)

## Phase 3: 기능 연동

- [x] Giscus 댓글 연동 — `src/components/Giscus.astro` 설정 완료
- [x] Google Analytics 연동 (G-KBCBB0D7H8)

## Phase 4: 테스트 및 테마 커스터마이징

- [x] 테스트 페이지 추가
- [x] 메인페이지 Explore 섹션 상위로 이동
- [x] RSS 관련 내용 제거 (CSS로 숨김)
- [x] 현재 페이지의 상위 페이지로 돌아가는 버튼 추가 (예: /docs/java/class.md → /docs/java/)
  - 공식 기능이나 모듈을 사용하는 것을 우선적으로 고려, 없다면 진행 하기 전에 논의
- [x] 컨텐츠 최하단에 다음 글 / 이전 글 안 나오도록 변경 (Pagination 컴포넌트 오버라이드)
- [x] blog / docs 진입 시 우측 상단의 버튼이 Blog / Docs / About / GitHub 버튼이 나오고, 현재 위치한 섹션은 다른 색상으로 표시되도록 변경
- [x] 제목 두 번 나오는 문제 수정(frontmatter title과 본문 H1 중복)
- [x] 제목의 `` 기호 적용 되지 않는 문제 수정 (PageTitle 오버라이드에서 백틱→`<code>` 변환)
- [x] mermaid 다이어그램 렌더링 문제 수정 (클라이언트 사이드 mermaid.js 렌더링)
- [x] 기술 블로그 컨텐츠 조회 시 왼쪽 사이드바 보이지 않도록 변경 (Sidebar 컴포넌트 오버라이드)
- [x] About 섹션에서도 사이드바 보이지 않도록 변경 (Sidebar 컴포넌트 `isAbout` 조건 추가)
- [x] DOCS도 블로그처럼 작성일 / 수정일 / 작성자 정보가 보이도록 반영 (PageTitle 컴포넌트 오버라이드)
- [x] DOCS 메인 페이지 NOT FOUND 문제 수정 (src/content/docs/docs/index.mdx 생성)
- [x] DOCS 메인 페이지 들어갔을 때 대분류가 나열되어 그 안에 문서가 존재하는 트리 형태 디자인으로 하기 (DocsTree 컴포넌트)
- [x] 기술 블로그 포스팅(blog) 메인 페이지 접속 시 최근 포스팅과 함께 내용이 조금씩(한 두 줄) 보이는 형태로 디자인(현재는 포스팅이 연속으로 나열되는 형태로 보임)
    - 구현이 어렵다면 다른 방법 (예: 포스팅 제목과 날짜만 보이는 형태)으로도 괜찮음

## Phase 5: 콘텐츠 마이그레이션

`/migrate` skill 사용 권장

> ⚠️ About은 `src/pages/about/`가 아닌 `src/content/docs/about/`에 배치 (Astro v4 local image 지원 문제)

- [x] docs 콘텐츠 이전 (`_import/docs/` → `src/content/docs/docs/`)
  - [x] java: 전체 (jvm, lambda, optional, thread, collections + 나머지 25개)
  - [x] java/effective-java: item1~item90, index.mdx (전체 90개)
  - [x] mysql: btree-index, transaction, isolation-level
  - [x] ai-assisted-development, computer-architecture, docker, kafka, large-scale-system, network, oop, operating-system, redis, secure, setting, spring, test (13개 신규 서브카테고리)
- [x] blog 콘텐츠 이전 (`_import/tech-log/posts/` → `src/content/docs/blog/`)
  - [x] 전체 18개 포스트 이전 완료 (Java, Spring & JPA, MySQL, AI 카테고리)
- [x] about 콘텐츠 이전 (`_import/about/posts/` → `src/content/docs/about/`)
  - why-developer, study-log, 1-day-1-commit 이전 완료

## Phase 6: 마무리

- 콘텐츠 문서 이관 검수
  - [x] MySQL 클러스터링 인덱스 부분에 여러 인덱스가 존재하는데, ETC 인덱스로 제목을 통일하거나, 혹은 각 인덱스 별로 문서를 나누는 방향으로 진행할 것(질의하면서 결정)
  - [x] 각 문서 제목은 아래 컨벤션을 유지
    - 영문 단독, 약어인 경우 풀네이밍 괄호 추가, 예: `AOP (Aspect-Oriented Programming)`
    - SQL 키워드(SELECT, INSERT 등), API/메서드명, 고유명사는 원문 유지
  - 섹션 관리
    - [x] AI-Assisted Development의 Claude 부분은 별도 섹션을 포함한, 추가적인 섹션 구분 진행, Docker와 같이 구분이 안 되어 있는 문서들을 대상(하나 하나 질의 하면서 진행할 것)
- [x] 콘텐츠 내 링크 경로 오류 수정
    - 상대경로 `.md` 링크 → 절대경로 `/blog/` 또는 `/docs/` 경로로 변경 (26개 파일)
    - 기존 gitbook 링크 → 현재 사이트 내 경로로 변경 완료
- [x] 게시글 추가 Skill 생성
- [x] SEO 검증 (sitemap, robots.txt, meta tag)
- [x] 모바일 반응형 확인
- [x] 최종 배포 확인
- [x] docs frontmatter description, tags 추가 (tags: 카테고리 자동 적용, description: "" 추후 적용)
- [x] docs 컨텐츠의 태그가 최상단 랜딩페이지에서 카테고리로 보이도록 변경 (현재는 Docs로 고정되어 있음, Blogs 글은 태그가 카테고리로 보이도록 되어 있음)
- [x] docs 컨텐츠의 태그가 컨텐츠 최하단에도 보이도록 변경 (현재는 보이지 않으며, 블로그 글은 최하단에 태그가 보이도록 되어 있음)
- [x] 특정 문서 코드 스니펫 색상 적용 안되는 문제(payment-gateway-strategy-pattern.md)
- [x] docs 앞으로 가기 버튼 2 뎁스 부터 보이도록 변경 (현재는 3뎁스부터 보임, 예를들어 mysql/index.md 같은 경우 앞으로 가기 버튼이 보이지 않음, 그 안의 btree-index.md로 들어가야 앞으로 가기 버튼이 보임)

## Phase 7: 디자인 마무리

- [x] 파비콘 추가
- [x] About 컨택트 정보 및 개인 정보(실명, 이메일 등) 추가
- [x] 왼쪽 위 타이틀 이름 변경 및 아이콘 추가 (현재는 hyoguoo, blog / docs 안에서는 hyoguoo's notes 인데 통합 필요)
- [x] 메인 랜딩 페이지 디자인 전면 개선
- [x] 메인 랜딩 페이지, about 테마 변경 추가 및 배경 색 톤 내부 페이지(docs, blogs)와 비슷하게 변경
- [x] docs 사이드바 카테고리가 기본적으로 닫혀있고, 내가 열람한 페이지만 열린 상태로 설정(현재는 전체 카테고리가 열린 상태로 되어 있음)
- [x] 모바일 뷰 테마 토글 안 보임

---

## Phase 8: 리팩토링 심화 & 코드 클린업

> 배경: `RESEARCH.md` 에서 식별된 문제점(P1~P11) 및 CSS 아키텍처 개선 사항.
> 우선순위 순으로 정렬. 각 항목 옆 `[P번호]`는 `RESEARCH.md` 참조.

### A. Blog/Docs 공통 컴포넌트 추출 ✅

- [x] `TreeSection.astro` 신규 생성 — 카드 컨테이너(border+radius+bg) + 섹션 레이블
  - Props: `label`, `labelVariant?: 'accent' | 'muted'`
- [x] `LinkList.astro` 신규 생성 — 링크 리스트 (→ 화살표, hover accent, disabled 지원)
  - Props: `items: { title, url | null }[]`, `label?`
- [x] `BlogTree.astro` 수정 — `TreeSection` 사용 (`labelVariant="accent"`)
- [x] `DocsTree.astro` 수정 — `TreeSection` + `LinkList` 사용, 중복 CSS 제거
- [x] `SubcategoryPage.astro` 수정 — `LinkList` 사용, 중복 CSS 제거
- 중복 CSS ~195줄 → ~110줄 (-85줄)

### C. 테마/CSS 단일화 ✅

- [x] `src/styles/tokens.css` 신규 생성 — 색상 원시값 단일 관리
  - `--t-*` prefixed raw token (dark/light 양 모드)
  - `custom.css`와 `pages.css`가 이 파일을 `@import`로 참조
- [x] `src/styles/pages.css` 신규 생성 — Landing/About 공통 CSS 변수 추출 [P1]
  - `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-accent` 등
  - `index.astro`, `about/index.astro` 인라인 변수 정의 블록 제거 후 import 적용
- [x] `src/styles/custom.css` — 하드코딩 hex 값 → `var(--t-*)` 참조로 교체

### D. Landing/About 공통 레이아웃 추출 [P1] ✅

> 두 파일이 아래 코드를 완전히 중복 보유 (합산 ~440줄 중복)

- [x] `src/components/PageLayout.astro` 신규 생성
  - Props: `title`, `description`, `activePage?`, OG 태그류, `sitemap?`
  - 공유 추출: header/nav 마크업+CSS, ThemeSelect JS+마크업, 모바일 nav CSS, footer
  - `pages.css` import도 이 컴포넌트로 이동
- [x] `src/pages/index.astro` — `<PageLayout>` 래퍼로 교체, 페이지 고유 콘텐츠만 유지
- [x] `src/pages/about/index.astro` — `<PageLayout activePage="about">` 로 교체

### E. 데이터/설정 관리 개선 ✅

- [x] `src/data/tagColors.ts` 신규 생성 — TAG_HUES와 CATEGORY_ORDER 통합 [P3]
  - `pages/index.astro`의 `TAG_HUES` 맵 → 외부 파일로 추출
  - `BlogTree.astro`의 `categoryOrder` 배열 → `CATEGORY_ORDER`로 추출
  - 두 파일이 동일 소스를 import → 카테고리명 불일치 리스크 제거
- [x] `src/data/docsGroups.ts` 신규 생성 — DocsTree groups 추출 [P2]
  - `DocsTree.astro`의 37줄 inline `groups` 배열 → 외부 파일로 추출
  - `DocsGroupItem`, `DocsGroup` 인터페이스 정의 포함
  - `astro.config.mjs` sidebar는 변경 없음 (autogenerate 방식 유지)

### F. 컴포넌트 클린업

- [ ] `ThemeSelect.astro` passthrough 제거 검토 [P4]
  - 현재 `<Default><slot /></Default>` 만 있는 파일
  - starlight-blog의 ThemeSelect 오버라이드 동작 확인 후 제거 가능 여부 판단
- [ ] `Header.astro` 내 `BlogMobileMenu` Web Component 분리 [P9]
  - `src/components/BlogMobileMenu.astro` (또는 `.ts`)로 추출
  - `Header.astro` 가독성 개선
- [ ] `Pagination.astro` 의도 명확화 [P5]
  - 빈 파일이지만 주석으로 역할(prev/next 제거 의도) 명시
- [ ] `Giscus.astro` 설정 외부화 [P11]
  - `repo`, `repoId`, `category`, `categoryId` → `astro.config.mjs` 또는 환경 변수로 이동

### G. 콘텐츠/표기 일관성

- [ ] 직함 표기 통일 [P7]
  - `pages/index.astro` (meta + hero): "Backend Developer"
  - `pages/about/index.astro` (meta + profile): "Backend Engineer"
  - 둘 중 하나로 통일 후 `astro.config.mjs` description도 동일하게 수정

### H. 유지보수 리스크 문서화 (작업 아님, 인지 필요)

> Starlight 버전 업그레이드 시 깨질 가능성 있는 부분

- `MobileMenuFooter.astro` — `.sidebar-content`, `.mobile-preferences` 내부 클래스 의존 [P10]
- `Sidebar.astro` — `#starlight__sidebar`, `sl-sidebar-restore` 커스텀 엘리먼트 의존 [P8]
- `custom.css` — `.posts article.preview .sl-markdown-content`, `.post-footer .pagination` 내부 클래스 참조
- `PageTitle.astro`, `Footer.astro` — `Astro.locals.starlightRoute` 내부 API 사용

---

## 추가 작업

- [ ] og 이미지 추가
- [ ] docs description 추가 / blogs description 점검
- [ ] README.md 업데이트 (프로젝트 설명, 기술 스택, 배포 URL 등)
