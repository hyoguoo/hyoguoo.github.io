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

## 파일 구조
```
_import/             ← 마이그레이션 소스 (git submodule, 서빙 안 됨)
├── tech-log/        ← hyoguoo/tech-log 서브모듈
├── docs/            ← hyoguoo/docs 서브모듈
└── about/           ← hyoguoo/about 서브모듈

src/
├── content/
│   ├── docs/        ← Docs 섹션 마크다운 (마이그레이션 완료본)
│   └── blog/        ← Blog 섹션 마크다운 (마이그레이션 완료본)
├── pages/
│   ├── index.astro  ← 랜딩 페이지
│   └── about/       ← About 섹션
└── components/
    └── Giscus.astro ← 댓글 컴포넌트
```

## Frontmatter 규칙

**Blog** (`src/content/blog/*.md`)
```yaml
---
title: 포스팅 제목
date: YYYY-MM-DD          # 최초 게시일 (starlight-blog 표시용)
lastUpdated: YYYY-MM-DD   # 수정 시 반드시 갱신, 정렬 기준
tags: [Spring, JPA]
---
```

**Docs** (`src/content/docs/**/*.md`)
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

## 주요 원칙
- 테마 커스터마이징은 Starlight CSS 변수 최소 수정 (accent 색상, 폰트만)
- 조회수 미표시 (Google Analytics로 내부 통계만)
- 댓글은 Blog + Docs 모두 적용, About은 미적용
