# /add - 새 게시글 추가

## Triggers
- "추가", "새 글", "새 문서", "포스팅" 등 게시글 추가 요청 시
- 완성된 마크다운 문서를 제공하면서 등록 요청 시

## Arguments
`$ARGUMENTS` — 대상 경로 또는 문서 내용 (생략 시 Mode 2 자동 탐지 진행)

---

## Mode 1: 위치 명시 추가

사용자가 `"docs/spring에 추가"`, `"blog 포스트로 추가"` 처럼 **위치를 직접 지정**한 경우.

### 처리 절차

1. **타입 판단** (`blog` vs `docs`)
   - `blog` → `src/content/docs/blog/<slug>.md`
   - `docs/<category>` → `src/content/docs/docs/<category>/<slug>.md`
   - `docs/<category>/<subcategory>` → `src/content/docs/docs/<category>/<subcategory>/<slug>.md`

2. **slug 결정**
   - 사용자가 파일명 미지정 시 `title`을 kebab-case로 변환하여 자동 결정
   - 영문 소문자, 숫자, 하이픈(`-`)만 허용
   - 기존 파일명과 충돌 여부 확인

3. **frontmatter 구성** → [Frontmatter 규칙](#frontmatter-규칙) 참고

4. **docs인 경우 추가 작업** → [Docs 추가 체크리스트](#docs-추가-체크리스트) 참고

5. **미리보기 출력 후 확인**

---

## Mode 2: 위치 자동 탐지

사용자가 **완성된 문서를 제공**하고 위치를 지정하지 않은 경우.

### 판단 절차

#### Step 1. Blog vs Docs 판단

| 특징 | Blog | Docs |
|------|------|------|
| 경험·회고·트러블슈팅 | ✅ | |
| 특정 기술 적용 사례 | ✅ | |
| 개념 정리·레퍼런스 | | ✅ |
| 내러티브 형식 | ✅ | |
| 체계적 분류 가능 주제 | | ✅ |

**Blog**: 에세이·사례 중심, 시간적 맥락이 있는 글
**Docs**: 기술 개념·레퍼런스 중심, 카테고리로 분류 가능한 글

#### Step 2. 카테고리 탐지 (Docs인 경우)

`src/data/docsSections.ts`의 최상위 키 목록:

```
java, mysql, ai-assisted-development, computer-architecture,
docker, kafka, large-scale-system, network, oop, operating-system,
redis, secure, setting, spring, test
```

문서 내용·제목을 분석해 **가장 적합한 카테고리** 선택.
판단이 애매한 경우 후보 2~3개를 제시하고 사용자에게 확인 요청.

#### Step 3. 섹션 탐지 (Docs인 경우)

선택된 카테고리의 `docsSections.ts` 섹션 목록을 확인해 **가장 적합한 섹션** 결정.
기존 섹션 어디에도 맞지 않으면 새 섹션 추가 여부를 사용자에게 확인.

#### Step 4. Blog 태그 결정 (Blog인 경우)

`src/content/docs/blog/` 내 기존 포스트의 `tags` 값을 확인하여 동일한 카테고리 값 사용.
현재 사용 중인 태그 목록:

```
Java, Spring & JPA, MySQL, AI
```

새 태그 도입이 필요한 경우 사용자에게 확인.

---

## Frontmatter 규칙

### Blog (`src/content/docs/blog/*.md`)
```yaml
---
title: 포스팅 제목               # 제목 컨벤션 참고
date: YYYY-MM-DD                  # 오늘 날짜
lastUpdated: YYYY-MM-DD           # 오늘 날짜 (수정 시 갱신)
tags: [카테고리]                  # ⚠️ 필수: BlogTree 카테고리 그룹핑 기준 (첫 번째 태그)
description: "한 문장 요약"       # SEO og:description (없으면 사이트 설명으로 대체)
---
```

### Docs (`src/content/docs/docs/**/*.md`)
```yaml
---
title: 문서 제목                  # 제목 컨벤션 참고
date: YYYY-MM-DD                  # 오늘 날짜
lastUpdated: YYYY-MM-DD           # 오늘 날짜 (수정 시 갱신)
tags: [카테고리]                  # 최상위 디렉토리명 기준 — 아래 매핑 참고
description: ""                   # SEO용. 한 문장 요약 권장 (비워도 무방)
---
```

#### Docs 카테고리 태그 매핑

| 디렉토리 | tags 값 |
|---------|---------|
| `java` | `[Java]` |
| `mysql` | `[MySQL]` |
| `spring` | `[Spring]` |
| `network` | `[Network]` |
| `operating-system` | `[Operating System]` |
| `computer-architecture` | `[Computer Architecture]` |
| `docker` | `[Docker]` |
| `kafka` | `[Kafka]` |
| `large-scale-system` | `[Large-Scale System]` |
| `redis` | `[Redis]` |
| `secure` | `[Secure]` |
| `setting` | `[Setting]` |
| `test` | `[Test]` |
| `oop` | `[OOP]` |
| `ai-assisted-development` | `[AI-Assisted Development]` |

중첩 디렉토리(`java/effective-java/item1.md`)도 **최상위 카테고리**(`[Java]`) 기준.

---

## 제목 컨벤션

**영문만 사용**, 한글 병기 금지.

| 경우 | 처리 방법 | 예시 |
|------|----------|------|
| 일반 영문 | 그대로 | `Spring IoC Container` |
| 약어 | 풀네임을 괄호 안에 추가 | `AOP (Aspect-Oriented Programming)` |
| SQL 키워드 | 그대로 (대문자 유지) | `SELECT`, `INSERT`, `ENUM` |
| API·메서드명 | 그대로 | `@Transactional`, `getBean()` |
| 고유명사 | 공식 표기 그대로 | `Redis`, `Docker`, `Spring Boot` |

주요 약어 확장 목록:

| 약어 | 풀네임 |
|------|--------|
| AOP | Aspect-Oriented Programming |
| CAS | Compare-And-Swap |
| CORS | Cross-Origin Resource Sharing |
| DNS | Domain Name System |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HyperText Transfer Protocol Secure |
| JDBC | Java Database Connectivity |
| JPA | Java Persistence API |
| JWT | JSON Web Token |
| JVM | Java Virtual Machine |
| OAuth | Open Authorization |
| SpEL | Spring Expression Language |
| URI | Uniform Resource Identifier |

---

## Docs 추가 체크리스트

### 기존 카테고리에 문서 추가 시

1. **파일 배치**: `src/content/docs/docs/<category>/<slug>.md`
2. **docsSections.ts 업데이트**: 해당 slug를 적절한 섹션의 `slugs` 배열에 추가
   - 기존 섹션 중 적합한 곳에 추가
   - 없으면 새 섹션 블록 추가 후 사용자 확인

### 새 카테고리 추가 시 (기존 카테고리가 없는 경우)

1. **콘텐츠 파일 배치**: `src/content/docs/docs/<name>/<slug>.md`
2. **index.mdx 생성**: `src/content/docs/docs/<name>/index.mdx`
   ```mdx
   ---
   title: 카테고리 표시명
   ---
   import SubcategoryPage from '../../../../components/SubcategoryPage.astro';
   <SubcategoryPage subcategory="<name>" />
   ```
3. **docsSections.ts 추가**: `src/data/docsSections.ts`에 새 항목 추가
   ```ts
   "<name>": [
     { label: "섹션명", slugs: ["<slug>"] },
   ],
   ```
4. **DocsTree groups 확인**: `src/data/docsGroups.ts`의 `DOCS_GROUPS` 배열에 해당 key가 있는지 확인. 없으면 적절한 그룹에 `{ key: '<name>', label: '표시명' }` 추가.

> ⚠️ index.mdx 누락 시 DocsTree에서 해당 카테고리 링크가 `<a>` 대신 `<span>`으로 렌더링됨.

---

## 본문 처리 규칙

- **H1 헤딩 제거**: Starlight가 frontmatter `title`을 H1으로 렌더링하므로, 본문에 H1이 있으면 **반드시 제거** (H1 바로 뒤 빈 줄 포함)
- **본문 내용 수정 금지**: 코드블록, 이미지, 링크 등 H1 외 본문은 그대로 유지
- **링크 형식**: 본문 내 내부 링크는 절대 경로 사용
  - Blog: `/blog/<slug>/`
  - Docs: `/docs/<category>/<slug>/`
  - 상대 경로나 `.md` 확장자 링크 금지

---

## 이미지 처리

본문에서 이미지를 참조하는 경우 **반드시** 이미지 파일도 함께 배치한다.

| 타입 | 이미지 배치 경로 |
|------|----------------|
| Blog | `src/content/docs/blog/images/<post-slug>/` |
| Docs | `src/content/docs/docs/<category>/image/` |

이미지 누락 시 빌드 시 `ImageNotFound` 오류 발생.

---

## Behavioral Flow

1. `$ARGUMENTS` 분석 → Mode 1 (위치 명시) or Mode 2 (자동 탐지) 결정
2. **Mode 2인 경우**: 문서 내용 분석 → Blog/Docs 판단 → 카테고리/섹션 결정
   - 판단 근거와 후보를 함께 제시
   - 애매한 경우 사용자 확인 요청
3. frontmatter 구성 (오늘 날짜로 `date`, `lastUpdated` 설정)
4. 제목 컨벤션 적용 (약어 확장, 한글 제거)
5. 본문 H1 제거 확인
6. **미리보기 출력**:
   ```
   ## 추가 예정
   - 파일: src/content/docs/.../<slug>.md
   - 타입: Blog / Docs (<category> > <section>)

   Frontmatter:
   ---
   [구성된 frontmatter]
   ---

   [docsSections.ts 변경사항 (Docs인 경우)]
   ```
7. 사용자 확인 후 파일 생성 및 관련 설정 업데이트
8. **PLAN.md `lastUpdated` 항목에 해당 없음** — 게시글 추가는 PLAN.md 체크 불필요

## Output Format
```
## 게시글 추가
- 파일: [생성 경로]
- 타입: [Blog / Docs]
- 카테고리: [카테고리명] (자동 탐지 시 근거 포함)

Frontmatter 미리보기:
---
[최종 frontmatter]
---

변경 파일:
- [생성 파일]
- [docsSections.ts 변경 내용 (해당 시)]
- [docsGroups.ts 변경 내용 (새 카테고리 시)]

추가할까요? (Y/N)
```