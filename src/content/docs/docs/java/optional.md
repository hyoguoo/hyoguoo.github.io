---
title: "Optional"
date: 2023-09-19
lastUpdated: 2025-11-13
---
자바에서 원시 타입을 제외한 모든 참조 변수는 `null`을 가질 수 있어, 이로 인해 `NullPointerException`(NPE)이 빈번하게 발생한다.

```java
public static void main(String[] args) {
    String str = "abc";
    if (str != null) {
        System.out.println(str.toUpperCase()); // ABC
    } else {
        System.out.println("null");
    }
}
```

자바 8에서는 `Optional` 클래스를 도입하여 메서드 시그니처만 보고도 `null` 반환 가능성을 예측할 수 있게 하며, `null` 처리를 강제하는 효과를 준다.

## Optional 객체 생성

`Optional`은 `null`이 될 수 있는 객체를 감싸는 래퍼 클래스로, `null`이 될 수 있는 객체를 담고 있는 `Optional` 객체를 생성할 수 있다.

```java
public static void main(String[] args) {
    Map<String, String> map = Map.of("existKey", "existValue");
    Optional<String> opt1 = Optional.of(map.get("existKey")); //  `null`이 아님을 보장할 때 사용
    Optional<String> opt2 = Optional.ofNullable(map.get("notExistKey")); // `null`일 수도 있을 때 사용
    Optional<String> opt3 = Optional.empty(); // `null`임을 명시적으로 나타낼 때 사용
}
```

|              메서드               |           입력 값 `null`            |          입력 값 `null` 아님          |
|:------------------------------:|:--------------------------------:|:--------------------------------:|
|     `Optional.of(T value)`     |    `NullPointerException` 발생     |   `Optional` 객체 생성 (값을 담고 있음)    |
| `Optional.ofNullable(T value)` |      `Optional.empty()` 반환       |   `Optional` 객체 생성 (값을 담고 있음)    |
|       `Optional.empty()`       | -(`null`을 담고 있는 `Optional` 객체 생성 | -(`null`을 담고 있는 `Optional` 객체 생성 |

## Optional 객체 조회

### `get()` 메서드

`Optional` 객체에 담긴 값을 가져오기 위해서는 기본적으로 `get()` 메서드를 사용해서 가져올 수 있다.

```java
public static void main(String[] args) {
    Optional<String> opt = Optional.of("abc");
    String str = opt.get();
    System.out.println(str); // abc
}
```

하지만 비어있는 `Optional` 객체에 `get()`을 호출하면 `NoSuchElementException`이 발생할 수 있기 때문에, `ifPresent()`와 결합하여 사용해볼 수 있다.

```java
public static void main(String[] args) {
    Optional<String> opt = Optional.empty();
    if (opt.isPresent()) {
        String str = opt.get();
        System.out.println(str);
    }
}
```

하지만 위와 같은 방식은 `if (value != null) { ... }` 코드와 본질적으로 다르지 않으며, `Optional`의 장점을 활용하지 못한다.

### 올바른 Optional 값 조회 및 처리 방법

`Optional` 객체의 값을 조회하고 처리하는 위해 다양한 메서드가 제공된다.

|                                 메서드                                 |    값이 있을 때    |         값이 없을 때         |
|:-------------------------------------------------------------------:|:-------------:|:-----------------------:|
|               `ifPresent(Consumer<? super T> action)`               | `Consumer` 실행 |      아무 동작도 하지 않음       |
| `ifPresentOrElse(Consumer<? super T> action, Runnable emptyAction)` | `Consumer` 실행 |      `Runnable` 실행      |
|                          `orElse(T other)`                          |     값을 반환     |      전달 받은 인자를 반환       |
|              `orElseGet(Supplier<? extends T> other)`               |     값을 반환     | `Supplier`를 실행한 결과를 반환  |
|       `orElseThrow(Supplier<? extends X> exceptionSupplier)`        |     값을 반환     | `Supplier`가 제공하는 예외를 발생 |

```java
public static void main(String[] args) {
    // ifPresent
    Optional<String> opt1 = Optional.of("abc");
    opt1.ifPresent(s -> System.out.println(s.toUpperCase())); // ABC

    // ifPresentOrElse
    Optional<String> opt2 = Optional.empty();
    opt2.ifPresentOrElse(s -> System.out.println(s.toUpperCase()),
            () -> System.out.println("null")); // null

    // orElse
    String value1 = Optional.of("abc")
            .map(String::toUpperCase)
            .orElse("null"); // "ABC"

    // orElseGet
    String value2 = Optional.empty()
            .map(String::toUpperCase)
            .orElseGet(() -> "null"); // "null"

    // orElseThrow
    Optional<String> opt5 = Optional.empty();
    String value = opt5.orElseThrow(IllegalArgumentException::new);
}
```

#### `orElse()` vs `orElseGet()`

`orElse()`와 `orElseGet()`은 `Optional`이 비어있을 때 대체 값을 제공하는 동일한 기능을 가진 메서드지만, 기본값을 생성하는 시점에서 차이가 있다.

- `orElse(T other)`: `Optional`에 값이 있든 없든 `other` 객체가 항상 생성
- `orElseGet(Supplier<? extends T> other)`: `Optional`에 값이 없을 때만 `Supplier` 람다식이 실행되어 기본값이 생성

때문에, 기본값 생성 비용이 큰 경우에는 `orElseGet()`을 사용하는 것이 성능상 유리하다.

## Optional 활용 시 주의점

`Optional`은 남용하면 오히려 코드를 복잡하게 만들 수 있다.

- 메서드 반환 타입으로만 사용: `Optional`은 메서드의 반환 타입(return type)으로 사용되는 것을 권장
- 필드(멤버 변수)로 사용 금지: 클래스의 필드 타입으로 `Optional`을 사용하는 것은 권장되지 않음
    - 직렬화 문제, JPA 등에서의 비호환성 문제
- 메서드 매개변수로 사용 금지: 매개변수로 `null`을 보낼 수 있어 `Optional` 객체 자체가 `null`이 될 수 있음
    - 메서드 오버로딩으로 해결하는 것이 더 나음
- 컬렉션 래핑 금지: 컬렉션은 `null`을 반환하기보다 비어있는 컬렉션(예: `Collections.emptyList()`)을 반환하는 것을 권장
