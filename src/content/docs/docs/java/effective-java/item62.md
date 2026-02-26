---
title: "Avoid String Type"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 다른 타입이 적절하다면 문자열 사용을 피하라

문자열은 자바에서 잘 지원해주기 떄문에 의도하지 않은 용도로 사용하기 쉽기 때문에 적합하지 않은 용도로 사용할 수 있다.  
문자열은 다른 값 타입을 대신하기에는 훨씬 무겁고, 덜 유연하고, 덜 읽기 쉽기 때문에 가능하다면 적절한 타입으로 변환해서 사용하는 것이 좋다.

- 수치형인 경우: int, float, BigInteger, BigDecimal 등 적당한 수치 타입으로 변환
- 질문의 답인 경우: 열거 타입이나 boolean으로 변환
- 혼합 타입인 경우: 적절한 전용 클래스를 작성

다음은 권한을 문자열로 표현하여 부적절하게 사용한 예이다.

```java
public class ThreadLocal {
    private ThreadLocal() {
    }

    // 현재 스레드의 값을 키로 구분해 저장
    public static void set(String key, Object value);

    // 현 스레드의 값 반환
    public static Object get(String key);
}
```

위 코드는 문자열 키가 전역 이름 공간에서 공유되는데, 키 이름으로 고유한 값이 아닌 같은 문자열을 사용하면 의도치 않게 값이 덮어쓰여지거나 서로 공유될 수 있다.  
이렇게 문자열을 사용하는 것보다는 다음과 같이 전용 클래스를 작성하여 사용하는 것이 좋다.

```java
public final class ThreadLocal {
    private ThreadLocal() {
    }

    public static class Key { // (권한)
        Key() {
        }
    }

    // 위조 불가능한 고유 키를 생성
    public static Key getKey() {
        return new Key();
    }

    public static void set(Key key, Object value);

    public static Object get(Key key);
}
```

## (번외)위 코드 개선

위 코드는 문자열 기반으로 작성된 문제를 해결해주지만 다시 아래와 같이 개선할 수 있다.

- set/get 정적 메서드를 Key 클래스의 인스턴스 메서드로 변경

```java
public final class ThreadLocal {
    private ThreadLocal() {
    }

    public static class Key {
        Key() {
        }

        // 현재 스레드의 값을 이 키로 구분해 저장
        public void set(Object value);

        // 현재 스레드의 값 반환
        public Object get();
    }

    public static Key getKey() {
        return new Key();
    }
}
```

- ThreadLocal 클래스의 역할이 없으므로 Key 클래스를 제거하고 ThreadLocal 클래스에 통합

```java
public final class ThreadLocal<T> {
    public ThreadLocal() {
    }

    public void set(T value);

    public T get();
}
```

- 매개변수화 타입을 사용하여 타입 안정성을 높임

```java
public final class ThreadLocal<T> {
    public ThreadLocal() {
    }

    public void set(T value);

    public T get();
}
```
