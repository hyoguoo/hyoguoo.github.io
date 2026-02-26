---
title: "Stream"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 스트림은 주의해서 사용하라

스트림 API는 다량의 데이터 처리 작업을 처리하는 것을 도와 주는데, 핵심 추상 개념은 아래 두 가지라고 할 수 있다.

- 스트림은 데이터 원소의 유한 혹은 무한 시퀀스를 뜻한다.
- 스트림 파이프라인은 이 원소들로 수행하는 연산 단계를 표현한다.

스트림 안의 데이터 원소들은 객체 참조나 기본 타입 값(int, long double)을 포함할 수 있다.

## 스트림 연산

스트림은 소스 스트림에서 시작해 종단 연산으로 끝나며, 그 사이에 하나 이상의 중간 연산이 있을 수 있다.

- 중간 연산(intermediate operation) : 스트림을 어떠한 방식으로 변환하는 연산(데이터 원소의 타입이 바뀔 수 있음)
- 종단 연산(terminal operation) : 스트림 파이프라인에서 결과를 도출하는 연산

스트림 파이프라인은 지연 실행되기 때문에, 종단 연산이 호출되는 시점에 모든 중간 연산이 적용된다.  
또한 스트림 API는 메서드 연쇄를 지원하는 플루언트 API(fluent API)이기 때문에, 파이프라인 하나를 구성하는 모든 호출을 연결하여 단일 표현식으로 만들 수 있다.

## 과한 스트림

스트림을 사용하면 코드가 간결해지고 가독성이 좋아지는 경우가 많지만, 과하게 사용하는 경우엔 오히려 코드가 더 복잡해질 수 있다.

```java
// 기존 코드
class Anaagram {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        Map<String, Set<String>> groups = new HashMap<>();
        try (Scanner s = new Scanner(dictionary)) {
            while (s.hasNext()) {
                String word = s.next();
                groups.computeIfAbsent(alphabetize(word), (unused) -> new TreeSet<>()).add(word);
            }
        }

        for (Set<String> group : groups.values()) {
            if (group.size() >= minGroupSize) {
                System.out.println(group.size() + ": " + group);
            }
        }
    }

    private static String alphabetize(String s) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        return new String(a);
    }
}

// Stream 사용
class Anaagram {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> word.chars().sorted()
                            .collect(StringBuilder::new, (sb, c) -> sb.append((char) c), StringBuilder::append).toString()))
                    .values().stream().filter(group -> group.size() >= minGroupSize)
                    .map(group -> group.size() + ": " + group).forEach(System.out::println);
        }
    }
}
```

코드의 길이만 짧아졌을 뿐, 스트림을 사용한 쪽의 코드가 더 복잡하고 이해하기 어렵다고 볼 수 있다.  
모든 연산을 스트림에서 수행하는 것이 아니라 적절히 사용하는 것이 중요하다.

```java
import java.nio.file.Files;

class Anaagram {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> alphabetize(word)))
                    .values().stream()
                    .filter(group -> group.size() >= minGroupSize)
                    .forEach(group -> System.out.println(group.size() + ": " + group));
        }
    }

    private static String alphabetize(String s) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        return new String(a);
    }
}
```

## 기본 타입이 아닌 스트림 사용

스트림은 기본적으로 int, long, double 타입만 지원하는데, 이외의 타입을 사용하면 의도하지 않은 동작이 발생할 수 있다.

```java
class Example {

    public static void main(String[] args) {
        // chars() 메서드는 IntStream을 반환하기 때문에 발생한 문제
        "Hello world!".chars().forEach(System.out::println); // 72101108...
        
        // 해결 방법, 명시적으로 형변환
        "Hello world!".chars().forEach(x -> System.out.print((char) x)); // Hello world!
    }
}
```

위와 같이 char 타입을 사용할 때는 명시적으로 형변환을 해주어야 한다.  
이는 가독성이 떨어지고 오류가 발생할 가능성이 높기 때문에 사용하지 않는 것이 좋다.

## 알맞는 스트림 사용

스트림을 과하게 사용하는 것은 안 좋지만, 아래와 같은 상황에서는 스트림을 사용을 고려해볼 수 있다.

- 원소들의 시퀀스를 일관되게 변환
- 원소들의 시퀀스를 필터링
- 원소들의 시퀀스를 하나의 연산을 사용해 결합(+, concat, min, max 등)
- 원소들의 시퀀스를 컬렉션에 모으기(toList, toSet 등)
- 원소들의 시퀀스에서 특정 조건을 만족하는 원소를 찾기(findAny, anyMatch 등)

하지만 위 상황이라고 무조건 스트림을 사용해야 하는 것은 아니고, 결국엔 같은 일을 수행하는 코드를 개인 취향으로 선택하는 것이기 때문에 둘 중 더 나은 것을 선택하면 된다.
