---
title: "Unnecessary Objects(불필요한 객체)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 불필요한 객체 생성을 피하라

불필요한 객체 생성의 대표 적인 예로는 `new String("string")`이 있다.  
리터럴로 생성하는 것과 `new String("string")`으로 생성하는 것은 동일한 결과를 반환하지만, 불필요한 인스턴스가 생성되는 문제가 있다.

## 불필요한 객체 생성을 피하는 방법 - 정적 초기화

정규표현식을 사용할 때 `Pattern` 인스턴스는 정규표현식에 해당하는 유한 상태 머신을 만들기 때문에 생성 비용이 높다.  
때문에 2번과 같이 사용하게 되면 한 번 사용할 때마다 `Pattern` 인스턴스를 생성하고 버려지게 되어 비효율적이다.

```java
class RomanNumerals {
    // 1. 정규표현식을 사용할 때마다 Pattern 인스턴스를 생성하지 않고 정적 초기화 블록에서 생성
    private static final Pattern ROMAN = Pattern.compile(
            "^(?=.)M*(C[MD]|D?C{0,3})"
                    + "(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$");

    static boolean isRomanNumeral1(String s) {
        return ROMAN.matcher(s).matches();
    }

    // 2. 정규표현식을 사용할 때마다 Pattern 인스턴스를 생성
    static boolean isRomanNumeral2(String s) {
        return s.matches("^(?=.)M*(C[MD]|D?C{0,3})"
                + "(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$");
    }
}
```

1번과 같이 정적 초기화로 `Pattern` 인스턴스를 생성하면 한 번만 생성되고 재사용할 수 있기 때문에 효율적이다.

## 불필요한 객체 생성의 예 - 오토 박싱(auto boxing)

오토 박싱은 기본 타입과 박싱된 기본 타입의 차이를 흐려주지만, 완전히 없애주지는 못한다.  
때문에 오토 박싱을 사용하면 불필요한 객체가 생성되고 성능에 큰 영향을 미칠 수 있다.

```java
class Sum {
    // 1. Do not use autoboxing
    long sum1() {
        long sum = 0L;
        for (long i = 0; i <= Integer.MAX_VALUE; i++) {
            sum += i;
        }
        return sum;
    }

    // 2. Use autoboxing
    Long sum2() {
        Long sum = 0L;
        for (long i = 0; i <= Integer.MAX_VALUE; i++) {
            sum += i;
        }
        return sum;
    }
}
// ** 실제로 로컬에서 실행했을 때는 두 연산에 큰 시간 차이는 없었다. **
```
