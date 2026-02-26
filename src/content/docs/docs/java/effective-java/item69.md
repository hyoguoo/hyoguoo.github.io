---
title: "Exceptional Conditions"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 예외는 진짜 예외 상황에만 사용하라

## 제어 흐름에서의 예외

반복문을 순회 할 때 아래와 같이 예외를 사용해서 루프를 종료하는 방법도 존재할 것이다.  
JVM은 배열에 접근할 때마다 경계를 넘지 않는지 검사를 하는데, 1번에서는 중복될 수 있는 배열의 경계를 넘지 않는지 검사하는 부분(`i < range.length`)을 제거했다.  
때문에 1번 방법이 루프를 더 빠르게 돌릴 수 있다고 생각할 수 있지만, 실제로는 2번의 방법이 더 빠르다.(약 2배 차이)

```java
class Test {

    public static void main(String[] args) {
        Mountain[] range = new Mountain[100000000];
        for (int i = 0; i < range.length; i++) {
            range[i] = new Mountain();
        }

        // 1. 예외를 써서 루프 종료
        long start = System.currentTimeMillis();
        try {
            int i = 0;
            while (true) {
                range[i++].climb();
            }
        } catch (ArrayIndexOutOfBoundsException e) {
            // ignore
        }
        long end = System.currentTimeMillis();
        System.out.println("실행 시간 : " + (end - start) / 1000.0 + "초");

        // 2. for-each 문 사용
        start = System.currentTimeMillis();
        for (Mountain mountain : range) {
            mountain.climb();
        }
        end = System.currentTimeMillis();
        System.out.println("실행 시간 : " + (end - start) / 1000.0 + "초");
    }

    static class Mountain {

        public void climb() {
        }
    }
}
```

또한 거의 대부분의 사람들이 직관적이지 않다는 이유로 2번의 방법을 선호할 것이지만, 그 이외에도 많은 이유가 존재한다.

1. 예외는 예외 상황을 목적으로 설계되었기 때문에, 최적화되어 있지 않다.(느린 속도)
2. `try-catch` 블록이 생기면 JVM이 적용할 수 있는 최적화가 제한된다.
3. 배열을 순회하는 표준 관용구에는 이미 최적화 처리 되어 배열 범위에 대한 중복 검사를 수행하지 않는다.

성능적인 측면 뿐만 아니라, 아래와 같은 시나리오로 인해 제대로 동작하지 않을 수도 있다.

1. 반복문 안에 버그가 존재한다고 가정
2. 흐름 제어에 사용된 예외가 해당 버그를 숨김
3. 반복문에서 호출한 메서드가 관련 없는 배열을 사용 중에 `ArrayIndexOutOfBoundsException`을 던짐
4. 표준 관용구라면 이 버그는 예외를 잡지 않고 스레드가 종료되지만, 예외를 잡았기 때문에 스레드는 종료되지 않고 계속 실행됨

위 상황처럼 흘러간다면 의도치 않은 동작으로 인해 디버깅이 더 어려워지고, 심각한 논리적 오류가 발생할 수 있다.  
때문에 예외는 예외 상황에서만 사용해야하며, 제어 흐름용으로는 사용하지 말아야 한다.

## 상태 검사를 통한 예외 처리 최소화

예외를 사용하지 않고, 상태 검사를 통해 예외 처리를 최소화 할 수 있다.  
잘 설계된 API에서는, 클라이언트가 정상적인 제어 흐름에서 예외를 사용할 일이 없게 해준다.

```java
import java.util.Iterator;

class Test {
    public static void main(String[] args) {
        // 1. hasNext()를 통한 상태 검사
        for (Iterator<Foo> i = collection.iterator(); i.hasNext(); ) {
            Foo foo = i.next();
            // do something
        }

        // 2. 예외 처리를 통한 상태 검사
        try {
            Iterator<Foo> i = collection.iterator();
            while (true) {
                Foo foo = i.next();
                // do something
            }
        } catch (NoSuchElementException e) {
            // ignore
        }
    }
}
```

`Iterator` 인터페이스의 `next()` 메서드는 다음 요소가 존재하지 않을 때 `NoSuchElementException`을 던지는데,  
사용하기 전에 `hasNext()` 메서드를 통해 다음 요소가 존재하는지 확인하고 사용하면 예외를 사용하지 않고도 상태 검사를 할 수 있다.

### 상태 검사 메서드 vs Optional vs 특정 값

상태 검사 메서드 대신 `Optional`을 사용하거나 `null` 같은 특수한 값을 반환하는 방법도 존재하는데,  
셋 중 선택하는 방법은 지침은 아래와 같다.

1. Optional / 특정 값
    - 외부 동기화 없이 여러 스레드가 동시 접근하거나 외부 요인으로 변하는 경우: 상태 검사 메서드와 상태 의존적 메서드 호출 사이에 객체 상태가 변할 수 있기 때문에 Optional / 특정 값이 적합하다.
    - 성능이 중요한 상황: 상태 검사 메서드를 호출하는 것보다 Optional / 특정 값을 사용하는 것이 더 빠르다.
2. 상태 검사 메서드
    - 다른 모든 경우: 가독성이 살짝 더 좋고, 잘못 사용했을 때 디버깅이 더 쉽다.
