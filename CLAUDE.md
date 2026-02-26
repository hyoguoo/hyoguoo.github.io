# Blog 프로젝트 컨텍스트

## 문서 참조
- 제품 스펙: `SPEC.md`
- 작업 진행: `PLAN.md`

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
│   ├── index.astro  ← 랜딩 페이지 (커스텀)
│   ├── blog/index.astro  ← /blog/ 라우트 오버라이드
│   └── about/       ← About 페이지 (커스텀)
├── components/      ← Starlight 오버라이드 컴포넌트 + 커스텀 컴포넌트
└── data/
    └── docsSections.ts  ← Docs 서브카테고리 섹션 config
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
---
```

- `date`: 마이그레이션 시 최초 커밋 날짜로 자동 설정
- `lastUpdated`: 수동 입력, 목록 및 랜딩 페이지 정렬 기준
- 글 수정 시 반드시 `lastUpdated` 갱신

## Skills
프로젝트 전용 skills: `.claude/skills/`

| Skill | 자동 호출 조건 |
|-------|-------------|
| `/status` | 세션 시작 시, 진행 상황 질문 시 |
| `/verify` | Phase 완료 후, 스펙 준수 확인 요청 시 |
| `/migrate [경로]` | 콘텐츠 이전 작업 시 |
| `/structure` | 사이트 구조·컴포넌트 역할 파악이 필요할 때 |

## 주요 원칙
- 테마 커스터마이징은 Starlight CSS 변수 최소 수정 (accent 색상, 폰트만)
- 조회수 미표시 (Google Analytics로 내부 통계만)
- 댓글은 Blog + Docs 개별 문서에만 적용, 인덱스 페이지·About은 미적용
