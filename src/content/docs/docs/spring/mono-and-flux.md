---
title: "Mono & Flux"
date: 2025-10-02
lastUpdated: 2026-04-16
tags: [ Spring ]
description: "Project Reactor의 핵심 Publisher 타입인 Mono와 Flux의 신호 방식과 map·flatMap·filter 등 주요 연산자, 구독 시 실행되는 지연 평가 방식을 정리한다."
---

Mono와 Flux는 Spring WebFlux가 기반으로 하는 Project Reactor 라이브러리의 핵심 Publisher 타입이다.

- 반응형 스트림(Reactive Stream)에서 데이터의 흐름을 정의하는 역할 담당
- 모든 비동기 작업은 이 두 타입을 통해 표현되고 처리됨
- 두 타입 모두 Reactive Streams 명세의 `Publisher<T>` 인터페이스를 구현

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

### 생성 (Creation)

|           연산자            |                     설명                     |
|:------------------------:|:------------------------------------------:|
|      `just(value)`       |               정적인 값으로 즉시 생성                |
| `fromIterable(iterable)` |               컬렉션을 스트림으로 변환                |
|  `range(start, count)`   |                  정수 범위 생성                  |
|    `defer(supplier)`     | 구독 시점에 Publisher를 새로 생성 (구독마다 다른 결과 필요할 때) |
| `fromCallable(callable)` |           블로킹 호출을 Mono로 감쌀 때 사용            |

### 변환 (Transformation)

|       연산자       |                       동작                        |                   사용 시점                   |
|:---------------:|:-----------------------------------------------:|:-----------------------------------------:|
|    `map(fn)`    |            동기적인 1:1 변환, `A`를 `B`로 매핑            |             변환 함수가 가볍고 동기적일 때             |
|  `flatMap(fn)`  | 각 요소를 새 `Mono`/`Flux`로 변환 후 평탄화, 결과는 도착 순서대로 병합 | 독립적인 비동기 호출(예: `User`로 `Order` 조회), 순서 무관 |
| `concatMap(fn)` |   `flatMap`과 같지만 내부 Publisher를 순차 구독하여 순서 보존    |             동시성보다 순서가 중요한 경우              |
| `switchMap(fn)` |     새 요소가 오면 이전 내부 Publisher를 취소하고 새 것으로 교체     |        검색 자동완성처럼 마지막 입력만 유효한 시나리오         |

### 필터링 (Filtering)

|          연산자          |         설명          |
|:---------------------:|:-------------------:|
|  `filter(predicate)`  | 주어진 조건을 만족하는 요소만 통과 |
| `take(n)` / `skip(n)` |   처음 n개를 받거나 건너뜀    |
|     `distinct()`      |        중복 제거        |

### 조합 (Combining)

|      연산자      |                       설명                        |
|:-------------:|:-----------------------------------------------:|
|  `zip(...)`   | 여러 스트림의 요소를 하나씩 짝지어 새 스트림 생성, 모든 소스가 도착할 때까지 대기 |
| `merge(...)`  |             여러 스트림을 도착 순서대로 하나로 합침              |
| `concat(...)` |            첫 스트림이 완료된 뒤 다음 스트림을 이어붙임            |

### 에러 처리 (Error Handling)

리액티브 스트림에서 `onError`는 종료 신호이므로, 복구가 필요한 경우 명시적인 연산자를 사용해야 한다.

|          연산자           |                     설명                     |
|:----------------------:|:------------------------------------------:|
| `onErrorReturn(value)` |            에러 발생 시 지정한 기본값으로 대체            |
|  `onErrorResume(fn)`   | 에러를 받아 대체 Publisher로 폴백 (예: 캐시 실패 시 DB 조회) |
|       `retry(n)`       |               에러 시 n번까지 재구독                |
|    `doOnError(fn)`     |      에러 발생을 관찰만 하고 신호는 그대로 전파 (로깅 용도)      |

```java
void main() {
    Flux.just(1, 2, 3).map(i -> "Number " + i); // Flux<String>으로 변환
    userFlux.flatMap(user -> orderService.getOrders(user.getId())); // Flux<Order>로 변환
    Flux.range(1, 10).filter(i -> i % 2 == 0); // 2, 4, 6, 8, 10만 방출

    // 에러 시 캐시로 폴백
    fetchFromDb(id)
            .onErrorResume(ex -> fetchFromCache(id));
}
```

### 변환 연산자 선택 기준

|     연산자     |  동시성   | 순서 보장 |         사용 시점          |
|:-----------:|:------:|:-----:|:----------------------:|
|    `map`    | 해당 없음  |  보장   |       동기적 1:1 변환       |
|  `flatMap`  |   높음   |  미보장  | 독립적인 비동기 호출, 빠른 처리량 우선 |
| `concatMap` | 낮음(순차) |  보장   |   순서가 결과의 의미를 좌우할 때    |
| `switchMap` | 1개 유지  | 마지막만  |    최신 입력만 유효한 시나리오     |

## Assembly Time vs Subscription Time

리액터의 연산자 체인은 두 단계의 시점으로 분리되어 동작한다.

- Assembly Time(조립 시점): `map()`, `flatMap()` 등을 호출해 연산자 체인을 구성하는 시점
    - 단순히 실행 계획(Operator 그래프)을 만들 뿐, 실제 데이터는 흐르지 않음
    - 람다 안의 코드는 아직 실행되지 않음
- Subscription Time(구독 시점): `subscribe()` 호출로 실제 신호가 흐르기 시작하는 시점
    - 소스 Publisher부터 데이터가 발행되며, 등록된 람다가 비로소 실행
    - 같은 체인을 두 번 구독하면 두 번 실행됨

## 구독(Subscribe)하기 전에는 아무 일도 일어나지 않음

`Mono`나 `Flux`를 생성하고 연산자를 체이닝하는 것은 단지 실행 계획을 만드는 것일 뿐, 실제 데이터의 흐름은 시작되지 않는다.

```java
void main() {
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
