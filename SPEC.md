# Blog 프로젝트 스펙

> 최종 업데이트: 2026-02-25

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
├── /                    ← 포트폴리오 랜딩 페이지
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
│   ├── content/
│   │   ├── docs/                 ← /notes/docs/ 마이그레이션
│   │   └── blog/                 ← /notes/tech-log/posts/ 마이그레이션
│   ├── pages/
│   │   ├── index.astro           ← 포트폴리오 메인 랜딩
│   │   └── about/                ← /notes/about/posts/ 마이그레이션
│   └── components/
│       └── Giscus.astro          ← 댓글 컴포넌트
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

방문자가 사이트 전체를 빠르게 파악할 수 있는 단순한 허브 페이지.

**구성 (위→아래)**

1. **Hero**: 이름 + 한 줄 소개 (Backend Developer, Java & Spring) + About / GitHub 링크
2. **최신 블로그 포스팅**: tech-log 최신 글 3개 카드 리스팅 (제목, 날짜, 태그) — frontmatter의 `lastUpdated` 기준 정렬 (수동 입력)
3. **최신 Docs**: docs 최근 수정 문서 3개 카드 리스팅 (제목, 카테고리) — 각 문서 frontmatter의 `lastUpdated` 기준 정렬 (수동 입력)
4. **섹션 안내**: Blog / Docs / About 각 섹션 한 줄 설명 + 링크

**원칙**
- 스크롤 최소화, 과도한 애니메이션 없음
- 각 카드는 해당 글로 바로 이동

### 4-2. About 섹션 (`/about/`)

단일 페이지. 다른 개발자 블로그의 "About Me" 페이지와 동일한 형태.

- 프로필 (이름, 직군 소개)
- 기술 스택
- GitHub / 연락처 링크
- 기존 about 포스팅 (why-developer, study-log 등)은 별도 페이지로 링크 또는 동일 페이지 내 섹션으로 편입
- 댓글 없음 (단순 소개 페이지)

### 4-3. Blog 섹션 (`/blog/`)

실무 경험 및 기술적 시행착오를 기록하는 포스팅 공간 (기존 tech-log).

**frontmatter 규칙**
```yaml
---
title: 포스팅 제목
date: YYYY-MM-DD          # 최초 게시일 (starlight-blog 표시용), 마이그레이션 시 최초 커밋 날짜로 설정
lastUpdated: YYYY-MM-DD   # 수정 시 수동 갱신, 목록 및 랜딩 페이지 정렬 기준
tags: [Spring, JPA]
---
```

**목록 페이지 (`/blog/`)**
- 포스팅 카드 리스팅 (제목, 날짜, 태그, 요약 1~2줄) — `lastUpdated` 기준 정렬
- 태그 필터링
- 페이지네이션

**태그 구성** (기존 콘텐츠 기준)
- `Payment` — 결제 시스템 구현 경험 시리즈
- `Java` — Java 언어 심화
- `Spring` — Spring / JPA 실무 팁
- `Database` — MySQL 등 DB 관련
- `Architecture` — 설계, 패턴

**개별 포스팅 페이지**
- 제목, 날짜, 태그
- 본문 (마크다운)
- 이전 글 / 다음 글 네비게이션
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
- 좌측 사이드바: 카테고리 트리 네비게이션 (Starlight 기본)
- 우측: 본문
- 상단: 전체 검색 (Starlight 기본 내장)

**사이드바 카테고리 구성** (기존 폴더 구조 그대로)
- Computer Architecture
- Operating System
- Network
- Secure
- Java
- Spring
- OOP
- MySQL
- Redis
- Kafka
- Docker
- Large-Scale System
- Test
- AI-Assisted Development
- Setting

**개별 문서 페이지**
- 브레드크럼 네비게이션 (Starlight 기본)
- 본문 (마크다운)
- 이전 / 다음 문서 네비게이션 (Starlight 기본)
- Giscus 댓글 (하단)

---

## 5. 배포 스펙

- **Repository**: `hyoguoo/hyoguoo.github.io` 또는 현재 레포(`notes/blog`) 활용
- **트리거**: `main` 브랜치 push → GitHub Actions 자동 빌드 → GitHub Pages 배포
- **URL**: `hyoguoo.github.io`
- **커스텀 도메인**: 추후 도메인 구입 시 CNAME 파일 추가로 전환

---

## 6. 미결 사항

> 현재 없음
