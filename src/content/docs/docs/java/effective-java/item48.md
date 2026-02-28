---
title: "Parallel Stream"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "스트림 병렬화의 동작 원리와 잘못된 병렬화가 유발하는 문제, 효과적인 병렬 처리 조건을 분석한다."
---

> 스트림 병렬화는 주의해서 적용하라

자바는 동시성 프로그래밍에 있어 많이 지원되는 편인데, 스트림 역시 `parallel()` 메서드를 통해 병렬화를 지원한다.  
해당 메서드 한 번 호출하면 스트림의 모든 연산이 병렬로 수행되지만, 올바르고 빠르게 동작하도록 보장하기 위해선 몇 가지 주의사항이 있다.

```java
class Example {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        primes().map(p -> TWO.pow(p.intValueExact()).subtract(ONE))
                .filter(mersenne -> mersenne.isProbablePrime(50))
                .limit(20)
                //  .parallel()
                .forEach(System.out::println);
        System.out.println(System.currentTimeMillis() - start);
    }

    static Stream<BigInteger> primes() {
        return Stream.iterate(BigInteger.TWO, BigInteger::nextProbablePrime);
    }
}
```

위 코드에서 `parallel()` 메서드를 주석 처리하고 실행하면 10초 내외로 완료되지만, 주석을 해제하고 실행하면 결과가 나오지 않고 연산만 계속 진행된다.  
해당 원인은 이 파이프라인을 병렬화하는 방법을 찾아내지 못 했기 때문인데, 그 원인은 `limit()` 메서드에 있다.

- 병렬화는 limit을 다룰 때 CPU 코어가 남으면 원소를 더 처리한 뒤 결과를 버리는 방식으로 처리한다.
- 하지만 위 코드는 새롭게 메르센 소수를 찾을 때마다 그 전 소수를 찾을 때보다 훨씬 오랜 시간이 걸린다.(새로운 원소 하나가 그 이전까지 처리한 시간보다 오래 걸림)
- 따라서 병렬화를 적용하면 무한 스트림이 되어버리고, 결과를 내지 못하고 끝나버린다.
    - 20번째 연산을 수행하는 시점에 남는 코어가 생겨 21,22,23 .. 연산을 시작해버리지만 그 시간은 훨씬 오래 걸리게 된다.

## 병렬 처리 영향 요소

대체로 스트림 소스가 `ArrayList`, `HashMap`, `HashSet`, `ConcurrentHashMap`의 인스턴스거나 배열, int 범위, long 범위일 때 병렬화의 효과가 가장 좋다.  
이러한 자료구조들은 데이터를 원하는 크기로 정확하고 손쉽게 나눌 수 있어 다수의 스레드 분배가 쉽기 때문이다.

### 참조 지역성(Locality of Reference)

빠른 병렬 처리를 위해서는 참조 지역성이 뛰어나야 한다.(이웃한 원소의 참조들이 메모리에 연속해서 저장되어 있어야 함)  
만약 참조들이 가리키는 객체들이 서로 떨어져 있다면(참조 지역성이 낮으면) 데이터가 주 메모리에서 캐시 메모리로 전송되는 시간을 대기하게 되고, 이는 병렬화의 효과를 떨어뜨린다.

### 스트림 종단 연산

스트림 파이프라인에서 병렬화의 효과는 종단 연산에 따라 달라진다.

- 모든 원소를 하나로 합치는(`count`, `max`, `min`, `sum`) 축소(reduction) 연산은 병렬화의 효과가 가장 좋다.
- `anyMatch`, `allMatch`, `noneMatch` 같은 조건에 맞으면 바로 반환되는 연산도 효과적이다.
- 하지만 가변 축소(mutable reduction)를 수행하는 `collect` 같은 메서드는 병렬화에 적합하지 않다.

### Spliterator

병렬화를 나누는 작업은 `Spliterator`가 수행하며, Stream이나 Iterable의 `spliterator()` 메서드를 호출하면 얻을 수 있다.  
이 `spliterator()` 메서드를 올바르게 재정의하면 높은 성능을 낼 수 있지만, 난이도 있는 작업이기 때문에 책에서는 다루지 않았다.

## 스트림 병렬화의 효율성

스트림을 잘못 병렬화하면 성능이 나빠지거나 첫 예시 코드처럼 아예 동작하지 않을 수 있다.  
게다가 적은 양의 데이터는 오히려 병렬화에 드는 추가 비용 때문에 성능 향상은 미미하거나 오히려 느려질 수 있다.(책에 의하면 원소 수 * 수행 코드 수 > 수십만 정도 되어야 병렬화의 효과가 나타난다고 한다.)  
때문에 병렬화를 고려할 때는 성능 테스트를 통해 실제로 효과가 있는지 확인해야 한다.  
실제로 스트림 파이프라인 병렬화는 사용할 일이 많지 않지만, 아래와 같이 효과적으로 사용할 수 있는 경우가 있다.(약 5배 성능 향상, M2 Pro 10코어 CPU 기준)

```java
class Example {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        System.out.println(piSerial(10_000_000));
        System.out.println(System.currentTimeMillis() - start);

        start = System.currentTimeMillis();
        System.out.println(piParallel(10_000_000));
        System.out.println(System.currentTimeMillis() - start);
    }

    static Long piSerial(long n) {
        return LongStream.rangeClosed(2, n)
                .mapToObj(BigInteger::valueOf)
                .filter(i -> i.isProbablePrime(50))
                .count();
    }

    static Long piParallel(long n) {
        return LongStream.rangeClosed(2, n)
                .parallel()
                .mapToObj(BigInteger::valueOf)
                .filter(i -> i.isProbablePrime(50))
                .count();
    }
}

/**** result ****
 664579
 14567
 664579
 2725
 ****************/
```

