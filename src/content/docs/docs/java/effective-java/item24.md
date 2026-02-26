---
title: "중첩 클래스(nested class)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 멤버 클래스는 되도록 static으로 만들라.


우선 중첩 클래스(nested class)에 대해 간단히 정리해 보자면 다른 클래스 안에 정의된 클래스를 말한다.  
중첩 클래스의 종류는 아래와 같으며, 정적 멤버 클래스를 제외한 나머지는 내부 클래스(inner class)에 해당한다.

1. 정적 멤버 클래스
2. (비정적)멤버 클래스
3. 익명 클래스
4. 지역 클래스

중첩 클래스는 자신을 감싼 바깥 클래스에서만 쓰여야 하며, 그 외의 쓰임새가 있다면 톱레벨 클래스로 만들어야 한다.

```java
class OuterClass {

    public void createAnonymousClass() {
        // 익명 클래스
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                // ...
            }
        };
    }

    public void createLocalClass() {
        // 지역 클래스
        class LocalClass {
            // ...
        }
    }

    // 정적 멤버 클래스
    public static class StaticNestedClass {
        // ...
    }

    // (비정적)멤버 클래스
    public class InnerClass {
        // ...
    }
}
```

## 1. 정적 멤버 클래스

정적 멤버 클래스는 기본적으로 일반 클래스와 동일하며, 아래와 같은 특징이 있다.

- 바깥 클래스의 private 멤버에도 접근 가능
- 다른 정적 멤버와 같은 접근 규칙을 적용받음(private인 경우 바깥 클래스에서만 접근 가능)

정적 멤버 클래스는 흔히 바깥 클래스와 함께 쓰일 때만 유용한 public 도우미 클래스로 쓰인다.  
예를 들면 Calculator 클래스의 Operator 열거 타입을 public 정적 멤버 클래스로 만들어 `Calculator.Operator`로 사용할 수 있다.

## 2. (비정적)멤버 클래스

`static` 차이 하나지만 의미하는 바가 전혀 다르고, 바깥 클래스와 비정적 멤버 클래스의 관계는 멤버 클래스가 인스턴스화 될 때 확립되고, 해당 관계를 변경할 수 없다.  
바깥 클래스의 인스턴스와 암묵적으로 연결되기 때문에 아래와 같은 차이가 있다.

- 비정적 멤버 클래스의 인스턴스 메서드에서 정규화된 this(`OuterClass.this`)를 사용해 바깥 인스턴스의 메서드를 호출하거나 바깥 인스턴스의 참조 가능
- 바깥 인스턴스와 독립적으로 존재할 수 없으며, 바깥 인스턴스 없이 생성할 수 없음
- 바깥 인스턴스를 참조하는 관계 정보가 비정적 멤버 클래스의 인스턴스 안에 저장되어 메모리 공간 차지 및 생성 시간 추가 소요

일반적으로 바깥 클래스의 인스턴스 메서드에서 비정적 멤버 클래스의 생성자를 호출하지만, `new OuterClass().new InnerClass();`와 같이 직접 생성할 수도 있다.  
비정적 멤버 클래스는 어떤 클래스의 인스턴스를 감싸 마치 다른 클래스의 인스턴스처럼 보이게 하는 뷰로 사용하는 어댑터를 정의할 때 자주 쓰인다.

```java
// 실제 HashMap의 비정적 멤버 클래스인 Values 예시
public class HashMap<K, V> extends AbstractMap<K, V>
        implements Map<K, V>, Cloneable, Serializable {

    // ...

    // 비정적 멤버 클래스를 반환하는 메서드
    public Collection<V> values() {
        Collection<V> vs = values;
        if (vs == null) {
            vs = new Values();
            values = vs;
        }
        return vs;
    }

    // 비정적 멤버 클래스
    final class Values extends AbstractCollection<V> {
        public final int size() {
            return size;
        }

        // 바깥 클래스의 메서드를 호출
        public final void clear() {
            HashMap.this.clear();
        }

        public final Iterator<V> iterator() {
            return new ValueIterator();
        }

        public final boolean contains(Object o) {
            return containsValue(o);
        }

        public final Spliterator<V> spliterator() {
            return new ValueSpliterator<>(HashMap.this, 0, -1, 0, 0);
        }

        public final void forEach(Consumer<? super V> action) {
            Node<K, V>[] tab;
            if (action == null)
                throw new NullPointerException();
            if (size > 0 && (tab = table) != null) {
                int mc = modCount;
                for (Node<K, V> e : tab) {
                    for (; e != null; e = e.next)
                        action.accept(e.value);
                }
                if (modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }
    }
}
```

