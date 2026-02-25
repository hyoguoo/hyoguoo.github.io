# /migrate - 마크다운 frontmatter 변환 및 콘텐츠 이전

## Triggers
- "마이그레이션", "변환", "이전" 요청 시
- Phase 4 콘텐츠 이전 작업 시
- `_import/` 파일을 Starlight 형식으로 변환할 때

## Arguments
`$ARGUMENTS` — 변환할 소스 경로 (생략 시 아래 기본 경로 전체 처리)

## Source / Target 경로 매핑
| 소스 | 타겟 | 타입 |
|------|------|------|
| `_import/tech-log/posts/` | `src/content/docs/blog/` | Blog |
| `_import/docs/` | `src/content/docs/docs/` | Docs |
| `_import/about/posts/` | `src/pages/about/` | About |

> **Note**: Starlight의 `src/content/docs/`는 URL 루트 `/`에 매핑됨.
> - Blog: `src/content/docs/blog/post.md` → `/blog/post/`
> - Docs: `src/content/docs/docs/java/class.md` → `/docs/java/class/`
> - `blog/`와 `docs/`가 같은 레벨의 형제 디렉토리로 구성됨.

## 절대 원칙: 본문 내용 수정 금지

**frontmatter 블록(`--- ... ---`)만 교체한다. 그 아래 본문은 단 한 글자도 바꾸지 않는다.**

- H1 헤딩은 title 추출에만 참조하고, 본문에서 제거하지 않는다
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
tags: [기존 frontmatter의 tags 유지 → 없으면 빈 배열 []]
---
```

### Docs (`src/content/docs/`)
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

## Behavioral Flow
1. 소스 경로의 `.md` 파일 목록 수집
2. 각 파일에 대해:
   a. 기존 frontmatter 파싱
   b. `title` 결정 (frontmatter → 본문 H1 순)
   c. `lastUpdated` 결정 (서브모듈 git log → 오늘 날짜 순)
   d. 타입에 맞는 새 frontmatter 구성
3. 변환 전/후 frontmatter diff 미리보기 출력 (본문은 표시 안 함)
4. 사용자 확인 후 타겟 경로에 복사 (frontmatter만 교체, 본문 원본 그대로)

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