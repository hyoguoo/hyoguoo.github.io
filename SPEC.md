# Blog 프로젝트 스펙

> 최종 업데이트: 2026-11-15

---

## 1. 목표

- 개발자 블로그 운영 및 포트폴리오 제공
- 기존 GitBook 3개 블로그를 단일 사이트로 통합
- GitHub 레포지토리 기반 콘텐츠 관리 (마크다운 작성/수정)
- Google 검색 접근 및 SEO 최적화
- 무료 배포 (GitHub Pages)
- 댓글 및 조회수 기능 제공

---

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | Astro + Starlight | Astro 공식 문서 프레임워크 |
| 블로그 플러그인 | starlight-blog | blog 섹션용 |
| 댓글 | Giscus | GitHub Discussions 기반, 무료 |
| 배포 | GitHub Pages | GitHub Actions 자동 배포 |
| 통계 | Google Analytics | 내부 대시보드용, Starlight 기본 통합 지원 |
| 공개 조회수 | 미표시 | 정적 사이트 특성상 미표시가 베스트 프랙티스, 추후 Supabase로 추가 가능 |
| 테마 커스터마이징 | Starlight CSS 변수 최소 수정 | accent 색상, 폰트 정도만 지정 |
| 도메인 | github.io | 추후 커스텀 도메인 전환 가능 (CNAME) |

### 선택 근거

- **Starlight**: 사이드바 네비게이션이 핵심 기능 → docs 섹션 요구사항에 최적
- **starlight-blog**: Starlight 생태계 내 블로그 플러그인, 별도 프레임워크 불필요
- **Giscus**: GitHub 계정 기반 댓글 → 개발자 독자에 자연스러움, 완전 무료
- **GitHub Pages**: 기존 GitHub 워크플로우 연장선, 무료
- **조회수 미표시**: 정적 사이트에서 조회수 표시는 외부 DB 필요, 대부분의 개발 블로그 미표시
- **테마 최소 수정**: Starlight 기본 디자인이 완성도 높음, 과도한 커스터마이징은 유지보수 비용 증가

---

## 3. 사이트 구조

### URL 구조

```
hyoguoo.github.io/
├── /                    ← 개인 블로그 홈
├── /about/              ← 자기소개 (why-developer, study-log 등)
├── /blog/               ← 실무 경험 포스팅 (tech-log)
└── /docs/               ← 학습 레퍼런스 (사이드바 네비게이션)
    ├── /java/
    ├── /spring/
    ├── /network/
    ├── /docker/
    └── ...
```

### 레포지토리 구조

```
notes/blog/                       ← Astro 프로젝트 루트
├── src/
│   ├── content/docs/
│   │   ├── blog/                 ← Blog 포스트 마크다운
│   │   └── docs/                 ← Docs 문서 마크다운 (서브카테고리별)
│   ├── pages/
│   │   ├── index.astro           ← 개인 블로그 홈 (PageLayout 사용)
│   │   ├── about/                ← About 페이지 (PageLayout 사용)
│   │   └── …                     ← 나머지 고유 페이지
│   ├── components/               ← Starlight 오버라이드 + 공통 UI
│   ├── styles/
│   │   ├── tokens.css            ← 원시 색상 토큰 (--t-*)
│   │   ├── pages.css             ← Landing/About 변수 (--color-*)
│   │   ├── custom.css            ← Starlight CSS 변수 (--sl-*)
│   │   └── interactions.css      ← 공통 링크 피드백
│   └── data/
│       ├── siteProfile.ts        ← 직군·소개 문구
│       ├── tagColors.ts          ← Blog 카테고리 색상·순서
│       ├── docsGroups.ts         ← DocsTree 그루핑 config
│       ├── docsSections.ts       ← 서브카테고리 섹션 config
│       └── giscusConfig.ts       ← Giscus 연동 설정
├── public/
├── astro.config.mjs
└── package.json
```

### 마이그레이션 콘텐츠 매핑

각 `_import/` 하위 디렉토리는 원본 레포의 git submodule. `/migrate` skill로 변환.

| 서브모듈 (원본 레포) | _import 경로 | 최종 경로 |
|---------------------|-------------|----------|
| `hyoguoo/tech-log` | `_import/tech-log/` | `src/content/blog/` |
| `hyoguoo/docs` | `_import/docs/` | `src/content/docs/` |
| `hyoguoo/about` | `_import/about/` | `src/pages/about/` |

---

## 4. 섹션별 스펙

### 4-1. 랜딩 페이지 (`/`)

개인 블로그의 최근 기록과 각 영역으로 들어가는 링크를 제공한다.

1. 이름, `Software Engineer`, 소개 문구와 오구 이미지
2. 최근 수정한 Blog 3개: 제목·날짜·첫 번째 태그·기존 description
3. 최근 수정한 Docs 4개: 제목·날짜·주제·기존 description
4. Blog·Docs 전체 목록으로 이동

문구는 `src/data/siteProfile.ts`에서 관리한다. 홈에 전체 주제 목록이나 학습 경로를 추가하지 않는다. 목록의 설명은 기본 표시하고, 링크에는 배경·제목·화살표의 짧은 반응을 제공한다. 모션 감소 설정을 따른다.

