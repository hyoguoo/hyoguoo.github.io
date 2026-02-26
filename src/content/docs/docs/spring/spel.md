---
title: "SpEL (Spring Expression Language)"
date: 2025-09-01
lastUpdated: 2025-09-01
tags: [Spring]
description: ""
---

SpEL은 Spring Framework 3.0부터 지원하는 강력한 표현 언어다. 객체 그래프를 런타임에 조회하고 조작하는 기능을 제공한다.

## 구문

Spring에서는 `${...}`와 `#{...}` 두 가지 형태의 표현식을 사용한다.

- `${...}` (Property Placeholder)
    - 용도: 프로퍼티 플레이스홀더로, `application.yml` 같은 파일이나 환경 변수 등 외부 설정 파일의 키(key)에 해당하는 값을 가져오기 위해 사용
    - 동작: 단순한 값 치환(replacement)으로 동작
    - 처리 시점: Spring 컨테이너가 Bean을 생성하기 전, Bean 정의를 읽어들이는 시점에 먼저 처리되어 값으로 대체
- `#{...}` (SpEL Expression)
    - 용도: SpEL 표현식으로, 단순한 값 주입을 넘어 객체의 메소드 호출, 연산, 조건부 평가, 다른 Bean 참조 등 동적인 로직을 수행할 때 사용
    - 동작: 표현식을 파싱하고 평가(evaluation)하여 결과를 동적으로 생성
    - 처리 시점: Bean이 생성된 이후, 런타임에 표현식이 평가

|  구분   | ${...} (Property Placeholder) |        #{...} (SpEL)        |
|:-----:|:-----------------------------:|:---------------------------:|
|  목적   |        외부 설정 값의 정적인 주입        |     동적인 표현식 평가 및 로직 수행      |
| 처리 시점 |   Bean 생성 전 (설정 메타데이터 로딩 시)   |       Bean 생성 후 (런타임)       |
|  기능   |            단순 값 치환            | 메소드 호출, 산술/논리 연산, Bean 참조 등 |

이 둘은 `@Value("#{'${app.name}' + ' - ' + T(java.time.LocalDate).now()}")`와 같이 함께 사용할 수도 있다.

### 1. 리터럴 (Literals)

문자열, 숫자, boolean, null 값을 직접 표현할 수 있다.

- 문자열: `'Hello World'`
- 숫자: `100`, `3.14`
- Boolean: `true`, `false`
- Null: `null`

### 2. 프로퍼티 및 메소드 접근

자바의 점 표기법(dot notation)을 사용하여 객체의 프로퍼티나 메소드에 접근할 수 있다.

```
// user.name 프로퍼티 접근
#{user.name}

// name 프로퍼티의 toUpperCase() 메소드 호출
#{user.name.toUpperCase()}

// Null-safe 접근자: user가 null이어도 NullPointerException을 발생시키지 않고 null을 반환
#{user?.name}
```

### 3. 연산자

다양한 종류의 연산자를 지원한다.

- 산술 연산자: `+`, `-`, `*`, `/`, `%`, `^`
- 관계 연산자: `==`, `!=`, `<`, `>`, `<=`, `>=`
- 논리 연산자: `and`, `or`, `not`
- 삼항 연산자: `#{user.age > 20 ? '성인' : '미성년자'}`
- Elvis 연산자: `#{user.name ?: 'Guest'}` (user.name이 null이면 'Guest'를 반환)

### 4. 타입 및 Bean 참조

- T() 연산자: 클래스의 정적(static) 메소드나 필드에 접근할 때 사용 가능
    - `#{T(java.lang.Math).random()}`

- Bean 참조: `@` 기호를 사용하여 Spring 컨테이너에 등록된 다른 Bean을 참조 가능
    - `#{@myBean.getSomeValue()}`

## 활용 사례

### 1. 애노테이션 기반 설정

`@Value` 애노테이션과 함께 사용하여 프로퍼티 값을 주입하거나, 다른 Bean의 값을 기반으로 동적인 값을 설정한다.

```java
// application.properties의 app.name 값을 주입
@Value("${app.name}")
private String appName;

// 시스템 프로퍼티(user.home) 값을 주입
@Value("#{systemProperties['user.home']}")
private String userHome;

// 다른 Bean(someComponent)의 someValue 필드 값을 주입
@Value("#{someComponent.someValue}")
private int someValue;

// 연산 결과를 주입
@Value("#{someComponent.someValue > 100}")
private boolean isValueLarge;
```

