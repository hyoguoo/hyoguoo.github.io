---
title: "Spring Boot Properties"
date: 2025-08-28
lastUpdated: 2025-08-28
tags: [Spring]
description: ""
---

## 프로퍼티 값 주입 방법

스프링 부트는 외부 설정을 `application.properties` 또는 `application.yml` 파일을 사용해 관리할 수 있으며, 이를 여러 방법으로 애플리케이션에 주입하여 사용할 수 있다.

```yaml
# application.yml
app:
  api:
    base-url: [ https://api.example.com ](https://api.example.com)
    key: ${APP_API_KEY}   # 환경 변수로 외부화(예: export APP_API_KEY=...)
    timeout: 3s           # Duration
    retry-max: 5          # int
    endpoints: # List<String>
      - users
      - payments
      - reports
    default-headers: # Map<String, String>
      X-CLIENT: demo
      X-TRACK: enabled
    max-body-size: 10MB   # DataSize
    feature-enabled: true # boolean
````

### Environment.getProperty

```java

@Component
public class EnvReader {

    private final URI baseUrl;
    private final int retryMax;
    private final Duration timeout;
    private final DataSize maxBodySize;

    public EnvReader(Environment env) {
        // getProperty 메서드를 사용하여 타입 변환 및 기본값 설정
        this.baseUrl = env.getProperty("app.api.base-url", URI.class);
        this.retryMax = env.getProperty("app.api.retry-max", Integer.class, 3);
        this.timeout = env.getProperty("app.api.timeout", Duration.class, Duration.ofSeconds(2));
        this.maxBodySize = env.getProperty("app.api.max-body-size", DataSize.class, DataSize.ofMegabytes(5));
    }
}
```

- `Environment` 빈을 주입받아 `getProperty()` 메서드로 값을 조회
- 프로퍼티 키를 문자열로 직접 지정(기본값 설정 가능)

### @Value

```java

@Component
public class ValueReader {

    private final String key;
    private final Duration timeout;
    private final int retryMax;
    private final List<String> endpoints;
    private final DataSize maxBodySize;

    public ValueReader(
            @Value("${app.api.key}") String key,
            @Value("${app.api.timeout}") Duration timeout,
            @Value("${app.api.retry-max:3}") int retryMax,
            @Value("${app.api.endpoints}") List<String> endpoints,
            @Value("${app.api.max-body-size}") DataSize maxBodySize) {
        this.key = key;
        this.timeout = timeout;
        this.retryMax = retryMax;
        this.endpoints = endpoints;
        this.maxBodySize = maxBodySize;
    }
}
```

- `${...}` 플레이스홀더를 사용해 프로퍼티 키를 명시
- SpEL(Spring Expression Language)을 활용한 동적인 값 주입 가능
- `:` 문자를 이용해 기본값 설정

#### @Value 주입 과정

`@Value`의 주입은 생성자 파라미터에 `@Value`를 붙이는 경우와 필드에 `@Value`를 붙이는 경우 주입 시점이 다르다.

- 필드 레벨
   - 객체 생성 이후 `BeanPostProcessor`가 리플렉션으로 주입 처리
   - 생성 이후에 처리되므로 `final` 필드에는 주입 불가
- 생성자 파라미터 레벨
   - 객체 생성 시점에 프로퍼티 값을 미리 읽어와 생성자 인자로 전달
   - 생성자 호출 시점에 이미 값이 준비되어 있으므로 `final` 필드에도 주입 가능

### @ConfigurationProperties

```java
// ApiProperties.java, 설정 프로퍼티 클래스 정의
@ConfigurationProperties(prefix = "app.api")
@Validated // jakarta.validation.constraints.* 어노테이션을 사용한 검증 활성화
public record ApiProperties(
                @NotEmpty
                URI baseUrl,
                String key,
                Duration timeout,
                int retryMax,
                List<String> endpoints,
                Map<String, String> defaultHeaders,
                DataSize maxBodySize,
                boolean featureEnabled
        ) {

}
```

메인 애플리케이션 클래스에 어노테이션을 추가하여 `@ConfigurationProperties`가 붙은 클래스를 자동으로 스캔하고 빈으로 등록하도록 설정하는 과정이 필요하다.

```java
// Application.java
@SpringBootApplication
@ConfigurationPropertiesScan
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

빈으로 등록되어있기 때문에 필요한 곳에 주입하여 사용할 수 있다.

```java
// PropsReader.java
@Component
public class PropsReader {

    private final ApiProperties properties;

    public PropsReader(ApiProperties properties) {
        this.properties = properties;
    }
}
```

- 관련 프로퍼티를 구조화된 객체로 관리하여 가독성과 유지보수성 향상
- `@Validated`와 `jakarta.validation` 어노테이션을 통해 애플리케이션 시작 시점에 프로퍼티 값 검증 가능
- 실제 프로퍼티 파일 대신 객체를 직접 생성하여 주입이 가능하여 테스트 용이성 향상

### 방법별 비교 요약

| 구분                         | 용도 및 특징                           | 장점                       | 단점                       |
|----------------------------|-----------------------------------|--------------------------|--------------------------|
| `Environment.getProperty`  | 프레임워크 내부 또는 동적으로 키를 결정해야 할 때 사용   | 스프링 컨테이너 어디서든 주입받아 사용 가능 | 키를 문자열로 관리, 타입 안정성 부족    |
| `@Value`                   | 소수의, 서로 관련 없는 단일 값을 주입할 때 간편하게 사용 | SpEL 지원, 사용법이 직관적        | 프로퍼티 관리 분산, 컴파일 시점 검증 불가 |
| `@ConfigurationProperties` | 여러 관련 값을 하나의 그룹으로 묶어 관리할 때 사용     | 타입 안전, 강력한 검증 기능, 테스트 용이 | 별도의 클래스 정의 필요            |

## 프로필(Profile)

스프링 부트는 다양한 환경(개발, 테스트, 운영 등)에 따라 설정을 분리하여 관리할 수 있는 기능을 제공한다.

```yaml
# 단일 파일에서 프로필별 설정 관리 예시 (application.yml)
# 기본 설정
server:
  port: 8080

app:
  name: demo
  message: 기본 메시지

---
# 프로필이 local일 때 설정
spring:
  config:
    activate:
      on-profile: local
app:
  message: 로컬 메시지
server:
  port: 8081

---
# 프로필이 prod일 때 설정
spring:
  config:
    activate:
      on-profile: prod
app:
  message: 운영 메시지
server:
  port: 8080
```

```yaml
# 별도 파일에서 프로필별 설정 관리 예시
# (application-prod.yml)
server:
  - port: 8080
app:
  - message: 운영 메시지
# (application-local.yml)
server:
  - port: 8081
app:
  - message: 로컬 메시지
```

- `application.yml` 안에서 `---`로 구분하거나 별도 파일로 관리 가능
    - `spring.config.activate.on-profile`로 프로필 지정
- `application-{profile}.yml` 형식으로 별도 파일 관리 가능

### 프로필 실행 방법

- JAR 실행: `java -jar build/libs/app.jar --spring.profiles.active=local`
- Gradle: `./gradlew bootRun --args='--spring.profiles.active=local'`
- Maven: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`

###### 참고자료

- [Spring Framework-AutowiredAnnotationBeanPostProcessor](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/AutowiredAnnotationBeanPostProcessor.html)