---
title: "Generic Type(제네릭 타입)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 이왕이면 제네릭 타입으로 만들라

클라이언트에서 직접 형변환해야하는 것보단 형변한 없이 사용할 수 있도록 하는 것이 좋다.  
이렇게 구현하기 위해선 제네릭 타입으로 만들어야 하는 경우가 많기 때문에 새로운 타입을 설계할 땐 제네릭 타입을 고려해보는 것이 좋다.

## 예제 코드

### 제네릭 타입 적용 전 코드

```java
class Stack {
    private static final int DEFAULT_INITIAL_CAPACITY = 16;
    private Object[] elements;
    private int size = 0;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(Object e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        Object result = elements[--size];
        elements[size] = null;
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size) {
            elements = Arrays.copyOf(elements, 2 * size + 1);
        }
    }
}

class Main {

    public static void main(String[] args) {
        Stack stack = new Stack();

        stack.push("Hello");
        stack.push("Ogu");

        while (!stack.isEmpty()) {
            System.out.println(stack.pop());
        }
    }
}
```

위와 같은 Stack 클래스가 있는 경우 제네릭을 적용하는 것이 좋다.  
위처럼 제네릭 코드를 적용하더라도 기존에 사용하던 클라이언트 코드도 변경할 필요가 없다.(경고가 발생하지만 Raw Type으로 사용할 수는 있어 에러는 발생하지 않음)

### 제네릭 타입 적용 코드

```java
class Stack<E> {
    private E[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY]; // 경고 발생, Unchecked cast: 'java.lang.Object[]' to 'E[]'
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public E pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        E result = elements[--size];
        elements[size] = null;
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size) {
            elements = Arrays.copyOf(elements, 2 * size + 1);
        }
    }
}


class Main {

    public static void main(String[] args) {
        // 경고 발생, Raw use of parameterized class 'Stack'
        Stack stack = new Stack();

        stack.push("Hello");
        stack.push("Ogu");

        while (!stack.isEmpty()) {
            System.out.println(stack.pop());
        }
    }
}
```

클라이언트(Main) 코드의 경고도 발생하지만, 생성자에서 발생하는 [비검사 경고를 제거](item27.md)하기 위해 `@SuppressWarnings("unchecked")` 어노테이션을 추가할 수 있다.

### `@SuppressWarnings("unchecked")` 어노테이션 추가

생성자에 `@SuppressWarnings("unchecked")` 어노테이션 추가하는 방법과 필드의 `elements`를 Object 배열로 선언하는 방법이 있다.  
두 방법에 정답이 있는 것은 아니며 장/단점이 있기 때문에 상황에 맞게 사용하면 된다.

- 생성자에 `@SuppressWarnings("unchecked")` 어노테이션 추가

```java
class Stack<E> {

    // ...

    // 메서드에 적용
    @SuppressWarnings("unchecked")
    public Stack() {
        elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
    }

    // ...
}
```

컴파일러에선 타입 안전한지 증명할 수 없지만, 개발자는 타입 안전하다고 확신할 수 있을 때 사용하는 방법이다.  
위 코드에서는 아래의 조건을 만족하기 때문에 타입 안전하다고 확신할 수 있다.

1. `elements`가 private 필드에 저장됨: 클라이언트에서 직접 접근 불가
2. 클라이언트나 다른 메서드에 전달되는 일이 없음: `elements` 배열을 반환하지 않아 클라이언트가 데이터 구조에 접근할 수 없음
3. `push` 메서드에서 `elements` 배열에 저장되는 타입을 `E`로 지정: `elements` 배열에 데이터를 추가하는 유일한 메서드이며, `elements` 배열에 저장되는 원소의 타입이 `E`로
   한정되어 있음

이 방법은 가독성이 더 좋으며, `elements` 배열 생성 시 한 번만 형변환을 하기 때문에 간편하다.  
하지만 배열의 런타임 타입이 컴파일타임 타입과 달라지기 때문에(Generic Type Erasure) 힙 오염이 발생할 수 있다.(위 코드에선 발생하지 않음)

** 힙 오염(Heap Pollution): JVM 힙 메모리 영역에 오염이 된 상태, 제네릭에서의 힙 오염은 적용된 제네릭 타입과 다른 타입의 객체를 저장할 때 발생하는 것을 의미

- 필드의 `elements`를 Object 배열로 선언

```java
class Stack<E> {
    private Object[] elements; // E -> Object 변경
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public E pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        @SuppressWarnings("unchecked")      // 타입 안전성이 보장되지 않음을 알려주기 위해 추가
        E result = (E) elements[--size];    // Object 배열이기 때문에 형변환 추가
        elements[size] = null;
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size) {
            elements = Arrays.copyOf(elements, 2 * size + 1);
        }
    }
}
```

Object 타입으로 변환했기 때문에 `pop()`에서 형 변환이 필요한데, 이때도 `@SuppressWarnings("unchecked")` 어노테이션을 추가하여 경고를 숨길 수 있다.  
이 경우에도 안전한 이유는 위와 동일하다.

이 방법은 형변환을 하는 부분이 많아 질 수 있어 가독성이 떨어지고, `elements` 배열 생성 시 매번 형변환을 해야하기 때문에 번거롭다.  
하지만 그만큼 형 변환의 범위가 최소화되고 힙 오염의 위치도 최소화되기 때문에 힙 오염에 대해 더 안전하다.

## 제한이 필요한 제네릭

제네릭타입은 기본적으로 타입 매개변수에 아무런 제약을 두지 않기 때문에 모든 타입을 수용할 수 있다.  
하지만 필요에 따라 특정 타입만 수용하도록 상황에는 제한을 두는 것이 좋다.

```java
// Delayed 클래스의 하위 클래스만 수용하도록 제한을 두어 타입 안전성을 보장
public class DelayQueue<E extends Delayed> extends AbstractQueue<E>
        implements BlockingQueue<E> {
    // ...
}
```
