---
title: "Spring Boot"
date: 2025-08-28
lastUpdated: 2025-08-28
---

과거 스프링 프레임워크는 직접 설정을 해야하고 구성하는 등의 번거로움이 상당히 많았지만 스프링 부트가 등장하면서 손쉽게 웹 애플리케이션을 만들 수 있게 되었다.

- 라이브러리 버전 관리 자동화
    - 여러 라이브러리의 버전을 명시하지 않더라도 적합한 버전을 자동으로 관리
- 자동 설정 자동화
    - 다양한 공통적인 설정을 자동으로 구성
- 내장 웹 서버 제공
    - 톰캣과 같은 별도 웹 서버를 설치하지 않아도 내장 웹 서버를 통해 웹 애플리케이션을 실행할 수 있도록 지원
- 실행 가능한 JAR
    - 순수 자바 애플리케이션 프로그램을 실행하는 것처럼 실행에 대한 편리성 제공

이처럼 스프링 부트는 스프링 프레임워크의 설정과 기능을 단순화하고 자동화하여 개발자가 더 쉽게 스프링 기반 애플리케이션을 개발할 수 있도록 도와준다.

## @SpringBootApplication

Spring Initializr를 통해 프로젝트를 생성하면 아래와 같이 `@SpringBootApplication` 어노테이션이 선언된 클래스가 생성된다.

```java

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

실제로 해당 애노테이션을 살펴보면 아래와 같이 정의된 것을 볼 수 있다.

```java

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = {@Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
        @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class)})
public @interface SpringBootApplication {

    // ...
}
```

### 핵심 구성 요소

1. @SpringBootConfiguration
    - @Configuration의 메타 애노테이션
    - 스프링 부트의 애플리케이션 설정 클래스임을 나타냄
2. @EnableAutoConfiguration
    - 자동 설정 활성화
    - @Import를 통해 `META-INF/.../...imports` 파일의 자동 설정 클래스를 읽어 등록
3. @ComponentScan
    - 현재 패키지와 하위 패키지를 스캔하여 컴포넌트를 빈으로 등록
    - 제외/포함 필터로 세밀 제어 가능

## SpringBootApplication 클래스

Main 코드에서 `SpringApplication.run(Application.class, args);`를 통해 `run` 메서드를 호출하는데, 아래의 역할을 수행하게 된다.

- 스프링 애플리케이션을 초기화하고 실행하는 주요한 역할을 수행
- 실행 리스너들에게 이벤트 발생
- 자동 구성을 수행하고 환경 설정 준비
- 애플리케이션 컨텍스트 생성 및 초기화
- ApplicationRunner와 CommandLineRunner 실행

## 스프링 부트의 실행 과정

위 내용을 바탕으로 스프링 부트의 실행 과정을 정리하면 아래와 같다.

1. @SpringBootApplication이 선언된 메인 클래스에서 main 실행
2. SpringApplication.run 호출로 환경(Environment) 준비, 프로파일 적용
3. ApplicationContext 생성 및 초기화, ApplicationContextInitializer 적용
4. @ComponentScan으로 애플리케이션 컴포넌트 등록
5. @EnableAutoConfiguration에 의해 자동 설정 클래스 로딩 및 조건 평가
6. 컨텍스트 refresh, 빈 후처리기와 라이프사이클 콜백 실행
7. 웹 애플리케이션이면 내장 웹 서버(Tomcat/Jetty/Undertow) 시작
8. ApplicationRunner, CommandLineRunner 실행
9. 애플리케이션 준비 완료, 요청 처리 가능 상태

###### 참고자료

- [스프링 부트 - 핵심 원리와 활용](https://www.inflearn.com/course/스프링부트-핵심원리-활용)
- [망나니개발자 티스토리](https://mangkyu.tistory.com/213)