---
title: "Scheduler & Thread Model"
date: 2025-10-02
lastUpdated: 2025-10-02
tags: [Spring]
description: "리액터의 subscribeOn과 publishOn 연산자의 스레드 적용 범위를 비교하고 boundedElastic·parallel 스케줄러를 활용한 블로킹 코드 격리 방법을 설명한다."
---

리액티브 스트림즈 명세 자체는 스레딩 모델을 강제하지 않아 특정 스레드에서 코드가 실행되도록 보장하지 않으며, 이는 개발자가 직접 관리해야 하는 영역이다.

- 기본적으로 리액터(Reactor)의 연산자 체인은 이전 단계의 신호를 발생시킨 스레드와 동일한 스레드에서 계속 실행
- 스케줄러는 이러한 실행 흐름을 의도적으로 다른 스레드로 전환할 때 사용

Spring WebFlux에서는 `Scheduler`를 통해 이 문제를 해결하며, 실행 컨텍스트(스레드)를 손쉽게 전환하고 제어할 수 있는 기능을 제공한다.

## 핵심 연산자: `publishOn` vs `subscribeOn`

`publishOn`과 `subscribeOn`는 스레드를 전환하는 두 핵심 연산자이다.

### `subscribeOn(Scheduler)`

리액티브 스트림은 `subscribe()` 호출 시 구독 신호가 체인의 가장 아래에서부터 위로(Upstream) 전파되면서 시작된다.

- 영향 범위: 구독 시작점과 데이터 소스를 포함한 업스트림 전체. `publishOn`으로 다른 스레드가 지정되기 전까지 영향
- 사용 횟수: 체인 내에 여러 번 선언되어도, 소스에 가장 가까운 첫 번째(맨 위쪽) `subscribeOn`만 유효
- 용도: 주로 블로킹 I/O 작업이나 오래 걸리는 초기화 작업을 별도의 스레드 풀에서 실행하여 기본 스레드(예: Netty 이벤트 루프)를 차단하지 않기 위해 사용

이처럼 `subscribeOn`은 이 구독 신호 전파 및 소스의 데이터 발행을 어떤 스레드에서 수행할지 결정한다.

### `publishOn(Scheduler)`

`publishOn`은 자신보다 아래에 있는, 즉 다운스트림(Downstream) 연산자들의 실행 스레드를 지정된 스케줄러의 스레드로 변경한다.

- 영향 범위: `publishOn` 호출 이후의 모든 다운스트림 연산자
- 사용 횟수: 체인 내에서 여러 번 사용하여 각기 다른 스레드 컨텍스트로 전환 가능
- 용도: 특정 연산(예: CPU 집약적 작업)을 별도의 스레드에서 처리하고 싶을 때, 혹은 특정 스레드 컨텍스트로 다시 돌아와야 할 때 사용

연산자 체인에 스레드 경계를 만드는 것과 같으며, `publishOn`은 업스트림(Upstream)으로부터 신호(`onNext`, `onComplete`, `onError`)를 받아, 다시 전파(emit)한다.

| 항목     | `subscribeOn()`          | `publishOn()`                      |
|:-------|--------------------------|------------------------------------|
| 적용 범위  | 스트림 전체의 시작 스레드(Upstream) | 자신 이후의 연산자들(Downstream)의 실행 스레드 지정 |
| 위치 민감도 | 소스 근처 첫 선언만 적용           | 해당 지점에서 스레드 경계 생성                  |
| 주요 용도  | 블로킹 소스/초기화를 논블로킹 환경으로 격리 | 연산 특성에 따라 실행 스레드를 분리/전환            |

## 코드 예제

```java
public class SchedulerExample {

    public static void main(String[] args) throws InterruptedException {
        Flux.range(1, 3)
                // 구독 및 업스트림 연산(range, map 1)을 boundedElastic 스레드에서 실행
                .subscribeOn(Schedulers.boundedElastic())
                .map(i -> {
                    System.out.println("[map 1] on thread: " + Thread.currentThread().getName());
                    return i * 2;
                })
                .map(i -> {
                    System.out.println("[map 2] on thread: " + Thread.currentThread().getName());
                    return "Value " + i;
                })
                // 이 지점부터 다운스트림 연산을 parallel 스레드에서 실행
                .publishOn(Schedulers.parallel())
                .doOnNext(val -> {
                    System.out.println("[doOnNext] on thread: " + Thread.currentThread().getName());
                })
                .subscribe();
    }
}
```

