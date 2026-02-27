# /description - SEO Description 작성 가이드

## Triggers
- "description 작성", "description 추가", "설명 추가" 등의 요청
- `description: ""` 채우기 요청 시
- SEO 개선·최적화 요청 시
- 특정 카테고리 일괄 작업: "docs/docker description 작성해줘"
- 기존 description 검토·점검 요청 시

## 공통 원칙

### 언어
- **한국어 1문장**으로 작성
- 영문 기술 용어(클래스명, 어노테이션, SQL 키워드 등)는 원문 그대로 유지
- 예: `@Transactional`, `COUNT(*)`, `PrintStream`

### 길이
- **40~100자** (공백 포함)
- 너무 짧으면 정보 부족, 너무 길면 Google에서 잘림 (≈ 155자)

### 톤 & 종결어
검색자가 "이 글을 읽으면 무엇을 얻는가"를 한 문장으로 전달한다.

| 글 성격 | 권장 종결어 |
|---------|-----------|
| 경험·사례 소개 | `~을 다룬다` |
| 원리·개념 설명 | `~를 분석한다` / `~를 정리한다` |
| 방법·방법론 안내 | `~하는 방법을 알아본다` / `~방법을 설명한다` |
| 구현·설계 | `~를 구현한다` / `~를 설계한다` |
| 비교·차이 분석 | `~차이를 비교한다` / `~를 비교·분석한다` |

### 피해야 할 표현
- "이 글에서는..." / "오늘은..." (주어 불필요)
- "~에 대해 알아본다" (막연함)
- 제목의 단순 반복
- "좋은", "중요한" 등 가치 판단 수식어

---

## Blog 가이드라인

**성격**: 실무 경험·트러블슈팅·시행착오 기록

### 작성 공식

```
[핵심 문제 또는 주제] + [해결 방법 또는 분석 내용] + [종결어]
```

### 예시 (기존 포스트 패턴)

```yaml
# 경험·개선기
description: "Offset이 아닌 Cursor 기반으로 페이징 처리를 적용하여 성능을 개선한 경험을 다룬다."

# 원리 분석
description: "Spring에서 @Transactional을 선언적으로 사용할 때 같은 클래스 내 메서드 호출(Self Invocation)이 트랜잭션을 무시하는 이유를 분석한다."

# 구현
description: "DB 재고 차감과 외부 PG 결제가 분리된 결제 로직에서 보상 트랜잭션으로 실패를 극복하는 플로우를 설계한다."

# 비교·차이
description: "MySQL에서 COUNT(*)·COUNT(1)·COUNT(column)의 동작 원리와 실행 계획 차이를 분석한다."
```

### 체크리스트

- [ ] 핵심 기술 키워드 포함 (검색 쿼리에 걸릴 단어)
- [ ] 어떤 문제를, 어떻게 해결·분석했는지 포함
- [ ] 40~100자 범위
- [ ] 제목과 겹치지 않는 표현 사용

---

## Docs 가이드라인

**성격**: 개념 정리·학습 레퍼런스 (카테고리별 문서)

### 작성 공식

```
[문서가 다루는 개념/기술] + [핵심 설명 포인트] + [종결어]
```

Docs는 "경험" 서술 대신 **개념·원리·구조·사용법** 중심으로 작성한다.

### 카테고리별 패턴

#### Java / Spring
```yaml
description: "JVM의 메모리 구조와 Heap·Stack·Method Area의 역할을 정리한다."
description: "Spring Bean 생명주기와 초기화·소멸 콜백의 동작 순서를 설명한다."
description: "@Transactional의 전파 속성(Propagation)과 격리 수준(Isolation)의 차이를 비교한다."
```

#### MySQL
```yaml
description: "인덱스의 B-Tree 구조와 쿼리 최적화에 활용하는 방법을 정리한다."
description: "트랜잭션 격리 수준별 발생 가능한 이상 현상(Dirty Read·Phantom Read)을 분석한다."
```

#### Network
```yaml
description: "HTTP/1.1과 HTTP/2의 멀티플렉싱 차이와 성능 개선 원리를 비교한다."
description: "TCP 3-Way Handshake와 연결 수립·해제 과정의 동작 원리를 정리한다."
```

#### Docker
```yaml
description: "Dockerfile의 주요 명령어와 이미지 레이어 최적화 방법을 설명한다."
description: "도커 네트워크 드라이버의 종류와 컨테이너 간 통신 방식을 비교한다."
```

#### Operating System / Computer Architecture
```yaml
description: "프로세스와 스레드의 차이, 컨텍스트 스위칭 동작 원리를 정리한다."
description: "CPU 스케줄링 알고리즘의 종류와 각 알고리즘의 장단점을 비교한다."
```

### 체크리스트

- [ ] 문서 제목(title)에 이미 있는 단어를 보완하는 내용 추가
- [ ] "어떤 개념을", "어떤 측면에서" 다루는지 명확히
- [ ] 단순 제목 반복 금지 (예: title이 "Dockerfile"이면 description도 "Dockerfile에 대해 설명한다" ❌)
- [ ] 40~100자 범위

---

## 작업 방법

### 단일 파일 수정
```
파일 경로를 알려주면 description을 작성해줄게.
```

### 카테고리 일괄 작성
```
"docs/docker 카테고리 description 모두 작성해줘"
→ 해당 디렉토리 파일 전체 스캔 후 일괄 작성
```

### 검토 요청
```
"blog description 품질 점검해줘"
→ 기존 작성 내용을 위 가이드라인 기준으로 검토
```
