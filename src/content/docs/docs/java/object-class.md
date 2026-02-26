---
title: "Object class"
date: 2024-03-07
lastUpdated: 2025-11-07
tags: [Java]
description: ""
---

`java.lang` 패키지는 자바 프로그래밍의 가장 기본이 되는 클래스들을 포함한다.

- `import` 문 없이 사용 가능
- 모든 클래스의 최고 조상으로, 모든 클래스는 `Object` 클래스의 멤버를 상속받음

|         Object class method         |                         description                         |
|:-----------------------------------:|:-----------------------------------------------------------:|
|     `protected Object clone()`      |                            객체 복제                            |
| `public boolean equals(Object obj)` |                       객체의 내용이 같은지 비교                        |
|     `protected void finalize()`     |                 객체 소멸 전에 호출(가비지 컬렉터에 의해 호출)                 |
|      `public Class getClass()`      |               객체의 클래스 정보를 담고 있는 Class 인스턴스 반환               |
|       `public int hashCode()`       |                        객체의 해시코드를 반환                         |
|     `public String toString()`      |                         객체를 문자열로 반환                         |
|       `public void notify()`        |                객체 자신을 사용하려고 기다리는 스레드를 하나만 깨움                |
|      `public void notifyAll()`      |                객체 자신을 사용하려고 기다리는 스레드를 모두 깨움                 |
|        `public void wait()`         | 다른 스레드가 `notify()` 혹은 `notifyAll()`을 호출할 때까지 지정된 시간동안 대기 지정 |

## equals(Object obj)

`Object` 클래스에 정의된 원본 `equals()` 메서드는 `==` 연산자와 동일하게 동작하는데, 이는 두 참조 변수가 동일한 메모리 주소의 인스턴스를 가리키는지(동일성) 비교한다.

```java
class Point {

    int x;
    int y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}

public class EqualsTest {

    public static void main(String[] args) {
        Point a = new Point(2, 3);
        Point b = new Point(2, 3);
        Point c = a; // a와 c는 같은 객체를 참조

        // 동일성 비교(비교 대상이 같은 인스턴스인지)
        System.out.println(a == b); // false
        System.out.println(a == c); // true

        // 동등성 비교(비교 대상이 같은 값을 갖는지), 하지만 Point 클래스는 equals() 메서드를 오버라이딩하지 않았기 때문에 동일성 비교와 같다.
        System.out.println(a.equals(b)); // false
        System.out.println(a.equals(c)); // true
    }
}
```

두 객체의 멤버 변수 값을 비교하여 논리적 내용이 같은지(동등성) 비교하고 싶다면, `equals()` 메서드를 다음과 같은 규칙에 따라 재정의(오버라이딩)해야 한다.

- 반사성(Reflexive): `x.equals(x)`는 항상 `true`
- 대칭성(Symmetric): `x.equals(y)`가 `true`면 `y.equals(x)`도 `true`
- 추이성(Transitive): `x.equals(y)`와 `y.equals(z)`가 `true`면 `x.equals(z)`도 `true`
- 일관성(Consistent): `x.equals(y)`는 여러 번 호출해도 같은 값을 반환
- `null`: `x.equals(null)`는 항상 `false`

```java
class Point {

    // ...

    @Override
    public boolean equals(Object o) {
        // 1. 동일성 비교 (같은 주소면 무조건 true)
        if (this == o)
            return true;
        // 2. null 체크 및 클래스 타입 비교
        if (o == null || getClass() != o.getClass())
            return false;
        // 3. 형변환 및 내용(동등성) 비교
        Point point = (Point) o;
        return x == point.x && y == point.y;
    }
}
```

### [String 클래스의 equals](string-class#String-클래스의-equals)

## hashCode()

`hashCode()`는 객체의 해시 코드를 반환하는 메서드다. 해시 코드는 객체를 식별하는 정수 값으로, `HashMap`, `HashSet`과 같이 해시 테이블(Hash Table)을 사용하는 자료구조에서 객체를
저장하고 검색할 때 사용된다.

```java
public class HashCodeTest {

    public static void main(String[] args) {
        String s1 = "ogu";
        String s2 = "ogu";
        System.out.println(s1.hashCode()); // 109981
        System.out.println(s2.hashCode()); // 109981
        Object o1 = new Object();
        Object o2 = new Object();
        System.out.println(o1.hashCode()); // 424058530
        System.out.println(o2.hashCode()); // 321001045
    }
}
```

`Object` 클래스의 원본 `hashCode()` 메서드는 객체의 메모리 주소와 유사한 값을 기반으로 해시 코드를 반환하며, `String` 클래스는 내용을 기반으로 해시 코드를 생성하도록 `hashCode()`
가 재정의되어 있다.

### hashCode() & equals()

`equals()`와 `hashCode()`는 함께 사용될 때 일관된 동작을 보장하기 위해 다음과 같은 규칙을 따라야 한다.

1. `equals()`를 통해 `true`를 반환하는 두 객체는 반드시 동일한 `hashCode()` 값 반환
2. `hashCode()`가 동일한 두 객체가 `equals()`를 통해 `true`를 반환할 필요는 없음

만약 `equals()`만 재정의하고 `hashCode()`를 재정의하지 않으면, 이 규약의 1번 항목이 깨지게 된다.

