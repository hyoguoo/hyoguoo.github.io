---
title: "WebFlux in API Gateway"
date: 2025-10-02
lastUpdated: 2025-10-11
tags: [Spring]
description: ""
---

API Gateway의 주된 역할은 요청을 받아서 내부 서비스로 '전달'하고, 그 응답을 다시 클라이언트에게 '전달'하는 것이다.

## API Gateway에서 Non-Blocking 방식이 중요한 이유

API Gateway 작업 특성상 CPU 집약적인 계산보다는 대부분 I/O(네트워크 입출력) 작업에 해당한다.

- I/O Bound 작업의 특성
    - 요청을 받고 내부 서비스를 호출하면, 게이트웨이는 내부 서비스로부터 응답이 올 때까지 대기
    - 기존의 블로킹(Blocking) 방식에서는 이 '대기' 시간 동안 요청을 처리하던 스레드는 계속해서 대기
    - 많은 동시 요청이 들어올 경우, 대기하는 스레드 수가 급격히 증가하여 대규모 스레드 풀이 필요
- Non-Blocking 방식의 이점
    - WebFlux와 같은 논블로킹 모델에서는 스레드가 대기하지 않음
    - 내부 서비스에 요청을 보낸 스레드는 결과를 기다리지 않고 즉시 다른 요청을 처리하러 복귀
    - 나중에 내부 서비스로부터 응답이 오면, 이벤트 루프가 이를 감지하여 응답을 클라이언트에게 전달하는 후속 작업 처리
    - 이로 인해 소수의 스레드만으로도 수많은 동시 요청을 효율적으로 처리

## Spring Cloud Gateway에서의 WebFlux

Spring Cloud Gateway는 Spring 생태계에서 MSA를 위한 API Gateway 스택으로, Spring WebFlux 위에서 구축되었다.

- 기술 스택: Spring Boot, Spring WebFlux, Project Reactor 기반으로, Netty를 내장 서버로 사용하여 논블로킹 시스템으로 동작
- 동작 원리
    1. 클라이언트의 요청이 들어오면, Netty의 이벤트 루프 스레드가 요청 수신
    2. Spring Cloud Gateway에 정의된 다양한 필터(Filter)와 라우팅 규칙(Route)들이 순차적으로 적용(인증, 로깅, 헤더 변조 등의 기능을 수행)
    3. 모든 처리는 리액티브 스트림(Mono, Flux) 파이프라인 위에서 처리
    4. 라우팅 규칙에 따라 논블로킹 HTTP 클라이언트를 사용하여 내부 마이크로서비스를 비동기적으로 호출
    5. 내부 서비스로부터 응답이 오면, 다시 리액티브 파이프라인을 통해 응답 필터들이 적용된 후 클라이언트에게 전달

## 적은 수의 스레드로 높은 처리량과 확장성을 확보하는 원리

- 스레드의 효율적 사용: 스레드가 I/O 작업을 기다리는 idle 시간이 거의 없어, 스레드를 항상 실제 작업을 처리에 사용
- 낮은 오버헤드
    - 스레드 수가 적기 때문에 스레드를 생성하고 전환하는 데 드는 컨텍스트 스위칭 비용 감소
    - 스레드 하나당 차지하는 메모리 공간(Thread Stack)도 절약되어 전체적인 시스템 리소스 사용량 감소

## 리액티브 체인으로 구현된 필터 실행

블로킹 방식의 필터와 가장 큰 차이를 보이는 핵심으로, 전통적인 필터는 단순히 다음 필터를 순차적으로 호출하지만, 리액티브 필터 체인은 `Mono`와 같은 리액티브 타입으로 연결된다.

- 각 필터는 `filter(ServerWebExchange exchange, GatewayFilterChain chain)` 메서드 구현
    - `ServerWebExchange` 매개변수: HTTP 요청과 응답에 대한 모든 정보를 포함
    - `chain` 매개변수: '다음 필터'를 포함한 나머지 체인 전체를 의미
- 'Pre' 필터 로직: `chain.filter(exchange)`를 호출하기 전의 작업
    - 다운스트림 서비스로 요청이 전달되기 전에 실행
    - 주로 요청 헤더를 추가하거나 인증을 수행하는 역할
