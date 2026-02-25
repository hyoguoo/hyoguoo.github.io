# Blog 프로젝트 작업 계획

> 최종 업데이트: 2026-02-26

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
- [x] DOCS도 블로그처럼 작성일 / 수정일 / 작성자 정보가 보이도록 반영 (PageTitle 컴포넌트 오버라이드)
- [x] DOCS 메인 페이지 NOT FOUND 문제 수정 (src/content/docs/docs/index.mdx 생성)
- [x] DOCS 메인 페이지 들어갔을 때 대분류가 나열되어 그 안에 문서가 존재하는 트리 형태 디자인으로 하기 (DocsTree 컴포넌트)
- [x] 기술 블로그 포스팅(blog) 메인 페이지 접속 시 최근 포스팅과 함께 내용이 조금씩(한 두 줄) 보이는 형태로 디자인(현재는 포스팅이 연속으로 나열되는 형태로 보임)
    - 구현이 어렵다면 다른 방법 (예: 포스팅 제목과 날짜만 보이는 형태)으로도 괜찮음

## Phase 5: 콘텐츠 마이그레이션

`/migrate` skill 사용 권장

- [ ] docs 콘텐츠 이전 (`_import/docs/` → `src/content/docs/`)
- [ ] blog 콘텐츠 이전 (`_import/tech-log/` → `src/content/blog/`)
- [ ] about 콘텐츠 이전 (`_import/about/` → `src/pages/about/`)

## Phase 6: 마무리

- [ ] SEO 검증 (sitemap, robots.txt, meta tag)
- [ ] 모바일 반응형 확인
- [ ] 최종 배포 확인

## Phase 7: 디자인 마무리