```java
class Animal {

    private String name;
    // ... getter, setter ...

    @Override
    public boolean equals(Object obj) {
        // ... (name을 기준으로 비교하도록 재정의) ...
        if (obj == null || getClass() != obj.getClass())
            return false;
        Animal animal = (Animal) obj;
        return this.name.equals(animal.name);
    }

    // hashCode()는 재정의하지 않음 / Object의 hashCode() 사용
}

class Example {

    public static void main(String[] args) {
        Animal animal1 = new Animal();
        animal1.setName("animal");
        Animal animal2 = new Animal();
        animal2.setName("animal");

        // 1. equals() 비교
        System.out.println(animal1.equals(animal2)); // true (재정의된 equals)

        // 2. hashCode() 비교
        System.out.println(animal1.hashCode()); // 321001045 (Object의 hashCode)
        System.out.println(animal2.hashCode()); // 791452441 (Object의 hashCode)

        // 3. HashSet에 저장
        Set<Animal> animals = new HashSet<>();
        animals.add(animal1);
        animals.add(animal2);
        System.out.println(animals.size()); // 2
        // [Animal@2f2c9b19, Animal@13221655]
    }
}
```

이 문제를 해결하려면 `equals()`의 비교 기준으로 사용된 필드(`name`)를 `hashCode()` 생성에도 동일하게 사용해야 한다.

```java


class Animal {

    // ...

    @Override
    public int hashCode() {
        return this.name.hashCode();
    }
}
```

## toString()

`toString()`은 객체를 대표하는 문자열을 반환하는데, `Object`의 원본 `toString()`은 "클래스명@해시코드" 형식의 문자열(예: `Animal@1ad9d`)을 반환한다.

```java
class Example {

    public static void main(String[] args) {
        Animal animal = new Animal();
        animal.setName("ogu");
        System.out.println(animal.toString()); // Animal{name='ogu'}, print 메서드를 호출하면 자동으로 toString() 메서드 호출
    }
}

class Animal {
    // ...

    @Override
    public String toString() {
        return "Animal{" + "name='" + name + '\'' + '}';
    }
}
```

디버깅이나 로깅(logging) 시 객체의 현재 상태(멤버 변수 값)를 쉽게 파악할 수 있도록 `toString()`을 재정의하는 것이 일반적이다.

## clone()

`clone()`은 객체의 복사본을 생성하여 반환하는 메서드로, `clone()`을 올바르게 사용하려면 다음 두 가지 조건을 만족해야 한다.

1. 복제할 클래스는 `Cloneable` 인터페이스를 구현 필요
    - `Cloneable`은 내부에 메서드가 없는 마커 인터페이스(Marker Interface)로, JVM에 이 객체가 복제 가능함을 알림
2. `Object`의 `clone()` 메서드는 `protected`이므로, 외부에서 호출할 수 있도록 `public`으로 오버라이딩하고 `CloneNotSupportedException` 예외 처리 필요

또한, `Object`의 `clone()` 메서드는 '얕은 복사(Shallow Copy)'를 수행한다는 점에 유의해야 한다.

```java
class Example {

    public static void main(String[] args) {
        Animal animal = new Animal();
        animal.setName("ogu");
        animal.addList(5);

        Animal clone = animal.clone();
        clone.setName("cloned-ogu");
        clone.addList(9); // 복제 객체의 list 수정

        System.out.println(animal.getName()); // ogu
        System.out.println(clone.getName()); // cloned-ogu

        // 얕은 복사로 인해 list가 공유됨
        System.out.println(animal.getList()); // [5, 9] (원본 객체에 영향)
        System.out.println(clone.getList()); // [5, 9]
    }
}

class Animal implements Cloneable { // 1. Cloneable 구현

    private String name;
    private List<Integer> list = new ArrayList<>();
    // ... getter, setter, list.add ...

    @Override
    public Animal clone() { // 2. public으로 오버라이딩
        try {
            // 얕은 복사 수행
            return (Animal) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(); // 발생하지 않아야 함
        }
    }
}

```

참조형 멤버 변수를 포함하는 객체를 복제할 때는, 참조형 변수까지 모두 복제하여 원본과 완전히 분리된 객체를 만드는 '깊은 복사(Deep Copy)'를 구현해야 한다.

```java
class Example {

    // ...
    @Override
    public Animal clone() {
        try {
            Animal clone = (Animal) super.clone();
            clone.list = new ArrayList<>(this.list);
            return clone;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
```

보통 `clone()`을 사용하는 것보다, '복사 생성자(Copy Constructor)'나 '복사 팩터리 메서드'를 정의하여 사용하는 것을 권장하고 있다.

## getClass()

`getClass()`는 객체의 런타임 클래스 정보를 담고 있는 `Class` 객체를 반환한다.

```java
class Example {

    public static void main(String[] args) {
        Animal animal = new Animal();
        System.out.println(animal.getClass()); // class Animal
    }
}
```

해당 객체를 이용해 리플렉션을 통해 해당 클래스의 메서드 / 필드 / 생성자 정보에 접근하는 등 동적인 프로그래밍을 할 수 있다.

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
- [실무 자바 개발을 위한 OOP와 핵심 디자인 패턴](https://school.programmers.co.kr/learn/courses/17778/17778-실무-자바-개발을-위한-oop와-핵심-디자인-패턴)
