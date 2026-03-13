# Blog 프로젝트 컨텍스트 (Gemini CLI 전용)

이 파일은 Gemini CLI가 이 프로젝트에서 작업을 수행할 때 필요한 모든 규칙을 담고 있는 **독립적인 지침서**이다. `CLAUDE.md`의 구조를 따르며, Gemini의 동작 방식에 최적화된 가이드라인을 제공한다.

## 기술 스택

- **프레임워크**: Astro + Starlight (Astro 공식 문서 프레임워크)
- **블로그**: starlight-blog 플러그인
- **댓글**: Giscus (GitHub Discussions 기반)
- **배포**: GitHub Pages (GitHub Actions)
- **통계**: Google Analytics

## 사이트 구조 (요약)

| 섹션 | URL | 레이아웃 |
|------|-----|---------|
| 랜딩 | `/` | 커스텀 Astro (Starlight 없음) |
| Blog | `/blog/` | Starlight + starlight-blog |
| Docs | `/docs/` | Starlight |
| About | `/about/` | 커스텀 Astro (Starlight 없음) |

콘텐츠는 **단일 `docs` 컬렉션**(`src/content/docs/`)으로 관리하며, `blog/`와 `docs/` 디렉토리로 구분한다.

## 파일 구조 (핵심)

```
src/
├── content/docs/
│   ├── blog/        ← Blog 포스트 (images/<slug>/ 포함)
│   └── docs/        ← Docs 문서 (서브카테고리별 디렉토리)
├── components/      ← Starlight 오버라이드 및 커스텀 컴포넌트
├── data/
│   ├── docsGroups.ts    ← DocsTree 시각적 그루핑 (10개 그룹)
│   └── docsSections.ts  ← Docs 서브카테고리별 섹션 및 slug 설정
└── styles/
    ├── tokens.css   ← 원시 색상 토큰 (단일 진실 원천)
    └── custom.css   ← Starlight CSS 변수 오버라이드
```

## Frontmatter 규칙

**Blog** (`src/content/docs/blog/*.md`)
- `tags`: 첫 번째 태그가 그룹핑 카테고리 기준이 됨.
- `lastUpdated`: 수정 시 반드시 오늘 날짜(YYYY-MM-DD)로 갱신.

**Docs** (`src/content/docs/docs/**/*.md`)
- `tags`: 최상위 디렉토리명 기준 (예: `java` → `[Java]`).
- `description`: 40~100자 사이의 핵심 요약 문장 필수 작성.
- `lastUpdated`: 수정 시 반드시 오늘 날짜(YYYY-MM-DD)로 갱신.

## 제목 컨벤션

**영문만 사용**, 한글 병기 금지.

- **약어**: 풀네임을 괄호 안에 추가 (예: `AOP (Aspect-Oriented Programming)`).
- **공식 표기**: `@Transactional`, `Redis`, `MySQL` 등 기술명은 공식 표기 준수.
- **주요 약어**: AOP, CAS, CORS, DNS, HTTP/HTTPS, JDBC, JPA, JWT, JVM, OAuth, SpEL, URI.

## 콘텐츠 작성 가이드 (`/writing` 핵심)

- **볼드(`**`) 사용 금지**: 본문 내 강조를 위한 볼드 처리를 절대 하지 않는다.
- **문체**: 모든 문장은 `~다.` 또는 명사형으로 종결한다 (`~합니다` 등 경어체 금지).
- **문장 분리**: 한 줄에 한 문장 원칙을 준수하며, 길어지면 대시(`-`) 리스트로 분리한다.
- **리스트 종결**: 대시 리스트 항목은 명사형으로 끝낸다 (예: `~함`, `~임`).

## 내부 링크 및 이미지 형식

- **내부 링크**: 반드시 **절대 경로**를 사용한다 (`/blog/<slug>/`, `/docs/<category>/<slug>/`).
- **이미지 경로**:
  - Blog: `src/content/docs/blog/images/<slug>/`
  - Docs: `src/content/docs/docs/<category>/image/`

## Skills (프로젝트 전용)

| Skill | 자동 호출 조건 |
|-------|-------------|
| `/status` | 세션 시작 시, 현재 작업 진행 상황 질문 시 |
| `/verify` | 스펙 준수 여부 및 빌드 가능성 확인 요청 시 |
| `/add [문서]` | 새 게시글(Blog) 또는 기술 문서(Docs) 추가 시 |
| `/description` | description 작성·추가·점검 요청 시 |
| `/writing` | 문서 콘텐츠 작성·수정 시 (컨벤션 준수 필요 시) |
| `/enhance` | 기존 문서의 설명 완결성 및 구체성 보강 요청 시 |

- **스킬 우선순위**: 모든 콘텐츠 작성·수정 시 `/writing` 컨벤션을 최우선으로 준수한다.
- **스킬 위치**: 상세 가이드라인은 `.claude/skills/` 디렉토리에 정의되어 있다.

## 주요 작업 원칙

- **Surgical Updates**: `replace` 툴을 활용하여 필요한 부분만 정밀하게 수정한다.
- **설정 동기화**: 새 문서 추가 시 `docsSections.ts` 및 `docsGroups.ts`를 반드시 업데이트한다.
- **Mermaid 레이아웃**: 수평 배치가 필요한 경우 HTML `flex` div로 감싸 시각적 가독성을 높인다.
- **커밋 메시지**: 영문 기반의 `type: description` 형식을 사용하며 "Why"에 집중한다.
