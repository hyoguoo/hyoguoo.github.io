---
title: "Varargs"
date: 2024-03-07
lastUpdated: 2024-06-04
tags: [Java]
description: "가변인수 메서드가 배열을 생성하는 원리와 1개 이상 인수 강제 패턴, 성능 최적화를 위한 다중정의 전략을 정리한다."
---

> 가변인수는 신중히 사용하라

가변인수 메서드는 명시한 타입의 인수를 0개 이상 받을 수 있고, 호출하게 되면 인수의 개수만큼 배열을 만들어서 인수들을 배열에 저장하여 메서드에 전달한다.   
여기서 인수 1개 이상을 받아야만 하는 메서드는 가변인수만 사용하면 런타임 시점에 오류가 발생할 수 있다.

```java
class Example {

    // 인수 1개 이상을 받아야만 하는 메서드
    static int min(int... args) {
        if (args.length == 0) {
            throw new IllegalArgumentException("인수가 1개 이상 필요합니다.");
        }
        int min = args[0];
        for (int i = 1; i < args.length; i++) {
            if (args[i] < min) {
                min = args[i];
            }
        }
        return min;
    }

    public static void main(String[] args) {
        System.out.println(min()); // 런타임 오류 발생
    }
}
```

위 예시에서는 인수가 1개 이상 필요한데 인수가 없는 상황에서 호출하게 되면 런타임 오류가 발생한다.  
이를 방지하기 위해선 첫 번째 인수를 평번한 매개변수로 받도록 하면 된다.

```java
class Example {

    // 인수 1개 이상을 받아야만 하는 메서드
    static int min(int firstArg, int... args) {
        int min = firstArg;
        for (int arg : args) {
            if (arg < min) {
                min = arg;
            }
        }
        return min;
    }
}
```

## 성능 문제

가변인수 메서드는 호출될 때마다 배열을 새로 하나 할당하고 초기화하기 때문에 성능이 중요한 상황에서는 가변인수를 사용하지 않는 것이 좋다.  
이러한 성능 문제를 최소화하기 위해선 일정 개수까지는 다중 정의를 활용하여 성능을 최적화할 수 있다.

```java
class Example {

    public void foo() {
    }

    public void foo(int a1) {
    }

    public void foo(int a1, int a2) {
    }

    public void foo(int a1, int a2, int a3) {
    }

    public void foo(int a1, int a2, int a3, int... rest) {
    }
}
```

만약 대부분의 경우 인수가 3개 이하일 것으로 예상된다면 위와 같이 다중 정의를 활용하면 불필요하게 배열을 할당하고 초기화하는 비용을 줄일 수 있다.
