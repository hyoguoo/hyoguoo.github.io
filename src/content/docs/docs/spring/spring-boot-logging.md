---
title: "Spring Boot Logging"
date: 2026-05-04
lastUpdated: 2026-05-04
tags: [ Spring ]
description: "Spring Boot 애플리케이션 로깅의 기본 스택(SLF4J + Logback) 구성, 로그 레벨·패턴 설정, 프로파일별 로그 분리, MDC 컨텍스트 부여와 비동기·가상 스레드 환경의 전파 주의점까지 정리한다."
---

Spring Boot는 별도 설정 없이도 표준 로깅 스택을 제공하며, 운영 수준의 컨텍스트 추적·구조화 로그까지 같은 스택 위에서 확장할 수 있다.

## 기본 로깅 스택

Spring Boot Starter는 SLF4J facade + Logback 구현체 조합을 기본으로 포함한다.

|     계층      |             역할             |                구성 요소                |
|:-----------:|:--------------------------:|:-----------------------------------:|
| facade(API) |   애플리케이션이 호출하는 추상 인터페이스    | `org.slf4j.Logger`, `org.slf4j.MDC` |
|     구현체     | 실제 로그 포맷·출력·필터링·컨텍스트 저장 담당 |       Logback (`MDCAdapter`)        |
|   기반 메커니즘   |        컨텍스트 저장 자료구조        |            `ThreadLocal`            |

- 출처는 SLF4J/Logback 라이브러리이며, Spring 프레임워크는 이를 의존하기만 함
- `org.slf4j.Logger`만 호출하면 구현체 교체(Logback ↔ Log4j2) 시에도 코드 변경 불필요
- Lombok `@Slf4j` 어노테이션으로 로거 선언을 자동 생성하는 것이 일반적

## 로그 레벨

|  레벨   |               용도               |
|:-----:|:------------------------------:|
| TRACE | 가장 세부적인 추적 정보, 운영에서는 거의 사용 안 함 |
| DEBUG |      개발 시 흐름 추적, 운영에서 OFF      |
| INFO  |  주요 비즈니스 이벤트(요청 진입, 외부 호출 결과)  |
| WARN  |  잠재적 문제, 즉시 장애는 아니지만 추적 가치 있음  |
| ERROR |      예외 발생, 알림·대응이 필요한 사건      |

- 운영 환경 기본은 INFO이며, 임시 디버깅 시에만 특정 패키지를 DEBUG로 일시 상승
- ERROR 로그는 알림 채널과 연결되는 경우가 많아 남발 시 노이즈 발생 → 진짜 예외 상황에만 사용

## 설정 방식

Spring Boot는 두 가지 위치에서 로깅 설정을 받는다.

|          위치          |                  용도                  |  적합한 시나리오   |
|:--------------------:|:------------------------------------:|:-----------:|
|  `application.yml`   |         레벨 설정·파일 경로 같은 단순 옵션         | 프로파일별 빠른 변경 |
| `logback-spring.xml` | 패턴·appender·필터·MDC 출력·환경별 분기 등 정밀 제어 | 운영 수준 로깅 정의 |

### `application.yml` 예시

```yaml
logging:
  level:
    root: INFO
    com.example.payment: DEBUG
  file:
    name: logs/app.log
  pattern:
    console: "%d{HH:mm:ss.SSS} %-5level [%X{requestId:-}] %logger{36} - %msg%n"
```

### `logback-spring.xml` 예시

```xml

<configuration>
  <springProfile name="prod">
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
      <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
    </appender>
    <root level="INFO">
      <appender-ref ref="JSON"/>
    </root>
  </springProfile>
</configuration>
```

- `logback-spring.xml`은 `logback.xml`과 달리 `<springProfile>` 등 Spring Boot 통합 기능 사용 가능
- 운영/개발 패턴 분리, JSON 인코딩 적용 같은 정밀 제어가 필요할 때 사용

## 로그 패턴

Logback 패턴 문법으로 출력 형식을 정의한다.

|         패턴         |          의미           |
|:------------------:|:---------------------:|
|     `%d{...}`      |    타임스탬프(ISO/단축 등)    |
|     `%-5level`     | 레벨(WARN/INFO 등 5칸 정렬) |
|     `%thread`      |        스레드 이름         |
|   `%logger{36}`    |     로거 이름(36자 약식)     |
|     `%X{key}`      |      MDC 컨텍스트 값       |
| `%X{key:-default}` |    MDC 키 부재 시 대체 값    |
|       `%msg`       |        로그 메시지         |
|        `%n`        |          줄바꿈          |

## 컨텍스트 부여 (MDC)

요청·사용자·트랜잭션 단위로 모든 로그 라인에 동일 식별자를 부착하는 표준 메커니즘으로, SLF4J `org.slf4j.MDC`로 정의되어 자바 로깅 생태계의 사실상 표준 인터페이스 역할을 한다.

### 동작 원리

