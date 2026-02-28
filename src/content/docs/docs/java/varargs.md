---
title: "Varargs"
date: 2023-10-28
lastUpdated: 2025-11-22
tags: [Java]
description: "Java 가변인자(Varargs)의 내부 배열 변환 방식과 오버로딩·제네릭과의 상호작용, 성능 주의사항을 설명한다."
---

JDK 5부터 도입된 기능으로 메서드 호출 시 넘기는 인자의 개수를 클라이언트가 유동적으로 조절할 수 있게 해주는 문법이다.

```java
public static void main(String[] args) {
    System.out.println(sum(1, 2, 3, 4, 5));
}

private static int sum(int... args) {
    int sum = 0;
    for (int arg : args) {
        sum += arg;
    }
    return sum;
}
```

## 기본 동작 원리 및 특징

개발자가 `Type...` 문법을 사용하면 컴파일러는 이를 내부적으로 해당 타입의 배열로 변환하여 처리한다.

1. `sum(1, 2, 3)` 호출
2. 컴파일러가 `new int[]{1, 2, 3}` 배열 생성 코드로 변환
3. 내부에서는 `int[] args` 배열로 메서드 실행

메서드 내부에서는 배열을 다루는 것과 동일하게 동작하며, 다음과 같은 특징이 있다.

- 호출 비용 발생
    - 메서드가 호출될 때마다 새로운 배열을 할당하고 초기화하는 오버헤드가 있음
    - 성능이 매우 중요한 루프 내에서는 사용을 지양하거나 최적화가 필요함
- 마지막 매개변수
    - 가변인수 매개변수는 반드시 매개변수 리스트의 마지막에 위치해야 함
    - 하나의 메서드에 여러 개의 가변인수 매개변수를 둘 수 없음

## 주의사항

### 오버로딩 모호성

컴파일러가 어떤 메서드를 호출해야 할지 판단하기 어려워 모호성 에러가 발생하거나, 의도와 다르게 동작할 수 있다.

```java
private static int sum(int... args) {
    int sum = 0;
    for (int arg : args) {
        sum += arg;
    }
    return sum;
}

// 인자가 3개인 경우 호출되지만, 모호함이 발생
private static int sum(int a, int b, int c) {
    return a + b + c;
}

// 컴파일 에러 발생, Ambiguous method call.
private static int sum(int a, int b, int... args) {
    int sum = 0;
    for (int arg : args) {
        sum += arg;
    }
    return sum + a + b;
}

```

### [제네릭과 힙 오염](/docs/java/effective-java/item32/)
