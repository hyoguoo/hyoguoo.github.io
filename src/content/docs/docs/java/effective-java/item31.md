---
title: "Wildcard type"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 한정적 와일드카드를 사용해 API 유연성을 높이라

[item 28](/docs/java/effective-java/item28/)에서 언급했듯 매개변수화 타입은 불공변(invariant)인 부분에 대해 의문점을 가질 수 있다.  
`List<String>`은 `List<Object>`의 하위 타입이 아닌데, `List<String>`은 `List<Object>`가 하는 일을 제대로 수행할 수 없기 때문에 리스코프 치환 원칙에 따르면 불공변인 것이 타당하다.

하지만 이대로 사용하기엔 불편한 점이 많아 매개변수화 타입을 유연하게 사용할 수 있도록 도와주는 방법이 있는데, 바로 한정적 와일드카드 타입(bounded wildcard type)을 사용하는 것이다.

```java
import java.util.Collection;

class Stack<E> {

    // ...

    public void push(E e) {
        elements[size++] = e;
    }

    public void pushAll(Iterable<E> src) {
        for (E e : src) {
            push(e);
        }
    }

    public void pop(E e) {
        E result = elements[--size];
        elements[size] = null;
        return result;
    }

    public void popAll(Collection<E> dst) {
        while (!isEmpty()) {
            dst.add(pop());
        }
    }
}

class Main {

    public static void main(String[] args) {
        Stack<Number> numberStack = new Stack<>();
        Iterable<Integer> integers = ...;
        numberStack.pushAll(integers); // 컴파일 에러, Iterable<Integer>는 Iterable<Number>의 하위 타입이 아님

        Collection<Object> objects = ...;
        numberStack.popAll(objects); // 컴파일 에러, Collection<Object>는 Collection<Number>의 하위 타입이 아님
    }
}
```

Integer는 Number의 하위 타입이니 논리적으로 잘 동작할 것 같지만, 제네릭의 불공변 특성으로 인해 컴파일 에러가 발생한다.  
해결책으로는 앞의 아이템들에서 언급했듯이 한정적 와일드카드 타입을 사용하는 것이다.

```java
class Stack<E> {

    // ...

    public void push(E e) {
        elements[size++] = e;
    }

    public void pushAll(Iterable<? extends E> src) { // 한정적 와일드카드 타입 적용
        for (E e : src) {
            push(e);
        }
    }

    public void pop(E e) {
        E result = elements[--size];
        elements[size] = null;
        return result;
    }

    public void popAll(Collection<? super E> dst) { // 한정적 와일드카드 타입 적용
        while (!isEmpty()) {
            dst.add(pop());
        }
    }
}
```

- `Iterable<? extends E>`

E의 하위 타입을 모두 포함하는 Iterable 타입을 매개변수로 받을 수 있게 되어, Number의 하위 타입인 Integer를 포함하는 Iterable 타입을 매개변수로 받을 수 있게 되었다.

- `Collection<? super E>`

E의 상위 타입을 모두 포함하는 Collection 타입을 매개변수로 받을 수 있게 되어, Number의 상위 타입인 Object를 포함하는 Collection 타입을 매개변수로 받을 수 있게 되었다.

이처럼 한정적 와일드카드 타입을 사용하면 매개변수화 타입이 불공변이라도 유연하게 사용할 수 있게 된다.

## PECS(Producer-Extends, Consumer-Super)

한정적 와일드카드 타입을 사용하면 매개변수화 타입이 불공변이라도 유연하게 사용할 수 있게 되었지만, 이를 사용할 때 주의할 점이 있다.  
바로 생산자(producer)와 소비자(consumer) 역할에 따라 `extends`와 `super`를 적절히 사용해야 한다는 것이며, 그 원칙은 다음과 같다.

- 매개변수화 타입 T가 생산자인 경우: `<? extends T>`
- 매개변수화 타입 T가 소비자인 경우: `<? super T>`
- 매개변수화 타입 T가 생산자와 소비자인 경우: `T`
- 반환 타입: 한정적 와일드카드 타입 적용 X, 클라이언트 코드에 와일드카드 타입이 전파되기 때문에 클라이언트 코드가 더 복잡해짐

앞서 언급한 Stack 예제에서도 생산자(`pushAll`)와 소비자(`popAll`) 역할에 따라 `extends`와 `super`를 사용했다.  
위 두 상황이 아닌, 입력 매개변수가 생산자와 소비자 역할을 동시에 해야 하는 상황에선 와일드카드 타입을 쓰지 않는 것이 좋다.

위 공식은 [item 30](/docs/java/effective-java/item30/)에서 살펴보았던 `Collections.max` 메서드에도 이미 적용되어 있음을 알 수 있다.

```java
// Comparable 인터페이스
public interface Comparable<T> {
    int compareTo(T o);
}

// java.util.Collections의 max 메서드
public class Collections {
    // Suppresses default constructor, ensuring non-instantiability.
    private Collections() {
    }

    // ...

    public static <T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll) {
        Iterator<? extends T> i = coll.iterator();
        T candidate = i.next();

        while (i.hasNext()) {
            T next = i.next();
            if (next.compareTo(candidate) > 0)
                candidate = next;
        }
        return candidate;
    }

    // ...
}
```

- `Collection<? extends T> coll`: 입력 매개변수에서 생산자 역할을 하므로 `extends`를 사용
- `Comparable<? super T>`: 입력 매개변수를 소비하면서 `compareTo` 메서드를 호출하므로 `super`를 사용

## 타입 매개변수 vs 와일드카드

타입 매개변수와 와일드카드는 타입 다형성에 있어 공통되는 부분이 있어 둘 중 하나를 선택해 사용할 수 있는 경우가 있다.

```java
interface Swap {
    // 1. 타입 매개변수를 사용한 메서드 선언
    public static <E> void swap(List<E> list, int i, int j);

    // 2. 와일드카드를 사용한 메서드 선언
    public static void swap(List<?> list, int i, int j);
}
```

위 처럼 메서드 선언에 타입 매개변수가 한 번만 나오는 경우엔 와일드카드로 대체하는 것이 좋은 방법이 될 수 있다.  
public API라면 두 번째 메서드가 어떤 타입의 List도 받을 수 있기 때문에 더 유연하게 사용할 수 있기 때문이다.

이를 구현하기 위해 추가적인 helper 메서드를 구현해야 한다는 단점이 있지만, 클라이언트는 이를 알 필요가 없으므로 문제가 되지 않는다.

```java
// 직관적으로 구현한 swap 메서드
class Swap1 {

    public static void swap(List<?> list, int i, int j) {
        list.set(i, list.set(j, list.get(i))); // 컴파일 에러, List<?>에는 null 외에는 어떤 값도 넣을 수 없음
    }
}

// helper method 추가
class Swap2 {

    public static void swap(List<?> list, int i, int j) {
        swapHelper(list, i, j);
    }

    private static <E> void swapHelper(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }
}
```
