# /migrate - 마크다운 frontmatter 변환 및 콘텐츠 이전

## Triggers
- "마이그레이션", "변환", "이전" 요청 시
- `_import/` 파일을 Starlight 형식으로 변환할 때

## Arguments
`$ARGUMENTS` — 변환할 소스 경로 (생략 시 아래 기본 경로 전체 처리)

## Source / Target 경로 매핑
| 소스 | 타겟 | 타입 |
|------|------|------|
| `_import/tech-log/posts/` | `src/content/docs/blog/` | Blog |
| `_import/docs/` | `src/content/docs/docs/` | Docs |
| `_import/about/posts/` | `src/content/docs/about/` | About |

> **Note**: Starlight의 `src/content/docs/`는 URL 루트 `/`에 매핑됨.
> - Blog: `src/content/docs/blog/post.md` → `/blog/post/`
> - Docs: `src/content/docs/docs/java/class.md` → `/docs/java/class/`
> - About: `src/content/docs/about/why-developer.md` → `/about/why-developer/`
> - `blog/`, `docs/`, `about/`가 `src/content/docs/` 안의 형제 디렉토리로 구성됨
>
> ⚠️ **About은 `src/pages/`가 아닌 `src/content/docs/about/`에 배치한다.**
> `src/pages/*.md`는 Astro v4에서 로컬 이미지를 지원하지 않아 `ImageNotFound` 오류 발생.

## 절대 원칙: 본문 내용 수정 금지 (단, H1 제외)

**frontmatter 블록(`--- ... ---`)만 교체한다. 그 아래 본문은 단 한 글자도 바꾸지 않는다.**

- H1 헤딩은 title 추출에 참조한 뒤 **본문에서 제거한다**
  - Starlight가 frontmatter `title`을 H1으로 렌더링하므로 본문 H1이 남아있으면 제목이 중복된다
  - H1 바로 뒤의 빈 줄도 함께 제거한다
- 코드블록, 링크, 이미지 경로 등 본문 내 모든 내용 그대로 유지
- 줄바꿈, 공백, 들여쓰기 등 원본 포맷 그대로 유지

## Frontmatter 필드 결정 규칙

### 공통
| 필드 | 결정 방법 |
|------|----------|
| `title` | 기존 frontmatter의 `title` 필드 우선 → 없으면 본문 첫 번째 `# 헤딩`에서 추출 (마크다운 기호·이모지 제거) |
| `lastUpdated` | `git -C _import/<repo> log -1 --format="%Y-%m-%d" -- <파일 상대경로>` → git 이력 없으면 오늘 날짜 |

### Blog (`src/content/blog/`)
```yaml
---
title: [위 규칙으로 결정]
date: YYYY-MM-DD        # 최초 커밋 날짜: git -C _import/tech-log log --follow --diff-filter=A --format="%Y-%m-%d" -- <파일 상대경로>
                        # git 이력 없으면 오늘 날짜
lastUpdated: YYYY-MM-DD
tags: [카테고리]        # ⚠️ 필수: BlogTree 카테고리 그룹핑에 사용됨 (첫 번째 태그 기준)
                        # _import/tech-log/posts/README.md 참고해서 섹션 결정
---
```

### Docs (`src/content/docs/docs/`)
```yaml
---
title: [위 규칙으로 결정]
date: YYYY-MM-DD        # 최초 커밋 날짜: git -C _import/docs log --follow --diff-filter=A --format="%Y-%m-%d" -- <파일 상대경로>
                        # git 이력 없으면 오늘 날짜
lastUpdated: YYYY-MM-DD
---
```

### 제거 대상 필드 (GitBook 전용, Starlight에서 불필요)
- `layout`
- `cover`, `coverY`
- `description` (GitBook 섹션 설명용)
- `hidden`
- 그 외 frontmatter에 있는 모든 미지정 필드

---

## ⚠️ CRITICAL: docsLoader ID 포맷

Astro docsLoader는 파일 ID를 **확장자 없이** 저장한다.
특히 **index 파일의 ID는 디렉토리 경로(2 parts)**이며, `index` suffix가 붙지 않는다.

