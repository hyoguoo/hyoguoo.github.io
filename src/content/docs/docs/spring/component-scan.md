---
title: "Component Scan(컴포넌트 스캔)"
date: 2024-03-07
lastUpdated: 2025-08-22
---

스프링은 클래스패스를 탐색해 컴포넌트 후보를 찾아 빈으로 등록하는 컴포넌트 스캔 기능을 제공하며, 애노테이션 기반 구성에서 빈 등록 작업을 자동화한다.

## 개요

- 기본 대상: `@Component`와 그 메타 애노테이션(`@Controller`, `@Service`, `@Repository`, `@Configuration`)이 부착된 타입
- 동작 요약: 클래스 파일 메타데이터를 읽어 후보 판정 -> `BeanDefinition` 생성 -> 빈 이름 결정 -> 빈 등록
- 권장 위치: 스캔을 시작하는 구성 클래스(`@Configuration` + `@ComponentScan`)를 프로젝트 최상단에 위치시키는 것이 일반적

스프링 부트를 사용하는 경우 `@SpringBootApplication`이 내부적으로 `@ComponentScan`을 포함하며, 애플리케이션 클래스의 패키지를 기준으로 하위 패키지를 스캔한다.

```java
// AppConfig.java
// @ComponentScan 사용하여 @Component 어노테이션이 붙은 클래스를 스캔하여 빈으로 등록  
@Configuration
@ComponentScan(
        // 스캔 시작 패키지(여러 개 지정 가능), 지정하지 않으면 이 클래스의 패키지를 기준으로 하위 패키지 전부 스캔
        basePackages = {"hello.core", "hello.service"},
        // 지정한 클래스의 패키지를 탐색 시작 위치로 지정, 지정하지 않으면 @ComponentScan이 붙은 설정 정보 클래스의 패키지가 시작 위치로 설정됨
        basePackageClasses = AutoAppConfig.class
)
public class AutoAppConfig {

}

// OrderServiceImpl.java
// @Component 어노테이션을 선언하여 @ComponentScan의 대상이 되도록 설정
@Component
public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    @Autowired
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy
            discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

아래는 컴포넌트 스캔의 대상 `Annotation`들로, 내부 구현 코드를 보면 모두 `@Component`을 포함하고있다.

|      애노테이션       | 설명                                                        |
|:----------------:|:----------------------------------------------------------|
|   `@Component`   | 컴포넌트 스캔의 대상에 사용, 일반적인 컴포넌트로 인식                            |
|  `@Controller`   | 스프링 MVC 컨트롤러에서 사용, 스프링 MVC 컨트롤러로 인식                       |
|    `@Service`    | 스프링 비즈니스 로직에서 사용, 특별한 처리는 없으나 의미상 구분하기 위해 사용              |
|  `@Repository`   | 스프링 데이터 접근 계층에서 사용, 데이터 계층(Database)의 예외를 스프링 예외로(추상화) 변환 |
| `@Configuration` | 스프링 설정 정보에서 사용, 스프링 설정 정보로 인식하며, 스프링 빈이 싱글톤을 유지하도록 추가 처리  |

## 필터

컴포넌트 스캔 대상을 추가로 지정하거나, 제외할 대상을 지정할 수 있는데 `@Component`의 사용으로 충분하기 때문에 필터를 사용할 일은 거의 없다.

```java
// IncludeComponent.java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyExcludeComponent {

}

// ExcludeComponent.java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyIncludeComponent {

}

// AppConfig.java
@Configuration
@ComponentScan(
        // 컴포넌트 스캔 대상에 추가할 애노테이션
        includeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = MyIncludeComponent.class),
        // 컴포넌트 스캔 대상에서 제외할 애노테이션
        excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = MyExcludeComponent.class)
)
public class AutoAppConfig {

}
```

FilterType에 줄 수 있는 옵션은 아래와 같다.

- `ANNOTATION`: 기본값, 애노테이션을 인식해서 동작
- `ASSIGNABLE_TYPE`: 지정한 타입과 자식 타입을 인식해서 동작
- `ASPECTJ`: AspectJ 패턴 사용
- `REGEX`: 정규 표현식
- `CUSTOM`: `TypeFilter`이라는 인터페이스를 구현해서 처리

하지만 위 방법은 권장하지 않으며 스프링 기본 설정에 맞추어 사용하는 것이 좋다.

###### 참고자료

- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/스프링-핵심-원리-기본편)