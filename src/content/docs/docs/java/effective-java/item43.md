---
title: "Method Reference"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 람다보다는 메서드 참조를 사용하라

람다는 익명 클래스보다 간결하다는 큰 장점이 있는데, 이보다 더 간결하게 하는 메서드 참조라는 방법이 있다.

```java
/*
merge 메서드는 키, 값, 함수를 인수로 받아
키가 없으면 주어진 키와 값으로 새로운 항목을 추가하고
키가 이미 존재하면 기존 값과 주어진 값을 합쳐서 새로운 값을 저장한다.
 */
class Example {
    public static void main(String[] args) {
        // 람다
        map.merge(key, 1, (count, incr) -> count + incr);

        // 메서드 참조
        map.merge(key, 1, Integer::sum);
    }
}
```

람다식을 보면 `count`와 `incr` 부분이 크게 하는 일 없이 단순히 두 값을 더하는 것을 알 수 있다.  
이러한 부분을 Integer 클래스(그 외에 모든 기본 박싱 타입)은 두 값을 더하는 정적 메서드 `sum`으로 대체할 수 있다.

하지만 매개변수 이름 자체가 코드 상에서 사라지기 때문에 프로그래머에 따라 가독성이 떨어질 수 있다.

## 메서드 참조 유형

메서드 참조 유형은 다섯 가지로, 가장 흔한 유형은 위 예시에서 사용한 정적 메서드 참조이다.  
메서드 참조 유형은 아래와 같다.

| 메서드 참조 유형  |           예시           |                          람다                           |
|:----------:|:----------------------:|:-----------------------------------------------------:|
|     정적     |   Integer::parseInt    |             str -> Integer.parseInt(str)              |
| 한정적(인스턴스)  | Instant.now()::isAfter | Instant then = Instant.now();<br>t -> then.isAfter(t) |
| 비한정적(인스턴스) |  String::toLowerCase   |               str -> str.toLowerCase()                |
|  클래스 생성자   |   TreeMap<K,V>::new    |                () -> new TreeMap<K,V>                 |
|   배열 생성자   |       int[]::new       |                  len -> new int[len]                  |