내부 구현은 `ThreadLocal<Map<String, String>>` 기반으로, 같은 스레드 내에서만 컨텍스트가 공유된다.

- Logback 1.2.x 시대(Spring Boot 2.x)에는 `InheritableThreadLocal`을 사용해 `new Thread()`로 만든 자식 스레드에 자동 전파되던 동작이 있었음
- Logback 1.4+(Spring Boot 3.x) 이후 일반 `ThreadLocal`로 교체되어 자식 스레드 자동 전파는 더 이상 보장되지 않으므로, 비동기 전파는 이후 절의 `TaskDecorator` 같은
  명시적 패턴으로 처리해야 함

```mermaid
graph TD
    Request([요청 진입]) --> Put["Filter - MDC.put 'requestId', 'abc-123'"]
    Put --> Store[현재 스레드의 ThreadLocal 맵에 저장]
    Store --> Service[비즈니스 로직 실행]
    Service --> Log["log.info '주문 처리 시작'"]
    Log --> Pattern["Logback이 %X{requestId}로 ThreadLocal 조회"]
    Pattern --> Output["로그 출력 - requestId=abc-123 주문 처리 시작"]
    Output --> End[요청 처리 완료]
    End --> Clear["Filter finally - MDC.clear"]
```

### 주요 API

|             API             |           역할            |
|:---------------------------:|:-----------------------:|
|    `MDC.put(key, value)`    |   현재 스레드 컨텍스트에 키-값 추가   |
|       `MDC.get(key)`        |    현재 스레드의 컨텍스트 값 조회    |
|      `MDC.remove(key)`      |        특정 키만 제거         |
|        `MDC.clear()`        |   현재 스레드의 컨텍스트 전체 비움    |
| `MDC.getCopyOfContextMap()` | 컨텍스트 스냅샷 복사(다른 스레드 전파용) |

### Filter 적용 패턴

Spring Web에서는 요청 진입 시점에 MDC를 채우고 종료 시점에 비우는 것이 표준이다.

```java

@Component
public class MdcFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID = "requestId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        try {
            String requestId = Optional.ofNullable(request.getHeader("X-Request-Id"))
                    .orElseGet(() -> UUID.randomUUID().toString());
            MDC.put(REQUEST_ID, requestId);
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

- 서블릿 워커 스레드는 풀에서 재사용되므로 `clear()` 누락 시 이전 요청 컨텍스트가 다음 요청 로그에 노출
- 예외 발생 경로에서도 정리되도록 반드시 `finally`에 배치

## 비동기 전파 문제

MDC가 ThreadLocal 기반이므로 작업이 다른 스레드로 넘어가는 순간 컨텍스트가 사라진다.

|           시나리오           |                  현상                  |
|:------------------------:|:------------------------------------:|
|       `@Async` 호출        |        새 스레드에서 실행되어 MDC 비어 있음        |
| `ExecutorService.submit` |           풀 스레드에 컨텍스트 미전파            |
|   CompletableFuture 체인   |         다음 단계가 다른 스레드일 수 있음          |
|       가상 스레드(Loom)       | 가상 스레드 자체는 정상이나 작업이 별개 풀로 넘어가면 동일 문제 |

### `TaskDecorator`로 전파 해결

Spring `TaskExecutor`에 데코레이터를 등록해 작업 제출 시점에 컨텍스트 스냅샷을 떠두고 실행 시점에 복원한다.

```java
public class MdcTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        return () -> {
            try {
                if (contextMap != null)
                    MDC.setContextMap(contextMap);
                runnable.run();
            } finally {
                MDC.clear();
            }
        };
    }
}

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(new MdcTaskDecorator());
        executor.initialize();
        return executor;
    }
}
```

- 핵심은 `getCopyOfContextMap()`으로 스냅샷을 잡고, 실행 스레드에서 `setContextMap()`으로 복원, 종료 시 `clear()`
- Spring 4.3부터 `TaskDecorator` 인터페이스 제공
- 최근 자바 버전에서 preview로 제안되는 `ScopedValue`가 ThreadLocal 대안으로 거론되지만, MDC API는 여전히 ThreadLocal 기반

## 활용 시나리오

|   시나리오    |                           MDC 키 예시                            |           목적            |
|:---------:|:-------------------------------------------------------------:|:-----------------------:|
|   요청 추적   |                          `requestId`                          |  단일 요청의 모든 로그를 한 번에 모음  |
| 사용자 단위 분석 |                           `userId`                            |      특정 사용자 행동 분석       |
| 분산 추적 연동  | `traceId`, `spanId`(Micrometer Tracing + OpenTelemetry/Brave) |   마이크로서비스 간 요청 흐름 추적    |
|  멱등성 처리   |                       `idempotencyKey`                        | 결제·외부 API 재시도 시 동일 키 추적 |
|  테넌트 분리   |                          `tenantId`                           |  SaaS 환경에서 테넌트별 로그 분리   |
