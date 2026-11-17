# 사이트 코드와 검증

이 사이트는 Astro의 정적 빌드 결과를 GitHub Pages에 배포한다. 서버 어댑터와 SSR은 사용하지 않는다. 기존 콘텐츠는 단일 `docs` 컬렉션으로 관리한다.

## 책임과 실행 환경

| 위치 | 책임 | 실행 시점 |
| --- | --- | --- |
| `src/data/` | 카테고리, 섹션, 시리즈, 블로그 설정, 포트폴리오 콘텐츠 | 빌드; 포트폴리오 데이터는 브라우저에서도 사용 |
| `src/lib/` | 날짜·URL, 블로그/문서 그룹핑, 메타데이터 이스케이프, 포트폴리오 해시 해석 | 순수 함수. DOM과 Astro 컬렉션에 의존하지 않음 |
| `src/build/` | YAML의 sitemap 날짜 추출, Starlight 플러그인 구성 | Node 빌드·개발 서버 |
| `src/components/`, `src/pages/` | 컬렉션 조회, HTML·메타데이터 렌더링, 브라우저 진입점 연결 | Astro frontmatter는 빌드, `<script>`는 브라우저 |
| `src/scripts/` | 테마, 저장소, Docs 활성 링크 위치, About 이미지 실패 처리, 분석·댓글·Mermaid 연동 | 브라우저 |
| `src/scripts/portfolio/` | SVG·패널 렌더링, 시나리오 재생, 입력 처리, 모션 | 브라우저; `main.ts`에서 초기화 순서 지정 |

`src/lib/`에서 `window`, DOM, 파일 시스템을 참조하지 않는다. 브라우저 코드에서 `astro:content`나 `src/build/`를 가져오지 않는다. 포트폴리오의 기존 데이터 문구와 수치는 유지하고 동작·타입을 수정한다.

## 테마와 외부 연동

- `ThemeProvider.astro`는 `theme-bootstrap.js`를 동기 인라인 스크립트로 넣어 첫 화면의 테마를 설정한다. 모듈 스크립트보다 먼저 실행되어야 한다.
- `theme.ts`가 Landing/About/Starlight의 선택기, 시스템 설정, 다른 탭의 변경을 동기화한다. `ThemePicker.astro`가 native select와 Starlight Icon을 렌더하고, `ThemeSelect.astro`가 Starlight 슬롯에 연결한다. Landing/About도 같은 선택기를 사용한다. 모바일 Starlight 헤더에는 선택기의 아이콘을 노출한다.
- `storage.ts`는 접근 자체가 차단된 저장소도 처리한다. 저장에 실패해도 현재 페이지의 선택은 유지한다.
- 포트폴리오는 기존 `pf-theme` 키와 system/light/dark 순서를 유지한다. 사이트 공통 테마는 기존 `starlight-theme` 키를 사용한다.
- `analytics.ts`는 production 빌드이면서 설정된 사이트의 호스트에서만 Google Analytics를 시작한다. localhost·LAN 미리보기와 개발 모드에서 전송하지 않는다.
- `giscus.ts`는 문서의 설정 속성을 읽고 iframe의 늦은 생성·로드와 테마 변경을 처리한다. 댓글 쓰기와 외부 알림은 검증에 포함하지 않는다.
- `mermaid.ts`는 해당 코드 블록이 있을 때 설치된 Mermaid를 동적 import한다. 테마 재렌더링은 직렬화하고, 실패 시 원본 코드를 남긴다. CDN에서 버전 미지정 코드를 직접 실행하지 않는다.

## Starlight와 블로그 호환 지점

블로그 플러그인이 `/blog/`, 페이지네이션, 태그, 작성자, RSS 경로를 소유한다. `blogIndexPlugin()`은 블로그 플러그인 다음에 실행하여 `MarkdownContent.astro`를 등록한다. Blog·페이지 번호·태그·작성자 목록은 `BlogArchive`, 개별 글은 플러그인의 공개 `MarkdownContent`, 나머지는 Starlight 렌더러를 사용한다. 별도 `/blog/` 페이지로 동일 경로를 덮어쓰지 않는다.

`BLOG_CONFIG`에서 페이지당 글 수와 기본 작성자를 함께 관리한다. 목록의 페이지 링크 수는 공개된 실제 글 수로 계산한다. `BlogArchive`는 `Astro.locals.starlightBlog.posts`의 공개 데이터와 태그 href를 사용해 기존 게시 순서·페이지 경계를 유지한다. Landing의 최신 목록은 수정일 정렬을 유지한다.

