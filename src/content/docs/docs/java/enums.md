---
title: "Enums"
date: 2023-06-15
lastUpdated: 2025-11-01
---

열거형(Enums)은 서로 연관된 상수들의 집합을 정의할 때 사용하는 데이터 타입으로, 타입 안전성을 보장하고 코드의 가독성을 높이는 데 목적이 있다.

## Enum 정의와 사용

`enum` 키워드를 사용하여 열거형을 정의하며, 각 상수는 관례적으로 대문자로 작성하며 쉼표로 구분한다.

```java
enum Direction {
    EAST, SOUTH, WEST, NORTH
}
```

### 열거형 비교와 활용

열거형 상수는 JVM 내에서 유일한 인스턴스(싱글턴)임이 보장된다.

- `==` 연산자: 참조가 동일하므로 `==` 연산자로 비교 가능
- `equals()` 메서드: `Object`의 `equals()`를 오버라이드하며, `==` 비교와 동일하게 동작
- `compareTo()` 메서드: `Comparable` 인터페이스를 구현하며, 열거형 상수가 선언된 순서(ordinal)를 기준으로 비교
- 비교 연산자: `<`, `>`와 같은 정수 비교 연산자는 사용 불가능

```java
class Unit {

    int x, y;
    Direction direction;

    void moveIf(Direction direction) {
        if (direction == Direction.EAST) { // '==' 연산자 비교 권장
            x++;
        } else if (direction.equals(Direction.SOUTH)) { // equals()도 가능
            y--;
        } else if (direction.compareTo(Direction.NORTH) == 0) { // compareTo()도 사용 가능
            y++;
        }
    }

    void moveSwitch(Direction direction) {
        // switch 문에서 case 레이블에 'Direction.EAST'가 아닌 'EAST' 사용
        switch (direction) {
            case EAST:
                x++;
                break;
            case SOUTH:
                y--;
                break;
            case WEST:
                x--;
                break;
            case NORTH:
                y++;
                break;
        }
    }
}
```

## 열거형과 멤버 변수, 메서드

열거형은 클래스의 특성을 가지므로, 멤버 변수, 메서드, 생성자를 가질 수 있다.

- 열거형의 생성자는 묵시적으로 `private`
    - `public`이나 `protected`로 선언 불가능
    - 열거형 인스턴스를 임의로 생성하는 것을 막기 위해 제한
- 상수를 선언할 때 괄호 `()`를 사용하여 생성자를 호출하고 값 전달하는 방식으로 선언

```java
enum Direction {
    EAST(1, ">"), SOUTH(2, "V"), WEST(3, "<"), NORTH(4, "^");

    // static 메서드
    private static final Direction[] DIR_ARR = Direction.values();
    // `values()` 메서드는 호출될 때마다 열거형 상수의 배열을 새로 생성
    // 자주 호출되는 경우, 성능 향상을 위해 static final 배열로 캐싱하여 성능 향상 가능
    // 멤버 변수
    private final int value;
    private final String symbol;

    // 생성자 (private 생략됨)
    Direction(int value, String symbol) {
        this.value = value;
        this.symbol = symbol;
    }

    public static Direction of(int dir) {
        if (dir < 1 || dir > 4) {
            throw new IllegalArgumentException("Invalid value : " + dir);
        }
        return DIR_ARR[dir - 1];
    }

    // 메서드
    public int getValue() {
        return value;
    }

    public String getSymbol() {
        return symbol;
    }

    public Direction rotate(int num) {
        num = (num % 4 + 4) % 4;
        return DIR_ARR[(value - 1 + num) % 4];
    }

    @Override
    public String toString() {
        return name() + " " + getSymbol();
    }
}
```

## 열거형과 다형성

### 추상 메서드 활용

열거형 내부에 추상 메서드를 선언하고, 각 상수가 익명 클래스처럼 해당 메서드를 오버라이드하여 구현할 수 있다.

