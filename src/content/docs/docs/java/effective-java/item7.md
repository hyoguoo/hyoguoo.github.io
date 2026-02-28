---
title: "Obsolete Objects"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "가비지 컬렉터가 있어도 발생하는 메모리 누수 원인과 null 처리·스코프 축소·WeakHashMap을 활용한 참조 해제 방법을 정리한다."
---

> 다 쓴 객체 참조를 해제하라

Java는 가비지 컬렉터를 통해 메모리 누수를 방지해주기 때문에, C/C++과 같은 언어처럼 메모리를 직접 관리할 필요가 없다.  
하지만 그렇다고 전혀 신경쓰지 않아도 되는 것은 아니다.

## 메모리 누수 예시

```java
public class Stack {
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
        return elements[--size];
    }

    /**
     * 원소를 위한 공간을 적어도 하나 이상 확보
     * 배열 크기를 늘려야 할 때마다 약 두 배씩 증가
     */
    private void ensureCapacity() {
        if (elements.length == size) {
            elements = Arrays.copyOf(elements, 2 * size + 1);
        }
    }
}
```

위 코드의 `pop()` 메서드에서 메모리 누수가 발생할 수 있다.  
`pop()` 메서드를 호출하면 `elements` 배열에서 원소를 꺼내 반환하고, `size`를 감소시키고 있지만, 배열이 여전히 참조하고 있기 때문에 가비지 컬렉터가 회수하지 않는다.  

이를 해결하기 위해서는 `pop()` 메서드에서 `elements` 배열에서 꺼낸 원소를 `null` 처리해주면 된다.

```java
public class Stack {

    // ...

    public Object pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        Object result = elements[--size];
        elements[size] = null; // 다 쓴 참조 해제
        return result;
    }
    
    // ...
}
```

이렇게 하면 `pop` 처리한 참조를 사용하려고 해도 `NullPointerException`이 발생하기 때문에, 의도하지 않은 사용을 방지할 수 있는 효과도 있다.

## 스코프에 의한 참조 해제

사실 프로그래밍 할 때 위 경우처럼 일일이 `null` 처리를 해줄 필요는 없다.(위 예시는 Stack 클래스가 메모리를 직접 관리하기 때문에 그렇다.)  
다 쓴 객체 참조를 해제하는 가장 좋은 방법은 해당 참조를 담은 변수를 유효 범위(scope) 밖으로 밀어내는 것이다.  
좋은 프로그래밍 습관을 가지고 있다면, 변수의 유효 범위를 최소화하려고 노력하기 때문에 이러한 경우는 자연스럽게 해결된다.

## 캐시

캐시는 메모리 누수를 일으키는 주범 중 하나이기 때문에 주의해야 한다.  
이를 해결하기 위한 방법들 중 하나로, 캐시를 사용할 때 `WeakHashMap`을 사용하는 방법이 있다.  
(단, 이 방법은 캐시 외부에서 키를 참조하는 동안만 값이 살아있는 캐시를 만들 수 있다.)

```java
class Test {
    public static void main(String[] args) {
        /*
         WeakHashMap의 주요 특징은 키에 대해 약한 참조를 사용한다는 것으로,
         약한 참조를 사용하면 객체를 가리키는 강력한 참조가 없을 때 객체가 가비지 컬렉션의 대상이 된다. 
         */
        WeakHashMap<Integer, Integer> weakHashMap = new WeakHashMap<>();
        Integer key1 = 59;
        Integer key2 = 95;
        weakHashMap.put(key1, 1);
        weakHashMap.put(key2, 2);

        System.out.println("before call gc() : " + weakHashMap.size()); // 2

        key1 = null; // 키를 null로 만들어서 GC 대상이 되도록 한다.
        System.gc(); // 위 코드에서 testWeakKey1은 null이 되었으므로 GC 대상이 된다.(보장되진 않음)

        System.out.println("after call gc() : " + weakHashMap.size()); // GC가 동작하지 않았다면 2, 동작했다면 1
    }
}
```