```
# 일반 docs 파일
_import/docs/java/class.md → ID: "docs/java/class"      (3 parts)

# index 파일 (서브카테고리 랜딩)
src/content/docs/docs/java/index.mdx → ID: "docs/java"  (2 parts, NOT "docs/java/index")
```

`DocsTree.astro`의 getCollection 쿼리는 이 포맷에 의존한다:
- 일반 docs: `parts.length >= 3`
- index 페이지: `parts.length === 2 && parts[0] === 'docs'`

---

## 새 서브카테고리 추가 체크리스트 (Docs)

새 subcategory(`_import/docs/<name>/`)를 처음 마이그레이션할 때 **반드시** 아래 3단계를 함께 수행한다.

### 1. 콘텐츠 파일 복사
```
_import/docs/<name>/*.md → src/content/docs/docs/<name>/*.md
(frontmatter 변환 적용)
```

### 2. index.mdx 생성 (서브카테고리 랜딩 페이지)
파일: `src/content/docs/docs/<name>/index.mdx`
```mdx
---
title: [서브카테고리 표시명]
---

import SubcategoryPage from '../../../../components/SubcategoryPage.astro';

<SubcategoryPage subcategory="<name>" />
```
> 이 파일이 없으면 DocsTree에서 해당 서브카테고리 링크가 `<a>` 대신 `<span>`으로 렌더링된다.

### 3. docsSections.ts 업데이트
파일: `src/data/docsSections.ts`
```ts
export const docsSections: Record<string, SectionConfig> = {
  // 기존 항목 유지...
  "<name>": [
    { label: "섹션명", slugs: ["slug1", "slug2", ...] },
    // _import/docs/<name>/README.md 참고해서 섹션 구성
  ],
};
```
> `slugs`는 파일명에서 확장자 제거한 값. config에 없는 slug는 자동으로 "기타" 섹션에 들어간다.

### 4. DocsTree groups 확인
파일: `src/data/docsGroups.ts`의 `DOCS_GROUPS` 배열에 해당 서브카테고리 key가 있는지 확인.
없으면 적절한 그룹 항목에 `{ key: '<name>', label: '표시명' }` 추가한다.
(DocsTree는 실제 콘텐츠가 있는 서브카테고리만 자동으로 표시하므로, DOCS_GROUPS에 항목이 있어야 함)

---

## 중첩 서브카테고리 추가 체크리스트 (Docs 안의 Docs)

아이템 수가 많아 별도 목차 페이지가 필요한 경우 (예: `effective-java`).

### 판단 기준
- 하나의 주제 아래 문서가 **10개 이상**이거나
- 소스에 별도 `README.md`(챕터 구성 표)가 있는 경우

### 구조 예시
```
_import/docs/java/effective-java/     ← 소스
  ├── README.md                       ← 챕터 구성 표 (참고용)
  ├── item1.md
  └── item2.md

src/content/docs/docs/java/
  └── effective-java/                 ← 타겟
      ├── index.mdx                   ← 목차 랜딩 페이지 (직접 작성)
      ├── item1.md
      └── item2.md
```

### URL 계층
```
/docs/java/                          ← SubcategoryPage (effective-java 링크 포함)
/docs/java/effective-java/           ← 목차 랜딩 (챕터별 표)
/docs/java/effective-java/item1/     ← 개별 문서
```

### docsLoader ID 포맷 (중첩 시)
```
effective-java/index.mdx → ID: "docs/java/effective-java"   (3 parts — 일반 doc으로 취급)
effective-java/item1.md  → ID: "docs/java/effective-java/item1" (4 parts)
```
SubcategoryPage는 `parts.length === 3`만 표시하므로 4-part 아이템은 부모 페이지에 노출되지 않는다.

### 단계별 체크리스트

#### 1. 개별 문서 변환 복사
```
_import/docs/<name>/<group>/*.md → src/content/docs/docs/<name>/<group>/*.md
(frontmatter 변환 + H1 제거 적용)
```
git 날짜 조회:
```bash
cd _import/docs && git log -1 --date=short --pretty=format:"%cd" -- <name>/<group>/item1.md
```

