# Blog 프로젝트 컨텍스트

## Overview

개인 개발 블로그·기술 학습 문서·포트폴리오를 제공하는 Astro + Starlight 기반 정적 사이트.
이 저장소의 공통 지침은 `AGENTS.md`에서 관리한다.

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
| 랜딩 | `/` | 커스텀 Astro + 공통 헤더 |
| Blog | `/blog/`, `/blog/<slug>/` | Starlight + starlight-blog |
| Docs | `/docs/`, `/docs/<name>/`, `/docs/<name>/<slug>/` | Starlight |
| About | `/about/` | 커스텀 Astro + 공통 헤더 |

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
│   ├── …                    ← Blog 라우트는 starlight-blog가 소유
│   └── about/               ← About 페이지 (PageLayout activePage="about")
├── components/      ← Starlight 오버라이드 + 공통 목록·테마 UI
├── styles/
│   ├── tokens.css   ← 원시 색상 토큰 (--t-*), 단일 진실 원천
│   ├── pages.css    ← Landing/About 시맨틱 변수 (--color-*), tokens.css import
│   └── custom.css   ← Starlight CSS 변수 오버라이드 (--sl-*), tokens.css import
└── data/
    ├── siteProfile.ts   ← 직군·소개 문구
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
tags: [Java]              # ⚠️ 필수: BlogArchive 주 카테고리 기준 (첫 번째 태그)
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

Blog 제목은 한글, Docs 제목은 영문이며 약어는 풀네임을 괄호로 더한다. 자세한 규칙은 사용자 수준 `writing` 스킬의 blog·docs 장르에, 약어 풀네임 목록은 `.agents/writing/glossary.md`에 있다. 사용자가 제목을 명시하면 사용자 요청을 우선한다.

## Blog 태그

`tags` 배열의 **첫 번째 태그**가 BlogArchive 주 카테고리 기준.

현재 사용 중인 태그: `Java`, `Spring & JPA`, `MySQL`, `AI`

새 태그 도입 전 기존 태그 재사용 여부 먼저 검토.

## 내부 링크 형식

본문 내 사이트 내부 링크는 **절대 경로**만 사용:
- Blog: `/blog/<slug>/`
- Docs: `/docs/<category>/<slug>/`

상대 경로(`.md`, `../`) 및 구 Gitbook URL(`hyoguoo.gitbook.io`) 사용 금지.

## 콘텐츠 작성 기준

- 글을 쓰거나 고칠 때는 사용자 수준 `writing` 스킬(agent-kits 저장소)을 쓴다. Blog 글은 `blog` 장르, Docs 문서는 `docs` 장르다. 검수는 `writing-review` 스킬을 쓴다.
- 이 저장소의 글 위치, 형식, 빌드·화면 확인 방법, 용어는 `.agents/writing/`에 있다.
- 작성 규칙은 이 저장소에 두지 않는다. 규칙을 고칠 때는 agent-kits 저장소에서 고친다.

## 화면 검증 범위

- 브라우저·스크린샷을 이용한 화면 검증은 다음 경우에만 한다.
    - 사용자가 명시적으로 요청할 때
    - 현재 작업이 실제 화면의 배치·표시·반응형 문제를 다룰 때
    - 글의 그림(컴포넌트, Mermaid, SVG)을 새로 만들거나 바꿨을 때. 이때는 바꾼 그림만 확인한다
- 문장·헤더·표·불릿만 고친 작업은 화면 검증을 하지 않는다. 변경 내용·문법·링크를 검토하고, 필요한 경우 빌드로 확인한다.
- 화면 검증을 하더라도 요청된 화면·문제·기기 범위에 맞춰 확인하며, 라이트·다크 테마와 데스크톱·모바일 전체 검증을 자동으로 반복하지 않는다. 미리보기 방법은 `.agents/writing/sites.md`에 있다.

## Skills
프로젝트 전용 skills: `.agents/skills/`

자동 탐색을 지원하지 않는 도구는 작업에 해당하는 `.agents/skills/<name>/SKILL.md`를 직접 읽는다.

| Skill | 자동 호출 조건 |
|-------|-------------|
| `/status` | 세션 시작 시, 진행 상황 질문 시 |
| `/verify` | 스펙 준수 확인 요청 시 |
| `/structure` | 사이트 구조·컴포넌트 역할 파악이 필요할 때 |
| `/add [위치 또는 문서]` | 새 게시글·문서 추가 시 |
| `/description` | description 작성·추가·점검 요청 시 |
| `/writing`, `/writing-review` | 사용자 수준 스킬(agent-kits). 문서 콘텐츠 작성·수정, 글 피드백·리뷰·가독성 점검 시 |
| `/study` | 기존 문서·커리큘럼을 바탕으로 학습·복습할 때 |
| `/enhance` | `/enhance` 호출 시, 특정 문서·카테고리 보강 요청 시 |
| `/roadmap [기술명]` | 새 카테고리의 학습 로드맵 스펙 파일(`*_SPEC.md`) 작성 요청 시 |
| `/section [키 또는 라벨]` | 새 docs 서브카테고리 추가 시 (4개 동기화 지점 일괄 처리) |

## 주요 원칙
- 테마 커스터마이징은 Starlight CSS 변수 최소 수정 (accent 색상, 폰트만)
- 조회수 미표시 (Google Analytics로 내부 통계만)
- 댓글은 Blog + Docs 개별 문서에만 적용, 인덱스 페이지·About은 미적용
