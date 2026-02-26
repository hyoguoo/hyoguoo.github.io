---
title: "Testcontainers"
date: 2025-10-23
lastUpdated: 2025-10-23
tags: [Spring]
description: ""
---

테스트에 H2와 같은 인메모리 데이터베이스를 사용할 수 있지만, 실제 운영 환경의 데이터베이스(예: MySQL)와 문법(Dialect)이나 동작 방식이 달라 테스트의 신뢰도를 떨어뜨릴 수 있다.

- 핵심 기능: 테스트 실행 시 실제 MySQL, Kafka, Redis 등의 소프트웨어가 설치된 도커 컨테이너를 실행하고, 테스트 종료 시 컨테이너를 자동으로 중지 및 삭제
- 장점
    - 환경 일관성: 개발, 테스트, 운영 환경에서 동일한 버전의 소프트웨어를 사용하여 높은 신뢰도의 테스트 가능
    - 완전한 격리: 각 테스트(혹은 테스트 클래스)마다 깨끗한 상태의 컨테이너를 제공하여 테스트 간 격리성 보장

Testcontainers는 이러한 문제를 해결하기 위한 Java 라이브러리로, 테스트 코드 내에서 프로그래밍 방식으로 도커(Docker) 컨테이너를 제어할 수 있게 해준다.

## 1. Spring Boot 3.1+ 자동 설정

Spring Boot 3.1 버전부터 Testcontainers와의 공식 통합 기능이 도입되어, `application.yml` 설정만으로 Testcontainers를 사용할 수 있다.

### 의존성 추가

```groovy
// build.gradle
testImplementation "org.springframework.boot:spring-boot-testcontainers"
testImplementation "org.testcontainers:mysql"
testImplementation "org.testcontainers:junit-jupiter" // 수동 설정 시 필요
```

### `application-test.yml` 설정

테스트용 설정 파일(`src/test/resources/application-test.yml`)의 `spring.datasource.url`을 `jdbc:tc:` 접두사로 변경한다.

```yaml
# application-test.yml
spring:
datasource:
# jdbc:tc:[데이터베이스종류]:[버전태그]///[DB이름]
url: "jdbc:tc:mysql:8.0.33:///testdb"
username: "test"
password: "test"
driver-class-name: "org.testcontainers.jdbc.ContainerDatabaseDriver"
```

### 동작 방식

1. `@ActiveProfiles("test")` 등으로 테스트 프로필이 활성화되면 스프링 부트가 `jdbc:tc:` URL을 인식
2. Testcontainers 모듈이 `mysql:8.0.33` 이미지를 찾아 도커 컨테이너를 실행
3. 컨테이너가 실행되면, `jdbc:tc:...` URL을 실제 컨테이너의 동적 JDBC URL(예: `jdbc:mysql://localhost:32768/testdb`) 자동 교체
4. 테스트가 종료되면 해당 컨테이너를 자동으로 종료

이 방식은 Kafka, RabbitMQ, Redis 등 다른 모듈에도 `@ServiceConnection` 애노테이션을 통해 매우 간편하게 적용할 수 있다.

## 2. 수동 설정 (`@Testcontainers` 및 `@DynamicPropertySource`)

Spring Boot 3.1 미만 버전을 사용하거나, JDBC 외의 커스텀 컨테이너(예: Kafka, Redis)를 세밀하게 제어해야 할 때 사용하는 전통적인 방식이다.

- `@Testcontainers`: JUnit 5 확장 기능으로, 테스트 클래스가 Testcontainers의 라이프사이클을 관리하도록 설정
- `@Container`: 관리할 컨테이너 인스턴스를 선언
    - `static`으로 선언하면 해당 테스트 클래스 내의 모든 메서드가 컨테이너를 공유
- `@DynamicPropertySource`: 동적 속성을 스프링의 `Environment` (프로퍼티)에 주입하는 역할

### 공통 설정(추상 클래스)

수동 설정은 주로 공통 설정을 담은 추상 클래스를 만들어 상속받는 방식으로 사용된다.

```java
// AbstractContainerBaseTest.java

@Testcontainers
public abstract class AbstractContainerBaseTest {

    // static: 모든 테스트 메서드가 이 컨테이너를 공유
    @Container
    static final MySQLContainer<?> MY_SQL_CONTAINER =
            new MySQLContainer<>("mysql:8.0.33");

    @Container
    static final KafkaContainer KAFKA_CONTAINER =
            new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:latest"));

    // 동적 프로퍼티 설정
    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        // 1. MySQL 컨테이너의 동적 URL, Username, Password를 스프링 설정에 주입
        registry.add("spring.datasource.url", MY_SQL_CONTAINER::getJdbcUrl);
        registry.add("spring.datasource.username", MY_SQL_CONTAINER::getUsername);
        registry.add("spring.datasource.password", MY_SQL_CONTAINER::getPassword);

        // 2. Kafka 컨테이너의 동적 Bootstrap 서버 주소를 스프링 설정에 주입
        registry.add("spring.kafka.bootstrap-servers", KAFKA_CONTAINER::getBootstrapServers);
    }
}
```

### 테스트 클래스 적용

이제 이 추상 클래스를 상속받기만 하면 된다.

```java

@SpringBootTest
class OrderServiceTest extends AbstractContainerBaseTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private KafkaProducer kafkaProducer;

    @Test
    void testOrderAndPublishEvent() {
        // ...
    }
}
```
