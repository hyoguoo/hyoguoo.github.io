---
title: "Class(클래스)"
date: 2022-11-20
lastUpdated: 2025-11-03
---

## 클래스의 구성 요소

```java
class Ogu {

    // 속성(property)
    int height;
    int weight;
    int age;

    // 기능(function), 메서드(method)
    void eat() {
        // ...
    }

    void sleep() {
        // ...
    }
}
```

- 속성(property): 클래스 내부에 선언된 변수로, 클래스 객체마다 각각의 값이 가질 수 있는 특징이나 상태
- 메서드(method): 클래스 내부에 선언된 함수로, 객체의 상태를 조작하거나 객체 간의 상호작용을 처리하는데 사용

## 인스턴스 생성과 사용

클래스는 설계도일 뿐이며, 이를 실제로 사용하기 위해서는 메모리에 생성하는 '인스턴스화' 과정이 필요하다.

- 인스턴스화 (Instantiate): 클래스(설계도)로부터 객체(제품)를 만드는 과정
- 인스턴스 (Instance): 인스턴스화를 통해 메모리에 생성된 실제 객체
- `new` 키워드를 사용하여 인스턴스를 생성

```java
class Example {

    public void main() {
        Ogu ogu = new Ogu(); // 인스턴스를 참조하기 위한 변수 선언 및 인스턴스 생성
        ogu.height = 180;
        ogu.weight = 70;
        ogu.age = 20;
        ogu.eat();
        ogu.sleep();
    }
}
```

## 변수

|   종류    |        선언 위치        |      생성 시기      |                       특징                       |
|:-------:|:-------------------:|:---------------:|:----------------------------------------------:|
| 인스턴스 변수 |       클래스 내부        |   인스턴스 생성됐을 때   |              인스턴스마다 독립적인 저장공간을 가짐              |
| 클래스 변수  |       클래스 내부        | 클래스가 메모리에 올라갈 때 | 모든 인스턴스가 공통된 변수를 공유하며, 인스턴스를 생성하지 않고도 바로 사용 가능 |
|  지역 변수  | 메서드, 생성자, 초기화 블록 내부 |   메서드가 호출됐을 때   |                 메서드 내에서만 사용가능                  |

```java
class Example {

    int instanceVar; // 인스턴스 변수
    static int classVar; // 클래스 변수

    void method() {
        int localVar; // 지역 변수
    }
}
```

## 메서드

```java
class Example {

    int add(int a, int b) { // 메서드 선언 부
        // 메서드 구현 부
        int result = a + b;
        return result;
    }
}
```

### return

메서드의 반환값이 있는 경우, 메서드의 마지막 문장으로 `return`문을 명시해야 한다.(`void`일 경우 컴파일러에서 자동 추가)

```java
class Example {

    // error, 모든 실행 경로에서 반환값이 보장되지 않음
    int add1(int a, int b) {
        if (a > b) {
            return a;
        }
    }

    // ok
    int add2(int a, int b) {
        if (a > b) {
            return a;
        } else {
            return b;
        }
    }
}
```

### static 메서드(클래스 메서드)

메서드 중에서 인스턴스와 관계없는(인스턴스 변수나 인스턴스 메서드를 사용하지 않는) 메서드는 클래스 메서드로 선언할 수 있다.

```java
class Example {

    int instanceVar;
    static int classVar;

    void instanceMethod() {
    }

    static void staticMethod() {
    }

    void instanceMethod2() {
        // 인스턴스 메서드는 인스턴스/static 멤버 모두 접근 가능
        instanceMethod(); // 가능
        staticMethod(); // 가능
        System.out.println(instanceVar); // 가능
        System.out.println(classVar); // 가능
    }

    static void staticMethod2() {
        // static 메서드는 static 멤버만 접근 가능
        instanceMethod(); // 오류. 인스턴스 메서드 접근 불가
        staticMethod(); // 가능
        System.out.println(instanceVar); // 오류. 인스턴스 변수 접근 불가
        System.out.println(classVar); // 가능
    }

    static void staticMethod3() {
        // static 메서드 내에서 인스턴스가 필요하면, 직접 생성해야 한다.
        Example e = new Example();
        e.instanceMethod(); // 가능
        System.out.println(e.instanceVar); // 가능
    }
}
```

