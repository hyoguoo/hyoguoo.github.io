---
title: "Varargs"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 제네릭과 가변인수를 함께 쓸 때는 신중하라

실체화 불가타입(거의 모든 제네릭과 매개변수화 타입)은 런타임에 컴파일타밍보다 타입 관련 정보를 적게 담고 있다.  
이런 특징 때문에 실체화 불가 타입으로 varaargs를 선언하면 컴파일러에서 경고를 발생시킨다.

```java
class Main {

    public static void main(String[] args) {
        dangerous(List.of("There be dragons!")); // Warning, Unchecked generics array creation for varargs parameter 
    }

    // Warning, Possible heap pollution from parameterized vararg type
    private static void dangerous(List<String>... stringLists) {
        List<Integer> intList = List.of(42);
        Object[] objects = stringLists;
        objects[0] = intList; // 힙 오염 발생
        String s = stringLists[0].get(0); // 형변환 도중 ClassCastException 발생
    }
}
```

위 코드처럼 가변인수를 사용하게 되면서 많은 경고들이 발생하고, 잘못된 타입이 전달되어도 런타임에야 알 수 있게 된다.

## 가변인수 에러가 발생하지 않는 이유

[item 28](item28.md)에서 알 수 있듯이 제네릭 배열은 컴파일러에서 아예 에러를 발생시킨다.  
하지만 가변인수는 컴파일러에서 에러를 발생시키고 있지 않은데, 이 이유는 실제 코드 작성 시 많은 이점을 줄 수 있어 모순적인 점을 수용하여 가변인수를 허용하고 있다.  
대표적으로 `Arrays.asList()`, `Collections.addAll()` 등이 있다.(이들은 타입 안전을 보장하고 있어 문제 없이 사용 가능하다.)

## @SafeVarargs

자바 7 전에는 발생할 수 있는 경고를 숨기기 위해 `@SuppressWarnings("unchecked")` 어노테이션을 사용하였다.  
하지만 이 어노테이션은 다른 문제를 알려주는 경고까지 숨길 수 있기 때문에 자바 7에서는 `@SafeVarargs` 어노테이션이 추가되었다.  
다음과 같은 조건을 만족하는 확실한 경우에만 `@SafeVarargs` 어노테이션을 사용해야 하며, 적용되지 않은 varargs는 사용하지 않는 것이 좋다.

- 가변인수로 만들어진 배열에 아무것도 저장하지 않음
- 해당 배열의 참조가 밖으로 노출되지 않음
- 순수하게 인수들을 전달하는 일만 수행

```java
class Main {

    @SafeVarargs
    static <T> List<T> flatten(List<? extends T>... lists) { // 가변인수로 만들어진 배열에 아무것도 저장하지 않음
        List<T> result = new ArrayList<>();
        for (List<? extends T> list : lists) { // 순수하게 인수들을 전달하는 일만 수행
            result.addAll(list);
        }
        return result; // 해당 배열 참조가 밖으로 노출되지 않음
    }
}
```

### `List.of()` 사용

`@SaveVarargs` 어노테이션을 사용하는 것이 아닌, `List.of()`를 사용하는 방법도 있다.  
`List.of()`는 가변인수를 받는 메서드이며, 이미 `@SaveVarargs` 어노테이션이 적용되어 있기 때문에 사용 시 경고가 발생하지 않는다.  
클라이언트 코드가 비교적 복잡해지지만, 이미 만들어진 검증된 코드를 사용하는 것이 더 좋은 방법이 될 수 있다.

```java
class Main {

    static <T> List<T> flatten(List<List<? extends T>> lists) {
        List<T> result = new ArrayList<>();
        for (List<? extends T> list : lists) {
            result.addAll(list);
        }
        return result;
    }

    public static void main(String[] args) {
        List<String> flatList = flatten(List.of(List.of("a", "b"), List.of("c", "d")));
        System.out.println(flatList); // [a, b, c, d]
    }
}
```
