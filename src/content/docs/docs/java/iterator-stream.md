---
title: "Iterator"
date: 2024-03-07
lastUpdated: 2025-11-12
tags: [Java]
description: "Java Iterator의 컬렉션 순회 방식과 Stream API의 지연 평가·중간 연산·최종 연산 처리 구조를 비교·분석한다."
---

`Iterator`는 컬렉션의 데이터를 순회하고 접근하기 위한 인터페이스로, 컬렉션 구현체의 내부 구조를 알지 못해도, 일관된 방식으로 요소에 접근할 수 있게 해준다.

## Iterator 인터페이스의 주요 메서드

Iterator 인터페이스는 다음과 같은 메서드를 가지고 있다.

- `boolean hasNext()`: 다음 요소가 존재하는지 확인하는 메서드로, 다음 요소가 있으면 `true`를 반환하고, 더 이상 순회할 요소가 없으면 `false`를 반환
- `E next()`: 다음 요소를 반환(호출할 다음 요소가 없을 경우 `NoSuchElementException` 예외가 발생)

```java
public class IteratorExample {

    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");

        // Iterator 생성
        Iterator<String> iterator = names.iterator();

        // 순회하면서 출력
        while (iterator.hasNext()) {
            String name = iterator.next();
            System.out.println(name);
        }
    }
}
```

# 스트림

자바 8부터 도입된 `Stream`은 데이터 소스를 추상화하고, 데이터를 처리하는 데 유용한 메서드들을 정의한 인터페이스다.

## Iterator vs Stream

`Iterator`가 데이터를 어떻게 처리할지 명시하는 명령형imperative 방식이라면, `Stream`은 무엇을 할지만 선언하는 선언형 방식이다.

- 컬렉션 요소를 람다식을 활용하여 처리 가능하며, Iterator보다 많은 연산을 지원
- 데이터 소스(배열, 컬렉션 등)가 무엇이든 동일한 방식으로 데이터를 처리하여 코드의 재사용성 향상

```java
public static void main(String[] args) {
    String[] array = {"a", "b", "c", "d", "e"};
    List<String> list = Arrays.asList(array);

    // 스트림 생성
    Stream<String> arrayStream = Arrays.stream(array);
    Stream<String> listStream = list.stream();

    // 두 스트림의 소스는 다르지만, 동일한 방식으로 처리
    arrayStream.sorted().forEach(System.out::println);
    listStream.sorted().forEach(System.out::println);
}
```

## 스트림의 특징

### 1. 데이터 소스 불변

스트림은 데이터 소스를 변경하지 않고, 연산 결과로 새로운 스트림을 반환하거나 최종 결과를 생성한다.

```java
public static void main(String[] args) {
    List<String> list = Arrays.asList("a", "c", "d", "b", "e");
    // list.stream().sorted()는 list 원본을 정렬하지 않음
    List<String> sortedList = list
            .stream()
            .sorted()
            .collect(Collectors.toList()); // 정렬된 새 리스트가 생성
}
```

### 2. 내부 반복

스트림을 사용하면 반복문을 메서드 호출을 통해 요소를 처리할 수 있다.

```java
class Example {

    public static void main(String[] args) {
        List<String> list = Arrays.asList("a", "b", "c", "d", "e");

        // 외부 반복
        for (String string : list) {
            System.out.println(string);
        }

        // 내부 반복
        list.stream().forEach(System.out::println);
    }
}
```

### 3. 중간 연산과 최종 연산

스트림의 연산은 파이프라인(pipeline)을 구성하며, 두 가지 유형으로 나뉜다.

- 중간 연산: 스트림을 반환하는 연산으로, 스트림에 연속해서 여러 개의 중간 연산을 호출 가능
- 최종 연산: 스트림을 반환하지 않는 연산으로, 스트림에 최종 연산을 호출하면 스트림이 소모
    - 소모하게 되면, 더 이상 스트림을 사용할 수 없음

```java
public static void main(String[] args) {
    List<String> list = Arrays.asList("a", "b", "c", "d", "e");

    Stream<String> stream = list.stream();
    stream.sorted(); // 중간 연산
    stream.forEach(System.out::println); // 최종 연산
}
```

### 4. 지연 연산

스트림의 중간 연산은 최종 연산이 호출되기 전까지는 실제로 수행되지 않고, 최종 연산이 호출되면 파이프라인이 동작하기 시작한다.

## 스트림 생성

대부분의 데이터 소스는 스트림으로 변환할 수 있다.

- `Collection` 인터페이스: `stream()` 메서드가 정의되어 있어 컬렉션을 스트림으로 변환(자손 클래스 모두 사용 가능)
- `Arrays` 클래스: 배열을 스트림으로 변환하는 `stream()` 메서드가 정의되어 있어 배열을 스트림으로 변환
- `Map` 인터페이스: `keySet()`, `values()`, `entrySet()` 메서드를 사용하여 스트림으로 변환
- `Stream` 클래스(static 메서드)
    - `Stream.of(1, 2, 3)`
    - `Stream.empty()`
    - `Stream.concat(stream1, stream2)`
- 무한 스트림
    - `Stream.iterate(1, n -> n + 2)`
    - `Stream.generate(Math::random)`
- 기본형 스트림
    - `IntStream.range(1, 10)`
    - `IntStream.rangeClosed(1, 10)`

## 스트림의 중간 연산

