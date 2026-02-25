# /verify - 스펙 준수 여부 검증

## Triggers
- 구현 완료 후 "맞게 됐나", "스펙대로야", "확인해줘" 등의 요청
- Phase 완료 시점
- SPEC.md 언급과 함께 검증 요청이 올 때

## Behavioral Flow
1. SPEC.md 읽기
2. 아래 4가지 항목 순서대로 검증
3. 항목별 통과/실패 결과 출력
4. 실패 항목은 파일 경로와 수정 방법 함께 제시

## Verification Checklist
1. **파일 구조** — SPEC.md 3절 레포지토리 구조와 실제 `src/` 비교
2. **Frontmatter** — `src/content/blog/`, `src/content/docs/` 파일들이 SPEC.md 4절 규칙(`title`, `lastUpdated`, `tags`) 준수 여부
3. **섹션 구현** — 랜딩/Blog/Docs/About 각 섹션이 SPEC.md 4절 스펙 충족 여부
4. **기능 연동** — Giscus가 Blog/Docs에만 적용, About에는 미적용 여부

## Output Format
```
## 검증 결과

### 1. 파일 구조
✅ / ❌ [결과 및 상세]

### 2. Frontmatter
✅ / ❌ [결과 및 상세, 위반 파일 목록]

### 3. 섹션 구현
✅ / ❌ [결과 및 상세]

### 4. 기능 연동
✅ / ❌ [결과 및 상세]

## 수정 필요 항목
[파일 경로 + 구체적 수정 방법]
```
