---
title: "Concurrent Utilities"
date: 2024-03-12
lastUpdated: 2025-02-20
tags: [Java]
description: "wait/notify 대신 java.util.concurrent 패키지의 동시성 컬렉션과 CountDownLatch 등의 동기화 유틸리티를 사용해야 하는 이유를 정리한다."
---

> wait와 notify보다는 동시성 유틸리티를 애용하라

`wait`와 `notiy`는 고수준의 동시성 유틸리티가 지원하기 이전엔 잘 알아둬야 했지만, 올바르게 사용하기 까다롭고 동시성 유틸리티가 지원하는 현 시점에서는 사용하지 않는 것이 좋다.(유틸리티 사용 권장)
`java.util.concurrent` 패키지에서 제공하는 고수준 유틸리티는 세 가지 범주로 나눌 수 있다.

- 실행자 프레임워크: 작업을 비동기적으로 실행할 수 있게 해준다.(`ExecutorService` 인터페이스와 `ThreadPoolExecutor` 클래스를 포함한 프레임워크)
- 동시성 컬렉션: 동시성을 지원하는 컬렉션을 제공한다.(`ConcurrentHashMap`, `CopyOnWriteArrayList` 등)
    - 내부에서 동기화를 수행하기 때문에 동시성을 무력화하는 것은 불가능하고, 외부 락을 추가로 사용하면 성능이 저하된다.
    - 여러 메서드를 원자적으로 묶어 호출하는 것이 불가능하다.
    - 때문에 여러 기본 동작을 하나의 동작으로 묶는 상태 의존적 수정 메서드들이 추가됬어다.(동시성 컬렉션 뿐만 아니라 일반 컬렉션에서도 사용 가능)
- 동기화 장치: 스레드가 다른 스레드를 기다릴 수 있게 하여, 작업을 조율할 수 있게 해준다.(`CountDownLatch`, `Semaphore`, `Phaser` 등)

## 동기화 장치를 사용한 예시

동기화 장치를 사용하면, `wait`, `notify`를 이용하는 것보다 더 간단하게 동시성을 다룰 수 있다.  
아래의 예시는 `CountDownLatch`를 사용하여 동작들을 동시에 시작해 모두 완료하는 데 걸리는 시간을 측정하는 메서드이다.

```java
import java.util.concurrent.CountDownLatch;

public class Test {

    // 동작들을 동시에 시작해 모두 완료하는 데 걸리는 시간을 측정하는 메서드
    public static long time(Executor executor, int concurrency, Runnable action)
            throws InterruptedException {
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(concurrency);

        for (int i = 0; i < concurrency; i++) {
            // concurrency만큼 작업자 스레드를 생성
            executor.execute(() -> {
                // 타이머에 준비 완료 신호를 보냄
                ready.countDown();
                try {
                    // 모든 작업자 스레드가 준비될 때까지 기다림
                    start.await();
                    action.run();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    // 타이머에 작업 완료 신호를 보냄
                    done.countDown();
                }
            });
        }

        ready.await(); // 모든 작업자가 준비될 때까지 기다림
        long startNanos = System.nanoTime();
        start.countDown(); // 작업자들을 깨움
        done.await(); // 모든 작업자가 작업을 완료할 때까지 기다림
        return System.nanoTime() - startNanos;
        // nanoTime이 currentTimesMillis보다 더 정확하고, 시스템의 실시간 시계 시간 보정에 영향을 받지 않음
    }
}
```

코드의 흐름은 다음과 같다.

1. `ready.countDown()`로 작업자 스레드가 준비됨을 알림
2. `start.await()`로 모든 작업자 스레드가 준비될 때까지 기다림(`start.countDown()`을 대기)
3. `read.await()`로 모든 작업자 스레드가 준비될 때까지 기다림
4. `done.countDown()`으로 2번에서 대기한 작업자 스레드를 깨움
5. `done.await()`로 모든 작업자 스레드가 작업을 완료할 때까지 기다림
6. `action.run()`으로 작업을 수행
7. `done.countDown()`으로 작업을 완료함을 알림
8. 모든 작업이 완료되어 `done.await()`가 풀리면 `System.nanoTime() - startNanos`를 반환

## `wait`와 `notify`

`wait`와 `notify`는 고수준 동시성을 사용할 수 있는 상황에선 전혀 고려할 필요가 없으며, 만약 레거시 코드를 다뤄야 한다면, 아래의 규칙을 따르고 올바르게 사용하는 방법을 알아두는 것이 좋다.

- `wait`는 반드시 대기 반복문(`while` 루프 사용) 안에서 호출해야 한다.
- 일반적으로 `notify`보다는 `notifyAll`을 사용하는 것이 좋다.
