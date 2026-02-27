# Blog 프로젝트 컨텍스트

## 문서 참조
- 제품 스펙: `SPEC.md`

## 기술 스택
- **프레임워크**: Astro + Starlight (Astro 공식 docs 프레임워크)
- **블로그**: starlight-blog 플러그인
- **댓글**: Giscus (GitHub Discussions 기반, GitHub 계정 필요)
- **배포**: GitHub Pages (GitHub Actions)
- **통계**: Google Analytics

## 사이트 구조 (요약)

4개 섹션, 2가지 레이아웃:

| 섹션 | URL | 레이아웃 |
|------|-----|---------|
| 랜딩 | `/` | 커스텀 Astro (Starlight 없음) |
| Blog | `/blog/`, `/blog/<slug>/` | Starlight + starlight-blog |
| Docs | `/docs/`, `/docs/<name>/`, `/docs/<name>/<slug>/` | Starlight |
| About | `/about/` | 커스텀 Astro (Starlight 없음) |

콘텐츠는 **단일 `docs` 컬렉션** (`src/content/docs/`)으로 관리:
- `src/content/docs/blog/` → Blog 포스트
- `src/content/docs/docs/` → Docs 문서

> 상세 구조(컴포넌트 역할, 오버라이드 목록, 카테고리 등): `/structure` skill 참조

## 파일 구조
```
_import/             ← 마이그레이션 소스 (git submodule, 서빙 안 됨)
├── tech-log/        ← hyoguoo/tech-log 서브모듈 (Blog 소스)
├── docs/            ← hyoguoo/docs 서브모듈 (Docs 소스)
└── about/           ← hyoguoo/about 서브모듈 (About 소스)

src/
├── content/docs/
│   ├── blog/        ← Blog 포스트 마크다운
│   └── docs/        ← Docs 문서 마크다운 (서브카테고리별 디렉토리)
├── pages/
│   ├── index.astro          ← 랜딩 페이지 (PageLayout 사용)
│   ├── blog/index.astro     ← /blog/ 라우트 오버라이드
│   └── about/               ← About 페이지 (PageLayout activePage="about")
├── components/      ← Starlight 오버라이드 컴포넌트(9개) + 커스텀 컴포넌트(9개)
├── styles/
│   ├── tokens.css   ← 원시 색상 토큰 (--t-*), 단일 진실 원천
│   ├── pages.css    ← Landing/About 시맨틱 변수 (--color-*), tokens.css import
│   └── custom.css   ← Starlight CSS 변수 오버라이드 (--sl-*), tokens.css import
└── data/
    ├── tagColors.ts     ← TAG_HUES (태그→색상 hue), CATEGORY_ORDER (Blog 카테고리 순서)
    ├── docsGroups.ts    ← DOCS_GROUPS (DocsTree 시각적 그루핑, 10개 그룹)
    ├── docsSections.ts  ← Docs 서브카테고리별 섹션 config (15개 서브카테고리)
    └── giscusConfig.ts  ← Giscus 연동 설정 (repo/repoId/category/categoryId)
```

## Frontmatter 규칙

**Blog** (`src/content/docs/blog/*.md`)
```yaml
---
title: 포스팅 제목
date: YYYY-MM-DD          # 최초 게시일
lastUpdated: YYYY-MM-DD   # 수정 시 반드시 갱신, 정렬 기준
tags: [Java]              # ⚠️ 필수: BlogTree 카테고리 그룹핑 기준 (첫 번째 태그)
---
```

**Docs** (`src/content/docs/docs/**/*.md`)
```yaml
---
title: 문서 제목
date: YYYY-MM-DD          # 최초 작성일
lastUpdated: YYYY-MM-DD   # 수정 시 반드시 갱신, 정렬 기준
tags: [카테고리]          # 최상위 디렉토리명 기준 (예: java → Java)
description: ""           # SEO용. 작성 시 한 문장 요약 권장
---
```

- `date`: 마이그레이션 시 최초 커밋 날짜로 자동 설정
- `lastUpdated`: 수동 입력, 목록 및 랜딩 페이지 정렬 기준
- `description`: SEO용 og:description. 한 문장 요약 권장 (없으면 사이트 설명으로 대체됨)
- 글 수정 시 반드시 `lastUpdated` 갱신

## 제목 컨벤션

**영문만 사용**, 한글 병기 금지.

| 경우 | 처리 | 예시 |
|------|------|------|
| 일반 영문 | 그대로 | `Spring IoC Container` |
| 약어 | 풀네임을 괄호 추가 | `AOP (Aspect-Oriented Programming)` |
| SQL 키워드 | 그대로 (대문자) | `SELECT`, `INSERT`, `ENUM` |
| API·메서드명·고유명사 | 공식 표기 그대로 | `@Transactional`, `Redis` |

주요 약어: AOP, CAS, CORS, DNS, HTTP/HTTPS, JDBC, JPA, JWT, JVM, OAuth, SpEL, URI
→ 상세 풀네임 목록: `/add` skill 참조

## Blog 태그

`tags` 배열의 **첫 번째 태그**가 BlogTree 카테고리 그룹핑 기준.

현재 사용 중인 태그: `Java`, `Spring & JPA`, `MySQL`, `AI`

새 태그 도입 전 기존 태그 재사용 여부 먼저 검토.

## 내부 링크 형식

본문 내 사이트 내부 링크는 **절대 경로**만 사용:
- Blog: `/blog/<slug>/`
- Docs: `/docs/<category>/<slug>/`

상대 경로(`.md`, `../`) 및 구 Gitbook URL(`hyoguoo.gitbook.io`) 사용 금지.

## Skills
프로젝트 전용 skills: `.claude/skills/`

| Skill | 자동 호출 조건 |
|-------|-------------|
| `/status` | 세션 시작 시, 진행 상황 질문 시 |
| `/verify` | 스펙 준수 확인 요청 시 |
| `/structure` | 사이트 구조·컴포넌트 역할 파악이 필요할 때 |
| `/add [위치 또는 문서]` | 새 게시글·문서 추가 시 |

## 주요 원칙
- 테마 커스터마이징은 Starlight CSS 변수 최소 수정 (accent 색상, 폰트만)
- 조회수 미표시 (Google Analytics로 내부 통계만)
- 댓글은 Blog + Docs 개별 문서에만 적용, 인덱스 페이지·About은 미적용
