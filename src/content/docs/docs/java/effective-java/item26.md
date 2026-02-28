---
title: "Raw Type"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "Raw Type의 위험성과 List, List&lt;Object&gt;, 와일드카드 타입의 차이를 비교하고, Raw Type을 피해야 하는 이유를 설명한다."
---

> Raw Type은 사용하지 말라

제네릭 타입을 정의하게 되면 매개변수 타입이 정의되지 않은 Raw Type이라는 것이 생기게 된다.(`List<E>` -> `List`)  
이러한 Raw Type을 아래와 같이 그냥 사용하게 되면 컴파일러는 경고를 띄우게 된다.(그만큼 위험한 안티 패턴)

```java
class Main {
    public static void main(String[] args) {
        List list = new ArrayList(); // Raw use of parameterized class 'List'
        list.add("Hello"); // Unchecked call to 'add(E)' as a member of raw type 'java.util.List'
        Object o = list.get(0);// 컴파일러 경고
        System.out.println(o);
        Integer i = (Integer) o; // 컴파일 성공, 런타임 에러
        System.out.println(i);
    }
}
```

하지만 역시 타입 변환을 시도하여 할당하려고 하는 경우엔 컴파일은 성공하고, 런타임 에러가 발생하는 심각한 문제가 발생한다.  
해결 방법은 간단하게도 제네릭 타입을 사용하여 컴파일러에게 타입을 강제하도록 하면 된다.

```java
class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("Hello");
        String s = list.get(0);
        System.out.println(s);
        Integer i = (Integer) s; // 컴파일 에러
    }
}
```

이처럼 Raw Type은 제네릭 타입을 사용하지 않고 사용하게 되면 생성할 수 있는데, 절대 써서는 안 되는 타입이다.  
하지만 컴파일러 상에서 Raw Type을 허용하는 이유는 제네릭 타입이 도입되기 전에 사용하던 코드와의 호환성을 위해 도입된 것이니 사용하지 않는 것이 좋다.

## `List` vs `List<Object>`

Object는 모든 클래스의 최상위 클래스이기 때문에 `List`같은 Raw Type과 동일하게 동작한다고 생각할 수 있지만, 실제로는 차이가 있다.

- `List`: 타입을 완전히 체크하지 않음
- `List<Object>`: 모든 타입을 허용한다는 의사를 명확히 정의, 타입을 체크

아래 예시 코드를 보면 `List`는 `List<String>`을 넘겨 받을 수 있지만, `List<Object>`는 `List<String>`을 넘겨 받을 수 없다.  
이는 제네릭 하위 타입 규칙에 의해 `List<String>`은 `List<Object>`의 하위 타입이 아니기 때문이다.

```java
// List
class Main1 {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        unsafeAdd(list, Integer.valueOf(42));
        String s = list.get(0); // 런타임 에러, Exception in thread "main" java.lang.ClassCastException
    }

    private static void unsafeAdd(List list, Object o) {
        list.add(o);
    }
}

// List<Object>
class Main2 {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        unsafeAdd(list, Integer.valueOf(42)); // 컴파일 에러, Required type: List<Object> Provided: List<String>
    }

    private static void unsafeAdd(List<Object> list, Object o) {
        list.add(o);
    }
}
```

## Wildcard Type(와일드카드 타입)

Raw Type을 사용하면 모든 타입을 허용할 수 있지만, 이는 위험한 방법이다.  
`List<Object>` 같이 사용하는 것은 제네릭 하위 타입 규칙에 의해 `List<String>`을 넘겨 받을 수 없기 때문에 모든 타입을 허용하는 방법이 아니다.  
이를 해결하기 위해 `?`를 사용한 와일드카드 타입을 사용하면 된다.

```java
class Main2 {
    public static void main(String[] args) {
        List<Integer> list1 = new ArrayList<>();
        List<Integer> list2 = new ArrayList<>();
        unsafeAddWildcard(list1, list2);
        unsafeAddRaw(list1, list2);
    }

    private static void unsafeAddWildcard(List<?> list1, List<?> list2) {
        list1.add(list2.get(0)); // incompatible types: java.lang.Object cannot be converted to capture#1 of ?
    }

    private static void unsafeAddRaw(List list1, List list2) {
        list1.add(list2.get(0));
    }
}
```

Raw Type은 타입 체크를 전혀 하고 있지 않아, 적절하지 않은 타입을 넘겨 받아도 컴파일 에러가 발생하지 않는다.  
하지만 와일드카드 타입은 타입 체크를 하고 있기 때문에 런타임 에러를 방지할 수 있다.

## Raw Type을 사용하는 경우

Raw Type을 직접적으로 사용하는 경우는 있어서는 안되지만 아래와 같은 경우에는 Raw Type을 사용해야한다.

- class 리터럴: `List.class`, `String[].class`, `int.class`는 허용되지만 `List<String>.class`는 허용되지 않음
- instanceof 연산자: `instanceof List<String>`은 허용되지 않음
    - 런타임에는 제네릭 타입 정보가 지워지기 때문에 사용할 수 없음
