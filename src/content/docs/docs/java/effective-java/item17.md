---
title: "Minimize Mutability"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 변경 가능성을 최소화하라

불변 인스턴스로 생성된 정보는 객체가 소멸하는 순간까지 절대 달라지지 않는다.  
이 특징은 가변 클래스보다 설계하고 구현하기 쉽고, 오류가 생길 여지도 적고, 훨씬 안전하게 해준다.

## 불변 클래스 생성의 5가지 규칙

간단히 말하면 위에 설명한 것과 같이 생성된 시점부터 소멸될 때까지 절대 달라지지 않도록 하면 된다.

1. 객체의 상태를 변경하는 메서드(변경자) 제공 X
2. 클래스 확장 금지
    - 가장 쉬운 방법은 클래스를 final로 선언하여 하위 클래스 생성을 막는 것이 존재
    - 모든 생성자를 private 혹은 package-private으로 선언한 뒤, public 정적 팩터리 메서드를 제공하는 방법도 존재(더 유연한 방법)
3. 모든 필드 final 선언
4. 모든 필드 private 선언
5. 자신 외 내부의 가변 컴포넌트에 대한 접근 제공 X
    - 클라이언트가 제공한 객체 참조 반환 X
    - 접근자 메서드가 가변 객체 참조 직접 반환 X
    - 생성자 / 접근자 / readObject 메서드에서 가변 객체 참조를 방어적으로 복사를 수행해야 함

위의 규칙을 지킨 예시 코드는 다음과 같다.

```java
public final class Complex { // 2. final 선언하여 하위 클래스 생성 금지

    // 3, 4. 모든 필드 final / private 선언
    private final double re;
    private final double im;

    public Complex(double re, double im) {
        this.re = re;
        this.im = im;
    }

    // 1. 객체의 상태를 변경하는 메서드(변경자) 제공 X
    public double realPart() {
        return re;
    }

    public double imaginaryPart() {
        return im;
    }

    public Complex plus(Complex c) {
        return new Complex(re + c.re, im + c.im); // 5. 새로운 인스턴스를 생성하여 원래 인스턴스의 값을 변경하지 않음, 아래 메서드들도 동일
    }

    public Complex minus(Complex c) {
        return new Complex(re - c.re, im - c.im);
    }

    public Complex times(Complex c) {
        return new Complex(re * c.re - im * c.im, re * c.im + im * c.re);
    }

    public Complex dividedBy(Complex c) {
        double tmp = c.re * c.re + c.im * c.im;
        return new Complex((re * c.re + im * c.im) / tmp, (im * c.re - re * c.im) / tmp);
    }

    // equals / hashCode / toString ...
}
```

여기서 사칙 연산 메서드(`plus`, `minus`, `times`, `dividedBy`)는 모두 새로운 인스턴스를 생성하여 원래 인스턴스의 값을 변경하지 않고, 새로운 인스턴스를 반환한다.  
때문에 메서드 이름도 `add`같은 동사가 아닌 `plus`같은 전치사를 사용한 것도 알 수 있다.(`BigInteger`, `BigDecimal` 클래스는 해당 명명 규칙을 지키지 않아 혼란을 주고 있다.)

## 불변 클래스의 장점

### 스레드 안전과 인스턴스 캐싱

근본적으로 변하지 않아 스레드 안전하기 때문에 따로 동기화할 필요가 없어 여러 스레드가 동시에 사용해도 안전하다.  
불변 객체로 만들어 놓는 것이 스레드 안전성을 얻을 수 있는 가장 쉬운 방법이기도 하다.

불변객체는 다른 스레드에 영향을 주지 않기 때문에 이러한 장점을 살려 한 번 만든 인스턴스를 중복 생성하지 않고 재활용하는 것이 가능하다.  
아래 두 가지 방법으로 제공해줄 수 있는데, 2번을 사용하게 되면 클라이언트를 수정하지 않고 필요에 따라 불변 객체를 캐싱하여 재활용할 수 있는 장점이 생긴다.

```java
// 1. public static final 필드로 불변 객체 생성
public final class Complex {
    public static final Complex ZERO = new Complex(0, 0);
    public static final Complex ONE = new Complex(1, 0);
    public static final Complex I = new Complex(0, 1);
    // ...
}

// 2. 정적 팩터리 메서드로 불변 객체 생성
public final class Integer extends Number implements Comparable<Integer> {
    // ...

    @HotSpotIntrinsicCandidate
    public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }
    // ...
}
```

### 내부 데이터 공유

불변 객체끼리는 내부 데이터를 공유하여 복사하지 않고 사용할 수 있다.

```java
public class BigInteger extends Number implements Comparable<BigInteger> {

    final int signum; // 부호
    final int[] mag; // 절댓값, 배열이기 때문에 가변

    // ...

    public BigInteger negate() {
        return new BigInteger(this.mag, -this.signum); // 복사하지 않고 그대로 사용하여, 새로 생성된 인스턴스와 내부 배열을 공유 
    }
}
```

불변 객체이기 때문에 가변 객체인 내부 배열이 변경되지 않는다는 것을 보장할 수 있기 때문에 가능한 방법이다.

### 실패 원자성 제공

내부 상태를 바꾸지 않기 때문에 메서드에서 예외가 발생한 후에도 그 객체는 여전히 유효한 상태여야 한다(실패 원자성)는 규칙을 자연스럽게 따르게 된다.

## 불변 클래스의 단점

장점이자 단점인 부분으로, 값을 아주 조금 변경하기 위해서도 새로운 객체를 생성해야 한다는 점이다.  
이 문제를 대처하기 위해, 가변 동반 클래스를 만들어 불변 클래스의 단점이 존재하나 연산마다 객체를 생성하지 않는 가변 동반 클래스로 해결할 수 있다.

- 클라이언트가 사용할 연산을 예측 가능한 경우: package-private에 가변 동반 클래스를 두어 연산을 수행(`BigInteger`)
- 클라이언트가 사용할 연산을 예측할 수 없는 경우: `StringBuilder`와 같은 별도의 가변 동반 클래스를 제공
