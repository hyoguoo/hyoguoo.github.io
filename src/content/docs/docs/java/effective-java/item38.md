---
title: "Extended Enum"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 확장할 수 있는 열거 타입이 필요하면 인터페이스를 사용하라.

열거 타입에 단점 중 하나는 확장이 불가능하다는 것이다. 열거 타입을 확장하는 방법은 없지만, 인터페이스를 사용하면 비슷한 효과를 낼 수 있다.  
대부분의 상황에서는 열거 타입을 확장하는 것이 좋지 않지만, 확장할 수 있는 열거 타입이 필요하다면 인터페이스를 사용하자.  
대표적인 예로 연산 코드를 나타내는 열거 타입이 있다.

```java
interface Operation {
    double apply(double x, double y);
}

enum BasicOperation implements Operation {
    PLUS("+") {
        public double apply(double x, double y) {
            return x + y;
        }
    },
    MINUS("-") {
        public double apply(double x, double y) {
            return x - y;
        }
    },
    TIMES("*") {
        public double apply(double x, double y) {
            return x * y;
        }
    },
    DIVIDE("/") {
        public double apply(double x, double y) {
            return x / y;
        }
    };

    private final String symbol;

    BasicOperation(String symbol) {
        this.symbol = symbol;
    }

    @Override
    public String toString() {
        return symbol;
    }
}

enum ExtendedOperation implements Operation {
    EXP("^") {
        public double apply(double x, double y) {
            return Math.pow(x, y);
        }
    },
    REMAINDER("%") {
        public double apply(double x, double y) {
            return x % y;
        }
    };

    private final String symbol;

    ExtendedOperation(String symbol) {
        this.symbol = symbol;
    }

    @Override
    public String toString() {
        return symbol;
    }
}
```

인터페이스의 Operation을 확장하여, 이 인터페이스를 연산의 타입으로 사용한 열거 타입 BasicOperation을 정의했다.  
이렇게 하면 다음과 같은 이점을 얻을 수 있다.

- apply 메서드가 인터페이스에 선언되어 있어 별도로 추상 메서드를 선언할 필요가 없음
- 인터페이스를 구현한 열거 타입을 만들어 연산 코드를 쉽게 추가 및 대체 가능 

아래 코드는 인터페이스를 확장한 확장된 연산 코드를 적용한 예시이다.

```java
import java.util.Collections;

class Main {
    public static void main(String[] args) {
        double x = 2.0;
        double y = 4.0;
        test1(BasicOperation.class, x, y);
        test1(ExtendedOperation.class, x, y);
        test2(Arrays.asList(ExtendedOperation.values()), x, y);
    }

    /**
     * @param opEnumType: class 리터럴을 넘겨 확장된 열거 타입의 Class 객체를 넘겨 확장된 연산들을 알려줌
     * @param x
     * @param y
     * @param <T>: T extends Enum<T> & Operation -> T는 열거 타입이면서 Operation 인터페이스를 구현한 타입
     */
    private static <T extends Enum<T> & Operation> void test(Class<T> opEnumType, double x, double y) {
        for (Operation op : opEnumType.getEnumConstants()) {
            System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
        }
    }

    /**
     * @param opSet: 한정적 와일드 카드 타입을 사용하여, 확장된 열거 타입의 인스턴스 집합을 받음
     * @param x
     * @param y
     */
    private static void test2(Collections<? extends Operation> opSet, double x, double y) {
        for (Operation op : opSet) {
            System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
        }
    }
}
```