## 오버로딩(Overloading)

같은 이름의 메서드를 여러 개 정의하는 것으로, 매개변수의 개수나 타입을 다르게 하여 같은 이름으로 메서드를 여러 개 정의할 수 있다.

```java
class PrintStream {

    void println(int x);

    void println(boolean x);

    void println(double x);

    void println(String x);

    void println(int x, int y) {
        System.out.println(x + ", " + y);
    }

    void println(int x, int y, int z) {
        System.out.println(x + ", " + y + ", " + z);
    }

    // 가변 인자를 통해 매개변수의 개수가 일정하지 않을 때 사용할 수 있다.
    void println(int... x) {
        for (int i : x) {
            System.out.println(i);
        }
    }
```

## 생성자(Constructor)

인스턴스가 생성될 때 호출되는 인스턴스 초기화 메서드로, 클래스의 이름과 동일하며 리턴 타입이 없다.

### 생성자 실행 과정

1. 연산자 `new`에 의해 힙(heap) 영역에 인스턴스가 생성된다.
2. 생성자가 호출되어 인스턴스 변수들이 초기화된다.
3. 연산자 `new`의 결과로 생성된 인스턴스의 주소가 반환되어 참조변수에 저장된다.

### 생성자

모든 클래스에는 반드시 하나 이상의 생성자가 존재해야하며, 정의하지 않은 경우에는 컴파일러가 `기본 생성자`를 추가한다.

```java
class Example {

    int x;

    Example(int x) {
        this.x = x;
    }
}

class Main {

    public static void main(String[] args) {
        Example e = new Example(); // 컴파일 에러
        Example e = new Example(10); // ok
    }
}
```

만약 생성자를 하나라도 정의하면 컴파일러는 기본 생성자를 추가하지 않는다.

## 변수 초기화

1. 명시적 초기화: 변수를 선언과 동시에 초기화하는 것
2. 초기화 블록: 여러 문장으로 이루어진 초기화 코드를 블록으로 묶어 놓은 것
    1. 인스턴스 초기화 블록: 인스턴스 변수를 초기화하는 블록
    2. 클래스 초기화 블록: 클래스 변수를 초기화하는 블록
3. 생성자: 인스턴스가 생성될 때 호출되는 인스턴스 초기화 메서드

```java
class InitBlock {

    static int classVar = 10; // 클래스 변수의 명시적 초기화
    int instanceVar = 10; // 인스턴스 변수의 명시적 초기화

    // 클래스 초기화 블록을 이용한 초기화
    static {
        classVar = 20;
    }

    // 인스턴스 초기화 블록을 이용한 초기화
    {
        instanceVar = 20;
    }

    // 생성자를 이용한 초기화
    InitBlock() {
        instanceVar = 30;
    }
}
```

### 멤버변수 초기화 시기와 순서

1. 클래스 변수 : 클래스가 처음 로딩될 때 단 한번 초기화
    - 기본값 -> 명시적 초기화 -> 클래스 초기화 블록
2. 인스턴스 변수 : 인스턴스가 생성될 때 마다 각 인스턴스별로 초기화
    - 기본값 -> 명시적 초기화 -> 인스턴스 초기화 블록 -> 생성자

```java
class InitTest {

    static int cv = 1;
    int iv = 1;

    static {
        cv = 2;
    }

    {
        iv = 2;
    }

    public InitTest() {
        iv = 3;
    }
}
```

