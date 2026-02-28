---
title: "Abstraction Level Exceptions"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "예외 번역(exception translation)과 예외 연쇄(exception chaining) 기법을 통해 추상화 수준에 맞는 예외를 던지는 방법을 정리한다."
---

> 추상화 수준에 맞는 예외를 던지라

수행하려는 일과 관련 없어 보이는 예외가 발생하면 어떤 에러가 발생했는지 알기 어려워진다.

## 예외 번역(exception translation)

상위 계층에서 사용할 때, 저수준 예외를 잡아 자신의 수준에 맞는 예외로 바꿔 던지는 예외 번역(exception translation) 기법을 사용하여 에러 파악을 쉽게 할 수 있다.

```java
class Example {

    public static void main(String[] args) {
        try {
            // ...
        } catch (LowerLevelException e) {
            // 추상화 수준에 맞게 다른 예외로 전환
            throw new HigherLevelException();
        }
    }
}
```

실제로 `AbstractSequentialList`의 `get` 메서드는 아래와 같이 구현되어 있다.

```java
public abstract class AbstractSequentialList<E> extends AbstractList<E> {

    public E get(int index) {
        try {
            return listIterator(index).next();
        } catch (NoSuchElementException exc) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
    }
}
```

## 예외 연쇄(exception chaining)

만약 저수준 예외가 유용한 정보를 담고 있다면, 예외 연쇄(exception chaining) 기법을 사용하여 예외 연결을 통해 저수준 예외의 정보를 고수준 예외에 담아서 던지는 방법도 있다.

```java
class Example {

    public static void main(String[] args) {
        try {
            // ...
        } catch (LowerLevelException cause) {
            // 저수준 예외를 고수준 예외에 실어 보냄
            throw new HigherLevelException(cause);
        }
    }
}
```

위와 같이 실어보내게 되면 `getCause` 메서드를 통해 저수준 예외를 확인할 수 있어, 원인과 고수준 예외의 스택 추적 정보를 모두 확인할 수 있게 된다.
