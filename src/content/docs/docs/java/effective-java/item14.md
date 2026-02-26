---
title: "Comparable"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> Comparable을 구현할지 고려하라

compareTo를 사용하기 위해서는 Comparable을 구현해야 한다.(앞의 clone과는 다르게 Object가 아닌 Comparable에 선언되어 있음)  
Comparable을 구현하면 어떤 객체든지 자연적인 순서를 정할 수 있게 된다.(반대로 말하면, 정의하지 않은 경우 순서를 필요로하는 TreeMap, TreeSet 등에서 사용할 수 없다.)

## compareTo 일반 규약

해당 객체와 주어진 객체의 순서를 비교하여 주어진 객체보다 작으면 음의 정수, 같으면 0, 크면 양의 정수를 반환하고, 비교할 수 없는 타입 객체가 주어지면 ClassCastException을 던지도록 정의한다.  
Comparable을 구현한 클래스 x, y, z에 대해 다음의 규약을 따라야 한다.

** sgn 표기: 수학에서 말하는 부호 함수(signum function)를 의미하며, -1, 0, 1 중 하나를 반환하도록 정의함

- `sgn(x.compareTo(y)) == -sgn(y.compareTo(x))`
- `x.compareTo(y) > 0 && y.compareTo(z) > 0`이면 `x.compareTo(z) > 0`
- `x.compareTo(y) == 0`이면 `sgn(x.compareTo(z)) == sgn(y.compareTo(z))`
- `(x.compareTo(y) == 0) == (x.equals(y))`(필수는 아니지만 일반적으로 권장)

## compareTo 구현 방법

기본적으로 관계 연산자 <, >를 사용하는 방법보다는 박싱된 기본 타입 클래스의 compare 정적 메서드를 사용하는 것이 좋다.(관계 연산자를 사용하는 방식은 오류를 낼 수 있어 추천하지 않음)  
그리고, 핵심 필드가 여러 개라면 가장 핵심적인 필드부터 비교한 뒤 순서가 결정되면 즉시 반환하여 불필요하게 비교하는 일을 줄이는 것이 좋다.

```java
class PhoneNumber implements Comparable<PhoneNumber> {

    // ...

    @Override
    public int compareTo(PhoneNumber pn) {
        // 가장 핵심적인 필드부터 비교
        int result = Short.compare(areaCode, pn.areaCode);
        if (result == 0) { // 같지 않으면 실행되지 않고 아래 라인으로 넘어가 바로 반환
            result = Short.compare(prefix, pn.prefix);
            if (result == 0) {
                result = Short.compare(lineNum, pn.lineNum);
            }
        }
        return result;
    }
}
```

위 내용을 Java 8 이상에서는 메서드 연쇄 방식으로 비교자를 생성할 수 있다.(약간의 성능 저하가 있을 수 있지만, 가독성이 좋아지므로 권장)

```java
class PhoneNumber implements Comparable<PhoneNumber> {

    // ...

    private static final Comparator<PhoneNumber> COMPARATOR =
        Comparator.comparingInt((PhoneNumber pn) -> pn.areaCode)
            .thenComparingInt(pn -> pn.prefix)
            .thenComparingInt(pn -> pn.lineNum);
    
    @Override
    public int compareTo(PhoneNumber pn) {
        return COMPARATOR.compare(this, pn);
    }
}
```