```java
enum Operation {
    PLUS("+") {
        @Override
        public int eval(int x, int y) {
            return x + y;
        }
    },
    MINUS("-") {
        @Override
        public int eval(int x, int y) {
            return x - y;
        }
    };

    private final String symbol;

    Operation(String symbol) {
        this.symbol = symbol;
    }

    // 추상 메서드 선언
    public abstract int eval(int x, int y);

    @Override
    public String toString() {
        return symbol;
    }
}
```

### 인터페이스와 람다 활용

인터페이스를 구현하고, 람다 표현식을 생성자로 받아 상수별 동작을 정의할 수도 있다.

```java
// 함수형 인터페이스 정의
interface Calculator {

    int eval(int x, int y);
}

// Calculator 인터페이스 구현
enum Operation implements Calculator {
    PLUS("+", (x, y) -> x + y),
    MINUS("-", (x, y) -> x - y);

    private final String symbol;
    private final Calculator calculator; // 람다식을 저장할 멤버 변수

    Operation(String symbol, Calculator calculator) {
        this.symbol = symbol;
        this.calculator = calculator;
    }

    @Override
    public int eval(int x, int y) {
        return calculator.eval(x, y); // 위임
    }

    @Override
    public String toString() {
        return symbol;
    }
}
```

## java.lang.Enum 메서드

Java의 모든 열거형은 java.lang.Enum 클래스를 상속받는다. 이 클래스는 열거형을 다루기 위한 여러 유용한 메서드를 제공한다.

|             메서드              |                 설명                  |
|:----------------------------:|:-----------------------------------:|
|         T[] values()         |          모든 열거형 상수를 배열로 반환          |
|        int ordinal()         |           열거형 상수의 순서를 반환            |
|        String name()         |         열거형 상수의 이름을 문자열로 반환         |
| Class<E> getDeclaringClass() |    열거형 상수가 정의된 열거형의 Class 객체를 반환    |
|      String toString()       | 열거형 상수의 문자열 표현을 반환(기본적으로 name() 반환) |

```java
enum Direction {
    EAST(10), SOUTH(20), WEST(30), NORTH(40);

    private final int value;

    Direction(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}

class Test {

    public static void main(String[] args) {
        System.out.println(Direction.EAST.getValue()); // 10
        System.out.println(Arrays.toString(Direction.values())); // [EAST, SOUTH, WEST, NORTH]
        System.out.println(Direction.EAST.ordinal()); // 0
        System.out.println(Direction.EAST.name()); // EAST
        System.out.println(Direction.EAST.getDeclaringClass()); // class Direction
    }
}
```

## 열거형의 내부 구현

`enum Direction { EAST, SOUTH }`는 내부적으로 다음과 유사한 클래스로 변환된다.

```java
// 컴파일러가 변환한 예상 코드
final class Direction extends java.lang.Enum<Direction> {

    public static final Direction EAST = new Direction("EAST", 0);
    public static final Direction SOUTH = new Direction("SOUTH", 1);

    private static final Direction[] $VALUES = {EAST, SOUTH};

    // private 생성자
    private Direction(String name, int ordinal) {
        super(name, ordinal);
    }

    public static Direction[] values() {
        return $VALUES.clone();
    }

    public static Direction valueOf(String name) {
        return Enum.valueOf(Direction.class, name);
    }
}
```

각 열거형 상수는 `public static final`로 선언된 자기 자신의 인스턴스가 되어 JVM 내에서 각 상수의 유일성(싱글턴)을 보장하며, `==` 비교가 가능한 근거가 된다.


-----

## EnumSet과 EnumMap

자바 컬렉션 프레임워크는 열거형을 위해 특별히 최적화된 `Set`과 `Map` 구현체를 제공한다.

- `EnumSet`
    - 내부적으로 비트 벡터(bit vector) 사용
    - 메모리 사용량이 매우 적고, `HashSet`보다 월등히 빠른 성능을 제공
- `EnumMap`
    - 내부적으로 단순 배열을 사용하며, 상수의 `ordinal()` 값을 인덱스로 활용
    - `HashMap`보다 훨씬 빠르고 효율적이다.

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
- [실무 자바 개발을 위한 OOP와 핵심 디자인 패턴](https://school.programmers.co.kr/learn/courses/17778/17778-실무-자바-개발을-위한-oop와-핵심-디자인-패턴)