```java
public static void main(String[] args) {
    // skip()와 limit(): 요소 건너뛰기와 제한
    Stream.of(1, 2, 3, 4, 5)
            .skip(2)
            .limit(2)
            .forEach(System.out::println);

    // filter()와 distinct(): 요소 걸러내기와 중복 제거
    Stream.of(1, 2, 3, 4, 5, 1, 2, 3)
            .filter(i -> i % 2 == 0)
            .distinct()
            .forEach(System.out::println);

    // sorted(): 요소 정렬
    Stream.of(5, 2, 1, 4, 3)
            .sorted()
            .forEach(System.out::println);

    // map(): 요소 변환
    Stream.of(1, 2, 3, 4, 5)
            .map(i -> i * 2)
            .forEach(System.out::println);

    // peek(): 요소 확인 (소비하지 않음)
    Stream.of(1, 2, 3, 4, 5)
            .peek(System.out::println)
            .forEach(System.out::println);

    // mapToInt(), mapToLong(), mapToDouble(): 기본형 스트림으로 변환
    Stream.of(1, 2, 3, 4, 5)
            .mapToInt(Integer::intValue)
            .forEach(System.out::println);

    // flatMap(): 스트림의 요소를 다른 스트림으로 변환하는 연산
    String[] lineArr = {
            "Believe or not It is true",
            "Do or do not There is no try"
    };

    Stream<String> lineStream = Stream.of(lineArr);
    Stream<Stream<String>> strArrStream = lineStream.map(line -> Stream.of(line.split(" +")));
    strArrStream.map(strStream -> Arrays.toString(strStream.toArray(String[]::new)))
            .forEach(System.out::println);
    // [[Believe, or, not, It, is, true], [Do, or, do, not, There, is, no, try]]

    lineStream = Stream.of(lineArr);
    Stream<String> stream = lineStream.flatMap(line -> Stream.of(line.split(" +")));
    stream.forEach(System.out::println);
    // [Believe, or, not, It, is, true, Do, or, do, not, There, is, no, try]
}
```

## 스트림의 최종 연산

```java
public static void main(String[] args) {
    // forEach(): 스트림 요소를 소모하면서 작업 수행
    Stream.of(1, 2, 3, 4, 5).forEach(System.out::println);

    // allMatch(), anyMatch(), noneMatch(): 요소에 대해 지정된 조건에 맞는지 검사하는 연산으로 boolean 값을 반환
    Stream.of(1, 2, 3, 4, 5).allMatch(i -> i > 0); // true
    Stream.of(1, 2, 3, 4, 5).anyMatch(i -> i > 2); // true
    Stream.of(1, 2, 3, 4, 5).noneMatch(i -> i > 0); // false

    // findFirst()와 findAny(): 스트림의 요소 중에서 찾은 첫 번째 요소를 `Optional` 객체로 반환(찾지 못하면 empty 상태의 `Optional` 객체 반환)
    Stream.of(1, 2, 3, 4, 5).findFirst(); // Optional[1]
    Stream.of(1, 2, 3, 4, 5).findAny(); // Optional[1]

    // reduce(): 스트림의 요소를 하나씩 소모하면서 지정된 람다식을 수행하는 연산으로 `Optional` 객체를 반환
    // reduce()를 사용하면 sum(), max(), min() 등의 집계 연산을 구현할 수 있다.
    Stream.of(1, 2, 3, 4, 5).reduce((a, b) -> a + b); // Optional[15]

    // count(), max(), min(): 스트림의 요소를 소모하면서 지정된 연산을 수행하고, 최종 결과를 반환
    Stream.of(1, 2, 3, 4, 5).count(); // 5
    Stream.of(1, 2, 3, 4, 5).max(Integer::compareTo); // Optional[5]
    Stream.of(1, 2, 3, 4, 5).min(Integer::compareTo); // Optional[1]

    // collect(): 스트림의 요소를 수집하는 연산으로, `Collector`를 매개변수로 받아 받은 타입으로 변환하여 반환
    List<Integer> list = Stream.of(1, 2, 3, 4, 5).collect(Collectors.toList());
    Set<Integer> set = Stream.of(1, 2, 3, 4, 5).collect(Collectors.toSet());
}
```

### findFirst() vs findAny()

`findFirst()`와 `findAny()` 두 메서드 모두 찾은 첫 번째 요소를 `Optional` 객체로 반환하지만, 병렬 환경에서 동작이 다르다.

- `findFirst()`: 여러 요소가 조건에 부합해도 Stream의 순서를 고려하여 첫 번째 요소를 반환
- `findAny()`: Multiple Thread에서 여러 요소를 처리하다가 가장 먼저 찾은 요소를 반환

```java
public static void main(String[] args) {
    List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    Optional<Integer> findFirst = list.stream().parallel().filter(i -> i % 2 == 0).findFirst();
    Optional<Integer> findAny = list.stream().parallel().filter(i -> i % 2 == 0).findAny();

    System.out.println(findFirst.get()); // 2
    System.out.println(findAny.get()); // 2, 4, 6, 8, 10 중 하나
}
```

## 기본형 스트림 (Primitive Stream)

`Stream<Integer>`, `Stream<Double>` 등을 사용하면 기본형과 객체 간의 변환(박싱, 언박싱) 오버헤드가 발생할 수 있기 때문에, 기본형을 직접 다루는 스트림을 사용하는 것이 좋다.

- `Stream<T>.mapToInt(ToIntFunction<T> mapper)`: `Stream<T>`를 `IntStream`으로 변환한
- `IntStream.sum()`, `IntStream.average()`: 기본형에 특화된 집계 메서드 제공
- `IntStream.boxed()`: `IntStream`을 다시 `Stream<Integer>`로 변환
- `IntStream`, `LongStream`, `DoubleStream` 사용 가능

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
