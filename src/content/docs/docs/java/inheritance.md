---
title: "Inheritance"
date: 2022-11-21
lastUpdated: 2025-11-04
---

기존 클래스를 재사용하여 새로운 클래스를 작성하는 것으로, 상속을 사용하면 코드의 중복을 줄이고 공통 관리가 가능해져 유지보수성이 향상된다.

- 조상 클래스 : 상속을 해주는 클래스(=부모(parent) 클래스, 상위(super) 클래스, 기반(base) 클래스)
- 자손 클래스 : 상속을 받는 클래스(=자식(child) 클래스, 하위(sub) 클래스, 파생(derived) 클래스)

```java
class Parent {

    private String name;
    private int age;
    // Child 클래스의 address 미존재 
}

class Child extends Parent {

    // Parent 클래스의 name, age 필드를 상속받음
    private String address;
}

class Child extends Parent1, Parent2 { // error
    // ...
}

class Parent extends Object { // Object 클래스는 모든 클래스의 조상
    // ...
}
```

- 자바에서는 관계 명확성 및 신뢰성을 위해 단일 상속만 허용
    - 다중 상속을 허영하면, 여러 부모 클래스에 동일한 이름의 메서드가 존재할 때 발생하는 모호함이 생길 수 있음
- 모든 클래스는 `java.lang.Object` 클래스를 상속받는다.(생략 가능)

## 상속 이외에 클래스를 재사용하는 방법

상속 외에 클래스의 멤버 변수로 다른 클래스의 인스턴스를 참조하는 포함(Composition) 방식으로도 클래스를 재사용할 수 있다.

```java
// 상속을 이용한 설계
class Circle extends Point {

    private int radius;
}

// 포함을 이용한 설계
class Circle {

    private Point center = new Point(); // 포함 관계
    private int radius;
}

class Rectangle {

    private Point topLeft = new Point(); // 포함 관계
    private int width;
    private int height;
}

class Point {

    private int x;
    private int y;
}
```

### 상속(is-a) vs 포함(has-a)

클래스 설계를 할 때 두 관계를 명확히 구분하는 것이 중요하다.

- 상속 (is-a): A는 B이다(예: `Car`는 `Vehicle`이다.)
- 포함 (has-a): A는 B를 가진다(예: `Car`는 `Engine`을 가진다.)

대부분의 상황에서는 상속보다 포함을 사용되는 것이 권장되며, 그 이유는 다음과 같다.

- 상속은 부모 클래스와 자식 클래스 간의 결합도를 높여, 부모 클래스의 변경이 자식 클래스에 의도치 않은 영향을 미칠 수 있음
- 포함을 사용하면 결합도가 낮아져 더 유연하고 테스트하기 쉬운 설계 가능

## 오버라이딩(Overriding)

조상 클래스로부터 상속받은 메서드의 구현 내용을 자손 클래스의 상황에 맞게 재정의하는 것이다.

```java
class Point {

    int x;
    int y;

    String getLocation() {
        return "x : " + x + ", y : " + y;
    }
}

class Point3D extends Point {

    int z;

    // getLocation() 메서드를 오버라이딩 (재정의)
    String getLocation() {
        return "x : " + x + ", y : " + y + ", z : " + z;
    }
}
```

### 오버라이딩의 조건

- 다음의 값들이 동일
    - 메서드 이름
    - 매개변수 목록(개수, 타입, 순서)
    - 반환 타입
        - JDK 1.5부터 '공변 반환 타입(Covariant return type)'이 허용되어, 조상 클래스 반환 타입의 자식 클래스 타입으로 반환 가능
- 접근 제어자는 조상 클래스의 메서드보다 좁은 범위로 변경 불가능(public > protected > default > private)
- 조상 클래스의 메서드보다 더 많은 수의 예외 선언 불가능(조상 클래스의 메서드가 예외를 선언하지 않은 경우, 자손 클래스에서 선언 불가)
- static 메서드는 오버라이딩 불가능하며, 인스턴스 메서드를 static으로 변경 불가능

## super

자손 클래스에서 조상 클래스의 멤버(변수 또는 메서드)를 참조할 때 사용하는 참조 변수다.

```java
class Point {

    int x;
    int y;

    String getLocation() {
        return "x : " + x + ", y : " + y;
    }
}

class Point3D extends Point {

    int z;

    String getLocation() { // Overriding
        return "x : " + x + ", y : " + y + ", z : " + z;
    }

    String getSuperLocation() {
        return super.getLocation();
    }
}
```

### super()

자손 클래스의 생성자에서 조상 클래스의 생성자를 호출할 때 사용한다.

- `super()`는 생성자의 첫 줄에서만 호출 가능(조상 멤버가 자손 멤버보다 먼저 초기화되어야 하기 때문)
    - 명시적으로 호출하지 않으면, 컴파일러가 자동으로 생성자 첫 줄에 `super()` (기본 생성자 호출) 추가
- 이 호출은 `Object` 클래스에 도달할 때까지 계층 구조를 따라 연쇄적으로 호출

```java
class Point /* extends Object */ {

    int x;
    int y;

    Point(int x, int y) {
        // super(); // 컴파일러가 자동으로 추가 -> 조상인 Object 클래스 생성자 Object() 호출
        this.x = x;
        this.y = y;
    }

    String getLocation() {
        return "x : " + x + ", y : " + y;
    }
}

class Point3D extends Point {

    int z;

    Point3D(int x, int y, int z) {
        super(x, y); // 조상 클래스의 생성자 Point(int x, int y) 호출
        this.z = z;
    }

    String getLocation() { // Overriding
        return "x : " + x + ", y : " + y + ", z : " + z;
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