- 'Post' 필터 로직: `chain.filter(exchange)`가 반환하는 `Mono<Void>`에 `.then()`, `flatMap` 같은 연산자를 사용하여 연결된 후속 작업
    - 다운스트림 서비스로부터 응답이 돌아온 후에 실행
    - 주로 응답 헤더를 추가하거나 응답 본문을 로깅하는 역할

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    // === 'Pre' 필터 ===
    ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
            .headers(h -> h.add("X-Request-ID", "some-value"))
            .build();

    ServerWebExchange mutatedExchange = exchange.mutate()
            .request(mutatedRequest)
            .build();

    // 체인 진행(논블로킹)
    return chain.filter(mutatedExchange)
            // === 'Post' 필터 ===
            .then(Mono.fromRunnable(() -> {
                ServerHttpResponse response = mutatedExchange.getResponse();
            }));
}
```

## 동작 과정

동작 과정은 내부적으로 Project Reactor와 Netty에 기반한 비동기 논블로킹(Asynchronous Non-Blocking) 모델을 사용하여, 높은 처리량과 낮은 지연 시간을 제공한다.

1. 클라이언트의 요청이 들어오면, `DispatcherHandler` 가 가장 먼저 요청을 받음
2. 요청은 `RoutePredicateHandlerMapping` 을 통해 어떤 `Route`와 일치하는지 검사(Predicate 평가)
3. 일치하는 `Route`를 찾으면, 요청은 `FilteringWebHandler` 로 전달되어 해당 `Route`에 정의된 필터 체인을 순차적으로 실행
4. 필터 체인은 Pre-Filter(요청 전달 전)와 Post-Filter(응답 받은 후)로 나뉘어 동작
5. 모든 필터링이 완료되면, 요청은 실제 마이크로서비스로 프록시되고, 응답 역시 필터 체인을 역순으로 거쳐 클라이언트에게 전달

## 리액티브 스트림으로서의 요청 처리

Spring Cloud Gateway는 요청과 응답을 단일 데이터가 아닌, 이벤트의 연속적인 흐름, 즉 리액티브 스트림(Reactive Stream)으로 처리한다.

1. 스트림 생성(Publisher 생성)
    - 클라이언트 요청이 들어오면, Netty 서버는 이를 I/O 작업이 처리되는 이벤트 루프(Event Loop)에 할당
    - 요청은 즉시 처리되지 않고, `ServerHttpRequest` 객체를 포함한 `Mono<ServerWebExchange>` 라는 스트림 객체로 포장
        - `Mono` 객체는 "요청을 어떻게 처리할지"에 대한 설계도(Publisher)이며, 아직 실행되지 않은 상태
2. 처리 파이프라인 정의(Operator 체이닝)
    - `DispatcherHandler` 는 이 설계도를 받아, 어떤 `Route`로 보낼지 결정(`Predicate` 평가)
    - 해당 `Route`에 필요한 필터(`GatewayFilter`,`GlobalFilter`)들을 순서대로 연결하여 파이프라인을 완성
3. 구독과 실행(Subscription & Execution)
    - 정의된 파이프라인의 맨 끝에서 `.subscribe()` 가 호출되는 순간, 실제 데이터 흐름이 시작
    - 요청 데이터는 Pre-Filter 체인을 순서대로 통과한 후, 실제 마이크로서비스로 비동기적으로 전달
    - 이때 요청을 보낸 스레드는 결과를 기다리며 멈추지 않고(Non-Blocking) 즉시 반환되어 다른 요청 처리
4. 비동기 응답 처리(Asynchronous Response)
    - 다운스트림 서비스로부터 응답이 오면, 이벤트로 간주되어 파이프라인을 역방향으로 타고 흐르면서 Post-Filter 로직이 적용
    - 응답 데이터는 Post-Filter 체인을 통과하며 가공된 후, 최종적으로 클라이언트에게 전달

이처럼 모든 요청 처리 과정은 하나의 거대한 파이프라인(Pipeline)을 정의하는 것과 같으며, 실제 데이터 흐름은 마지막에 구독(subscribe)이 일어날 때 시작된다.