구조화 데이터는 `Head.astro`에서 관리한다. 플러그인의 중복 JSON-LD 생성은 `structuredData: false`로 비활성화한다. boolean `lastUpdated`는 날짜로 변환하지 않는다. JSON-LD의 `<`와 제목의 HTML을 이스케이프한다.

`src/pages/404.astro`가 GitHub Pages용 `/404.html`을 생성한다. Starlight 기본 404 라우트는 중복 생성하지 않는다. 기존 잘못된 상대 링크 3곳은 Astro의 정적 리다이렉트로 복구했다. GitHub Pages는 서버 리다이렉트 대신 HTML의 refresh를 사용한다.

업그레이드 시 다음을 확인한다.

- `MobileMenuFooter.astro`, `Sidebar.astro`, `docs-navigation.ts`: Starlight sidebar pane의 스크롤·native popover toggle 연결
- `ThemePicker.astro` / `ThemeSelect.astro`: native select·Icon과 헤더/모바일 메뉴 연결
- `custom.css`: `sl-blog-*` 클래스, 제목·메타데이터, 본문·목차 폭, 모바일 목차 높이
- `tests/fixtures/routes.json`: 이 리팩터링 전 경로의 보존 기준. 새 문서를 추가할 때 기존 경로를 임의로 삭제하지 않는다. RSS는 현재 게시글 frontmatter의 제목·URL·게시일과 최신순 정렬을 검증하고, Docs 목록과 시리즈는 설정 파일의 링크 순서와 대조한다.

## 검증 명령

설치와 실행 명령은 [README.md](README.md)를 따른다. `npm run check`는 Astro와 TypeScript를 검사하고 hint도 실패로 취급한다. 기존 `@ts-nocheck`는 제거했다. `npm test`는 순수 로직을, `npm run test:browser`는 실제 빌드 결과를 검증한다.

브라우저 테스트는 독립 preview 서버를 시작하고 종료한다. Astro 7의 에이전트 자동 백그라운드 실행과 기존 서버 lock에 영향을 받지 않도록 `--ignore-lock`을 사용한다. 테스트 서버의 포트는 4399이다. 외부 댓글·이미지·폰트는 결정적인 응답으로 대체하며, 실서비스 확인은 별도로 수행한다. Chromium 이외의 엔진은 이 테스트에 포함하지 않는다.

`npm run audit:links`는 생성된 HTML의 canonical, 내부 링크·리소스·앵커, 리다이렉트 대상을 검사한다. Google 소유권 확인 파일은 일반 페이지 메타데이터 검사 대상이 아니다. 실패를 숨기거나 자동으로 무시하지 않는다.

## 현재 남은 항목

- `oltp-vs-olap.md`가 참조하는 `/docs/large-scale-system/data-warehousing-and-etl/` 문서가 없다. 기존 글과 frontmatter 보존 조건에 따라 본문은 수정하지 않았다. `npm run audit:links`는 이 링크를 보고하고 종료 코드 1을 반환한다. 대상 문서를 작성하거나 편집자가 링크를 변경해야 한다.
- Mermaid의 ELK 및 공유 라이브러리 청크가 Vite의 500 kB 경고 기준을 넘는다. Mermaid는 다이어그램을 사용하는 페이지에서만 로드한다. 경고 기준 변경이나 로그 필터는 적용하지 않았다. 향후 레이아웃 기능 범위를 정한 후 별도 경량화를 검토한다.
- 댓글이 없는 경로에서 실서비스 Giscus discussion API의 404 응답을 관찰했다. 댓글 생성·로그인·작성과 Google Analytics 수신은 실행하지 않았다.
- `SPEC.md`의 포트폴리오·배포 등 이번 디자인 변경 밖의 기능 설명은 전체 재검증하지 않았다.

## 2026-11-14 검증 기록

macOS에서 Node 22.23.5와 26.13.1, Chromium으로 확인했다. GitHub Actions의 Linux 실행과 실제 배포는 수행하지 않았다.

