---
title: "CAS (Compare-And-Swap)"
date: 2025-01-24
lastUpdated: 2025-11-15
tags: [Java]
description: ""
---

CAS는 '비교 후 교체'를 의미하며, 특정 메모리 위치의 값을 예상되는 값과 비교하여, 일치할 경우에만 새로운 값으로 교체하는 원자적(atomic) 연산이다.

- 연산에 필요한 인자는 예상되는 현재 값, 새로운 값, 실제 메모리 주소 세 가지
- 메모리의 현재 값이 예상 값과 일치하는지 비교
- 일치하면 메모리 값을 새로운 값으로 교체
- 일치하지 않으면 교체를 수행하지 않음
- 이 모든 과정의 성공 여부 반환

비교와 교체 두 단계로 보이지만, 이 과정은 CPU의 특별한 명령어(instruction)를 통해 하드웨어 수준에서 하나의 원자적 연산으로 처리된다.

## Java에서의 CAS

자바는 `java.util.concurrent.atomic` 패키지를 통해 CAS 연산을 지원한다.

- CAS 연산을 Atomic 클래스의 메서드로 구현
- 각 타입에 대응하는 클래스가 제공(AtomicInteger, AtomicLong, AtomicBoolean 등)
- `compareAndSet(expectedValue, newValue)` 메서드를 통해 CAS 연산 수행

```java
public static void main(String[] args) {
    AtomicInteger atomicInt = new AtomicInteger(0);

    int expectedValue = 0;
    int newValue = 1;

    // 현재 값이 0(expectedValue)이면 1(newValue)로 교체
    boolean success = atomicInt.compareAndSet(expectedValue, newValue);

    System.out.println("CAS 성공 여부: " + success); // true
    System.out.println("현재 값: " + atomicInt.get()); // 1
}
```

### Atomic과 volatile

Atomic 클래스는 내부적으로 `volatile` 키워드를 사용하여 멤버 변수를 선언한다.

```java
public class AtomicInteger extends Number implements java.io.Serializable {

    private static final long serialVersionUID = 6214790243416807050L;

    // ...

    private volatile int value;

    // ...
}
```

volatile 키워드는 메모리 가시성을 보장하기 위해 사용되는데, 이는 CAS 연산이 올바르게 동작하기 위한 필수 조건이다.

- volatile 키워드를 사용하면, 변수의 값을 읽을 때 CPU 캐시가 아닌 메인 메모리에서 읽어오게 됨
- 멀티스레드 환경에서 모든 스레드가 항상 최신 값을 읽을 수 있도록 보장
- CAS 연산은 비교와 교체를 하는 동안 메모리 값이 정확해야 하므로, 메모리 가시성이 보장되어야 함

### vs 락 기반 동기화

여러 스레드가 공유 자원에 접근할 때, 동기화 방식은 크게 락(Lock) 기반 방식과 CAS 기반 방식으로 나눌 수 있다.

- CAS 방식: 간단한 연산과 충돌이 적은 환경에 적합 / 충돌 발생 시 재시도로 인해 성능 저하 가능
- 락 기반: 복잡한 동기화 로직이나 충돌이 빈번한 환경에 적합 / 락 획득 과정에서 경합과 대기 발생 가능

|     특징     |    락(Lock) 방식    | CAS(Compare-And-Swap) 방식 |
|:----------:|:----------------:|:------------------------:|
|   접근 방식    | 비관적(pessimistic) |     낙관적(optimistic)      |
|   동작 원리    |  락 획득 후 데이터 접근   |    값 비교 후 조건 만족 시 교체     |
| 복잡한 동기화 처리 |        적합        |           부적합            |
|  충돌 시 처리   |        대기        |           재시도            |
