---
title: "Functional Interface"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 표준 함수형 인터페이스를 사용하라

자바가 람다를 지원하게 되면서 함수 객체를 받는 메서드나 생성자를 작성할 수 있게 되었다.  
함수형 인터페이스를 직접 구현할 수도 있지만 이미 자바는 표준 API로 java.util.function 패키지에 있는 함수형 인터페이스를 사용하는 것을 권장한다.

- java.util.function 패키지의 기본 인터페이스 6가지

|       인터페이스       |       함수 시그니처       |         예시          |              설명              |
|:-----------------:|:-------------------:|:-------------------:|:----------------------------:|
| UnaryOperator<T>  |    T apply(T t)     | String::toLowerCase |    인수(1개)와 반환값의 타입이 같은 함수    |
| BinaryOperator<T> | T apply(T t1, T t2) |   BigInteger::add   |    인수(2개)와 반환값의 타입이 같은 함수    |
|   Predicate<T>    |  boolean test(T t)  | Collection::isEmpty |   인수를 받아 boolean을 반환하는 함수    |
|  Function<T, R>   |    R apply(T t)     |   Arrays::asList    |      인수와 반환값의 타입이 다른 함수      |
|    Supplier<T>    |       T get()       |    Instant::now     |     인수를 받지 않고 값을 반환하는 함수     |
|    Consumer<T>    |  void accept(T t)   | System.out::println | 인수를 하나 받고 반환값 없이 인수를 소비하는 함수 |

모든 기본 인터페이스는 기본 타입인 int, long, double을 각각 받는 변형 인터페이스 3개씩 제공하게 되고, 그 외에 다양한 변형 인터페이스도 제공하고 있다.  
(총 43개지만, 규칙성이 부족하기 때문에 필요할 때 찾아 사용하는 것이 좋다.)

많은 수의 인터페이스를 지원하기 때문에 대부분 상황에서는 표준 함수형 인터페이스를 사용하고, 없는 경우에만 직접 구현하는 것이 좋다.

## 표준 함수형 인터페이스를 사용하지 않는 경우

이미 똑같은 시그니처를 갖는 인터페이스가 존재하고 있음에도 불구하고, 사용하지 않고 별도의 인터페이스를 만들어 사용하는 경우가 있다.  
그 예시는 `Comparator<T>`와 `ToIntBiFunction<T, U>`로, 둘이 구조적으로 동일한 역할을 하지만 `Comparator`를 독자적인 인터페이스로 사용하는 것이 일반적이다.

1. 자주 쓰이면서, 이름 자체가 용도를 명확하게 설명해줌
2. 구현하는 쪽에서 지켜야 할 규약이 명확하게 정의되어 있음
3. 비교자들을 변환하고 조합할 수 있는 유용한 메서드들을 제공함

만약 위의 내용 중 하나 이상을 만족한다면 표준 함수형 인터페이스가 아닌 전용 함수형 인터페이스를 구현하는 것도 좋은 방법이 될 수 있다.(구현할 땐 `@FunctionalInterface` 어노테이션을 사용하자)

## 함수형 인터페이스 사용시 주의점

서로 다른 함수형 인터페이스를 같은 위치의 인수로 받게 되는 메서드를 다중 정의해서는 안된다.

```java
public interface ExecutorService extends Executor {
    // ...

    <T> Future<T> submit(Callable<T> task);

    Future<?> submit(Runnable task);

    // ...
}
```

이렇게 되면 클라이언트에선 올바른 메서드 사용을 하기 위해 형변환을 해야하기 때문에, 이는 피하는 것이 좋다.

```java
class Main {
    public static void main(String[] args) {

        ExecutorService exec = Executors.newCachedThreadPool();
        exec.submit(() -> System.out.println("Hello")); // 어떤 것이 호출 되는지 모호함
        // 형변환을 통해 명시적으로 어떤 것을 호출할 것인지 명시할 수 있음
        exec.submit((Callable<Void>) () -> {
            System.out.println("Hello");
            return null;
        });
    }
}
```
