---
title: "Dependency Injection"
date: 2024-03-07
lastUpdated: 2026-05-15
tags: [ Spring ]
description: "스프링의 의존성 주입 매칭 우선순위와 컬렉션 주입 활용법, 생성자 주입의 순환 참조 조기 검출 및 불변성 보장 원리를 분석한다."
---

> 객체 간 의존성을 자신이 아닌 외부에서 두 객체 간의 관계를 결정해주는 디자인 패턴

의존성 주입은 제어의 역전을 실현하는 핵심 수단으로, 객체 간의 결합도를 낮추고 테스트 용이성을 높이는 역할을 한다.

## @Autowired 작동 원리와 매칭 우선순위

스프링 컨테이너는 `AutowiredAnnotationBeanPostProcessor`를 통해 빈 생성 직후 리플렉션으로 의존성을 주입한다.

- 타입 매칭: 먼저 주입 대상의 타입을 기반으로 빈을 검색
- 다중 후보 처리: 동일한 타입의 빈이 여러 개 발견될 경우 아래 순서에 따라 최종 후보를 결정

1. `@Qualifier`: 특정 빈 이름을 지정하여 구분
2. `@Primary`: 우선순위를 가진 대표 빈 선택
3. `@Priority`: `jakarta.annotation.Priority` 설정값이 가장 높은 빈 선택
4. 빈 이름 매칭: 주입 받는 필드 또는 파라미터 이름과 일치하는 빈 선택

만약 주입 대상이 컬렉션 타입(`List`, `Map`, `Set`)인 경우, 타입이 일치하는 모든 빈을 한 번에 주입받을 수 있다.

## DI 3가지 방법

### 1. 생성자 주입(가장 권장되는 방법)

```java

@Controller
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }
}
```

- 생성자 호출 시점에 딱 한 번만 주입되는 것이 보장
- 필드를 `final`로 선언할 수 있어 객체의 불변성 확보 가능
- 의존 관계가 생성자 파라미터에 명시되어 누락 시 컴파일 시점에 즉시 파악 가능

### 2. 필드 주입

```java

@Controller
public class MemberController {

    @Autowired
    private MemberService memberService;
}
```

- 코드가 간결하지만 외부에서 변경이 불가능하여 단위 테스트 작성이 어려움
- DI 프레임워크가 반드시 존재해야 하므로 순수 자바 코드 기반의 검증이 불가능
- 실제 애플리케이션 로직보다는 테스트 코드나 설정(`@Configuration`) 파일에서 제한적으로 사용 권장

### 3. 수정자 주입(Setter Injection)

```java

@Controller
public class MemberController {

    private MemberService memberService;

    @Autowired
    public void setMemberService(MemberService memberService) {
        this.memberService = memberService;
    }
}
```

- 선택적이거나 런타임에 변경 가능성이 있는 의존 관계에 활용
- `public`으로 노출되어 실행 도중 의존 관계가 의도치 않게 변경될 위험 존재

## 생성자 주입 권장 이유

### 1. 순환 참조의 조기 검출

컴포넌트 간 서로를 참조하는 순환 구조가 발생했을 때, 주입 방식에 따라 에러 발생 시점이 달라진다.

- 생성자 주입: 빈을 만드는 과정에서 의존 빈이 필요하므로 애플리케이션 기동 시점에 `BeanCurrentlyInCreationException` 발생
- 필드/수정자 주입: 빈을 먼저 생성한 뒤 주입하므로 런타임에 메서드 호출 시점에 에러가 발생하거나 무한 루프 위험
- Spring Boot 2.6+: 주입 방식과 무관하게 기본적으로 순환 참조를 금지하여 기동 실패를 유도함

### 2. 불변성 및 NPE 방지

- `final` 키워드 사용: 인스턴스화 이후 의존성이 변경되지 않음을 언어 차원에서 보장
- 필수 의존성 보장: 의존성이 누락된 채로 객체가 생성되는 것을 방지하여 런타임 NullPointerException 차단

### 3. 테스트 용이성

- 프레임워크 독립성: 스프링 컨테이너 없이 `new` 연산자를 통해 Mock 객체를 주입하여 테스트 가능
- 단일 책임 원칙(SRP) 경고: 생성자 파라미터가 지나치게 많아지면 클래스가 과도한 책임을 지고 있다는 신호를 시각적으로 제공

## Lombok 활용

Lombok의 `@RequiredArgsConstructor`를 활용하면 생성자 주입의 코드 중복을 제거하면서 장점을 그대로 누릴 수 있다.

```java

@Controller
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
}
```

## 빈 선택 문제 해결

동일한 인터페이스의 구현체가 여러 개인 경우 발생하는 매칭 충돌을 해결하는 방법은 다음과 같다.

- `@Primary` 사용: 특정 빈에 우선순위를 부여하여 기본 주입 대상으로 지정
- `@Qualifier` 사용: 주입 지점에 특정 빈 이름을 명시하여 명확하게 매칭
- 우선순위: `@Qualifier`가 `@Primary`보다 우선순위가 높으므로 상세한 설정이 필요할 때 활용

###### 참고자료

- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/스프링-핵심-원리-기본편)