| 검사 | 기준 상태 | 변경 후 |
| --- | --- | --- |
| Astro·TypeScript | 오류 17개, hint 3개 | 오류·워닝·hint 0개 |
| 단위 테스트 | 구성 없음 | 7개 통과 |
| 브라우저 회귀 테스트 | 구성 없음 | 10개 통과 |
| 보안 감사 | 취약 패키지 23개 | 0개 |
| 기존 HTML 경로 | 445개 | 모두 유지, 리다이렉트 3개 추가 |
| RSS 최근 항목 | 20개 | 제목·URL·게시일 유지 |
| Mermaid 문법 | 검사 없음 | 생성된 472개 블록 통과 |
| 전체 링크 검사 | 잘못된 내부 참조 4개 | 미작성 문서 참조 1개, 종료 코드 1 |

`npm ci`와 Node 22의 `npm run validate`가 통과했다. 빌드에는 위 Mermaid 크기 경고가 남는다. npm 11.20.0은 macOS 선택 의존성 `fsevents`의 install script에 대한 allowScripts 안내도 출력했다. 이를 숨기거나 실행 허용 정책을 바꾸지 않았다.

화면은 데스크톱 1440px 다크 모드의 Landing·About·Blog·Docs·카테고리·개별 글·포트폴리오 8곳, 모바일 390px 라이트 모드의 Blog·Docs를 변경 전후 비교했다. Docs 폭과 Blog 목록 간격·모바일 목차 여백을 기존 값으로 복원했다. Firefox·Safari 전체 동작과 PDF 전체 내보내기는 검증하지 않았다. 개발 서버 기동 및 개발 모드의 Mermaid 렌더링·분석 스크립트 비활성화는 확인했다.

## 승인된 목록과 글 화면 반영

- `SITE_PROFILE`는 스택에 한정하지 않는 직군·소개 문구의 단일 설정이다.
- `ContentPreview`는 홈과 모든 Blog 목록의 날짜·태그·설명·글 링크를 렌더한다. `CategoryTag`의 색상은 기존 `TAG_HUES`를 따른다.
- `LinkList`는 Docs 문서·주제의 제목과 frontmatter description을 기본 표시한다. `groupDocs`가 기존 섹션 순서를 유지하고, `docsCatalog`는 날짜가 있는 문서만 집계해 중첩 목차 페이지를 중복으로 세지 않는다.
- `DocsNavigation`은 목록·개별 글 모두 분야 → 주제 → 섹션 → 문서 순서로 탐색한다. `docsNavigationSections`가 목록과 같은 섹션 순서를 사용하고, 책의 하위 문서를 숫자가 포함된 ID 순으로 정렬한다. 현재 글의 상위 details는 빌드 시 열고, 과거 sessionStorage의 접힘 상태로 덮어쓰지 않는다. 중첩 목차의 챕터 TOC는 유지한다.
- `docs-navigation.ts`는 sidebar pane만 스크롤해 현재 링크를 보여준다. 모바일 native popover가 열릴 때도 적용하고, custom element가 분리될 때 toggle 리스너를 해제한다.
- `Head`는 빌드 데이터로 `data-article`을 설정한다. `custom.css`는 Docs/Blog 글에만 본문 폭·제목 크기를 적용한다. `PageTitle`의 경로와 `EntryMeta`의 작성·수정일·작성자 한 줄이 본문 헤더를 구성한다. 개별 글의 description은 헤더에 반복하지 않고 목록·SEO 메타데이터에 유지한다.
- `BlogSeries`는 native details로 제목·현재 순서를 먼저 표시하고 전체 시리즈 링크를 펼친다. 본문·시리즈 순서·개별 URL은 바꾸지 않는다.
- `interactions.css`는 공통 행의 배경·제목·화살표 피드백을 관리한다. 세로 강조선과 자동 진입 애니메이션은 사용하지 않으며, `prefers-reduced-motion`에서는 이동·전환을 끈다.
- About에는 실제 통계 이미지와 기존 기록 링크 두 개를 표시한다. 외부 이미지가 실패하면 기존 실패 처리로 해당 항목을 숨긴다. 학습 날짜·이력과 글 본문은 변경하지 않는다.

이번 검증은 Node 22.23.5·26.13.1과 Chromium에서 실행했다. Node 최소 버전·의존성·GitHub Pages의 SSG 배포 방식은 바꾸지 않는다.


