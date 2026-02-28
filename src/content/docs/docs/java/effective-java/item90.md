---
title: "Serialization Proxy Pattern"
date: 2024-08-25
lastUpdated: 2024-08-25
tags: [Java]
description: "직렬화 프록시 패턴의 구현 방법과 writeReplace/readResolve를 활용해 역직렬화 보안 취약점을 차단하는 원리를 정리한다."
---

> 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라

`Serializable` 인터페이스를 구현하는 순간 정상적인 생성자 이외의 방법으로 인스턴스를 생성할 수 있게 되면서, 버그나 보안 문제에 노출되게 된다.  
이런 위험을 크게 줄여주는 기법으로 직렬화 프록시 패턴이 있다.

## 구현 방법

직렬화 프록시 패턴의 구현 방법은 다음과 같다.

- 바깥 클래스의 논리적 상태를 표현하는 중첩 클래스를 설계해 `private static`으로 선언
- 중첩 클래스의 생성자는 단 하나로 제한하며, 바깥 클래스를 매개변수로 받아 단순히 넘어온 인스턴스 데이터를 복사
- 바깥 클래스와 직렬화 프록시 모두 `Serializable`을 구현

```java

class Period implements Serializable {

    // final 키워드 사용
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = start;
        this.end = end;
    }

    // 직렬화할 객체를 대체할 다른 객체를 반환하는 메서드
    private Object writeReplace() {
        return new SerializationProxy(this);
    }

    // 역직렬화 과정에서 호출
    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        throw new InvalidObjectException("Proxy required");
    }

    private static class SerializationProxy implements Serializable {

        private static final long serialVersionUID = 234098243823485285L; // 아무 값이나 상관 없음
        private final Date start;
        private final Date end;

        SerializationProxy(Period p) {
            this.start = p.start;
            this.end = p.end;
        }

        // 역직렬화된 객체를 대신할 객체를 반환하는 역할을 수행하는 메서드
        private Object readResolve() {
            return new Period(start, end);
        }
    }
```

위처럼 구현된 각각의 메서드들은 아래와 같은 역할을 수행하면서 보안 문제를 해결하게 된다.

- `writeReplace`: 바깥 클래스 인스턴스 대신 직렬화 프록시 객체를 반환하여 직렬화 중에 생성자 호출을 막음
- `readObject`: 역직렬화가 직접적으로 이루어지지 않도록 예외를 던져 프록시 객체를 통해서만 역직렬화가 이루어지도록 함
- `readResolve`: 역직렬화된 프록시 객체를 바깥 클래스 인스턴스로 대체하여 반환

## 장점

직렬화 프록시 패턴을 사용하면 아래와 같은 장점을 얻을 수 있다.

1. 진정한 불변 클래스: 멤버 필드 final 선언하여 불변성 보장 가능
2. 역직렬화 유효성 검사 불필요: 직렬화 대상이 직접적으로 되지 않기 때문에 역직렬화 과정에서 유효성 검사를 할 필요가 없음
3. 역직렬화 인스턴스 != 원래의 인스턴스: 역직렬화된 인스턴스가 원래의 인스턴스와 다르게 되어도 문제가 없음

이 중 3번에 대한 장점은 `EnumSet` 클래스를 사용한 예시를 통해 확인할 수 있다.

### EnumSet 클래스의 직렬화 프록시 패턴

`EnumSet` 클래스 생성 시 `RegularEnumSet`과 `JumboEnumSet` 두 가지 인스턴스를 반환하게 되는데, 이 두 인스턴스의 차이는 다음과 같다.

- `RegularEnumSet` 인스턴스: 64개 이하의 원소를 가질 때 사용
- `JumboEnumSet` 인스턴스: 64개 이상의 원소를 가질 때 사용

64개짜리 열거 타입을 가진 `RegularEnumSet` 인스턴스를 직렬화하고 원소를 추가한 후 역직렬화하면 `JumboEnumSet` 인스턴스가 생성되어야 하는데,  
이를 위해 `EnumSet` 클래스는 직렬화 프록시 패턴을 사용해 적절한 인스턴스를 생성하도록 구현되어 있다.

```java
public abstract class EnumSet<E extends Enum<E>> extends AbstractSet<E>
        implements Cloneable, Serializable {

    // ...

    // 
    public static <E extends Enum<E>> EnumSet<E> noneOf(Class<E> elementType) {
        Enum<?>[] universe = getUniverse(elementType);
        if (universe == null)
            throw new ClassCastException(elementType + " not an enum");

        if (universe.length <= 64)
            return new RegularEnumSet<>(elementType, universe);
        else
            return new JumboEnumSet<>(elementType, universe);
    }

    private static class SerializationProxy<E extends Enum<E>> implements Serializable {

        private static final long serialVersionUID = 362491234563181265L;
        // 이 EnumSet의 원소 타입
        private final Class<E> elementType;
        // 이 EnumSet의 원소들
        private final Enum[] elements;

        SerializationProxy(EnumSet<E> set) {
            elementType = set.elementType;
            elements = set.toArray(ZERO_LENGTH_ENUM_ARRAY);
        }

        private Object readResolve() {
            EnumSet<E> result = EnumSet.noneOf(elementType);
            for (Enum e : elements) {
                result.add((E) e);
            }
            return result;
        }
    }
}
```
