# Blog 프로젝트 작업 계획

> 최종 업데이트: 2026-02-25

---

## Phase 1: 환경 구성

- [ ] Astro + Starlight 프로젝트 초기화
- [ ] GitHub Pages 배포 파이프라인 구성 (GitHub Actions)
- [ ] Giscus 설정 (GitHub Discussions 활성화)

## Phase 2: 기본 구조 구현

- [ ] 포트폴리오 랜딩 페이지 (`/`)
- [ ] About 섹션 (`/about/`)
- [ ] Blog 섹션 (`/blog/`, starlight-blog 플러그인)
- [ ] Docs 섹션 (`/docs/`, 사이드바 네비게이션)

## Phase 3: 기능 연동

- [ ] Giscus 댓글 연동 (blog + docs)
- [ ] Google Analytics 연동

## Phase 4: 콘텐츠 마이그레이션

- [ ] docs 콘텐츠 이전 (`_import/docs/` → `src/content/docs/`)
- [ ] blog 콘텐츠 이전 (`_import/tech-log/` → `src/content/blog/`)
- [ ] about 콘텐츠 이전 (`_import/about/` → `src/pages/about/`)

## Phase 5: 마무리

- [ ] SEO 검증 (sitemap, robots.txt, meta tag)
- [ ] 모바일 반응형 확인
- [ ] 최종 배포 확인
