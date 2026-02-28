---
title: "clone"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "Cloneable 인터페이스의 설계 문제와 가변 객체를 포함한 클래스에서 clone을 올바르게 재정의하는 방법을 분석한다."
---

> clone 재정의는 주의해서 진행하라

## Cloneable

```java
public interface Cloneable {
    // 어떤 구현도 되어 있지 않음
}
```

Cloneable은 복제해도 되는 클래스임을 명시하기 위한 인터페이스이다.  
하지만 의도와는 다르게 해당 목적을 제대로 수행하지 못하고 있는데, 그 이유는 다음과 같다.

- clone 메서드가 선언된 곳이 Cloneable이 아닌 Object에 protected로 선언되어 있음
- 때문에 비어있는 Cloneable을 구현해도 clone 메서드를 호출할 수 없음

이처럼 문제가 많은 인터페이스지만 해당 방식을 널리 사용하고 있기 때문에, 알아두는 것이 좋다.

### Cloneable 인터페이스의 역할

내부 구현이 아무것도 없지만 Object의 protected 메서드인 clone의 동작 방식을 결정한다.  
Cloneable을 구현한 클래스의 인스턴스에서 clone 호출하면 해당 객체의 필드들을 하나하나 복사한 객체를 반환하고,  
Cloneable을 구현하지 않은 클래스의 인스턴스에서 clone 호출하면 CloneNotSupportedException을 던진다.

```java
class NotCloneable {
    int x;
    int y;

    @Override
    public Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}

class Cloneable implements java.lang.Cloneable {
    int x;
    int y;

    @Override
    public Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}

class Main {
    public static void main(String[] args) throws CloneNotSupportedException {
        Cloneable cloneable = new Cloneable();
        NotCloneable notCloneable = new NotCloneable();

        cloneable.clone(); // OK
        notCloneable.clone(); // CloneNotSupportedException
    }
}
```

인터페이스를 상당히 이례적으로 사용한 사례기 때문에 다른 곳에 이러한 방식을 적용하는 것은 좋지 않다.  
(일반적으로 인터페이스를 구현하는 것은 해당 인터페이스에서 정의 한 기능을 제공하는 것이지만, 이 경우엔 상위 클래스에 정의된 동작 방식을 결정한다.)

## Object.clone

clone 메서드의 규약은 허술한 편인데, Object 명세에 다음과 같이 정리되어 있다.

- 객체의 복사본을 생성해 반환
    - 복사의 정확한 뜻은 그 객체를 구현한 클래스에 따라 다를 수 있음
- 일반적인 의도는 다음과 같음(반드시 이렇게 구현해야 하는 것은 아님)
    - x.clone() != x
    - x.clone().getClass() == x.getClass()
    - x.clone().equals(x)

## 올바른 Cloneable 구현 방법

```java
class Point implements Cloneable {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public Point clone() {
        try {
            return (Point) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(); // 일어나지 않는 에러, 외부로 던지지 않는 것이 좋음
        }
    }
}
```

clone 메서드를 public으로 제공하고, super.clone을 호출한 후 반환 타입을 해당 클래스로 캐스팅하는 것이 일반적인 방법이다.  
이렇게 하면 기본 타입이거나 불변 객체를 참조하는 필드에 대해서는 문제가 없지만, 가변 객체를 참조하는 필드에 대해서는 문제가 발생한다.

### 가변 객체를 참조하는 필드가 있는 클래스의 clone

Stack 클래스처럼 가변 객체를 참조하는 필드가 있는 클래스를 위 방식처럼 그대로 복사를 하게 되면, 내부 원소들까지 같은 객체를 참조하게 된다.

```java
public class Stack implements Cloneable {
    private Object[] elements; // 가변 객체를 참조하는 필드, 그대로 복사하면 내부 원소들까지 같은 객체를 참조하게 됨
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        this.elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    // ...
}
```

때문에 가변 객체를 참조하는 클래스라면 clone 메서드를 재정의할 때 해당 필드들을 새로 복사해서 참조하도록 해야 한다.

```java
public class Stack implements Cloneable {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        this.elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    @Override
    public Stack clone() {
        try {
            Stack result = (Stack) super.clone();
            result.elements = elements.clone(); // 가변 객체를 참조하는 필드를 재귀적으로 복사
            return result;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }

    // ...
}
```

하지만 이 방법에도 문제가 있을 수 있는데, 만약 elements가 final이라면 새로운 값을 할당할 수 없기 때문에 문법 에러가 발생한다.  
그래서 복제할 수 있는 클래스를 만들기 위해 일부 필드에서 final을 제거해야 할 수도 있다.  
추가적으로 가변 객체 내부에 또 다른 가변 객체가 존재한다면, 해당 객체들도 재귀적으로 복사해야 함을 잊지 말아야 한다.

## 결론

clone 메서드는 복제 기능을 제공하기 위해 고안된 것이지만 언어 모순적이고, 엉성하게 문서화된 규약, 예외 발생 가능성 등 문제가 많다.  
이미 Cloneable을 구현한 클래스를 확장하는 것이 아니라면 복제 기능을 사용하기 위해선, 복사 생성자나 복사 팩터리 메서드를 사용하는 것이 더 좋다.