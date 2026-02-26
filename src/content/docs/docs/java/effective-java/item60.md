---
title: "Decimal Calculation"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 정확한 답이 필요하다면 float와 double은 피하라.

float와 double 타입은 과학과 공학 계산용으로 설계되었는데, 넓은 범위 수를 빠르게 정밀한 `근사치`로 계산하도록 설계되었다.  
때문에 만약 정확한 답이 필요하다면 float와 double은 피해야 한다.

```java
class Example {

    public static void main(String[] args) {
        System.out.println(1.03 - 0.42);        // 0.6100000000000001
        System.out.println(1.00 - 9 * 0.10);    // 0.09999999999999998

        double funds = 1.00;
        int itemsBought = 0;
        for (double price = 0.10; funds >= price; price += 0.10) {
            funds -= price;
            itemsBought++;
        }
        System.out.println(itemsBought + " items bought.");    // 3 items bought.
        System.out.println("Change: $" + funds);               // Change: $0.3999999999999999
    }
}
```

위 결과는 각각 0.6, 0,1, 4, 0이 나오길 기대하지만 소수점을 정확히 표현하지 못해 오차가 발생한다.  
이를 해결하기 위해선 `BigDecimal`, `int`, `long`을 사용해야 한다.

- `BigDecimal` : 정확한 계산이 필요할 때 해결책으로 사용할 수 있지만 성능이 느리고 쓰기 불편하다.

```java
class Example {

    public static void main(String[] args) {
        final BigDecimal TEN_CENTS = new BigDecimal(".10");

        BigDecimal funds = new BigDecimal("1.00");
        int itemsBought = 0;
        for (BigDecimal price = new BigDecimal("0.10"); funds.compareTo(price) >= 0; price = price.add(new BigDecimal("0.10"))) {
            funds = funds.subtract(price);
            itemsBought++;
        }
        System.out.println(itemsBought + " items bought.");    // 4 items bought.
        System.out.println("Change: $" + funds);               // Change: $0.00
    }
}
```

- `int` / `long` : 빠른 성능을 보장하지만 크기가 제한되고 소수점을 직접 관리해야 한다.(예시는 단위를 변경하여 해결)

```java
class Example {

    public static void main(String[] args) {
        int itemsBought = 0;
        int funds = 100;
        for (int price = 10; funds >= price; price += 10) {
            funds -= price;
            itemsBought++;
        }
        System.out.println(itemsBought + " items bought.");    // 4 items bought.
        System.out.println("Change: $" + funds);               // Change: $0
    }
}
```

