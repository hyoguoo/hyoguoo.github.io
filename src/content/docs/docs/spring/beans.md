---
title: "Beans"
date: 2022-10-10
lastUpdated: 2025-08-22
---

> 스프링 빈(Bean) : 스프링 컨테이너가 생성하고 생명주기를 관리하는 자바 객체

Bean은 스프링을 구성하는 핵심 요소로, 빈 정의 메타데이터(BeanDefinition)로 등록되고 컨테이너는 해당 정의에 따라 객체를 생성, 의존성 주입, 초기화, 소멸까지 관리한다.

## 핵심 구성 요소

1. class
    - 빈으로 등록할 Java 클래스
    - 스프링 컨테이너에 의해 객체로 생성 및 관리되어 클래스의 인스턴스를 Bean으로 사용
2. id
    - 컨테이너에서 빈을 식별하기 위한 고유 식별자
    - 클래스명을 decapitalize한 이름을 기본으로 부여하며, 명시적으로 지정 가능
3. scope
    - 빈 인스턴스의 생존 범위 정의
    - 기본값 singleton
4. constructor-arguments
    - Bean을 생성할 때 생성자에 전달할 인자들을 정의
    - Bean을 초기화하는 데 사용
5. property
    - Bean을 생성할 때 setter를 통해 전달할 인자들을 정의
6. 기타 메타데이터
    - initMethod, destroyMethod, lazyInit, primary, autowireCandidate, dependsOn, description 등

## 스프링 빈 등록 방법

### 1. 컴포넌트 스캔

컴포넌트 스캔으로 어노테이션이 부여된 클래스를 자동 탐지하여 빈으로 등록한다.

- 사용 어노테이션: `@Component` 와 특화 어노테이션(`@Controller`, `@Service`, `@Repository`, 등)
- 탐색 범위: `@ComponentScan` 의 `basePackages`, `basePackageClasses`, `includeFilters`, `excludeFilters`로 제어
- 이름 규칙: 기본은 클래스명 decapitalize. @Component("customName")로 지정 가능

의존성 주입은 방법으론 여러 가지가 있는데, 그 중 생성자 주입 방법을 권장하고 있다.(단일 생성자일 경우 @Autowired 생략 가능)

```java

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    @Autowired // 생략 가능
    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}


@Repository
public class MemoryMemberRepository implements MemberRepository {

}
```

### 2. 자바 설정(@Configuration + @Bean)

정형화 되지 않은 코드거나, 상황에 따라 구현 클래스를 변경해야하는 경우 사용한다.

```java

@Configuration
public class SpringConfig {

    @Bean
    public MemberService memberService() {
        return new MemberService(memberRepository());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```

`@Configuration`에 두 가지 속성이 존재하는데, 각 역할은 다음과 같다.

- `value`: `@Configuration` 선언된 클래스의 이름을 지정
- `proxyBeanMethods`: 스프링이 관리하는 빈을 참조할 때 프록시를 사용하여 싱글톤 보장(기본값 `true`)
    - 직접 생성한 객체를 사용하는 것이 아닌, `CGLIB`에 의해 생성된 프록시 객체를 사용하여 싱글톤 보장

## 빈 생명주기

스프링 빈은 생성 - 의존관계 주입 단계를 거쳐 사용할 수 있는 상태가 되며, 스프링 빈의 대략적인 이벤트 라이프 사이클은 아래와 같다.

1. 스프링 컨테이너 생성
2. 스프링 빈 생성 및 등록
    - `Bean`으로 등록할 수 있는 `Annotation` 및 `Configuration`을 읽어 IoC 컨테이너 안에 `Bean`으로 등록
    - 의존 관계 주입 전 객체 생성 과정 수행(Field/Setter 주입의 경우에만)
        - 생성자 주입: 객체의 생성과 의존관계 주입이 동시에 발생
        - Setter/Field 주입: 객체 생성 -> 의존 관계 주입 단계 분리
3. [의존 관계 주입](dependency-injection.md)
4. 초기화 콜백
    - 빈이 생성되고, 빈의 의존관계 주입이 완료된 후 호출
5. 런타임 사용
    - 실제 애플리케이션(빈) 동작 단계
6. 소멸 전 콜백
    - 빈이 소멸되기 직전에 호출
7. 스프링 종료

### 빈 생명주기(초기화/소멸) 콜백

빈은 시작 및 종료 시점에 추가적인 콜백 작업을 수행할 수 있으며, 아래 세 가지 방법을 제공한다.(실행되는 순서는 아래 번호 순서대로 실행)

#### 1. @PostConstruct, @PreDestroy 애노테이션

- @PostConstruct: 의존관계 주입이 끝나면 호출
- @PreDestroy: 빈이 종료될 때 호출

```java
public class Example {
    // ...

    @PostConstruct
    public void init() {
        action();
    }

    @PreDestroy
    public void close() {
        exit();
    }
}
```

