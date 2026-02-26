---
title: "Return Collection or Stream"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 반환 타입으로는 스트림보다 컬렉션이 낫다

메서드 반환 타입으로는 주로 컬렉션 인터페이스나 Iterable, 혹은 배열이 사용된다.  
스트림 타입 역시 반환할 수 있지만 반환 된 스트림은 for-each로 반복할 수 없어 권장하지 않는다.(메서드 참조 + 형변환을 사용하면 되긴 하지만, 비효율적)

```java
class Example {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("a");
        list.add("b");
        list.add("c");

        // 컬렉션 인터페이스 반환
        Collection<String> collection = list;
        for (String s : collection) {
            System.out.println(s);
        }

        // Iterable 반환
        Iterable<String> iterable = list;
        for (String s : iterable) {
            System.out.println(s);
        }

        // 배열 반환
        String[] array = list.toArray(new String[0]);
        for (String s : array) {
            System.out.println(s);
        }

        // 스트림 반환
        Stream<String> stream = list.stream();
        for (String s : stream) { // 컴파일 에러
            System.out.println(s);
        }

        for (String s : (Iterable<String>) stream::iterator) { // 형변환 + 메서드 참조, 비효율적
            System.out.println(s);
        }

        for (String s : iterableOf(stream)) { // 메서드를 만들어 사용
            System.out.println(s);
        }
    }

    public static <E> Iterable<E> iterableOf(Stream<E> stream) {
        return stream::iterator;
    }
}
```

만약 오직 스트림 파이프라인에만 쓰이는 경우라면 스트림을 반환해도 되지만, 그렇지 않은 경우 Iterable을 반환하는 것이 좋다.

## Collection 인터페이스

Collection 인터페이스는 Iterable의 하위 인터페이스이면서 stream 메서드를 제공한다.  
떄문에 Collection 인터페이스를 반환하면 컬렉션을 반복할 수 있고, 스트림으로도 사용할 수 있기 때문에 반환 타입으로는 Collection 인터페이스가 최선이라고 할 수 있다.

만약 시퀀스의 크기가 크지 않다면 `ArrayList`나 `HashSet` 같은 표준 컬렉션 구현체를 반환해도 좋지만, 큰 시퀀스인 경우 Collection 인터페이스를 구현한 클래스를 반환하는 것은 좋지 않다.  
예를 들어 멱집합을 구하는 메서드의 경우 2^n개의 원소를 가진 Collection을 반환하게 되는데, 이 경우 ArrayList를 반환하면 메모리를 많이 사용하게 된다.

### 전용 컬렉션

만약 반환하는 컬렉션이 크지만 표현을 간결하게 할 수 있다면 전용 컬렉션을 만들어 반환하는 것도 좋은 방법이다.  
`AbstractList`를 이용하여 전용 컬렉션을 만든 예시 코드는 다음과 같다.

```java
class PowerSet {
    public static final <E> Collection<Set<E>> of(Set<E> s) {
        List<E> src = new ArrayList<>(s);
        if (src.size() > 30) {
            throw new IllegalArgumentException("집합에 원소가 너무 많습니다(최대 30개).: " + s);
        }
        return new AbstractList<Set<E>>() {
            @Override
            public int size() {
                return 1 << src.size(); // 2의 src.size() 제곱
            }

            @Override
            public boolean contains(Object o) {
                return o instanceof Set && src.containsAll((Set) o);
            }

            @Override
            public Set<E> get(int index) {
                Set<E> result = new HashSet<>();
                for (int i = 0; index != 0; i++, index >>= 1) {
                    if ((index & 1) == 1) {
                        result.add(src.get(i));
                    }
                }
                return result;
            }
        };
    }
}
```

멱집합을 구해야하는 경우 항상 모든 컬렉션 요소를 메모리상에 올리는 것보단, 필요한 시점에 요소를 만들어 반환하는 방법을 사용하고 있다.  

## 결론

모든 경우에 컬렉션을 반환하는 것이 최선은 아니지만, 메서드를 사용하여 반환 받은 클라이언트는 이를 어떤 방식으로 처리할 지 모른다.  
때문에 대부분의 경우, 스트림과 반복을 모두 사용할 수 있는 Collection 인터페이스를 반환하는 것이 좋다.
