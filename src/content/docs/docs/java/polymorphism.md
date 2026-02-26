---
title: "Polymorphism"
date: 2022-11-28
lastUpdated: 2025-11-05
tags: [Java]
description: ""
---

자바는 조상 클래스 타입의 참조 변수로 그 자손 클래스의 인스턴스를 참조할 수 있도록 하여 다형성을 구현한다.

```java
class Product {

    int price;
    int bonusPoint;

    Product(int price) {
        this.price = price;
        bonusPoint = (int) (price / 10.0);
    }
}

class Tv extends Product {

    Tv() {
        super(100);
    }

    public String toString() {
        return "Tv";
    }
}

class Example {

    public static void main(String[] args) {
        Product product = new Product(100); // Product 클래스의 인스턴스 생성
        Tv tv = new Tv(); // Tv 클래스의 인스턴스 생성
//        Product product2 = new Tv(); // Tv 클래스의 인스턴스를 Product 클래스 타입의 참조변수에 저장, Tv 인스턴스의 모든 멤버 사용 불가능
//        Tv tv2 = new Product(); // 컴파일 에러
    }
}
```

## instanceof 연산자

참조 변수가 참조하고 있는 인스턴스의 실제 타입을 확인하는 데 사용하며, boolean 타입의 값을 반환한다.

- `instanceof` 연산 결과가 `true`라는 것은, 해당 타입으로 강제 형변환이 안전하게 가능함을 의미
- `false`가 나온 인스턴스를 강제로 형변환하면, 실행 시 `ClassCastException`이 발생

```java
class Example {

    public static void main(String[] args) {
        Product product = new Product(100); // Product 클래스의 인스턴스 생성
        Tv tv = new Tv(); // Tv 클래스의 인스턴스 생성
        Product productTv = new Tv(); // Tv 클래스의 인스턴스를 Product 클래스 타입의 참조변수에 저장, Tv 인스턴스의 모든 멤버 사용 불가능

        System.out.println(product instanceof Product); // true
        System.out.println(product instanceof Tv); // false
        System.out.println(tv instanceof Product); // true
        System.out.println(tv instanceof Tv); // true
        System.out.println(productTv instanceof Product); // true
        System.out.println(productTv instanceof Tv); // true
    }
}
```

## 참조변수와 인스턴스 연결

조상 타입의 참조 변수(`Parent p`)로 자손 인스턴스(`new Child()`)를 참조할 때, 멤버 변수(필드)와 메서드의 동작 방식이 다르다.

- 멤버 변수(필드)
    - 참조 변수의 타입에 따라 결정(정적 바인딩, Static Binding)
    - `p.x`는 `Parent` 타입으로 선언되었으므로 `Parent`의 `x`가 사용
- 메서드(오버라이딩된 메서드)
    - 참조 변수의 타입과 관계없이, 실제 연결된 인스턴스의 메서드가 호출(동적 바인딩, Dynamic Binding)
    - `p.method()`는 `new Child()` 인스턴스의 `method()` 호출

실무에서는 이처럼 멤버 변수를 중복 정의하는 것은 코드에 혼란을 주므로 권장되지 않으며, 메서드 오버라이딩이 다형성 활용의 핵심이다.

```java
class BindingTest {

    public static void main(String[] args) {
        Parent p = new Child();
        Child c = new Child();

        // p는 Parent 타입 -> Parent의 x 사용
        System.out.println("p.x = " + p.x); // 100 
        // p는 Child 인스턴스 참조 -> Child의 오버라이딩된 method() 사용
        p.method(); // Child Method

        // c는 Child 타입 -> Child의 x 사용
        System.out.println("c.x = " + c.x); // 200
        // c는 Child 인스턴스 참조 -> Child의 method() 사용
        c.method(); // Child Method
    }
}

class Parent {

    int x = 100;

    void method() {
        System.out.println("Parent Method");
    }
}

class Child extends Parent {

    int x = 200; // 부모의 x를 '숨기는(hiding)' 것. 오버라이딩이 아님.

    @Override
    void method() {
        System.out.println("Child Method");
    }
}
```

`Child` 클래스 내부에서는 `this.x`와 `super.x`로 부모와 자식의 변수를 명확히 구분할 수 있다.

```java
// Child 클래스의 method() 내부
void method() {
    System.out.println("x=" + x); // 200 (this.x와 동일)
    System.out.println("super.x=" + super.x); // 100
    System.out.println("this.x=" + this.x); // 200
}
```

## 매개변수의 다형성

메서드의 매개변수 타입을 조상 클래스 타입으로 선언하여, 다양한 자손 타입의 인스턴스를 하나의 메서드로 처리하는 방식이다.

```java
class Product {

    int price;
    int bonusPoint;

    Product(int price) {
        this.price = price;
        bonusPoint = (int) (price / 10.0);
    }
}

// Tv extends Product, Computer extends Product, Audio extends Product ...

class Buyer {

    int money = 1000;
    int bonusPoint = 0;
    Product[] item = new Product[10];
    int i = 0;

    // 매개변수의 다형성을 활용
    void buy(Product p) {
        this.money -= p.price;
        this.bonusPoint += p.bonusPoint;
        item[i++] = p; // Product 배열에 자손 인스턴스 저장
    }
}
```

이 방식은 코드의 양을 줄이는 것 뿐만 아니라, 객체 지향 설계 원칙 측면에서도 여러 가지 장점이 있다.

- 느슨한 결합(Loose Coupling): `Buyer`는 `Tv`, `Computer` 등 구체적인 클래스에 대해 알 필요가 없음
- 유연한 확장(OCP): 나중에 `Product`를 상속받는 클래스가 추가되어도, `Buyer` 클래스의 코드는 전혀 수정할 필요 없이 동작

### 여러 종류 객체 배열로 다루기

위 예제처럼 `Product` 클래스가 `Tv`, `Computer`, `Audio` 클래스의 조상일 때 `Product` 타입의 참조 변수 배열로 처리할 수 있다.

```java
class Example {

    public static void main(String[] args) {
        Product[] product = new Product[3];
        product[0] = new Tv();
        product[1] = new Computer();
        product[2] = new Audio();
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
