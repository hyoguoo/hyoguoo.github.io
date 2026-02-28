---
title: "volatile"
date: 2025-01-07
lastUpdated: 2025-11-14
tags: [Java]
description: "Java volatile 키워드의 CPU 캐시 가시성 문제 해결 방식과 happens-before 관계, 원자성 미보장 한계를 분석한다."
---

CPU의 각 코어는 성능 향상을 위해 캐시(Cache)를 가지고 있다.

- 스레드가 특정 변수를 읽을 때, 메인 메모리에서 데이터를 가져와 자신의 캐시에 저장
- 이후 해당 캐시에서 값 조회
- 한 스레드에서 메인 메모리의 값을 변경하더라도, 다른 스레드는 자신의 캐시에 저장된 이전 값을 계속 읽어올 수 있음

이처럼 스레드 간에 변수의 값이 일치하지 않는 가시성(Visibility) 문제가 발생할 수 있다.

```java
volatile boolean v = false;
```

변수에 `volatile`을 선언하면, 해당 변수를 읽고 쓸 때 CPU 캐시를 사용하지 않고 항상 메인 메모리에 직접 접근하도록 강제한다.

- 쓰기(write): 메인 메모리에 반영
- 읽기(read): 자신의 캐시를 무효화하고 메인 메모리에서 최신 값 조회

## 원자성

`volatile`은 가시성 보장 외에, 특정 연산의 원자성(Atomicity)을 보장하는 역할을 할 수 있다.

- 자바 메모리 모델(JMM)은 `int`, `byte`, `short`, `char` 등 32비트 이하 타입의 단순 읽기/쓰기 연산은 원자적으로 처리하도록 보장
- 64비트 타입인 `long`과 `double`은 JMM 명세상, `long` 값의 쓰기(write)는 두 개의 32비트 쓰기 작업으로 나뉘어 수행

64비트 변수에 `volatile`을 선언하면, `long`과 `double` 타입의 읽기/쓰기 연산이 분리되지 않고 원자적으로 처리됨을 보장한다.

## volatile 한계와 동기화

`volatile`는 변수의 읽기/쓰기 연산만 원자화 시킬 뿐, 동기화 시키는 개념은 아니다.

```java
balance -=amount; // 읽기-수정-쓰기 연산
```

위 한 줄의 코드는 내부적으로 세 단계로 나뉜다.

1. 값 조회(Read)
2. 연산 수행(Modify)
3. 결과 저장(Write)

`volatile`을 적용하더라도 두 스레드가 동시에 `balance -= amount`를 수행하면, 두 스레드가 동일한 값을 읽어간 후 각자 연산하고 덮어쓰므로 경쟁 조건(Race Condition)이 발생한다.

## 동기화(synchronization) 보장

원자성을 보장하기 위해서는 `synchronized` 블록을 사용하여, 해당 코드 영역을 한 번에 하나의 스레드만 실행하도록 해야 한다.

- `volatile` : 해당 변수에 대한 읽기/쓰기를 원자적으로 처리
- `synchronized` : 해당 블록에 감싸진 코드를 원자적으로 처리

```java
class Example {

    volatile int balance;

    synchronized int getBalance() {
        return balance;
    }

    synchronized void withdraw(int amount) {
        balance -= amount;
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
