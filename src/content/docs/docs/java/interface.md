---
title: "Interface"
date: 2022-12-05
lastUpdated: 2025-11-06
tags: [Java]
description: "Java 인터페이스의 구현과 명세 분리 목적과 default·static 메서드, 함수형 인터페이스와 람다 활용법을 설명한다."
---

일종의 추상클래스로 추상클래스보다 추상화 정도가 더 높으며, 다음과 같은 특징이 있다.

- 핵심 목적은 구현과 명세(사양)의 분리
- 느슨한 결합(Loose Coupling)을 통해 유연하고 확장 가능한 설계를 가능하게 함

## 인터페이스의 정의

`class` 키워드 대신 `interface` 키워드를 사용해 정의하며, JDK 8 이전까지 인터페이스의 모든 멤버는 다음 규칙을 따라야 했다.

- 멤버 변수: `public static final` 제어자만 사용 가능
- 메서드: `public abstract` 제어자만 사용 가능

이 제어자들은 인터페이스 멤버의 기본값이므로, 일반적으로 생략한다.

```java
interface 인터페이스명 {

    // 컴파일 시 public static final 이 자동으로 추가된다.
    int VALUE = 100;

    // 컴파일 시 public abstract 가 자동으로 추가된다.
    void method();
}
```

## 인터페이스의 구현

인터페이스는 그 자체로 인스턴스를 생성할 수 없다. `implements` 키워드를 사용하여 클래스가 특정 인터페이스를 구현(implement)함을 선언해야 한다.

- 인터페이스를 구현하는 클래스는 인터페이스에 선언된 모든 추상 메서드를 반드시 구현(오버라이딩) 필요
- 상속(`extends`)과 구현(`implements`)은 한 클래스에서 동시에 선언 가능

```java
class Fighter extends Unit implements Fightable {

    public void move() {
        System.out.println("move");
    }

    public void attack() {
        System.out.println("attack");
    }
}
```

만약 구현하는 추상 메서드 중 하나라도 구현하지 않는다면, 해당 클래스는 `abstract` 키워드를 붙여 추상 클래스로 선언해야 한다.

```java
abstract class Fighter extends Unit implements Fightable {

    public void move() {
        System.out.println("move");
    }
}
```

## 인터페이스의 상속

인터페이스는 인터페이스로부터만 상속 받을 수 있으며, 클래스와 달리 다중 상속이 가능하다.

- 구현 코드가 없는 명세의 조합이므로 다중 상속 시 발생하는 문제가 발생하지 않음
- `extends` 키워드를 사용하여 인터페이스 상속

```java
interface Movable {

    void move();
}

interface Attackable {

    void attack();
}

interface Fightable extends Movable, Attackable {

}
```

## 인터페이스를 이용한 다형성 구현

상속과 마찬가지로, 인터페이스 타입의 참조 변수는 해당 인터페이스를 구현한 모든 클래스의 인스턴스를 참조할 수 있다.

- 다형성의 핵심적인 구현 방식
- 여러 구현 클래스를 동일한 하나의 인터페이스 타입으로 핸들링 가능

```java

class ParserTest {

    public static void main(String[] args) {
        Parseable parser = ParserManager.getParser("XML"); // == Parseable parser = new XMLParser();
        parser.parse("document.xml"); // document.xml- XML parsing completed.
        System.out.println(parser.getClass().getName()); // XMLParser
        parser = ParserManager.getParser("HTML"); // == Parseable parser = new HTMLParser();
        parser.parse("document2.html"); // document2.html- HTML parsing completed.
        System.out.println(parser.getClass().getName()); // HTMLParser
    }
}
```

## static / default 메서드(JDK 1.8)

JDK 1.8부터 인터페이스에도 구현체를 가진 메서드를 선언할 수 있게 되었다.

- 하위 호환성을 지키면서 인터페이스에 새로운 기능을 추가하기 위해 도입
- 기존에 인터페이스를 구현한 클래스 코드를 수정하지 않고도 인터페이스를 확장 가능

```java
interface Calculator {

    static int execMulti(int a, int b) {
        return a * b;
    }

    int plus(int a, int b);

    int multi(int a, int b);

    default int execPlus(int a, int b) {
        return a + b;
    }
}

class CalculatorImpl implements Calculator {

    @Override
    public int plus(int pre, int post) {
        return pre + post;
    }

    @Override
    public int multi(int pre, int post) {
        return pre * post;
    }
}

class CalculatorTest {

    public static void main(String[] args) {
        Calculator cal = new CalculatorImpl();

        // 추상 메서드 호출
        System.out.println(cal.plus(3, 9)); // 12
        System.out.println(cal.multi(3, 9)); // 27

        // default 메서드 호출
        System.out.println(cal.execPlus(3, 9)); // 12
        System.out.println(cal.execPlus(3, 9)); // 12

        // static 메서드 호출
        // System.out.println(cal.execMulti(3, 9)); // 오류. 인스턴스로 호출 불가
        System.out.println(Calculator.execMulti(3, 9)); // 27
    }
}
```

|   메서드    | 내부 구현 가능 여부 | 재정의(오버라이딩) 여부 |    호출 방법    |
|:--------:|:-----------:|:-------------:|:-----------:|
|  static  |     가능      |      불가능      | 인터페이스명.메서드명 |
| default  |     가능      |    가능(선택적)    |  인스턴스.메서드명  |
| abstract |     불가능     |    가능(필수)     |  인스턴스.메서드명  |

### default 메서드 충돌

만약 두 개 이상의 인터페이스를 구현(`implements`)하는데, 동일한 시그니처를 가진 `default` 메서드가 여러 인터페이스에 존재하면 충돌이 발생한다.

```java
interface Interface1 {

    void interfaceMethod1();

    default void defaultMethod() {
        System.out.println("defaultMethod1");
    }
}

interface Interface2 {

    void interfaceMethod2();

    default void defaultMethod() {
        System.out.println("defaultMethod2");
    }
}

class ConcreteClass2 implements Interface1, Interface2 {

    @Override
    public void defaultMethod() {
        Interface1.super.defaultMethod();
    }
}
```

이 경우, 구현 클래스는 해당 `default` 메서드를 반드시 오버라이딩하여 모호성을 해결해야 한다.

## 익명 구현 객체(Anonymous Implement Object)

별도의 구현 클래스 파일(.java)을 정의하지 않고, 인터페이스를 즉석에서 구현하여 객체를 생성하는 방법이다.

- 주로 해당 위치에서 단 한 번만 사용될 객체를 생성할 때 사용
- 함수형 인터페이스(추상 메서드가 하나만 있는 인터페이스)일 경우, 람다(Lambda) 표현식으로 더 간결하게 대체 가능

```java
interface Calculator {

    int exec(int a, int b);
}

class CalculatorTest {

    public static void main(String[] args) {
        Calculator cal = new Calculator() {
            @Override
            public int exec(int a, int b) {
                return a + b;
            }
        };

        System.out.println(cal.exec(3, 9)); // 12

        // 람다 표현식 (위 익명 클래스와 동일한 기능)
        Calculator calLambda = (a, b) -> a + b;
        System.out.println(calLambda.exec(3, 9)); // 12
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
