---
title: "Parameter Validation"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 매개변수가 유효한지 검사하라

메서드와 생성자의 매개변수는 특정 조건이 만족되는 값만 들어오도록 기대하지만, 검사를 제대로 수행하지 않으면 에러가 발생하거나 아예 잘못된 결과를 반환할 수 있다.  
때문에 public이나 protected 메서드에는 어떤 제약이 있을지 생각하고 매개변수 값이 잘못됐을 때 던지는 예외를 문서화해야 한다.

```java
// java.math.BigInteger

/**
 * ...
 * <p>All methods and constructors in this class throw
 * {@code NullPointerException} when passed
 * a null object reference for any input parameter.
 * ...
 */
public class BigInteger extends Number implements Comparable<BigInteger> {

    // ...

    /**
     * (현재 값 mod m) 값을 반환한다. 이 메서드는
     * 항상 음이 아닌 BigInteger를 반환한다는 점에서 remainder 메서드와 다르다.
     *
     * @param m 계수(양수여야 한다.)
     * @return 현재 값 mod m
     * @throws ArithmeticException m이 0보다 작거나 같으면 발생한다.
     */
    public BigInteger mod(BigInteger m) {
        if (m.signum() <= 0) {
            throw new ArithmeticException("계수(m)는 양수여야 합니다. " + m);
        }
        BigInteger result = this.remainder(m);
        return (result.signum >= 0 ? result : result.add(m));
    }

    // ...
}
```

위 코드는 BigInteger 클래스의 mod 메서드의 유효성 검사 문서화 예시이다.  
BigInteger 클래스 수준에서 input parameter가 null인 경우에 대해 문서화가 되어 있기 때문에 mod 메서드에서는 설명이 생략되었다.  
(클래스 수준의 주석은 해당 클래스의 모든 public에 적용되므로, 메서드 수준에서 중복해서 작성할 필요가 없다.)

## 매개변수 유효성 검사의 중요성

매개변수로 받은 값을 해당 메서드에서 직접 사용하면 에러 발생 시 원인을 찾는 것이 쉽지만, 그렇지 않은 경우에는 매개변수 유효성 검사가 더욱 중요해진다.  
예를 들어 직접 사용하지 않고 나중에 쓰기 위해 저장하는 경우엔, 아래의 시나리오와 같이 에러가 발생하게 되면서 원인을 찾기가 어려워진다.

1. 메서드를 통해 객체 필드에 null을 저장(비정상적인 상태)
2. 임의의 시점에 필드에 저장된 null을 반환하거나 사용하는 메서드 호출
3. NullPointerException 발생하면서 어느 시점에 null이 저장되었는지 추적하기 어려움

## 매개변수 유효성 검사가 생략되는 경우

무조건 적으로 매개변수 유효성 검사를 수행해야 하는 것은 아닌데, 아래의 경우에는 생략해도 된다.

- 유효성 검사 비용이 지나치게 높거나 실용적이지 않은 경우
- 계산 과정에서 암묵적으로 검사가 수행되는 경우
    - `Collections.sort(List)`: 상호 비교될 수 없는 타입의 객체가 들어가면 `ClassCastException`이 발생하여, 굳이 유효성 검사를 수행하지 않아도 된다.
    - 하지만 암묵적 유효성 검사에 너무 의존하게되면 실패 원자성을 해칠 수 있으니 주의해야 한다.

