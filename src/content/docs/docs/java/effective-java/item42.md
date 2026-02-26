---
title: "Lambda"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 익명 클래스보다는 람다를 사용하라

예전 자바에서는 함수 타입을 표현할 때 추상 메서드를 하나만 담은 인터페이스나 추상 클래스를 사용했다.  
이러한 인터페이스의 인스턴스를 함수 객체라고 하며, 특정 함수나 동작을 나타내는데 사용했다.

```java
class Main {

    public static void main(String[] args) {
        Collections.sort(words, new Comparator<String>() {
            public int compare(String o1, String o2) {
                return Integer.compare(o1.length(), o2.length());
            }
        });
    }
}
```

위 코드는 문자열의 길이를 기준으로 정렬하는 코드로, 기능을 수행하는 데에는 문제가 없지만 코드가 너무 길어 가독성이 떨어지는 단점이 있다.  
이 단점을 해소하기 위해 자바 8부터는 람다를 지원하게 되면서 코드를 더 간결하게 작성할 수 있게 되었다.

```java
class Main {

    public static void main(String[] args) {
        /*
        1. 람다 표현식
        - 매개 변수와 반환 값의 타입 생략(컴파일러가 문맥을 살펴 타입을 추론)
        - return 문 생략(단일 표현식이므로 자동으로 반환)
         */
        Collections.sort(words, (o1, o2) -> Integer.compare(o1.length(), o2.length()));
        
        /*
        2. 비교자 생성 메서드 사용
         */
        Collections.sort(words, comparingInt(String::length));
        
        /*
        3. List.sort 사용
         */
        words.sort(comparingInt(String::length));
    }
}
```

함수형 인터페이스를 구현한 객체를 생성하기 떄문에 이를 응용하여 함수형 인터페이스 타입을 받는 모든 곳에서 람다를 사용할 수 있다.

```java
enum Operation {
    // 함수 객체를 인스턴스 필드에 저장해 상수별 동작을 구현한 열거 타입
    PLUS("+", (x, y) -> x + y),
    MINUS("-", (x, y) -> x - y),
    TIMES("*", (x, y) -> x * y),
    DIVIDE("/", (x, y) -> x / y);

    private final String symbol;
    private final DoubleBinaryOperator op; // 함수형 인터페이스 타입을 필드로 선언

    Operation(String symbol, DoubleBinaryOperator op) {
        this.symbol = symbol;
        this.op = op;
    }

    public double apply(double x, double y) {
        return op.applyAsDouble(x, y);
    }
}
```

## 람다의 한계

메서드나 클래스와 달리, 람다는 이름이 없고 문서화를 못 하기 때문에 코드 자체로 동작이 명확히 설명되지 않는 경우가 있다.  
또한 익명 클래스의 `this`는 익명 클래스 자신을 가리키지만, 람다의 `this`는 람다식을 감싼 클래스의 인스턴스를 가리키는 차이가 있기 때문에 자신을 참조해야 한다면 익명 클래스를 사용하는 것이 좋다.  
때문에 람다를 사용하는 경우엔 코드 줄수가 적어서 간결하게 표현될 수 있는 경우에만 사용하는 것이 좋다.
