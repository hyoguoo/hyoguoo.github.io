---
title: "Ordinal"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> ordinal 메서드 대신 인스턴스 필드를 사용하라

대부분의 열거 타입 상수는 자연스럽게 하나의 정숫값에 대응되고, 모든 열거 타입은 해당 상수가 그 열거 타입에서 몇 번째 위치인지를 반환하는 ordinal 메서드를 제공한다.  
때문에 연결 타입 상수와 연결된 정숫값을 ordinal 메서드로 얻을 수 있지만, 이는 절대 사용하지 말아야 한다.

- ordinal 사용

```java
enum Ensemble {
    SOLO, DUET, TRIO, QUARTET, QUINTET,
    SEXTET, SEPTET, OCTET, NONET, DECTET;

    public int numberOfMusicians() {
        return ordinal() + 1;
    }
}

class Main {

    public static void main(String[] args) {
        System.out.println(Ensemble.DUET.numberOfMusicians()); // 2, 만약 순서가 바뀌면 다른 값이 출력됨
    }
}
```

- 인스턴스 필드 사용

```java
enum Ensemble {
    SOLO(1), DUET(2), TRIO(3), QUARTET(4), QUINTET(5),
    SEXTET(6), SEPTET(7), OCTET(8), NONET(9), DECTET(10);

    private final int numberOfMusicians;

    Ensemble(int numberOfMusicians) {
        this.numberOfMusicians = numberOfMusicians;
    }

    public int numberOfMusicians() {
        return numberOfMusicians;
    }
}

class Main {

    public static void main(String[] args) {
        System.out.println(Ensemble.DUET.numberOfMusicians()); // 2
    }
}
```

인스턴스 필드를 사용하면 간단하게 해결할 수 있는데, 이 방식을 사용하면 중간에 값을 추가하거나 비우는 등의 작업을 수행해도 문제가 없다.

## ordinal의 쓰임

ordinal 메서드는 대부분 사용할 일이 없고, EnumSet과 EnumMap 같이 열거 타입 기반의 범용 자료구조에 쓸 목적으로 설계되었으니 이 목적이 아니라면 사용하지 않는 것이 좋다.