#### 2. 목차 랜딩 페이지 생성
파일: `src/content/docs/docs/<name>/<group>/index.mdx`
- `SubcategoryPage`를 사용하지 않고 **직접 MDX 표**를 작성한다
- 소스 `_import/docs/<name>/<group>/README.md`의 표를 참고해서 링크를 절대 경로로 변환

```mdx
---
title: 그룹 표시명
---

## Chapter N. 챕터명

| Item | Title |
|:----:|-------|
| [Item 1. 제목](/docs/<name>/<group>/item1/) | 한국어 설명 |
| [Item 2. 제목](/docs/<name>/<group>/item2/) | 한국어 설명 |
```

> ⚠️ README의 상대 경로 링크 `(item1.md)` → 절대 경로 `/docs/<name>/<group>/item1/`로 변환

#### 3. docsSections.ts 업데이트
부모 서브카테고리 섹션에 그룹 슬러그(랜딩 페이지) 하나만 추가:
```ts
"<name>": [
  // 기존 섹션들...
  { label: "<그룹명>", slugs: ["<group>"] },  // ← 랜딩 페이지 slug
]
```
개별 아이템 slug는 넣지 않는다 (SubcategoryPage depth 필터로 어차피 제외됨).

#### 4. 이름 충돌 주의
소스에 `index.md` 파일이 있으면 랜딩 페이지 `index.mdx`와 충돌한다.
→ 해당 파일은 의미 있는 이름으로 **변경**하여 복사한다 (예: `mysql/index.md` → `btree-index.md`).

---

## 새 Blog 포스트 추가 체크리스트

### 1. 콘텐츠 파일 복사
```
_import/tech-log/posts/<post>.md → src/content/blog/<post>.md
(frontmatter 변환 적용)
```

### 2. tags 필드 확인
- `tags` 배열의 **첫 번째 태그**가 BlogTree 카테고리 그룹핑 기준이 됨
- `_import/tech-log/posts/README.md` 섹션 구조를 참고해서 적절한 태그 부여
- 예: `tags: [Java]`, `tags: [Spring & JPA]`

---

## 이미지 처리 규칙

본문에서 `images/...` 경로로 참조하는 이미지는 반드시 함께 복사한다.

| 소스 이미지 위치 | 타겟 이미지 위치 |
|----------------|----------------|
| `_import/tech-log/posts/images/<post-slug>/` | `src/content/docs/blog/images/<post-slug>/` |
| `_import/docs/<name>/image/` | `src/content/docs/docs/<name>/image/` |
| `_import/about/posts/images/` | `src/content/docs/about/images/` |

```bash
# Blog 이미지 복사 예시
cp -r _import/tech-log/posts/images/<post-slug> src/content/docs/blog/images/
```

이미지 복사를 누락하면 빌드 시 `ImageNotFound` 오류가 발생한다.

## Behavioral Flow
1. 소스 경로의 `.md` 파일 목록 수집
2. 각 파일에 대해:
   a. 기존 frontmatter 파싱
   b. `title` 결정 (frontmatter → 본문 H1 순)
   c. `lastUpdated` / `date` 결정 (서브모듈 git log → 오늘 날짜 순)
   d. 타입에 맞는 새 frontmatter 구성 (tags 포함)
   e. 본문 첫 번째 H1 줄 및 바로 뒤 빈 줄 제거
3. 변환 전/후 frontmatter diff 미리보기 출력 (본문은 표시 안 함)
4. 사용자 확인 후 타겟 경로에 복사 (frontmatter만 교체, 본문 원본 그대로)
5. **Docs인 경우**: index.mdx 생성 여부 + docsSections.ts 업데이트 여부 확인

## Output Format
```
## 변환 대상: [소스경로] → [타겟경로] (N개 파일)

### [파일명]
Before:
---
[기존 frontmatter]
---

After:
---
[변환된 frontmatter]
---

---
변환을 진행할까요? (Y/N)
```
