---
title: "Overloading"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 다중정의는 신중히 사용하라

메서드 다중 정의(overloading)란 이름은 같지만 매개변수가 다른 여러 메서드를 말한다. 다중정의는 프로그래머에게 편의를 제공해주지만,  
어느 메서드가 호출될지 혼란을 줄 수 있다.

```java
class CollectionClassifier {
    public static String classify(Set<?> s) {
        return "집합";
    }

    public static String classify(List<?> lst) {
        return "리스트";
    }

    public static String classify(Collection<?> c) {
        return "그 외";
    }

    public static void main(String[] args) {
        Collection<?>[] collections = {
                new HashSet<String>(),
                new ArrayList<BigInteger>(),
                new HashMap<String, String>().values()
        };

        for (Collection<?> c : collections) {
            // 컴파일타임에 c는 항상 Collection<?> 타입이므로 모두 "그 외" 출력
            System.out.println(classify(c));
        }
    }
}
```

위 코드의 의도는 매개변수의 런타임 타입에 따라 다르게 동작하기를 기대할 수 있지만, 기대와는 다르게 컴파일타임에 c는 항상 Collection<?> 타입이므로, 모두 "그 외"를 출력한다.  
만약 의도대로 동작되길 원한다면, 모든 classify 메서드를 하나의 메서드로 합친 후 instanceof로 매개변수의 타입을 확인하면 된다.

```java
class CollectionClassifier {
    public static String classify(Collection<?> c) {
        return c instanceof Set ? "집합" :
                c instanceof List ? "리스트" : "그 외";
    }

    // ...
}
```

## 다중정의 혼동 회피 방법

위와 같이 프로그래머가 의도한 대로 동작하지 않기 때문에, 애초에 혼동을 일으키는 상황을 피하는 것이 좋다.  
제일 안전한 방법은 매개변수 수가 같은 다중정의는 만들지 않고, 가변인수를 사용하는 메서드는 다중정의하지 않는 것이다.  
만약 다중정의가 필요하다면 다중정의 대신에 메서드 이름을 다르게 지어주는 방법을 고려해보는 것도 좋다.

```java
// 매개변수 타입에 따라 다른 이름을 사용한 ObjectInputStream의 메서드
public class ObjectOutputStream
        extends OutputStream implements ObjectOutput, ObjectStreamConstants {

    // ...

    public void writeChar(int val) throws IOException {
        bout.writeChar(val);
    }

    public void writeInt(int val) throws IOException {
        bout.writeInt(val);
    }

    public void writeLong(long val) throws IOException {
        bout.writeLong(val);
    }

    public void writeFloat(float val) throws IOException {
        bout.writeFloat(val);
    }

    // ...
}
```

### 생성자

메서드는 위와 같이 다른 이름으로 지어주는 것으로 혼동을 회피할 수 있지만, 생성자는 이름을 다르게 지어줄 수 없다.  
때문에 생성자에선 아래와 같은 방법으로 혼동을 회피할 수 있다.

- 정적 팩터리 메서드 사용으로 생성자 직접 사용을 대체
- 매개변수가 명확하게 구분되도록 하여 어느 것이 호출될지 혼동되지 않도록 함
    - ex) ArrayList(int initialCapacity) vs ArrayList(Collection<? extends E> c)

## 다중정의 혼동으로 생기는 예시

### List.remove(int index) vs List.remove(Object o)

제네릭과 오토박싱의 등장으로 다중정의 혼동이 더욱 심해졌는데, 대표적으로 List의 remove 메서드가 있다.

```java
class SetList {
    public static void main(String[] args) {
        Set<Integer> set = new TreeSet<>();
        List<Integer> list = new ArrayList<>();

        for (int i = -3; i < 3; i++) {
            set.add(i);
            list.add(i);
        }

        for (int i = 0; i < 3; i++) {
            set.remove(i);
            list.remove(i);
        }

        System.out.println(set + " " + list);
        // 예상: [-3, -2, -1] [-3, -2, -1]
        // 실제: [-3, -2, -1] [-2, 0, 2]
    }
}
```

set은 `remove(Object o)` 메서드가 호출되어 의도대로 해당 객체를 삭제하지만,  
list는 `remove(Object o)`가 아닌 `remove(int index)` 메서드가 다중정의되어 있기 때문에 지정한 인덱스의 객체를 삭제하게 된다.  
(만약 의도대로 동작하길 원한다면, `list.remove(i)` 대신 `list.remove((Integer) i)`를 사용하면 된다.)
