# hyoguoo.log

개인 블로그 및 기술 문서 사이트.

**[hyoguoo.github.io](https://hyoguoo.github.io)**

## 섹션

| 섹션    | URL       | 설명                                   |
|---------|-----------|----------------------------------------|
| Landing | `/`       | 최근 Blog·Docs를 보여주는 개인 블로그 홈 |
| Blog    | `/blog/`  | 실무 경험, 트러블슈팅, 기술적 인사이트 |
| Docs    | `/docs/`  | CS 기초, Java, Spring 등 학습 레퍼런스 |
| About   | `/about/` | 소개                                   |

## 로컬 실행과 검증

Node **22.23.4 이상**과 npm 9.6.5 이상이 필요합니다. `.nvmrc`와 GitHub Actions는 Node 22.23.5를 사용합니다.

```sh
nvm use
npm ci
npx playwright install chromium
npm run dev
```

```sh
npm run check         # Astro·TypeScript, hint 포함 검사
npm test              # 순수 로직 회귀 테스트
npm run build         # GitHub Pages용 dist/ 생성
npm run test:browser  # 빌드 결과의 UI·URL·메타데이터·RSS·검색·Mermaid 검증
npm run audit:links   # 전체 HTML 내부 링크·앵커·리소스·canonical 검사
npm audit             # 개발 도구를 포함한 의존성 보안 감사
```

`npm run validate`는 check → 단위 테스트 → build → 브라우저 테스트를 실행합니다. 링크 검사는 별도로 실행하며, 현재 미작성 문서 참조 1곳 때문에 종료 코드 1을 반환합니다. `preview`는 개발 서버 포트인 4322를 사용합니다. 독립 서버가 필요한 자동화에서는 `--ignore-lock`을 지정합니다.

책임 경계, 업그레이드 시 확인할 지점과 남은 진단은 [ARCHITECTURE.md](ARCHITECTURE.md)에 정리했습니다.

## 화면과 소개 문구

- 홈은 최근 Blog 3개·Docs 4개를 보여줍니다. 전체 탐색은 각 목록 페이지로 이동합니다.
- `SiteHeader.astro`가 홈·About·Blog·Docs의 로고·검색·네비게이션·테마를 통일합니다. 검색은 기존 Starlight/Pagefind를 재사용합니다. 개발 모드에서는 기본 안내가 나오며, 실제 검색은 빌드 후 preview에서 확인합니다.
- 홈과 Blog 목록은 날짜를 별도 열로 두고, 홈의 Docs 영역만 옅은 면으로 구분합니다. Docs 전체 목록은 분야를 세로로 잇고 분야 내부의 주제를 두 열로 표시합니다. 모바일에서는 한 열로 이어집니다.
- Docs는 목록과 글 화면 모두 `docsGroups.ts`의 분야·주제와 `docsSections.ts`의 하위 섹션·문서 순서를 유지합니다. 설명은 기존 frontmatter에서 가져옵니다. 현재 글이 속한 묶음은 열어두며, 중첩 책의 목차·문서 링크도 제공합니다.
- 글의 제목·본문 폭은 `custom.css`의 `data-article` 범위에서 조정합니다. 작성·수정일은 간결하게 표시하고, Blog 시리즈 전체 목록은 펼쳐서 볼 수 있습니다.
- Blog 목록은 플러그인의 게시 순서·태그 URL·5개 단위 페이지를 사용합니다. 홈의 최근 기록은 수정일 기준입니다.
- About의 ‘기록’은 Study Log·1일 1커밋 글 링크만 표시합니다. 연도별 활동 미리보기는 만들지 않습니다.
- 소개 문구와 직군은 `src/data/siteProfile.ts`, 태그 색상은 `src/data/tagColors.ts`에서 관리합니다.
- `ThemePicker.astro`를 custom page와 Starlight가 공유합니다. 테마 저장·시스템 설정 처리는 `src/scripts/theme.ts`가 담당합니다.

## 콘텐츠

모든 콘텐츠는 마크다운으로 작성되며 이 레포지토리에서 직접 관리됩니다.

- `src/content/docs/blog/` — 블로그 포스트
- `src/content/docs/docs/` — 카테고리별 문서

## 기술 스택

- **Framework**: [Astro](https://astro.build) + [Starlight](https://starlight.astro.build)
- **Blog plugin**: [starlight-blog](https://github.com/HiDeoo/starlight-blog)
- **Comments**: [Giscus](https://giscus.app) (GitHub Discussions)
- **Analytics**: Google Analytics
- **Deployment**: GitHub Pages via GitHub Actions

## AI 에이전트 지침

공통 지침은 [`AGENTS.md`](AGENTS.md), 프로젝트 스킬은 `.agents/skills/`에서 관리합니다.

## 커밋 컨벤션 (Commit Convention)

이 프로젝트는 다음과 같은 커밋 스코프 (Scope) 분류 체계를 따릅니다.

- `(portfolio)`: 포트폴리오 내용 작성 및 수정
- `(note)`: CS 지식, 스터디, 면접 대비 등 개인 학습 노트 작성
- `(post)`: 일반적인 블로그 포스팅 내용 작성
- `(inst)`: 개발 지침, 규칙, 명세서 등 가이드라인 문서 수정 (`AGENTS.md`, `SPEC.md` 등)
- `(config)`: 프로젝트 환경 설정 및 패키지 변경 (`package.json`, `astro.config.mjs` 등)
- `(blog)`: 블로그 자체의 기능 개발, UI 추가, 전체적인 디자인 (CSS) 수정 등 시스템 변경
- `(etc)`: 위의 분류에 속하지 않는 자잘한 수정이나 기타 작업