### 2. 조건부 Bean 생성

`@ConditionalOnExpression` 애노테이션을 사용하여 특정 조건이 참일 때만 Bean을 생성하도록 제어할 수 있다.

```java
// 'feature.enabled' 프로퍼티가 true일 때만 MyFeatureService Bean을 생성
@Service
@ConditionalOnExpression("${feature.enabled:false}")
public class MyFeatureService {
    // ...
}
```

### 3. Spring Security

메소드 레벨의 보안 설정에서 사용자의 권한이나 요청 파라미터를 검사하는 등 복잡한 보안 규칙을 적용할 때 매우 유용하다.

```java
// 'ADMIN' 역할을 가진 사용자만 접근 허용
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long userId) {
    // ...
}

// 파라미터로 받은 username이 현재 인증된 사용자의 이름과 같을 때만 접근 허용
@PreAuthorize("#username == authentication.principal.username")
public UserProfile getUserProfile(String username) {
    // ...
}
```

## 동적 표현식 평가

SpEL은 정적인 설정뿐만 아니라, `SpelExpressionParser`와 `EvaluationContext`를 사용하여 코드 내에서 런타임에 문자열 형태의 표현식을 동적으로 해석하고 실행하는 기능도 제공한다.

1. ExpressionParser: 문자열 표현식을 파싱하여 실행 가능한 `Expression` 객체로 변환
2. EvaluationContext: 표현식 평가에 필요한 컨텍스트(루트 객체, 변수 등)를 제공

### 동작 예시 코드

```java

@Service
public class DiscountService {


    private final ExpressionParser parser = new SpelExpressionParser(); // SpEL 파서는 스레드에 안전하므로 Bean으로 관리하거나 멤버 변수로 사용 가능
    private final List<DiscountRule> discountRules; // 실제로는 Repository를 통해 DB에서 조회

    /**
     * 주문 정보(OrderContext)를 받아 적용 가능한 할인율을 계산
     */
    public double calculateDiscountRate(OrderContext context) {
        EvaluationContext evalContext = new StandardEvaluationContext(context);

        // 저장된 규칙들을 순회하며 조건 확인
        for (DiscountRule rule : discountRules) {
            try {
                // DB에서 가져온 문자열 표현식을 파싱하여 Expression 객체로 변환
                Expression expression = parser.parseExpression(rule.getCondition());

                // 현재 주문 정보(context)를 기준으로 표현식을 평가
                Boolean isMatch = expression.getValue(evalContext, Boolean.class);

                if (isMatch != null && isMatch) {
                    return rule.getDiscountRate(); // 조건이 맞으면 해당 할인율 반환
                }
            } catch (Exception e) {
                // 표현식 오류 시 로그 기록 등의 예외 처리
                System.err.println("SpEL 평가 오류 발생: " + rule.getCondition());
            }
        }

        return 0.0; // 적용될 할인 없음
    }

    private List<DiscountRule> loadDiscountRulesFromDB() {
        return List.of(
                new DiscountRule(
                        "user.membershipLevel == 'GOLD' and order.amount >= 100000",
                        0.15
                ),
                new DiscountRule(
                        "user.membershipLevel == 'SILVER' and order.amount >= 50000",
                        0.05
                ),
                new DiscountRule(
                        "order.productCategory == 'ELECTRONICS'",
                        0.10
                )
        );
    }
}

// --- SpEL 평가에 사용될 데이터 모델 ---

// 규칙 평가에 필요한 데이터를 묶어주는 DTO
class OrderContext {

    private final User user;
    private final Order order;

    // ...
}

// DB에 저장된 할인 규칙 모델
class DiscountRule {

    private final String condition; // SpEL 표현식
    private final double discountRate; // 할인율

    // ...
}
```

## 동작 원리

SpEL은 내부적으로 다음과 같은 단계를 거쳐 동작한다.

1. 파싱 (Parsing): 개발자가 작성한 문자열 표현식(`'Hello' + ' World'`)을 파서(`SpelExpressionParser`)가 분석하여 추상 구문 트리(AST)로 변환
2. 평가 (Evaluation): 생성된 AST를 순회하며 각 노드에 해당하는 연산(프로퍼티 접근, 메소드 호출, 산술 연산 등)을 실행
    - 해당 과정은 `EvaluationContext`에 정의된 상태( 루트 객체, 변수 등)를 기반으로 이루어지면서 최종 결과를 반환
