---
title: "Abstract Class & Interface(추상 클래스와 인터페이스)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 추상 클래스보다는 인터페이스를 우선하라

Java에서 제공하는 다중 구현 메커니즘은 인터페이스와 추상 클래스를 통해 제공된다.  
Java 8 이전에는 인터페이스는 구현 코드를 포함할 수 없었지만, Java 8 이후부터는 인터페이스도 디폴트 메서드를 통해 구현 코드를 포함할 수 있게 되었다.  
때문에 Java 8 이후에서의 두 방식의 큰 차이는 아래와 같다.

- 추상 클래스: 추상 클래스가 정의한 타입을 구현한 클래스는 반드시 추상 클래스의 하위 클래스가 되어야 한다.
- 인터페이스: 인터페이스가 선언한 메서드를 모두 정의하고 그 일반 규약을 잘 지키면 다른 클래스를 상속했든 상관없이 같은 타입으로 취급된다.

한마디로 인터페이스는 추상 클래스와 달리 다중 구현이 가능하다는 차이가 존재한다. (추상 클래스는 `Class cannot extend multiple classes` 에러 발생)  
만약 기존 클래스에 기능을 추가하기 위해선, 인터페이스를 구현한 클래스가 훨씬 손 쉽게 기능을 추가할 수 있다.

## 인터페이스의 강점

### mixin(믹스인) 정의

** 믹스인: 클래스가 구현할 수 있는 타입으로, 믹스인을 구현한 클래스에 원래의 주된 타입 외에도 특정 선택적 행위를 혼합할 수 있게 해준다.

위 특징 때문에 인터페이스는 기존의 주요 기능에 선택적 기능을 추가할 수 있는 믹스인을 정의하는 용도로 사용할 수 있다.

```java
interface A {
    // ..
}

interface B {
    // ..
}

// ..

class ImplementClass implements A, B { // C, D, ...
    // ..
}
```

### 계층 구조 없는 타입 프레임워크 정의

계층 구조는 수많은 개념을 구조적으로 잘 표현할 수 있지만, 현실의 개발에서는 구분하기 힘든 개념이 많다.  
계층 구조로 모든 개념을 포괄하기 위해선 지나치게 많고 복잡한 구조가 생기게 되어 유지보수가 어려워진다.  
때문에 추상 클래스와는 달리 인터페이스는 다중 구현이 가능하기 때문에 철저한 계층 구조 없이 유연하게 타입을 정의할 수 있다.

```java
interface Singer {
    void sing();
}

interface Songwriter {
    void compose();
}

interface SingerSongwriter extends Singer, Songwriter {
    void strum();

    void actSensitive();
}
```

## 인터페이스의 단점

Java 8부터 인터페이스에 default 메서드를 정의할 수 있게 되었다.  
이 기능으로 인해 인터페이스를 구현한 클래스들이 새로운 메서드를 구현하지 않아도 된다는 장점이 생겼지만 이 기능을 남용하면 안되며 아래의 사항들을 염두해야 한다.

- `@implSpec`을 통한 문서화하여 클라이언트에게 정보 제공
- `equals`, `hashCode`, `toString` 등의 메서드는 default 메서드로 제공 금지
    - 객체의 기본 동작 및 객체의 식별성에 영향을 주어, 구현 클래스에서 이러한 메서드를 오버라이드하지 않고 그대로 사용할 경우 잘못된 동작을 유발 가능
- 인스턴스 필드를 가질 수 없음
- `private static` 메서드를 제외한 `private` 멤버 사용 불가능

만약 위의 단점이 구현 사항에 영향을 주지 않는다면 가능한 인터페이스를 사용하는 것이 좋으며, 만약 구현 사항에 제약이 걸리는 경우 아래에서 소개할 방법을 고려해볼 수 있다.

## Skeletal Implementation(추상 골격 구현)

인터페이스와 추상 클래스의 장점을 모두 가지는 방법으로 인터페이스 + 추상 골격 구현 클래스를 함께 제공하는 방법이 있다.  
이를 템플릿 메서드 패턴이라고 하며, 각각의 역할은 아래와 같다.

- 인터페이스
    - 타입 정의
    - 필요한 경우 디폴트 메서드도 제공
- 추상 골격 구현 클래스
    - 나머지 메서드들을 구현

이러한 사례를 JDK에서도 많이 볼 수 있는데, 대표적으로 `AbstractList` 이 있다.

```java
public abstract class AbstractList<E> extends AbstractCollection<E> implements List<E> {

    // 인터페이스의 메서드 구현, 에러를 발생시켜 하위 클래스가 오버라이드하도록 유도
    public E set(int index, E element) {
        throw new UnsupportedOperationException();
    }

    public void add(int index, E element) {
        throw new UnsupportedOperationException();
    }

    public E remove(int index) {
        throw new UnsupportedOperationException();
    }

    // 필요한 메서드를 사용할 수 있도록 구현
    public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof List))
            return false;

        ListIterator<E> e1 = listIterator();
        ListIterator<?> e2 = ((List<?>) o).listIterator();
        while (e1.hasNext() && e2.hasNext()) {
            E o1 = e1.next();
            Object o2 = e2.next();
            if (!(o1 == null ? o2 == null : o1.equals(o2)))
                return false;
        }
        return !(e1.hasNext() || e2.hasNext());
    }

    public int hashCode() {
        int hashCode = 1;
        for (E e : this)
            hashCode = 31 * hashCode + (e == null ? 0 : e.hashCode());
        return hashCode;
    }
}
```

`equals`와 `hashCode`를 `List` 인터페이스의 일반 규약을 지켜서 제공하였고, 나머지 메서드들은 하위 클래스에서 오버라이드하도록 유도하여 구현을 강제하였다.  
결과적으로 추상 클래스처럼 구현을 도와주는 동시에, 다중 구현이 가능한 인터페이스의 장점도 모두 가지게 된다.