홈·About·Blog·Docs는 같은 `SiteHeader`를 사용한다. 로고·검색·네비게이션·테마의 위치와 표현을 공유하며, 모바일의 Docs 문서 탐색은 기존 sidebar 메뉴를 유지한다. 홈의 Blog는 날짜 열과 제목 크기로 강약을 주고 Docs 영역만 옅은 배경으로 구분한다.

### 4-2. About 섹션 (`/about/`)

- 프로필, 직군, 스택을 한정하지 않는 소개 문구와 오구 이미지
- 기존 기술 스택, GitHub·LinkedIn·Email 링크
- 기존 GitHub·solved.ac 통계 이미지. 로딩 실패 항목은 숨긴다.
- ‘기록’에 Study Log·1일 1커밋 글 링크를 묶는다. 과거 날짜의 학습 목록을 미리보기로 노출하지 않는다.
- 댓글 없음

### 4-3. Blog 섹션 (`/blog/`)

실무 경험 및 기술적 시행착오를 기록하는 포스팅 공간 (기존 tech-log).

**frontmatter 규칙**
```yaml
---
title: 포스팅 제목
date: YYYY-MM-DD          # 최초 게시일 (starlight-blog 표시용), 마이그레이션 시 최초 커밋 날짜로 설정
lastUpdated: YYYY-MM-DD   # 수정 시 수동 갱신, 홈의 최근 기록 정렬 기준
tags: [Spring & JPA]      # 첫 번째 태그가 목록의 주 카테고리
---
```

**목록 페이지 (`/blog/`)**
- 제목·날짜·첫 번째 태그·description을 보여주는 행 목록
- 플러그인의 공개 데이터에서 게시 순서와 태그 URL을 사용
- 기존 5개 단위 페이지네이션, 태그·작성자 아카이브 URL 유지

**태그 구성** (기존 콘텐츠 기준)
- `Java` — Java 언어 심화
- `Spring & JPA` — Spring / JPA 실무 경험
- `MySQL` — MySQL 동작과 문제 해결
- `AI` — AI 도구 활용 경험

**개별 포스팅 페이지**
- 제목, 작성·수정일, 작성자와 태그
- 시리즈 제목·현재 순서와 펼칠 수 있는 전체 글 링크
- 본문 (마크다운), 기존 목차·앵커
- Giscus 댓글 (하단)

### 4-4. Docs 섹션 (`/docs/`)

**frontmatter 규칙**
```yaml
---
title: 문서 제목
date: YYYY-MM-DD          # 최초 작성일, 마이그레이션 시 최초 커밋 날짜로 설정
lastUpdated: YYYY-MM-DD   # 수정 시 수동 갱신, 랜딩 페이지 정렬 기준
---
```

CS 기초부터 실무 기술 스택까지 개념을 정리한 학습 레퍼런스 (기존 GitBook docs).

**레이아웃**
- 좌측 사이드바: 목록과 글 화면이 공유하는 분야·주제·섹션·문서 탐색
- 우측: 본문
- 상단: 전체 검색 (Starlight 기본 내장)

**탐색과 목록**
- `DOCS_GROUPS`의 분야 → 기술 주제 구조로 전체 목록을 표시한다.
- 분야는 세로로 이어지고 각 분야 안의 주제는 두 열로 배치한다. 서로 다른 분야를 같은 높이의 두 열에 맞추지 않는다. 모바일은 한 열로 표시한다.
- 주제 안에서는 `docsSections`의 하위 섹션 → 문서 순서를 사용한다. 시간 순으로 바꾸지 않는다.
- 목록에서는 제목 아래에 기존 frontmatter description을 기본 표시한다.
- 목록과 개별 글 모두 같은 위계의 사이드바를 사용한다. 현재 문서의 묶음은 열어두며 모바일 메뉴에서도 현재 링크가 보이게 한다.
- 개별 글에는 경로·작성/수정일·작성자를 표시한다. description은 목록·SEO 메타데이터에만 사용한다. 본문은 읽기 폭과 제목 크기를 조정하고 기존 코드·표·TOC·앵커를 유지한다.
- 헤더의 공통 테마 선택기는 자동·라이트·다크를 지원한다.

**사이드바 카테고리 구성**
`src/data/docsGroups.ts`의 10개 분야·20개 주제를 사용한다. 카테고리 이름과 분야 순서를 이 문서에 중복 정의하지 않는다.

**개별 문서 페이지**
- Docs·주제·중첩 목차로 돌아가는 경로 링크
- 본문 (마크다운)
- 기존 본문 TOC와 앵커
- Giscus 댓글 (하단)

---

## 5. 배포 스펙

- **Repository**: `hyoguoo/hyoguoo.github.io` 또는 현재 레포(`notes/blog`) 활용
- **트리거**: `main` 브랜치 push → GitHub Actions 자동 빌드 → GitHub Pages 배포
- **URL**: `hyoguoo.github.io`
- **커스텀 도메인**: 추후 도메인 구입 시 CNAME 파일 추가로 전환

---

## 6. 미결 사항

기술 진단의 남은 항목과 검증 한계는 [ARCHITECTURE.md](ARCHITECTURE.md)의 ‘현재 남은 항목’을 따른다.
