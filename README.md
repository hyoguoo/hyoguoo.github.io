# hyoguoo.log

개인 블로그 및 기술 문서 사이트.

**[hyoguoo.github.io](https://hyoguoo.github.io)**

## 섹션

| 섹션    | URL       | 설명                                   |
|---------|-----------|----------------------------------------|
| Landing | `/`       | 포트폴리오 메인                        |
| Blog    | `/blog/`  | 실무 경험, 트러블슈팅, 기술적 인사이트 |
| Docs    | `/docs/`  | CS 기초, Java, Spring 등 학습 레퍼런스 |
| About   | `/about/` | 소개                                   |

## 콘텐츠

모든 콘텐츠는 마크다운으로 작성되며 이 레포지토리에서 직접 관리됩니다.

- `src/content/docs/blog/` — 블로그 포스트
- `src/content/docs/docs/` — 카테고리별 문서

## 기술 스택

- **Framework**: [Astro](https://astro.build) + [Starlight](https://starlight.astro.build)
- **Blog plugin**: [starlight-blog](https://github.com/HiDeoo/starlight-blog)
- **Comments**:: [Giscus](https://giscus.app) (GitHub Discussions)
- **Analytics**:: Google Analytics
- **Deployment**:: GitHub Pages via GitHub Actions

## 커밋 컨벤션 (Commit Convention)

이 프로젝트는 다음과 같은 커밋 스코프 (Scope) 분류 체계를 따릅니다.

- `(portfolio)`: 포트폴리오 내용 작성 및 수정
- `(note)`: CS 지식, 스터디, 면접 대비 등 개인 학습 노트 작성
- `(post)`: 일반적인 블로그 포스팅 내용 작성
- `(inst)`: 개발 지침, 규칙, 명세서 등 가이드라인 문서 수정 (`CLAUDE.md`, `SPEC.md` 등)
- `(config)`: 프로젝트 환경 설정 및 패키지 변경 (`package.json`, `astro.config.mjs` 등)
- `(blog)`: 블로그 자체의 기능 개발, UI 추가, 전체적인 디자인 (CSS) 수정 등 시스템 변경
- `(etc)`: 위의 분류에 속하지 않는 자잘한 수정이나 기타 작업