|         -         | cv | iv |
|:-----------------:|:--:|:--:|
|   (클래스 초기화)기본값    | 0  | -  |
| (클래스 초기화)명시적 초기화  | 1  | -  |
|    클래스 초기화 블록     | 2  | -  |
|   (인스턴스 초기화)기본값   | 2  | 0  |
| (인스턴스 초기화)명시적 초기화 | 2  | 1  |
|    인스턴스 초기화 블록    | 2  | 2  |
|        생성자        | 2  | 3  |

1. `cv`가 메모리(method area)에 생성되고, 타입 기본 값인 0이 저장
2. 명시적 초기화(`int cv = 1`)가 수행되어 1로 저장
3. 클래스 초기화 블록이 수행되어 2로 저장
4. InitTest 클래스 인스턴스가 생성되면서 `iv`가 메모리(heap)에 생성되고, 타입 기본 값인 0이 저장
5. 명시적 초기화(`int iv = 1`)가 수행되어 1로 저장
6. 인스턴스 초기화 블록이 수행되어 2로 저장
7. 생성자가 수행되어 3으로 저장

## 내부 클래스(Inner Class)

클래스 내부에 정의된 클래스로서, 주로 외부 클래스와 밀접한 관계를 가지는 경우 사용된다.

- inner class
    - 인스턴스 내부 클래스는 외부 클래스의 인스턴스 멤버처럼 취급
    - 외부 클래스의 인스턴스 필드와 메서드에 접근 가능
    - 외부 클래스의 인스턴스가 생성되어야만 사용 가능
- static inner class
    - static 내부 클래스는 외부 클래스의 static 멤버처럼 취급
    - 외부 클래스의 static 멤버만 접근 가능
    - 외부 클래스의 인스턴스 생성 없이 사용 가능

```java
public class Main {

    public static void main(String[] args) {
        // 1. 인스턴스 내부 클래스, 외부 클래스의 인스턴스 생성 후 접근 가능
        OuterClass.InnerClass inner = new OuterClass().new InnerClass();
        // 2. 정적 내부 클래스, 외부 클래스의 인스턴스 생성 없이 접근 가능
        OuterClass.StaticInnerClass staticInner = new OuterClass.StaticInnerClass();
    }
}
```

|       클래스 유형       |           설명           | 외부 클래스 필드 접근  | 외부 클래스 생성 필요 |          특징           |
|:------------------:|:----------------------:|:-------------:|:------------:|:---------------------:|
|    inner class     |  외부 클래스의 인스턴스 멤버처럼 동작  |      가능       |      필요      | 외부 클래스의 인스턴스와 연결되어 있음 |
| static inner class | 외부 클래스의 static 멤버처럼 동작 | static 멤버만 가능 |     불필요      |   외부 클래스 인스턴스와 독립적    |

### static inner class vs inner class

1. 외부 클래스의 인스턴스 생성 여부
    - 인스턴스 내부 클래스는 외부 클래스의 인스턴스가 생성되어야만 사용 가능
    - 정적 내부 클래스는 외부 클래스의 인스턴스 생성 없이 사용 가능
2. 외부 클래스 필드 접근 여부
    - 인스턴스 내부 클래스는 외부 클래스의 인스턴스 필드와 메서드에 접근 가능
    - 정적 내부 클래스는 외부 클래스의 static 멤버만 접근 가능

#### 메모리 누수 (Memory Leak) 위험

인스턴스 내부 클래스는 메모리 누수 현상의 원인이 될 수 있는데, 그 이유는 다음과 같다.

1. 인스턴스 내부 클래스는 암묵적으로 외부 클래스의 인스턴스를 참조
2. 내부 클래스 인스턴스가 외부 클래스 인스턴스보다 오래 살아남는 경우, 가비지 컬렉터(GC)가 외부 클래스 인스턴스를 수거하지 못함
3. 이로 인해 외부 클래스 인스턴스가 메모리에 남아 있게 되어 메모리 누수가 발생할 수 있음


###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
