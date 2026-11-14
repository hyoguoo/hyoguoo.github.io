---
name: structure
description: "사이트 구조, CSS 아키텍처, 컴포넌트 역할과 Starlight 업그레이드 영향도를 확인한다."
---

# /structure — 사이트 구조와 책임

새 UI를 추가하거나 레이아웃·컴포넌트·Starlight 호환 지점을 확인할 때 사용한다. 실행 환경, 검증 명령과 남은 항목은 루트 `ARCHITECTURE.md`를 함께 읽는다.

## 라우트와 렌더링

이 사이트는 Astro SSG이며 GitHub Pages로 배포한다. 콘텐츠는 단일 `docs` 컬렉션이다.

| 영역 | 위치 | 렌더링 |
| --- | --- | --- |
| 홈 `/` | `src/pages/index.astro` | `PageLayout` + 최근 Blog 3개·Docs 4개 |
| About `/about/` | `src/pages/about/index.astro` | `PageLayout` + 프로필·Skills·Stats·기록 링크 |
| Blog·태그·작성자·페이지 번호 | starlight-blog 라우트 | `MarkdownContent` → `BlogArchive` |
| Blog 개별 글 | `src/content/docs/blog/` | 플러그인의 공개 `MarkdownContent` |
| Docs 전체 목록 | `src/content/docs/docs/index.mdx` | `DocsTree` |
| Docs 주제 목록 | `src/content/docs/docs/<key>/index.mdx` | `SubcategoryPage` → `LinkList` |
| Docs 개별 글·중첩 목차 | `src/content/docs/docs/` | Starlight의 본문·목차 |

`src/pages/blog/index.astro`는 없다. `src/build/blog-index-plugin.ts`가 플러그인 다음에 MarkdownContent 오버라이드를 등록한다. 라우트 소유권을 별도 Astro 페이지로 덮어쓰지 않는다.

## 공통 UI

| 파일 | 책임 |
| --- | --- |
| `PageLayout.astro` | 홈/About의 head·공통 헤더 연결·footer |
| `SiteHeader.astro` | 모든 영역의 같은 로고·검색·네비게이션·테마 배치 |
| `SiteSearch.astro` | 기존 Starlight 검색 재사용과 두 레이아웃의 검색 색상·유틸리티 연결 |
| `SiteMobileMenu.astro` | 홈/About/Blog 목록 메뉴·Escape·바깥 클릭·리스너 정리 |
| `ThemePicker.astro` | native 자동·라이트·다크 선택기와 Icon |
| `ThemeSelect.astro` | ThemePicker를 Starlight 슬롯에 연결 |
| `ContentPreview.astro` | 홈·Blog 목록의 날짜 열·색상 글자·제목·description과 작은 Docs 행 |
| `CategoryTag.astro` | 기존 TAG_HUES를 따르는 작은 라벨 |
| `BlogArchive.astro` | 플러그인의 공개 게시 데이터와 태그 href, 5개 단위 페이지 |
| `DocsTree.astro` | 분야를 세로로 잇고 각 분야 안에서 주제·설명·섹션을 두 열로 배치 |
| `DocsNavigation.astro` | Docs 목록·글의 분야·주제·섹션·중첩 책 문서 탐색 |
| `SubcategoryPage.astro` | docsSections 순서에 따른 하위 섹션·문서 |
| `LinkList.astro` | Docs의 제목·기존 description·링크 |
| `EntryMeta.astro` | 개별 글의 게시/수정일·작성자 |
| `BlogSeries.astro` | native details로 기존 시리즈의 순서·현재 글 탐색 |

About은 Study Log·1일 1커밋 글 링크만 표시한다. 과거 날짜의 학습 목록이나 추정한 활동을 미리보기에 추가하지 않는다.

## 데이터와 순수 로직