검증 결과: Node 26.13.1 및 22.23.5에서 `npm run validate` 통과(Astro·TypeScript 오류/워닝/hint 0개, 단위 테스트 9개, 브라우저 테스트 18개). 기존 HTML 경로·RSS·sitemap 회귀 검사가 통과했고, 전체 링크 검사는 기존 미작성 문서 링크 1곳으로 종료 코드 1을 유지했다. `npm audit` 취약점은 0개이다. 라이트 테마 메뉴의 잘못된 gray-5/black 지정은 Starlight의 테마별 시맨틱 색상으로 교정하고, 기본·호버 명암 대비를 검사한다.

화면은 데스크톱 다크의 홈·About·Blog·Docs·Docs 주제 목록을 변경 전후 비교했다. About 통계 이미지는 동일한 실제 응답을 사용했고 SVG 등장 효과가 끝난 후 확인했다. 글 화면은 Docs Basic·Class·중첩 책 문서와 Blog 시리즈 글을 확인했다. Docs Basic의 다크 변경 전후와 라이트 화면을 비교했다. 모바일은 390px 및 320px에서 목록·설명·기록 링크·테마 컨트롤, 문서 메뉴·코드·표와 가로 넘침을 확인했다. Firefox·Safari의 전체 시각 검증과 실제 게시·배포는 수행하지 않았다.

## 2026-11-15 공통 헤더와 목록 정돈

- `SiteHeader`가 홈·About·Blog·Docs의 로고·검색·네비게이션·테마를 렌더한다. `Header`와 `PageLayout`은 같은 헤더에 연결한다. 개별 문서의 native sidebar 메뉴와 홈/About/Blog 목록의 `SiteMobileMenu`를 구분하며, 후자는 기존 Blog 메뉴를 공통화한 것이다. 검색 클릭은 캡처 단계에서 바깥 클릭으로 처리해 열린 사이트 메뉴도 닫는다. 분리 시 AbortController로 이벤트를 해제한다.
- `SiteSearch`는 공개 Starlight Search를 그대로 사용한다. 전역 번역 초기화는 모든 라우트에서 실행되므로 커스텀 페이지에서 가짜 starlightRoute를 만들지 않는다. 두 레이아웃의 검색 색상·유틸리티를 연결하고 `PageLayout`의 head에 같은 CSS 레이어 순서를 선언한다. reset이 뒤에서 로드되어도 검색 모달이 중앙에 놓이도록 검사한다.
- `ContentPreview`의 editorial 배치는 날짜 열과 배경 없는 카테고리 색상 글자를 사용한다. 홈은 첫 글 제목을 더 크게 하고 Docs 영역만 옅은 면으로 구분한다. 기존 홈 3/4개·수정일 정렬, Blog의 게시 순서·페이지·태그 URL은 유지한다.
- `DocsTree`는 10개 분야를 세로로 이어 각 분야 안의 20개 주제를 배치한다. 분야 내부는 두 열, 모바일은 한 열이다. 하위 섹션 순서와 모든 문서 링크는 기존 데이터를 사용한다.
- 본문은 제목과 날짜 사이 간격·날짜 크기를 조정하고, 구분선을 읽기 폭 안에 둔다. 글 본문·frontmatter·이미지, 의존성·최소 Node 버전과 SSG/GitHub Pages 방식은 변경하지 않는다.

검증 범위는 기존 회귀 검사와 공통 헤더의 같은 로고 배치, 홈/About 검색 결과·모달 위치, 모바일 메뉴의 Escape·바깥 클릭·재연결, 검색과 메뉴 전환, 800/390/320px 제어 요소 겹침, Docs 분야 배치이다. 실제 빌드 화면은 1440px 다크의 홈·About·Blog·Docs·Cache 글을 비교하고 홈 검색 모달, 390px 홈·Docs·문서·사이트 메뉴, 라이트 Docs를 확인했다. 외부 댓글·통계·폰트는 브라우저 회귀 검사에서 대체 응답을 사용한다. 실제 댓글 작성, Firefox·Safari 및 GitHub Actions 배포는 검증하지 않았다.

Node 26.13.1·22.23.5에서 `npm run validate`가 통과했다. Astro·TypeScript 오류/워닝/hint는 0개, 단위 테스트 9개와 브라우저 테스트 21개가 통과했다. `npm audit`는 취약점 0개이며, 전체 링크 검사는 기존 미작성 문서 참조 1곳으로 종료 코드 1을 유지한다. Mermaid의 500 kB 초과 청크 경고도 그대로 남는다.
