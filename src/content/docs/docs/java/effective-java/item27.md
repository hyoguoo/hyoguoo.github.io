---
title: "Unchecked Warning"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 비검사 경고를 제거하라.

제네릭을 사용하게되면 `ClassCastException`이 발생할 수 있는데, 이를 방지하기 위해 컴파일러가 경고를 발생시킨다.  
이 경고를 무시하게되면 당연하게도 문제가 발생할 수 있기 때문에 최대한 경고를 제거하는 것이 좋다.

## @SuppressWarnings

경고를 최대한 제거하더라도 완벽하게 제거할 수 없는 경우가 있다.  
만약 타입 안전이 확신하다면 이 경고를 숨겨줄 수 있는 `@SuppressWarnings` 애너테이션을 사용하면 된다.

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    // ...

    @SuppressWarnings("unchecked")
    public <T> T[] toArray(T[] a) {
        if (a.length < size)
            // Make a new array of a's runtime type, but my contents:
            return (T[]) Arrays.copyOf(elementData, size, a.getClass());
        System.arraycopy(elementData, 0, a, 0, size);
        if (a.length > size)
            a[size] = null;
        return a;
    }

    // ...
}
```

위 코드는 실제 Java 17의 `ArrayList` 코드로, 주석 부분에서 경고가 발생하지만 `@SuppressWarnings` 애너테이션을 메서드에 사용하여 경고를 숨겨주게 된다.  
애너테이션 선언은 개별 지역변수 선언부터 클래스 전체까지 가능하지만, 가능한 한 좁은 범위에 적용하는 것이 좋다.  
위 코드의 더 좁은 범위에 적용하면 다음과 같다.

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    // ...

    public <T> T[] toArray(T[] a) {
        if (a.length < size) {
            // 선언부에만 적용할 수 있기 때문에 지역변수 선언 후 애너테이션을 사용
            @SuppressWarnings("unchecked")
            T[] result = (T[]) Arrays.copyOf(elementData, size, a.getClass());
            return result;
        }
        System.arraycopy(elementData, 0, a, 0, size);
        if (a.length > size)
            a[size] = null;
        return a;
    }

    // ...
}
```

## 결론

비검사 경고는 중요하니 무시하지 말고, 만약 경고를 제거할 수 없다면 `@SuppressWarnings` 애너테이션을 사용하여 경고를 숨겨주는 방법을 사용할 수 있다.  
또한 안전한 이유를 클라이언트에게 알려주기 위해 항상 주석을 통해 알려주는 것이 좋다.