- `siteProfile.ts`: 기술 스택을 한정하지 않는 직군·소개 문구.
- `tagColors.ts`: 태그 hue와 Blog 주 카테고리 순서. 첫 번째 태그가 주 카테고리이다.
- `docsGroups.ts`: 분야 → 주제 구조. `docsSections.ts`: 주제 → 하위 섹션 → 문서 순서.
- `blogConfig.ts`: 블로그 페이지 크기·작성자. RSS·태그·작성자 URL은 플러그인이 관리한다.
- `lib/blog.ts`: 공개 게시 데이터의 필터·기존 페이지 경계 계산. 자체 태그 slug를 만들지 않는다.
- `lib/docs.ts`: 기존 섹션 순서·미배정 문서 처리, 날짜 있는 글만 세는 주제별 집계와 sidebar의 중첩 문서 순서. 중첩 목차를 글 수에 중복 집계하지 않는다.
- `lib/content.ts`: 날짜·URL. 홈은 수정일, Blog 아카이브는 플러그인의 게시 순서를 따른다.

새 Docs 주제는 `/section` skill에 따라 그룹·섹션·sidebar·index를 함께 갱신한다. 학습 로드맵을 UI 탐색 대신 새로 만들지 않는다.

## CSS와 브라우저 경계

`tokens.css`는 원시 색상 값, `pages.css`는 홈/About 변수와 레이아웃, `custom.css`는 Starlight 변수와 호환 지점을 관리한다. `interactions.css`는 두 레이아웃이 공유하는 행 배경·제목·화살표의 짧은 피드백을 관리한다. 세로 강조선·자동 진입 애니메이션은 쓰지 않으며, 모션 감소 설정을 따른다.

`ThemeProvider.astro` + 동기 `theme-bootstrap.js`가 첫 화면을 설정하고, `scripts/theme.ts`가 선택기·저장소·시스템 변경을 동기화한다. 브라우저 코드에서 Astro 컬렉션·빌드 모듈을 import하지 않는다. Giscus·분석·Mermaid는 각각의 `src/scripts/` 모듈이 담당한다.

## 오버라이드와 업그레이드 확인

- `Header.astro`: SiteHeader에 연결하고, 사이트 메뉴와 기존 Starlight 문서 sidebar 메뉴를 구분한다.
- `SiteSearch.astro`: Starlight의 전역 번역 초기화와 공개 Search 컴포넌트에 의존한다. 커스텀 페이지에서 starlightRoute를 읽지 않는다. 검색 엔진·키보드·모달 동작은 복제하지 않는다.
- `PageLayout.astro`의 head는 Starlight와 같은 CSS 레이어 순서를 먼저 선언한다. 이를 빼면 뒤에 로드된 reset이 검색 모달의 중앙 배치를 덮을 수 있다. 업그레이드 시 설치된 Starlight의 layers.css 순서와 함께 확인한다.
- `Sidebar.astro`: Docs 목록·개별 글 모두 DocsNavigation. 현재 글의 상위 details는 SSR에서 열고, docs-navigation.ts가 sidebar pane만 스크롤한다. 분리 시 toggle 리스너를 해제한다.
- `PageTitle.astro`: 목록의 제목·설명·문서 수와 개별 글의 경로·간결한 메타데이터·접이식 시리즈. 글 헤더에는 description을 반복하지 않으며 목록·SEO에 유지한다. 백틱 제목 이스케이프 유지.
- `Pagination.astro`: 의도적으로 빈 파일. 블로그의 페이지 번호는 BlogArchive가 렌더한다.
- `Footer.astro`: 날짜 있는 Blog·Docs 글만 댓글, Docs 글만 태그. About·각종 인덱스에는 댓글 없음.
- `ThemeSelect.astro`는 제거하지 않는다. 플러그인의 기본 오버라이드가 주입하는 Blog 링크를 막는다.
- `MobileMenuFooter.astro`, `custom.css`: Starlight 내부 클래스·header 여백·sidebar/TOC 폭에 의존한다.

화면 변경 후 `npm run validate`로 URL·RSS·메타데이터·검색·Mermaid·공통 UI를 확인한다. 실제 검사 범위와 남은 한계는 ARCHITECTURE.md에 기록한다.
