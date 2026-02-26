---
title: "Enum for Instance Control"
date: 2024-08-25
lastUpdated: 2024-08-25
tags: [Java]
description: ""
---

> 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라

생성자를 호출하지 못하게 막는 방식으로 인스턴스가 하나만 만들어짐을 보장할 수 있다.

```java
public class SingletonClass {

    private static final SingletonClass INSTANCE = new SingletonClass();

    private SingletonClass() {
        // ...
    }

    // ...
}
```

하지만 클래스 선언에 `implements Serializable`을 추가하면 직렬화를 통한 객체 생성이 가능해지면서 더 이상 싱글턴이 아니게 된다.

## `readResolve`를 이용한 해결 방법

`readResolve` 기능을 이용하여 `readObject`가 반환하는 인스턴스를 다른 것으로 대체하는 방식으로 해결해볼 수 있다.

```java
public class SingletonClass implements Serializable {

    private static final SingletonClass INSTANCE = new SingletonClass();
    private transient SomeField someField; // 직렬화 형태에서 아무런 실 데이터를 가질 필요가 없으니 모든 필드를 transient로 선언

    private SingletonClass() {
        // ...
    }

    public static SingletonClass getInstance() {
        return INSTANCE;
    }

    // 역직렬화된 객체를 대신할 객체를 반환하는 역할을 수행하는 메서드
    private Object readResolve() {
        // 진짜 인스턴스를 반환하고, 역직렬화 중 생긴 인스턴스는 GC에서 제거되도록 함
        return INSTANCE;
    }
}
```

`readResolve` 메서드 구현 및 `transient` 선언을 통해 해결할 수 있는데, 각각의 구현은 아래의 역할을 하게 된다.

- `readResolve` 메서드 구현: 역직렬화된 객체를 대신할 객체를 반환하여 역직렬화하여 생긴 객체 접근 방지
- 모든 필드를 `transient` 선언: 일반 참조 필드가 있다면 해당 필드의 내용은 `readResolve` 메서드가 수행되기 전에 역직렬화가 수행되기 때문에 이를 방지

열거 타입을 사용하여 더 쉽게 해결할 수 있지만, 아래의 상황에선 `readResolve`를 사용하는 방법을 고려해보는 것도 좋다.

- 직렬화 가능 인스턴스 통제 클래스를 작성해야하지만, 컴파일타임에는 어떤 인스턴스들이 있는지 알 수 없는 상황

## 열거 타입을 사용한 해결 방법

`readResolve` 구현과 `transient` 선언을 통해 해결할 수 있지만 신경을 많이 써야하는 작업인데, 열거 타입을 사용하면 이러한 작업을 간단하게 해결할 수 있다.

```java
public enum SingletonEnum {
    INSTANCE; // 선언한 상수 외의 다른 객체는 존재하지 않음을 자바가 보장

    // ...
}
```