## 주요 스케줄러 종류

Project Reactor는 `Schedulers` 클래스를 통해 미리 정의된 스케줄러들을 제공한다.

- `Schedulers.parallel()`: CPU 코어 수만큼의 스레드를 가진 고정된 스레드 풀
    - CPU 집약적인 계산 작업에 최적화
- `Schedulers.boundedElastic()`: 필요에 따라 스레드를 동적으로 생성하고 재사용하는 스레드 풀
    - 스레드 수에 상한선 존재
    - 블로킹(Blocking) I/O 작업을 처리할 때 사용하기에 적합
- `Schedulers.single()`: 단 하나의 스레드를 재사용하는 스케줄러
    - 순서가 보장되어야 하는 작업 처리에 적합

-----

## Spring WebFlux에서의 활용

일반적인 WebFlux 컨트롤러에서는 스케줄러를 직접 다룰 일이 거의 없는데, 이벤트 루프 스레드에서 코드를 실행하기 때문이다.

하지만 레거시 블로킹(Blocking) 코드를 WebFlux 환경에서 호출해야 할 경우 스케줄러 사용은 필수적이다. 블로킹 코드가 WebFlux의 이벤트 루프 스레드를 점유하는 것을 막아야 하기 때문이다.

```java
// 레거시 JDBC 호출과 같은 블로킹 메서드
private User findUserByIdBlocking(String id) {
    // 이 스레드는 DB 응답이 올 때까지 멈춤(Block)
    return user;
}

// WebFlux에서 안전하게 호출하는 방법
public Mono<User> findUser(String id) {
    // 1. 블로킹 호출을 Mono로 래핑
    return Mono.fromCallable(() -> findUserByIdBlocking(id))
            // 2. 블로킹 작업을 위한 별도의 스레드 풀(boundedElastic)에서 실행하도록 지정
            .subscribeOn(Schedulers.boundedElastic());
}
```

`Schedulers.boundedElastic()`를 사용하면 `findUserByIdBlocking` 메서드가 이벤트 루프 스레드를 막지 않고, 블로킹 I/O 전용 스레드에서 안전하게 실행되도록 격리할 수 있다.

### WebFlux의 스레드 모델

Spring WebFlux는 기본적으로 적은 수의 고정된 스레드를 사용하여 수많은 동시 요청을 처리한다.

- 기본 스레드: Netty를 기본 서버로 사용하며, CPU 코어 수에 맞춰 생성된 이벤트 루프(Event Loop) 스레드를 사용
- 동작 원칙: 이벤트 루프 스레드는 절대 차단(block)되지 않아야 하며, I/O 작업이 완료될 때까지 기다리지 않고 다른 요청을 계속 처리
    - 만약 하나의 이벤트 루프 스레드가 `Thread.sleep()`, 블로킹 DB 호출 등으로 멈추게 되면, 해당 스레드에 할당된 모든 요청의 처리가 지연
    - 결국 시스템 전체의 처리량과 응답성을 심각하게 저하시키는 원인

### 스레드 사용 방식

실무에서는 다양한 상황에 맞춰 `Scheduler`를 전략적으로 사용해야 한다.

- 논블로킹 작업: 별도의 스케줄러를 지정할 필요가 없이, WebFlux의 기본 스레드(이벤트 루프)를 그대로 사용
- 블로킹 I/O (예: R2DBC가 아닌 JDBC, 외부 API 동기 호출)
    - `subscribeOn(Schedulers.boundedElastic())`을 사용
    - `boundedElastic` 스케줄러는 블로킹 I/O 작업을 위해 특별히 설계
    - 필요에 따라 스레드를 생성하지만, 무한정 생성되는 것을 막기 위해 상한선이 있으며 유휴 스레드는 자동으로 제거
    - 이벤트 루프 스레드가 아닌 별도의 스레드에서 블로킹 작업을 처리함으로써 전체 시스템의 반응성 유지 가능
- CPU 집약적인 계산 작업
    - `publishOn(Schedulers.parallel())` 사용
    - `parallel` 스케줄러는 CPU 코어 수만큼의 스레드를 가진 고정된 스레드 풀 제공
    - 계산이 많은 작업을 이벤트 루프에서 분리하여 다른 요청 처리에 영향을 주지 않도록 함
