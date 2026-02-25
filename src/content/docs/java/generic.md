---
title: "Generics"
date: 2023-01-08
lastUpdated: 2025-11-28
---

# Generics

제네릭은 데이터의 타입을 클래스 내부에서 지정하는 것이 아니라 외부에서 지정하는 기법으로, 컴파일 시점에 강력한 타입 체크를 지원하는 기능이다.

```java
// 제네릭 클래스(= 제네릭 타입)
class Box<T> {

    private T t;

    public void set(T t) {
        this.t = t;
    }

    public T get() {
        return t;
    }
}

class Main {

    public static void main(String[] args) {
        Box<String> box = new Box<String>();
        box.set("Hello");
        String str = box.get();
    }
}
```

```mermaid
flowchart LR
    Source["소스 코드<br>Box&lt;String&gt;"] -->|Compiler| Check[타입 체크 &<br>타입 소거]
    Check --> Bytecode["바이트코드<br>Box (Raw Type)"]
    Bytecode -->|Runtime| Execution[실행<br>Casting 자동 삽입]
```

## 제네릭에 사용되는 용어

제네릭에서 사용되는 용어와 의미는 다음과 같다.

|       용어(Terminology)        |             예시              |                      설명                       |
|:----------------------------:|:---------------------------:|:---------------------------------------------:|
|     제네릭 타입(Generic Type)     |          `List<E>`          |           타입을 파라미터로 가지는 클래스나 인터페이스            |
|   타입 매개변수(Type Parameter)    |        `<T>`, `<E>`         |               제네릭 선언에 사용된 매개변수                |
| 매개변수화 타입(Parameterized Type) |       `List<String>`        |             제네릭 타입에 실제 타입을 대입한 것              |
|        로 타입(Raw Type)        |           `List`            | 타입 매개변수를 사용하지 않은 일반 타입(하위 호환성을 위해 존재하나 사용 지양) |
|          비한정적 와일드카드          |          `List<?>`          |               모든 타입이 올 수 있음을 의미               |
|          한정적 와일드카드           |  `List<? extends Number>`   |             특정 타입과 그 하위/상위 타입만 허용             |
|          재귀적 타입 한정           | `<T extends Comparable<T>>` |           T가 자신과 비교 가능한 타입이어야 함을 의미           |

일반적으로 사용되는 타입 파라미터 명명 규칙은 다음과 같다.

|  타입   |         설명         |
|:-----:|:------------------:|
| `<T>` | Type (일반적인 데이터 타입) |
| `<E>` |  Element (컬렉션 요소)  |
| `<K>` |        Key         |
| `<V>` |       Value        |
| `<N>` |       Number       |

## 제네릭의 제한

제네릭은 컴파일 시점에 타입을 체크하고 런타임에는 타입을 지우는(Erasure) 방식으로 동작하기 때문에 몇 가지 제약이 발생한다.

### static 멤버 사용 불가

`static` 필드나 메서드는 클래스가 로딩될 때 메모리에 올라가므로, 인스턴스 생성 시점에 결정되는 제네릭 타입 `T`를 사용할 수 없다.

```java
class Box<T> {

    static T item; // 컴파일 에러

    static int compare(T t1, T t2) { ...} // 컴파일 에러
}
```

### 제네릭 배열 생성 불가

제네릭 배열 타입의 참조 변수 선언은 가능하지만, `new T[10]`과 같이 배열을 생성하는 것은 불가능하다.

- 원인
    - `new` 연산자는 힙 영역에 메모리를 할당하기 위해 컴파일 시점에 타입의 정확한 크기를 알아야 함
    - 제네릭은 런타임에 타입이 소거되므로 크기를 확정할 수 없음
- 해결
    - `Object[]` 배열을 생성한 뒤 제네릭 타입으로 형변환하거나 `ArrayList`와 같은 컬렉션을 사용
    - `Reflection` API의 `Array.newInstance` 활용

