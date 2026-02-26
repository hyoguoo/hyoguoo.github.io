---
title: "Primitive Type & Boxed Primitive Type"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 박싱된 기본 타입보다는 기본 타입을 사용하라

자바의 데이터 타입은 크게 기본 타입과 참조 타입으로 나뉘는데, 각각 기본 타입에도 대응하는 참조 타입이 존재한다.  
이를 박싱된 기본 타입이라고 한다.(예: `int` -> `Integer`)  
최신 자바에서는 오토방식 및 오토언박싱 덕분에 두 타입을 구분하지 않고 사용할 수 있지만, 실제로는 크게 세 가지 차이점이 존재한다.

1. 기본 타입은 값만 가지고, 박싱된 기본 타입은 값에 더해 식별성이라는 속성을 갖는다.
    - 박싱된 기본 타입은 두 인스턴스의 값이 같아도 다르다고 식별될 수 있음
2. 기본 타입은 항상 유효한 값을 가질 수 있지만, 박싱된 타입은 nullable이다.
3. 기본 타입이 박싱된 기본 타입보다 시간과 메모리 사용면에서 효율적이다.

다음은 2번으로 인해 발생할 수 있는 문제를 보여주는 예시이다.

```java
class Example {
    public static void main(String[] args) {
        Comparator<Integer> naturalOrder =
                (i, j) -> (i < j)
                        ? -1
                        : (i == j ? 0 : 1);

        System.out.println(naturalOrder.compare(new Integer(59), new Integer(42)));    // 1
        System.out.println(naturalOrder.compare(new Integer(42), new Integer(59)));    // -1
        System.out.println(naturalOrder.compare(new Integer(59), new Integer(59)));    // 1, not 0!
    }
}
```

서로 다른 값을 넣었을 때는 정상적으로 동작하지만, 같은 값을 넣었을 때는 1이 아닌 0이 나온는데, 다음과 같이 실행되기 때문이다.

1. `naturalOrder.compare(new Integer(59), new Integer(59))`가 실행되면서 서로 다른 두 개의 `Integer` 인스턴스 생성
2. `(i < j)`에서는 기본 타입 값으로 변환되어 실행되어 `false`가 반환되어 `(i == j ? 0 : 1)`이 실행됨
3. `(i == j)`에서는 인스턴스가 같은지 비교되어 `false`가 반환되어 `1`이 반환됨

이처럼 박싱된 기본 타입에 `==` 연산자를 사용하면 원하지 않는 결과가 나올 수 있다.  
때문에 비교할 때는 `equals` 메서드를 사용해야 하며, 비교자를 위처럼 직접 만드는 것보다는 `Comparator.naturalOrder()`를 사용하는 것이 좋다.

## 박싱 타입과 기본 타입을 혼용해서 사용할 때의 주의점

박싱 타입은 기본 타입과 혼용된 연산에서는 박싱 타입이 자동으로 언박싱 되기 때문에 항상 주의해야 한다.

```java
class Example {
    static Integer i;

    public static void main(String[] args) {
        if (i == 59) { // NullPointerException
            System.out.println("Hello Ogu!");
        }
    }
}
```

위 코드에선 `i`가 `null`로 초기화 되어 있지만, 기본 타입인 `59`와 비교할 때 자동으로 언박싱되어 `NullPointerException`이 발생하게 된다. 

## 박싱타입을 사용해야 하는 경우

박싱 타입은 성능 문제나 비교에 있어서 문제가 발생할 수 있지만, 다음과 같은 경우에는 사용하는 것이 좋다.

1. 컬렉션의 원소, 키, 값으로 사용할 때
    - 컬렉셔은 기본 타입을 담을 수 없으므로 박싱 타입을 사용해야 한다.
2. 매개변수화 타입이나 매개변수화 메서드의 타입 매개변수로 사용할 때
    - 마찬가지로 타입 매개변수에는 기본 타입을 사용할 수 없으므로 박싱 타입을 사용해야 한다.
3. 리플렉션을 통해 메서드를 호출할 때

이 외에도 빈 값이라는 것을 명확하게 표현해야 할 때도 박싱 타입을 사용하는 것이 좋다고 한다.