이처럼 비정적 멤버 클래스는 바깥 클래스의 인스턴스와 참조가 되는 특징이 있다.  
이는 장점이 될 수 있지만 활용하지 않는다면 메모리 공간을 차지하고 생성 시간이 추가 소요되는 단점이 될 수 있으며 가비지 컬렉션이 바깥 클래스의 인스턴스를 수거하지 못하는 메모리 누수가 발생할 수 있다.  
만약 비정적 멤버 클래스로 바깥 클래스의 인스턴스를 참조하지 않는다면 정적 멤버 클래스로 만느는 것이 좋다.

## 3. 익명 클래스

익명 클래스는 이름이 없는 클래스로, 클래스의 선언과 인스턴스 생성을 동시에 하여 간편하게 사용할 수 있지만 아래와 같은 제약이 있다.

- 이름이 없어 `instanceof` 같은 클래스 이름이 필요한 작업은 수행할 수 없음
- 비정적인 문맥에서만 바깥 클래스의 인스턴스를 참조할 수 있으며, 정적 문맥에서는 상수 변수 이외의 정적 멤버를 가질 수 없음
- 여러 인터페이스를 구현할 수 없음
- 인터페이스를 구현하는 동시에 다른 클래스를 상속할 수 없음
- 복잡한 코드는 가독성 저하

익명 클래스는 주로 함수 객체를 만들 때 사용했지만, 자바 8부터는 람다를 사용할 수 있기 때문에 그 역할은 람다로 대체되었다.  
다른 용도로는 아래와 같이 정적 팩터리 메서드를 구현할 때 사용할 수 있다.

```java
// inArrayAsList
class Example {

    static List<Integer> intArrayAsList(int[] a) {
        Objects.requireNonNull(a);

        // 익명 클래스
        return new AbstractList<Integer>() {
            @Override
            public Integer get(int index) {
                return a[index];
            }

            @Override
            public Integer set(int index, Integer element) {
                int oldValue = a[index];
                a[index] = element;
                return oldValue;
            }

            @Override
            public int size() {
                return a.length;
            }
        };
    }
}
```

## 4. 지역 클래스

가장 드물게 사용되는 방식으로, 지역 변수를 선언할 수 있는 곳이면 어디서든 선언할 수 있으며 유효 범위도 지역 변수와 같다.

- 멤버 클래스처럼 이름이 있으며, 반복해서 사용 가능
- 익명 클래스처럼 비정적 문맥에서 사용될 때만 바깥 인스턴스 참조 가능
- 정적 멤버는 가질 수 없음

## 결론

중첩 클래스는 위와 같이 네 가지 방식이 존재하는데, 특징이 모두 다르기 때문에 상황별 적절한 방법은 아래와 같이 정리할 수 있다.

- 메서드 밖에서도 사용해야하거나 메서드 안에서 정의하기엔 너무 긴 경우 -> 멤버 클래스로 정의
    - 멤버 클래스의 인스턴스 각각이 바깥 인스턴스를 참조하는 경우 -> 비정적 멤버 클래스로 정의
    - 그 외의 경우 -> 정적 멤버 클래스로 정의
- 한 메서드 안에서만 사용되고, 해당 인스턴스를 생성하는 지점이 단 한 곳이며, 해당 타입으로 쓰기에 적합한 클래스나 인터페이스가 이미 있는 경우 -> 익명 클래스로 정의
- 위에 해당하지 않는 경우 -> 지역 클래스로 정의
