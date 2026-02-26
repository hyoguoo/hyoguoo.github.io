---
title: "List vs Array"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 배열보다는 리스트를 사용하라

아이템의 주제처럼 배열보다는 리스트를 우선해야하지만 무조건적으로 배열을 사용하지 말라는 것은 아니다.  
리스트는 결국 Java 기본 타입이 아니며(내부 구현에서 배열 사용), 성능이 중요한 상황(HashMap)에서는 배열을 사용하고 있다.  
하지만 꼭 배열을 사용해야하는 상황이 아니라면 리스트를 사용하는 것이 좋다.

## 배열과 제네릭 타입의 차이

배열과 제네릭 타입 사이의 큰 차이로는 공변과 실체화가 있는데, 자세히 알아보면 다음과 같다.

### 공변(covariant)

Sub가 Super의 하위 타입이라면 배열 Sub[]는 배열 Super[]의 하위 타입이 되지만,  
제네릭 타입 List<Sub>는 List<Super>의 하위 타입이 되지 않으며, 상위 타입도 아니다.

```java
class Main {

    public static void main(String[] args) {
        Object[] objectArray = new Long[1];
        objectArray[0] = "I don't fit in"; // 런타임 에러, ArrayStoreException

        List<Object> ol = new ArrayList<Long>(); // 컴파일 에러, Incompatible types
        ol.add("I don't fit in");
    }
}
```

이 차이는 위 코드에서 알 수 있듯이 배열은 공변을 허용하여 런타임에 문제가 발생하지만,  
제네릭은 컴파일 시에 문제가 발생하여 보다 안전하다.

### 실체화(reify)

마찬가지로 배열은 실체화되고, 제네릭은 실체화되지 않는 차이가 있다.  
이 차이로 위 코드에서 발생하는 차이는 다음과 같다.

- 배열: 런타임에도 자신이 담기로 한 원소의 타입을 인지하고 확인하여 `ArrayStoreException`을 발생시킴
- 제네릭: 제네릭은 타입 정보를 컴파일 타임에만 검사하고런타임에 소거되기 때문에 런타임에는 타입 정보를 알 수 없음
    - `E`, `List<E>`, `List<String>` 같은 타입을 실체화 불가 타입(non-reifiable type)이라고 함
    - 실체화 되지 않아 런타임에 컴파일타임보다 타입 정보를 적게 가지고 있음
    - 매개변수화 타입을 실체화할 수 있는 타입은 비한정적 와일드카드(`List<?>`, `Map<?, ?>` 등)타입으로 한정됨

이처럼 공변/실체화에 있어 서로 반대되는 성질을 가지고 있기 때문에 배열과 제네릭은 잘 어우러지지 못한다.

## 제네릭 배열

이처럼 잘 어우러지기 힘들기 때문에 제네릭 배열을 만드려고 시도하면 컴파일 에러가 발생한다.  
만약 이를 허용하고 1번 라인 코드에서 컴파일 에러가 발생하지 않는다고 가정하는 경우 다음과 같은 문제가 발생한다.

```java
class Main {

    public static void main(String[] args) {
        List<String>[] stringLists = new List<String>[1]; // 1. 제네릭 배열 생성
        List<Integer> intList = List.of(42); // 2. 원소가 하나인 리스트 생성
        Object[] objects = stringLists; // 3. Object 배열에 List<String> 배열을 대입(배열은 공변이기 때문에 가능)
        objects[0] = intList; // 4. Object 배열의 첫 번째 원소에 2번에서 생성한 intList를 대입(런타임에서 List<Integer> -> List raw type으로 변환되어 가능)
        String s = stringLists[0].get(0); // 컴파일 에러
        // stringLists[0]에 저장된 List<Integer> 인스턴스에서 첫 번째 원소인 5는 Integer이기 때문에 String으로 형변환할 수 없음
    }
}
```

이처럼 예상치 못 한 런타임 에러가 발생할 수 있기 때문에 자바 컴파일러에서는 1번 라인의 제네릭 배열을 생성하는 코드를 컴파일 에러로 처리한다.

## 실체화 불가 타입

실체화 불가 타입으로 배열을 생성하는 경우 컴파일 에러가 발생하지는 않지만 경고가 발생한다.(타입 안전성이 보장되지 않음을 알려줌)

```java
class Chooser<T> {
    private final T[] choiceArray;

    public Chooser(Collection<T> choices) {
        choiceArray = (T[]) choices.toArray();
    }

    public T choose() {
        Random random = ThreadLocalRandom.current();
        return choiceArray[random.nextInt(choiceArray.length)];
    }
}
```

위 코드에서는 정상적으로 컴파일 되고, 런타임에서도 발생하지는 않아 안전하다고 확신할 수 있는 경우엔 `@SuppressWarnings("unchecked")` 어노테이션을 추가하여 경고를 숨길 수 있다.  
하지만 이 방법보다는 성능 상 손해를 볼 수 있지만 리스트를 사용하여 경고의 원인을 제거하는 것이 더 좋다.

```java
class Chooser<T> {
    private final List<T> choiceList;

    public Chooser(Collection<T> choices) {
        choiceList = new ArrayList<>(choices);
    }

    public T choose() {
        Random random = ThreadLocalRandom.current();
        return choiceList.get(random.nextInt(choiceList.size()));
    }
}
```
