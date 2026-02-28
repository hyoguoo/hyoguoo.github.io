---
title: "Mono & Flux"
date: 2025-10-02
lastUpdated: 2025-10-02
tags: [Spring]
description: "Project Reactor의 핵심 Publisher 타입인 Mono와 Flux의 신호 방식과 map·flatMap·filter 등 주요 연산자, 구독 시 실행되는 지연 평가 방식을 정리한다."
---

Mono와 Flux는 Spring WebFlux가 기반으로 하는 Project Reactor 라이브러리에서 사용하는 핵심 Publisher 타입입니다.

- 이 둘은 반응형 스트림(Reactive Stream)에서 데이터의 흐름을 정의하는 역할
- 모든 비동기 작업은 이 두 타입을 통해 표현되고 처리됨

## Mono

Mono는 0개 또는 최대 1개의 결과만을 방출하는 Publisher이다.

- 신호(Signal)
    - `onNext(T)`: 데이터를 1개 전달(최대 한 번 발생)
    - `onComplete()`: 모든 작업이 성공적으로 완료되었음을 알림(`onNext` 이후 또는 단독으로 발생)
    - `onError(Throwable)`: 작업 중 에러 발생을 알림
- 주요 사용 사례
    - ID로 단일 데이터 조회 (`findById`)
    - 데이터 생성, 수정, 삭제 후 결과 반환
    - 총 개수 세기 (`count`)

```java
// "Hello"라는 단일 데이터를 포함하는 Mono 생성
Mono<String> monoJust = Mono.just("Hello");

// 데이터 없이 작업 완료(onComplete) 신호만 보내는 Mono 생성
Mono<Void> monoEmpty = Mono.empty();

// 에러(onError) 신호만 보내는 Mono 생성
Mono<String> monoError = Mono.error(new RuntimeException("Error occurred"));
```

## Flux

Flux는 0개부터 N개까지, 여러 개의 결과를 스트림 형태로 방출하는 Publisher이다.

- 신호(Signal)
    - `onNext(T)`: 데이터를 1개 전달(여러 번 발생 가능)
    - `onComplete()`: 모든 데이터 스트림이 성공적으로 완료되었음을 알림
    - `onError(Throwable)`: 스트림 처리 중 에러 발생을 알림
- 주요 사용 사례
    - 여러 개의 데이터 목록 조회 (`findAll`)
    - 데이터베이스 커서나 메시지 큐로부터 데이터 스트리밍
    - 실시간 이벤트 스트림 (예: 주식 시세, 알림)

```java
// 1, 2, 3, 4, 5 라는 5개의 데이터를 순차적으로 방출하는 Flux 생성
Flux<Integer> fluxJust = Flux.just(1, 2, 3, 4, 5);

// List로부터 Flux 생성
List<String> names = List.of("Alice", "Bob", "Charlie");
Flux<String> fluxFromIterable = Flux.fromIterable(names);
```

## 핵심 연산자

Mono와 Flux는 데이터를 가공, 필터링, 조합하기 위한 풍부한 연산자를 제공하며, 이 연산자들은 체인 형태로 연결하여 데이터 파이프라인을 구성할 수 있다.

- 생성(Creation): `just()`, `fromIterable()`, `range()`
- 변환(Transformation)
    - `map()`: 동기적인 1:1 변환
        - `A` 타입의 요소를 `B` 타입으로 변환
    - `flatMap()`: 비동기적인 1:N 변환
        - 각 요소를 새로운 `Mono`나 `Flux`로 변환 후, 그 결과를 하나의 스트림으로 평탄화(예: `User` 객체로 `Order` 목록을 조회)
- 필터링(Filtering)
    - `filter()`: 주어진 조건(Predicate)을 만족하는 요소만 통과시킴
- 조합(Combining)
    - `zip()`: 여러 스트림의 요소를 하나씩 짝지어 새로운 스트림 생성
    - `merge()`: 여러 스트림을 도착하는 순서대로 하나의 스트림으로 합침

```java
public static void main(String[] args) {
    Flux.just(1, 2, 3).map(i -> "Number " + i); // Flux<String>으로 변환
    userFlux.flatMap(user -> orderService.getOrders(user.getId())); // Flux<Order>로 변환
    Flux.range(1, 10).filter(i -> i % 2 == 0); // 2, 4, 6, 8, 10만 방출
}
```

## 구독(Subscribe)하기 전에는 아무 일도 일어나지 않음

`Mono`나 `Flux`를 생성하고 연산자를 체이닝하는 것은 단지 실행 계획을 만드는 것일 뿐, 실제 데이터의 흐름은 시작되지 않는다.

```java
public static void main(String[] args) {
    Flux.range(1, 5)
            .doOnNext(num -> System.out.println("데이터 준비: " + num)) // 데이터가 흐를 때 실행
            .map(i -> "item-" + i)
            .subscribe(result -> System.out.println("최종 결과: " + result)); // 이 코드가 실행되어야 위쪽의 모든 로직이 동작
    // 데이터 준비: 1
    // 최종 결과: item-1
    // 데이터 준비: 2
    // 최종 결과: item-2
    // ...
}
```

`.subscribe()` 메서드가 호출되는 시점에 비로소 데이터가 흐르기 시작하며, Spring WebFlux에서는 프레임워크가 이 역할을 수행하므로 개발자가 직접 호출할 일은 거의 없다.