```java
class Box<T> {

    T[] itemArr; // 선언 가능

    T[] toArray() {
        return new T[10]; // 컴파일 에러: Generic Array Creation
    }

    // 배열 생성 후 형변환하여 해결 가능
    T[] toArray() {
        return (T[]) Arrays.copyOf(itemArr, itemArr.length);
    }
}
```

## 제네릭 클래스와 타입 한정

제네릭 클래스는 인스턴스 생성 시 타입을 명시해야 하며, `extends` 키워드를 통해 대입 가능한 타입을 제한할 수 있다.

- 기본 사용
    - `Box<Apple> box = new Box<>();` (JDK 7부터 생성자 측 타입 생략 가능)
    - `Box<Fruit> box = new Box<Apple>();` (불가능: 제네릭은 불공변)
- 제한된 제네릭(`extends`)
    - `<T extends Fruit>`: Fruit과 그 자손만 대입 가능
    - `<T extends Fruit & Eatable>`: 클래스와 인터페이스를 동시에 상속/구현해야 하는 경우 `&`로 연결 (클래스가 먼저 와야 함)

## 와일드 카드

제네릭을 유연하게 처리하기 위해 와일드카드(`?`)를 사용하며, 특정 타입으로 제한하기 위해선 한정적 와일드카드를 사용할 수 있다.

- `<? extends T>` : T와 그 자손들만 가능
    - 데이터를 꺼내오는(Produce) 역할만 할 때 사용
    - `T`와 그 자손들만 가능하므로, 꺼낸 데이터는 최소한 `T`임이 보장(`read` 안전)
    - 데이터를 넣는 것은 불가능(구체적인 하위 타입을 알 수 없기 때문)
- `<? super T>` : T와 그 조상들만 가능
    - 데이터를 저장하는(Consume) 역할만 할 때 사용
    - `T` 타입의 객체를 안전하게 저장 가능(`write` 안전)

```java
class Juicer {

    static Juice makeJuice(FruitBox<? extends Fruit> box) {
        StringBuilder tmp = new StringBuilder();
        // 꺼내는 것은 Fruit 타입으로 안전하게 가능
        for (Fruit f : box.getList()) {
            tmp.append(f).append(" ");
        }
        return new Juice(tmp.toString());
    }
}
```

## 제네릭 메서드

클래스의 제네릭 타입과 별개로 메서드 레벨에서 독립적인 제네릭 타입을 정의하여 사용할 수 있다.

```java
class ClassName<E> {

    // 이 E는 클래스의 제네릭 타입 E
    void instanceMethod(E o) { ...}

    // 에러: 클래스의 E는 static에서 사용 불가
    // static void staticMethod(E o) { ... }

    // 이 E는 메서드만의 독립적인 타입 E (클래스의 E와 무관)
    static <E> E genericStaticMethod(E o) {
        return o;
    }

    // 독립적인 타입 T를 선언하여 사용 가능
    static <T> T genericStaticMethod2(T o) {
        return o;
    }
}
```

## Generic Type Erasure

제네릭 타입은 컴파일 시에만 유효하고, 컴파일 후에는 런타임 중에는 타입 정보가 사라지게 된다.

1. 타입 경계 제거
    - `<T extends Fruit>`는 `Fruit`로 치환
    - `<T>`와 같이 제한이 없으면 `Object`로 치환
2. 타입 캐스팅 추가
    - 타입 안정성을 위해 요소를 참조하는 지점에 적절한 캐스팅 코드를 컴파일러가 자동 삽입
3. 브리지 메서드(Bridge Method) 생성
    - 다형성을 유지하기 위해 컴파일러가 내부적으로 브리지 메서드를 생성할 수 있음

```java
// 컴파일 전
class Test<T> {

    private T t;

}

class Test<T extends Number> {

    private T t;

}


// 컴파일 후
class Test {

    private Object t;

}

class Test {

    private Number t;

}
```

이러한 소거 특징 때문에 런타임에 제네릭 타입을 `instanceof`로 검사하거나, `.class`로 타입을 알아내는 것은 불가능하다.

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
- [Stranger's LAB Tistory](https://st-lab.tistory.com/153)
