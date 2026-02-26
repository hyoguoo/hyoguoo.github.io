---
title: "ExecutorService"
date: 2024-03-11
lastUpdated: 2024-03-11
tags: [Java]
description: ""
---

> 스레드보다는 실행자, 테스크, 스트림을 애용하라

스레드를 직접 다루기 위해서는 예외를 위한 코드도 많이 작성해야하고, 오류가 발생하기도 쉽다.  
하지만 `java.util.concurrent` 패키지가 나오면서 스레드를 직접 다루지 않고 쉽게 작업을 처리할 수 있게 되었다.

```java
public static void main(String[] args) {
    // 작업 큐 생성(싱글 스레드로 동작)
    ExecutorService exec = Executors.newSingleThreadExecutor();
    // 싱행할 테스크 넘김
    exec.execute(runnable);
    // 실행자 종료
    exec.shutdown();
}
```

위 코드는 `ExecutorService`를 사용하여 스레드를 생성하고 실행하는 간단한 기능을 사용한 코드이다.  
그 외에 아래 기능을 제공해주고 있다.

- `get`: 특정 테스크 완료 대기
- `invokeAny`: 테스크 모음 중 아무거나 하나 완료 대기
- `invokeAll`: 테스크 모음 모두 완료 대기
- `awaitTermination`: 실행자 서비스 종료 대기

또한, 위 코드는 싱글 스레드로 동작하는 `ExecutorService`를 생성했지만, 다른 정적 팩터리 메서드를 사용하여 다양한 스레드 풀을 생성할 수 있다.

- `Executors.newSingleThreadExecutor`: 단일 스레드 풀
- `Executors.newFixedThreadPool`: 고정 크기 스레드 풀
- `Executors.newCachedThreadPool`: 캐시 스레드 풀, 가벼운 서버나 프로토타입 서버에 적합(무거운 프로덕션 서버에는 사용하지 않는 것이 좋음)
    - 요청 받은 테스크들이 큐에 쌓이지 않고 즉시 스레드에 위임돼 실행되기 때문에 가용 스레드가 없는 경우 새로운 스레드를 생성하기 때문에 무한정 스레드를 생성할 수 있음
    - 프로덕션 서버에서는 `newFixedThreadPool`을 사용하거나, `ThreadPoolExecutor`를 직접 사용하는 것이 좋음