- 최신 스프링에서 가장 권장하는 방법
- `javax.annotation.PostConstruct`인 자바 표준 기술
- 컴포넌트 스캔과 궁합이 좋음
- 외부 라이브러리에는 적용 불가능 -> 이 경우 `@Bean`의 `initMethod`, `destroyMethod`를 사용

#### 2. 인터페이스(InitializingBean, DisposableBean)

- `InitializingBean` In `afterPropertiesSet()`: 의존관계 주입이 끝나면 호출
- `DisposableBean` In `destroy()`: 빈이 종료될 때 호출

```java
public class Example implements InitializingBean, DisposableBean {
    // ...

    @Override
    public void afterPropertiesSet() throws Exception {
        action();
    }

    @Override
    public void destroy() throws Exception {
        exit();
    }
}
```

- 스프링 전용 인터페이스에 의존
- 초기화, 소멸 메서드의 이름 변경 불가
- 코드를 고칠 수 없는 외부 라이브러리에 적용 불가

#### 3. 설정 정보에 초기화 메서드, 종료 메서드 지정

- `@Bean(initMethod = "init", destroyMethod = "close")` 초기화/소멸 메서드 지정

```java
public class Example {
    // ...

    public void init() {
        action();
    }

    public void close() {
        exit();
    }
}

@Configuration
public class AppConfig {

    @Bean(initMethod = "init", destroyMethod = "close")
    public Example example() {
        return new Example();
    }
}
```

- 메서드 이름 자유롭게 설정 가능
- 스프링 빈이 스프링 코드에 의존하지 않음
- 설정 정보를 사용하기 때문에 코드를 고칠 수 없는 외부 라이브러리에도 초기화, 종료 메서드 적용 가능
- 종료 메서드 추론 기능
    - `@Bean`의 `destroyMethod` 속성에는 아무것도 지정하지 않으면 추론 기능이 동작
    - `close`, `shutdown` 같은 일반적으로 많이 사용하는 종료 메서드를 자동으로 호출
    - 추론 기능을 막기 위해서 `destroyMethod=""`로 지정 할 수 있음

## 스코프

빈이 존재할 수 있는 범위를 뜻하며, 스프링 빈이 기본적으로 싱글톤 스코프로 생성되기 때문에 보통 스프링 컨테이너의 시작과 종료 시점과 같으며 크게 세 가지 스코프를 지원한다.

- 싱글톤(Default): 스프링 컨테이너의 시작과 종료 시점에 생성되고 소멸하는 가장 넓은 범위의 스코프, 가장 많이 사용되는 스코프
- 프로토타입: 스프링 컨테이너가 빈의 생성과 의존 관계 주입까지만 관여하고 더는 관리하지 않는 스코프
- 웹 관련 스코프
    - request: 웹 요청 하나가 들어오고 나갈 때 까지 유지되는 스코프
    - session: 웹 Session과 동일한 생명주기를 가지는 스코프
    - application: 서블릿 컨텍스트와 동일한 생명주기를 가지는 스코프

### 프로토타입 스코프

싱글톤 스코프는 스프링 컨테이너에서 항상 같은 인스턴스의 스프링 빈을 반환하지만, 스코프의 빈은 스프링 컨테이너에 요청할 때마다 새로 인스턴스를 생성하여 반환한다.

- 싱글톤 빈 / 프로토타입 빈 비교

|             싱글톤 빈              |             프로토타입 빈             |
|:------------------------------:|:-------------------------------:|
|    싱글톤 스코프 빈을 스프링 컨테이너에 요청     |    프로토타입 스코프 빈을 스프링 컨테이너에 요청    |
|    (요청 한 빈이 이미 생성되어 있는 상태)     | 요청 온 시점에 프로토타입 빈을 생성하고 의존 관계 주입 |
|     스프링 컨테이너가 관리하고 있는 빈 반환     |            생성한 빈을 반환            |
| 같은 요청이 와도 계속 같은 인스턴스의 스프링 빈 반환 | 같은 요청이 오면 계속 새로운 인스턴스의 스프링 빈 반환 |

프로토타입 빈의 특징을 정리하면 다음과 같다.

- 스프링 컨테이너에 요청할 때 마다 새로운 인스턴스를 생성
- 스프링 컨테이너는 프로토타입 스코프 빈을 `생성/의존관계 주입/초기화`까지만 처리
- 생성 및 초기화까지만 처리하기 때문에 `@PreDestroy` 같은 종료 메서드도 호출하지 않음
- 프로토타입 빈은 프로토타입 빈을 조회한 클라이언트가 관리
- 여러 빈에서 같은 프로토타입 빈을 주입 받으면, 주입 받은 모든 빈은 각자 다른 인스턴스를 사용(하나의 빈에선 계속 같은 프로토타입 빈을 가짐)

###### 참고자료

- [스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/스프링-입문-스프링부트)
- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/스프링-핵심-원리-기본편)
