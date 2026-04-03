---
title: "Prompt Engineering for Developers"
date: 2025-10-25
lastUpdated: 2026-04-03
tags: [ AI-Assisted Development ]
description: "AI 어시스턴트를 효과적으로 활용하기 위한 페르소나 설정, Few-Shot 기법, Chain of Thought, 수동 컨텍스트 주입 등 실전 프롬프트 엔지니어링 기법을 설명한다."
---

## 핵심 원칙

효율적인 프롬프트 엔지니어링을 위해 다음 원칙들을 준수한다.

### 기본 원칙 4가지

1. 페르소나 설정: AI가 특정 역할(예: 시니어 개발자, 보안 전문가, 코드 리뷰어 등)을 맡도록 지시하여 전문성 있는 응답 유도
2. 명확성과 구체성: 요청의 목적과 기대 결과를 명확히 정의하여 모호성을 제거
3. 제약 조건 설정: AI가 따라야 할 구체적인 규칙이나 제한 사항을 명시
4. 단계별 사고: 복잡한 문제를 단일 요청으로 해결하기보다 논리적 단계를 나누어 작업을 분해하도록 유도

## 실전 기법

### Zero-Shot vs. Few-Shot

- Zero-Shot (단순 요청): AI의 일반 지식에만 의존하여 바로 질문하는 방식
- Few-Shot (예시 제공): AI에게 작업에 대한 예시를 먼저 보여주고, 그 스타일에 맞춰 작업을 요청하는 방식

Few-Shot 기법은 AI의 '출력 공간(Output Space)'을 강력하게 '제약'하는 원리를 이용한다.

```
// 우리 팀의 테스트 코드 스타일 예시
@Test
void should_return_user_when_id_exists() {
  // given
  given(userRepository.findById(any())).willReturn(Optional.of(user));
  // when
  User foundUser = userService.findById(1L);
  // then
  assertThat(foundUser.getName()).isEqualTo(user.getName());
}

// 위 예시와 동일한 스타일(given-when-then)로,
// 'deleteUser' 메서드에 대한 테스트 코드를 작성해줘.
```

AI는 제공된 예시(컨텍스트)를 바탕으로, 다음에 생성될 내용이 어떤 구조와 스타일을 가져야 하는지 높은 확률로 예측한다.

### 반복적 개선

첫 번째 답변에 만족하지 말고, 그 답변을 새로운 컨텍스트로 삼아 추가 요청을 하는 방식이다.

1. 명령: "상품 주문(Order)을 처리하는 `OrderService` 클래스 만들어줘."
2. AI: (초안 코드 생성)
3. 피드백 및 계속 반복...
4. AI: (최종 코드 완성)

이 기법은 AI와의 대화 내역 전체가 '누적 컨텍스트'로 작동하는 원리를 활용하여, 점진적으로 결과물을 개선해 나가는 방식이다.

- 장점: 점진적으로 복잡한 결과물을 완성 가능
- 단점: 대화가 길어질수록 컨텍스트 윈도우 한계에 빠르게 도달 가능
    - 토큰(비용) 소모가 커지고 AI의 응답 속도가 느려지거나 맥락을 잃을 수 있음
    - 복잡한 작업이 완료되면 주기적으로 컨텍스트를 초기화하는 것이 좋음

### Chain of Thought(CoT) & 단계별 실행

'단계별 사고' 원칙을 실제 작업으로 연결하는 가장 강력한 기법으로, '계획' 단계와 '실행' 단계를 개발자가 의도적으로 분리하는 것이다.

- 계획 수립(CoT)
    - 명령: "기존 `UserService`에 Redis를 이용한 캐시 레이어를 추가하려고 해. 필요한 작업 단계를 순서대로 설명해줘."

```
1. `build.gradle` (또는 `pom.xml`)에 `spring-boot-starter-data-redis` 의존성을 추가합니다.
2. `application.yml`에 Redis 호스트 및 포트 정보를 설정합니다.
3. `@Configuration` 클래스를 만들어 `@EnableCaching`을 선언하고, `CacheManager` 빈을 설정합니다.
4. `UserService`의 `findUserById` 같은 메서드에 `@Cacheable` 어노테이션을 추가합니다.
5. `updateUser`나 `deleteUser` 메서드에는 `@CacheEvict`를 추가하여 캐시를 갱신합니다.
```

- 단계별 실행 및 검증 (Execution): 각 단계를 하나씩 실행하도록 AI에 지시하여, 개발자가 각 단계의 결과물을 검토하고 승인할 수 있게 함

이는 AI가 스스로 논리적인 계획을 세우고(Chain of Thought), 개발자는 그 계획을 검토하고 제어(Control)할 수 있게 한다.

### 수동 컨텍스트 주입(Manual Context Injection)

AI의 컨텍스트 분석이 완벽하지 않거나, 현재 열리지 않은 파일의 정보를 AI가 알아야 할 때 개발자가 '사실(Facts)'을 직접 컨텍스트에 주입하는 기법이다.

- Few-Shot이 타일(Style)을 주입한다면, 이 기법은 데이터(Data)를 주입하는 방식
    - 에러 로그 / 의존성 목록 / 외부 문서 등
- AI가 모르는 '현재 상태'나 '외부 정보'를 명시적으로 제공하여 정확한 답변 유도

### 마크다운(Markdown) 협업

AI와 협업할 때 정보를 구조화하고 전달하는 가장 효율적인 형식이다.

- 구조화된 정보 전달: 마크다운의 헤더, 리스트, 코드 블록을 사용하여 AI가 컨텍스트를 계층적으로 파악 가능
- 문서 기반 협업: 블로그 포스팅, 업무 계획, 기술 문서 작성 시 마크다운 형식을 적극 활용하여 AI와 문서 중심의 소통 지향
