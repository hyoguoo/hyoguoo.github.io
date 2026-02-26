---
title: "Composition(컴포지션)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 상속보다 컴포지션을 사용하라
>
> ** 이번 아이템에서 논하는 문제는 클래스가 인터페이스를 구현하거나 인터페이스가 다른 인터페이스를 확장할 때와는 무관한 문제들을 다룸

상속은 코드를 재사용하기 위해 유용한 도구이지만, 항상 최선이 아니며, 잘못 사용하게되면 오류를 내기 쉽게 된다.  
아래의 경우에는 상속을 사용하더라도 안전하다.

- 상위 클래스와 하위 클래스 모두 동일한 프로그래머가 통제하는 패키지 안에서만 사용
- 확장할 목적으로 설계되었고 문서화도 잘 되어있는 클래스를 상속하는 경우

하지만 반대의 상황(패키지 경계를 넘거나, 문서화가 부족하거나, 확장을 고려하지 않은 클래스를 상속하는 경우)에서는 상속은 위험하다.

## 상속의 위험성

상속을 하게 되면 상위 클래스의 구현에 따라 하위 클래스의 동작에 영향을 미치기 때문에 결국 캡슐화를 위반하게 된다.  
상위 클래스 설계 시 확장을 충분히 고려하지 않고 문서화를 잘 해두지 않으면 하위 클래스는 상위 클래스의 변경에 취약해지게 된다.

### 메서드 오버라이딩

아래는 HashSet을 상속하여 add / addAll을 오버라이딩하였지만 제대로 동작하지 않는 예시이다.

```java
class InstrumentedHashSet<E> extends HashSet<E> {

    private int addCount = 0; // 추가된 원소의 수

    public InstrumentedHashSet() {
    }

    public InstrumentedHashSet(int initialCapacity, float loadFactor) {
        super(initialCapacity, loadFactor);
    }

    @Override
    public boolean add(E e) {
        addCount++; // 4. 각 원소가 추가될 때마다 addCount 증가
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); // 2. addCount 증가
        return super.addAll(c); // 3. 상위 클래스의 addAll 호출, addAll은 내부적으로 add를 호출
    }

    public int getAddCount() {
        return addCount;
    }
}

class Main {

    public static void main(String[] args) {
        InstrumentedHashSet<String> s = new InstrumentedHashSet<>();
        s.addAll(List.of("틱", "탁탁", "펑")); // 1. addAll 호출
        System.out.println(s.getAddCount()); // 5. 기대하는 3이 아닌 6이 출력됨
    }
}
```

위의 주석에서 볼 수 있듯이  `addAll` 메서드를 호출하면서 `addCount`가 3이 증가할 것으로 기대하지만, 실제로는 6이 증가하게 된다.  
`HashSet`의 `addAll` 메서드는 내부적으로 `add` 메서드를 호출하고 있지만, 프로그래머가 이를 인지하기 쉽지 않기 때문에 위와 같은 문제가 발생하게 된다.  
일시적으로 `addAll` 메서드를 재정의하여 직접 컬렉션을 순회하며 `add` 메서드를 호출하도록 수정하면 문제는 해결되지만, 다른 오류를 내기 쉬운 코드가 되어버린다.

### 새로운 메서드 추가

위의 문제는 오버라이딩하면서 발생하는 문제이지만, 상위 클래스에 새로운 메서드가 추가되는 경우에도 문제가 발생할 수 있다.  
만약 새로 추가한 메서드가 상위 클래스의 다음 버전에서 새롭게 추가된 메서드와 동일한 이름을 가진다면, 확장한 하위 클래스는 컴파일조차 되지 않거나 오버라이딩을 하게 되어 잘못된 동작을 하게 된다.

## 문제를 회피하는 방법

상속을 사용하지 않고도 상위 클래스의 기능을 재사용할 수 있는 방법이 있는데, 바로 컴포지션이다.  
컴포지션을 사용하는 방법은 아래와 같다.

1. 확장하는 대신 새로운 클래스 생성
2. private 필드로 기존 클래스의 인스턴스를 참조하는 필드 추가(= composition)
3. 새로운 클래스의 인스턴스 메서드에서 기존 클래스의 대응하는 메서드를 호출하여 결과를 반환(= forwarding)
    - 래퍼 클래스(wrapper class): 기존 클래스의 인스턴스를 필드로 갖고 있는 새 클래스
    - 전달 메서드(forwarding method): 기존 클래스를 호출해주는 새 클래스의 메서드

위 구현 방법을 바탕으로 전달 클래스를 만들어 새로운 `InstrumentedHashSet` 클래스를 구현하면 아래와 같다.

```java
// Wrapper Class
class InstrumentedSet<E> extends ForwardingSet<E> {

    private int addCount = 0;

    public InstrumentedSet(Set<E> s) {
        super(s);
    }

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);
    }

    public int getAddCount() {
        return addCount;
    }
}

// Forwarding Class
class ForwardingSet<E> implements Set<E> {

    private final Set<E> s;

    public ForwardingSet(Set<E> s) {
        this.s = s;
    }

    @Override
    public int size() {
        return s.size();
    }

    // 위와 같이 그대로 전달하는 나머지 메서드들
}
```

위 코드는 Set 인터페이스를 활용해서 전달 클래스를 만들어 다른 Set 구현체에도 적용할 수 있도록 설계하여 매우 유연하게 설계된 예시이다.  
상속 방식은 구체 클래스를 각각 상속받아 구현해야 하지만, 컴포지션 방식은 인터페이스를 활용하여 구현체에 상관없이 재사용할 수 있다.

## 상속을 사용해야하는 상황

아래 두 조건을 만족하는 경우에는 상속을 사용해도 안전하지만, 그 외의 경우에는 상속을 사용하지 않고 컴포지션을 사용하는 것이 좋다.

- 두 클래스의 관계가 is-a 관계인 경우 (하위 클래스 is a 상위 클래스)
    - B는 A다 라는 문장이 성립해야만 한다.
- 상속하려는 상위 클래스가 처음에 명시 된 조건(동일 패키지, 문서화, 확장을 고려한 설계)을 만족하는 경우

자바 라이브러리의 Stack/Vector, Properties/Hashtable 등은 상속을 사용하였지만, is-a 관계가 아니기 때문에 잘못된 설계라고 볼 수 있다.
