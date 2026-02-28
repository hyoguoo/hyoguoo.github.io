---
title: "Side-Effect-Free Function"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "스트림에서 부작용 없는 순수 함수를 사용해야 하는 이유와 forEach의 올바른 용도, Collectors 활용법을 정리한다."
---

> 스트림에서는 부작용 없는 함수를 사용하라

스트림은 함수형 프로그래밍에 기초한 패러다임이기 때문에, 스트림에도 함수형 프로그래밍의 패러다임이 적용된다.  
스트림 패러다임의 핵심은 계산을 일련의 변환으로 재구성하는 부분인데, 이때 각 변환 단계는 가능한 한 이전 단계의 결과를 받아 처리하는 순수 함수여야 한다.

```java
// 안 좋은 예시
class Example {
    public static void main(String[] args) {
        Map<String, Long> freq = new HashMap<>();
        try (Stream<String> words = new Scanner(file).tokens()) {
            // 스트림 API를 사용했지만 단순 반복문을 사용한 것과 같다.
            words.forEach(word -> {
                // 단어를 소문자로 변환한 다음, 외부 상태를 수정(연산 결과를 보여주는 일 이상의 일을 수행 중)
                freq.merge(word.toLowerCase(), 1L, Long::sum);
            });
        }
    }
}

// 좋은 예시
class Example {
    public static void main(String[] args) {
        Map<String, Long> freq;
        try (Stream<String> words = new Scanner(file).tokens()) {
            // 스트림 파이프라인을 이용해 외부 상태를 수정하지 않고 단어 빈도를 계산
            freq = words
                .collect(groupingBy(String::toLowerCase, counting()));
        }
    }
}
```

`forEach` 연산은 종단 연산 중 기능이 가장 적고 스트림 답지 못한 연산이기 때문에, 위와 같이 스트림 패러다임의 장점을 제대로 살리지 못할 수 있다.  
때문에 `forEach` 연산은 스트림 계산 결과를 보고할 때만 사용하고, 계산하는 데는 사용하지 않는 것이 좋다.

## Collectors

`Collectors`는 스트림의 원소를 손쉽게 컬렉션으로 모을 수 있게 해주는데, 스트림을 올바르게 활용하려면 `Collectors`를 잘 알아두는 것이 좋다.  
`toList`, `toSet`, `toCollection`, `toMap`, `groupingBy`, `partitioningBy` 등 다양한 메서드를 제공하는데, 책의 본문을 참고하면 된다.