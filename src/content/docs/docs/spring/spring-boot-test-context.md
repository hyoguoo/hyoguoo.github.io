---
title: "Spring Boot Test Context"
date: 2025-10-23
lastUpdated: 2025-10-23
---

스프링 부트는 다양한 계층의 테스트를 지원하기 위해 여러 테스트 애노테이션을 제공한다.

| 애노테이션             | 주요 특징                                                     | 사용 상황                                                            |
|-------------------|-----------------------------------------------------------|------------------------------------------------------------------|
| `@SpringBootTest` | - 전체 애플리케이션 컨텍스트 로드<br/>- 통합 테스트 수행<br/>- 모든 계층 테스트 가능    | - 애플리케이션 전체 흐름 테스트<br/>- 여러 계층 간 상호작용 테스트<br/>- 실제와 유사한 환경에서 테스트 |
| `@DataJpaTest`    | - JPA 관련 Bean만 로드<br/>- 트랜잭션 관리 및 롤백<br/>- 내장형 데이터베이스 사용  | - JPA 엔티티 및 리포지토리 테스트<br/>- 데이터베이스 쿼리 검증<br/>- JPA 관련 테스트 수행 시   |
| `@JdbcTest`       | - JDBC 관련 Bean만 로드<br/>- 트랜잭션 관리 및 롤백<br/>- 내장형 데이터베이스 사용 | - 순수 JDBC 테스트<br/>- SQL 쿼리 검증<br/>- JPA를 사용하지 않는 데이터베이스 상호작용 테스트 |
| `@WebMvcTest`     | - 웹 계층 관련 Bean만 로드<br/>- 내장형 웹 서버(MockMvc) 사용             | - 컨트롤러 계층 테스트<br/>- 웹 계층의 단위 테스트 수행<br/>- 빠른 웹 계층 테스트 필요 시       |

이는 테스트 목적에 맞는 최소한의 빈(Bean)만 로드하여, 테스트 환경을 쉽게 구성할 수 있도록 돕는다.

## 테스트 컨텍스트 최적화

하지만 편리한만큼 이를 남용하게 되면 아래의 이유로 테스트 실행 속도가 느려지는 문제가 발생할 수 있다.

- 불필요한 로드: 테스트 목적에 맞지 않는 불필요한 Bean과 컨텍스트가 로드
- 반복 되는 로드: 같은 테스트 어노테이션이더라도 반복적으로 애플리케이션 컨텍스트를 생성함

### 애플리케이션 컨텍스트가 필요한 경우만 로드

통합 테스트가 꼭 필요한 상황이 아니라면, `@SpringBootTest` 대신 특정 계층만 테스트하는 슬라이스 테스트(Slice Test) 애노테이션을 사용하는 것이 좋다.

- 컨트롤러 로직만 검증 시: `@WebMvcTest` 사용
- 리포지토리 쿼리 검증 시: `@DataJpaTest` 사용
- Spring과 무관한 단순 로직 검증 시: Junit이나 Mockito만 사용하여 단위 테스트 수행

### 컨텍스트 캐싱 사용

스프링은 기본적으로 애플리케이션 컨텍스트를 캐싱하는데, 동일한 설정을 사용하는 테스트는 동일한 컨텍스트를 재사용한다.

```java
// OrderServiceTest.java
@SpringBootTest
public class OrderServiceTest {
    // ... (컨텍스트 A 생성 및 캐싱)
}

// PaymentServiceTest.java
@SpringBootTest
public class PaymentServiceTest {
    // ... (캐시된 컨텍스트 A 재사용)
}
```

하지만 테스트마다 설정이 조금이라도 다르면, 스프링은 새로운 컨텍스트를 생성한다.

```java
// OrderServiceTest.java
@ActiveProfiles("test")
@SpringBootTest
public class OrderServiceTest {
    // ... (컨텍스트 A("test" 프로필) 생성)
}

// PaymentServiceTest.java
@ActiveProfiles("dev") // 프로필이 다름
@SpringBootTest
public class PaymentServiceTest {
    // ... (컨텍스트 B("dev" 프로필) 새로 생성)
}
```

`TestContext` 프레임워크는 다음 구성 매개 변수를 사용하여 컨텍스트 캐싱을 하는데, 다를 경우 새로운 컨텍스트를 생성하게 된다.

| 항목                          | 관련 애노테이션/인자                       |
|-----------------------------|-----------------------------------|
| `locations`                 | `@ContextConfiguration` 애노테이션의 인자 |
| `classes`                   | `@ContextConfiguration` 애노테이션의 인자 |
| `contextInitializerClasses` | `@ContextConfiguration` 애노테이션의 인자 |
| `contextCustomizers`        | `ContextCustomizerFactory`에서 로드   |
| `contextLoader`             | `@ContextConfiguration` 애노테이션의 인자 |
| `parent`                    | `@ContextHierarchy`               |
| `activeProfiles`            | `@ActiveProfiles`                 |
| `propertySourceLocations`   | `@TestPropertySource`             |
| `propertySourceProperties`  | `@TestPropertySource`             |
| `resourceBasePath`          | `@WebAppConfiguration`            |

### 공통된 설정 사용

컨텍스트 캐싱을 이용하여 공통된 설정을 사용하면 컨텍스트를 재사용할 수 있어 테스트 실행 속도를 높일 수 있다.

```java
// 공통 설정 클래스
@SpringBootTest
public abstract class IntegrationTestSupport {
    // 공통 의존성, MockBean 등 정의
}

// 공통 설정을 사용하는 테스트 (컨텍스트 재사용)
public class OrderServiceTest extends IntegrationTestSupport {
    // ...
}
```

## 테스트 환경 제어

### 테스트 프로퍼티 제어

테스트 시 특정 프로퍼티 값을 변경하거나 활성 프로필을 지정할 수 있다.

- `@ActiveProfiles("test")`: `application-test.yml` (혹은 properties) 설정 활성화
- `@TestPropertySource`: 특정 테스트에서만 임시로 프로퍼티 값을 덮어쓸 때 사용
    - `properties = "feature.flag=true"`: 인라인으로 직접 값을 정의
    - `locations = "classpath:test.properties"`: 별도 프로퍼티 파일을 로드

### 테스트와 트랜잭션(@Transactional)

테스트 코드에 `@Transactional`을 사용하면, 프로덕션 코드와 다르게 동작한다.

- 기본 동작: 각 테스트 메서드 종료 시, 트랜잭션이 자동으로 롤백(Rollback)
- `@DataJpaTest`는 이 애노테이션을 기본적으로 포함

### 웹 환경 테스트 제어

`@SpringBootTest`는 `webEnvironment` 속성으로 실제 웹 서버(톰캣) 구동 방식을 정한다.

- `MOCK`(기본값): 실제 서버를 띄우지 않고, 서블릿 컨테이너를 시뮬레이션
    - `MockMvc`를 사용하여 컨트롤러 계층 테스트 가능
- `RANDOM_PORT` / `DEFINED_PORT`: 실제 톰캣 서버를 지정된 포트나 랜덤 포트로 구동
    - `TestRestTemplate`이나 `WebTestClient`를 사용하여 실제 HTTP 요청 가능
- `NONE`: 웹 환경을 로드하지 않음
