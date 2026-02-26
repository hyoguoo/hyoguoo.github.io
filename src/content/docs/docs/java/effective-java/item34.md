---
title: "Enum"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> int 상수 대신 열거 타입을 사용하라.

열거 타입은 일정 개수의 상수 값을 정의하여 그 외의 값은 허용하지 않는 타입으로, 정해진 값만을 사용하고 싶을 때 사용한다.  
열거 타입 지원 이전에는 정수 상수를 사용하여 구현하였지만 타입 안전을 보장하지 않고 가독성도 좋지 않았다.

## 열거 타입

열거 타입은 다음과 같이 정의할 수 있다.

```java
public enum Apple {
    FUJI, PIPPIN, GRANNY_SMITH
}
```

C/C++의 `enum`과 달리 열거 타입은 완전한 형태의 클래스기 때문에 다른 언어의 열거 타입보다 할 수 있는 일이 많다.  
열거 타입 자체가 클래스이기 때문에, 상수 하나당 자신의 인스턴스를 하나씩 만들어 public static final 필드로 공개되는 것이다.  
그에 따라 생기는 특징은 다음과 같다.

- 밖에서 접근할 수 있는 생성자를 제공하지 않으므로 인스턴스를 직접 생성할 수 없음
- 직접 생성하거나 확장 불가능하므로 인스턴스들은 미리 정의된 상수 하나 씩만 존재함(싱글턴을 일반화한 형태)

미리 정의된 상수만 사용할 수 있기 때문에 컴파일타임에 다 알 수 있는 상수 집합이라면 열거 타입을 사용하는 것이 좋다.

## 메서드와 필드 추가

결국 완전한 형태의 클래스기 때문에 열거 타입은 다음과 같이 메서드와 필드를 추가할 수 있다.

```java
enum Operation {
    PLUS("+") {
        @Override
        public double apply(double x, double y) {
            return x + y;
        }
    },
    MINUS("-") {
        @Override
        public double apply(double x, double y) {
            return x - y;
        }
    },
    TIMES("*") {
        @Override
        public double apply(double x, double y) {
            return x * y;
        }
    },
    DIVIDE("/") {
        @Override
        public double apply(double x, double y) {
            return x / y;
        }
    };

    private final String symbol;

    Operation(String symbol) {
        this.symbol = symbol;
    }

    // 추상 메서드로 각 상수에서 다른 동작을 수행하도록 함
    public abstract double apply(double x, double y);

    // 일반 메서드로 해당 상수의 필드를 반환하도록 함
    public String getSymbol() {
        return symbol;
    }

    // static 메서드로 문자열을 받아 해당 문자열을 가지는 상수를 반환하도록 함
    public static Operation fromString(String symbol) {
        return Arrays.stream(values())
                .filter(op -> op.symbol.equals(symbol))
                .findFirst()
                .orElseThrow(IllegalArgumentException::new);
    }

    // toString 메서드를 재정의하여 해당 상수의 필드를 반환하도록 함
    @Override
    public String toString() {
        return getSymbol();
    }
}

class Main {

    public static void main(String[] args) {
        double x = 10;
        double y = 5;
        for (Operation op : Operation.values()) {
            System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
        }
    }
}
```

## 전략 열거 타입 패턴(Strategy Enum Pattern)

열거 타입을 사용하면 상수끼리 코드를 공유하기 어렵다는 단점이 있다.  
아래 코드는 주중/주말에 따라 잔업 수당을 계산하는 코드인데, switch 문을 통해 잔업 수당을 계산하고 있다.  
우선은 간결하게 표현되는 코드지만, 관리 관점에서는 위험한 코드로, 휴가와 같은 새로운 값이 추가되면 switch 문을 찾아 해당 case 문을 추가해야 한다.

```java
enum PayrollDay {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY;

    private static final int MINS_PER_SHIFT = 8 * 60;

    int pay(int minutesWorked, int payRate) {
        int basePay = minutesWorked * payRate;

        int overtimePay;
        switch (this) {
            case SATURDAY:
            case SUNDAY:
                overtimePay = basePay / 2;
                break;
            default:
                overtimePay = minutesWorked <= MINS_PER_SHIFT ?
                        0 : (minutesWorked - MINS_PER_SHIFT) * payRate / 2;
        }

        return basePay + overtimePay;
    }
}
```

이를 보다 정확하고 안정적으로 구현하기 위해선 두 가지 방법이 존재하는데, 두 방식 모두 가독성이 떨어지고 코드가 장황해지는 단점이 있다.

1. 잔업 수당을 계산하는 코드를 모든 상수에 중복하여 작성
2. 계산 코드를 평일/주말용으로 나눠 각각 도우미 메서드로 작성한 뒤 각 상수가 알맞는 메서드 호출

이러한 방법이 아닌 상수를 추가할 때 생성자에서 전략을 선택하도록 하여 해결할 수 있다.

```java
enum PayrollDay {
    MONDAY(PayType.WEEKDAY), TUESDAY(PayType.WEEKDAY), WEDNESDAY(PayType.WEEKDAY), THURSDAY(PayType.WEEKDAY), FRIDAY(PayType.WEEKDAY),
    SATURDAY(PayType.WEEKEND), SUNDAY(PayType.WEEKEND);

    private final PayType payType;

    PayrollDay(PayType payType) {
        this.payType = payType;
    }

    int pay(int minutesWorked, int payRate) {
        return payType.pay(minutesWorked, payRate);
    }

    // 전략 열거 타입
    private enum PayType {
        WEEKDAY {
            @Override
            int overtimePay(int minsWorked, int payRate) {
                return minsWorked <= MINS_PER_SHIFT ? 0 : (minsWorked - MINS_PER_SHIFT) * payRate / 2;
            }
        },
        WEEKEND {
            @Override
            int overtimePay(int minsWorked, int payRate) {
                return minsWorked * payRate / 2;
            }
        };

        private static final int MINS_PER_SHIFT = 8 * 60;

        abstract int overtimePay(int mins, int payRate);

        int pay(int minsWorked, int payRate) {
            int basePay = minsWorked * payRate;
            return basePay + overtimePay(minsWorked, payRate);
        }
    }
}
```

이렇게 하면 기존 switch문보다 코드 양은 많아지지만, 새로운 상수를 추가할 때마다 switch문을 찾아 case문을 추가하는 것보다 훨씬 안전하고 유연하다.  
이러한 방법을 전략 열거 타입 패턴이라 하며, 열가 타입 상수 일부가 같은 동작을 공유한다면 이 방식을 사용하는 것이 좋다.
