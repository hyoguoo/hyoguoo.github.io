---
title: "Generic Method"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "제네릭 메서드의 작성 방법, 제네릭 싱글턴 팩터리 패턴, 재귀적 타입 한정을 이용한 타입 안전 메서드 설계 방식을 정리한다."
---

> 이왕이면 제네릭 메서드로 만들라

메서드도 제네릭으로 만들 수 있는데, 이를 제네릭 메서드라고 하며, `Collections`의 `sort` 메서드가 대표적인 예이다.  
명명 규칙이나 사용 방법은 제네릭 클래스와 동일하다.

```java

class Test {

    public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
        Set<E> result = new HashSet<>(s1);
        result.addAll(s2);
        return result;
    }

    public static void main(String[] args) {
        Set<String> a = Set.of("a", "b", "c");
        Set<String> b = Set.of("d", "e", "f");
        Set<String> c = union(a, b);
    }
}
```

마찬가지로 한정적 와일드카드 타입으로 더 유연하게 만들 수 있다.

## 제네릭 싱글턴 팩터리

불변 객체를 여러 타입으로 활용할 수 있게 만들어야 할 때가 있다.  
제네렉은 런타임에 타입 정보가 소거되기 때문에 하나의 객체를 어떤 타입으로 매개변수화 할 수 있는데, 이를 위해선 타입을 바꿔주는 정적 팩터리를 만들어야 한다.  
정적 팩터리 메서드에서는 요청한 타입 매개변수에 맞게 그 객체의 타입을 바꿔주는 역할을 수행하게 되며, 이 패턴을 제네릭 싱글턴 팩터리라고 한다.

```java
// Collections에서 사용된 정적 팩터리 메서드 reverseOrder
public class Collections {
    // Suppresses default constructor, ensuring non-instantiability.
    private Collections() {
    }

    // ...

    @SuppressWarnings("unchecked")
    public static <T> Comparator<T> reverseOrder() {
        return (Comparator<T>) ReverseComparator.REVERSE_ORDER;
    }

    // ...
}
```

제네릭 싱글턴 팩터리를 항등함수를 담은 클래스의 메서드에 적용하면 아래와 같이 사용할 수 있다.

```java
class GenericSingletonFactory {
    private static final UnaryOperator<Object> IDENTITY_FN = (t) -> t;

    @SuppressWarnings("unchecked") // 수정 없이 그대로 반환하므로 안전(=타입 안정성 보장)
    public static <T> UnaryOperator<T> identityFunction() {
        return (UnaryOperator<T>) IDENTITY_FN; // UnaryOperator<Object> != UnaryOperator<T> 으로 경고 발생
    }
}

class Main {
    public static void main(String[] args) {
        String[] strings = {"오리", "너구리", "오구"};
        // String을 인수로 받아 String을 반환하는 UnaryOperator
        UnaryOperator<String> sameString = GenericSingletonFactory.identityFunction();
        for (String s : strings) System.out.println(sameString.apply(s));

        Number[] numbers = {5, 9.0, 59L};
        // Number를 인수로 받아 Number를 반환하는 UnaryOperator
        UnaryOperator<Number> sameNumber = GenericSingletonFactory.identityFunction();
        for (Number n : numbers) System.out.println(sameNumber.apply(n));
    }
}
```

### 재귀적 타입 한정(recursive type bound)

자기 자신이 들어간 표현식을 사용해 타입 매개변수의 허용 범위를 한정하는 재귀적 타입 한정이라는 개념도 존재한다.  
재귀적 타입 한정은 주로 `Comparable` 인터페이스와 함께 사용한다.

```java
// Comparable 인터페이스
public interface Comparable<T> {
    int compareTo(T o);
}

// java.util.Collections의 max 메서드
public class Collections {
    // Suppresses default constructor, ensuring non-instantiability.
    private Collections() {
    }

    // ...

    public static <T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll) {
        Iterator<? extends T> i = coll.iterator();
        T candidate = i.next();

        while (i.hasNext()) {
            T next = i.next();
            if (next.compareTo(candidate) > 0)
                candidate = next;
        }
        return candidate;
    }

    // ...
}
```

값을 상호 비교하기 위해서는 컬렉션에 담긴 모든 원소가 상호 비교될 수 있어야 한다.   
`Collection`의 `max` 메서드도 정상적으로 기능을 수행하기 위해선 상호 비교가 되야하므로 `T`가 `Comparable`을 구현하도록 제한하고 있다.