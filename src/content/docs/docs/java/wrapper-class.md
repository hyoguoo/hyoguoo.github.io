---
title: "Wrapper class"
date: 2024-03-07
lastUpdated: 2025-11-09
---

자바에서는 8개의 기본형을 객체로 다루지 않고 있는데, 이를 객체로 다루기 위해 Wrapper 클래스를 제공한다.

|   기본형   | Wrapper 클래스 |          생성자           |
|:-------:|:-----------:|:----------------------:|
| boolean |   Boolean   | Boolean(boolean value) |
|  char   |  Character  | Character(char value)  |
|  byte   |    Byte     |    Byte(byte value)    |
|  short  |    Short    |   Short(short value)   |
|   int   |   Integer   |   Integer(int value)   |
|  long   |    Long     |    Long(long value)    |
|  float  |    Float    |   Float(float value)   |
| double  |   Double    |  Double(double value)  |

`Boolean`과 `Character`를 제외한 6개의 숫자 래퍼 클래스(Byte, Short, Integer, Long, Float, Double)는 모두 `Number` 추상 클래스를 상속받는다.

## 값 비교

래퍼 클래스는 `equals()` 메서드를 재정의(override)되어 있으며, `Comparable` 인터페이스를 구현하여 `compareTo()` 메서드를 통해 값의 크기를 비교할 수 있다.

```java
public static void main(String[] args) {
    Integer i1 = new Integer(100);
    Integer i2 = new Integer(100);
    System.out.println(i1 == i2); // false
    System.out.println(i1.equals(i2)); // true
    System.out.println(i1.compareTo(i2)); // 0
}
```

## 캐싱

`Integer`를 비롯한 몇몇 래퍼 클래스는 자주 사용되는 값의 범위를 캐싱(caching)해 둔다.

- `Integer.valueOf()`를 사용할 경우, 기본적으로 -128에서 127 사이의 값을 이 캐시(pool)에서 꺼내어 사용
- JVM 옵션을 통해 캐시 범위를 조정 가능
- `new Integer()`는 이 캐시를 사용하지 않고 항상 힙(Heap)에 새 객체를 생성(deprecated 방식)
- 이러한 동작 방식 때문에, `==` 연산자로 래퍼 클래스를 비교하는 것 보단 `equals()` 사용 권장

```java
public static void main(String[] args) {
    // 캐싱 동작 예시
    Integer a = 100; // Integer.valueOf(100) (캐시 범위 내)
    Integer b = 100; // Integer.valueOf(100) (캐시 범위 내)
    System.out.println(a == b); // true (캐시된 동일 인스턴스 참조)
    Integer an = new Integer(100);
    Integer bn = new Integer(100);
    System.out.println(an == bn); // false (항상 새 객체 생성)

    Integer c = 200; // Integer.valueOf(200) (캐시 범위 밖)
    Integer d = 200; // Integer.valueOf(200) (캐시 범위 밖)
    System.out.println(c == d); // false (범위를 벗어나 새 객체 생성)
}
```

## 박싱(Boxing) & 언박싱(Unboxing)

기본형(primitive) 값을 래퍼 클래스 객체로 변환하는 과정, 래퍼 클래스 객체를 기본형 값으로 변환하는 과정을 각각 박싱(Boxing), 언박싱(Unboxing)이라고 한다.

```java
public static void main(String[] args) {
    int i_primitive = 100;

    // 수동 박싱 (Deprecated)
    Integer i_wrapper1 = new Integer(i_primitive);
    // 수동 박싱 (권장)
    Integer i_wrapper2 = Integer.valueOf(i_primitive);

    // 오토박싱 (컴파일러가 Integer.valueOf(100)으로 변환)
    Integer i_wrapper3 = 100;

    // 수동 언박싱
    int i_primitive2 = i_wrapper2.intValue();

    // 오토언박싱 (컴파일러가 i_wrapper3.intValue()로 변환)
    int i_primitive3 = i_wrapper3;
}
```

오토박싱과 오토언박싱은 코드를 간결하게 만들지만, 내부적으로는 객체 생성 및 메서드 호출 연산이 발생한다.

- 반복문 등에서 불필요한 박싱/언박싱이 반복되면 성능 저하 발생 가능
- `Integer` 래퍼 객체가 `null`일 때 오토언박싱이 발생하면, `null.intValue()`가 호출되어 `NullPointerException` 발생 가능하므로 주의 필요

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
