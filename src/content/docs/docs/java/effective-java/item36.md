---
title: "EnumSet"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "비트 필드의 단점을 분석하고, 열거 타입 상수의 집합 표현에 EnumSet을 활용해 타입 안전하고 효율적인 코드를 작성하는 방법을 설명한다."
---

> 비트 필드 대신 EnumSet을 사용하라

열거한 값들이 집합으로 사용되는 경우, 예전에는 각 상수에 서로 다른 2의 거듭제곱 값을 할당한 정수 열거 패턴을 사용하였다.

```java
class Text {
    public static final int STYLE_BOLD = 1 << 0; // 0001
    public static final int STYLE_ITALIC = 1 << 1; // 0010
    public static final int STYLE_UNDERLINE = 1 << 2; // 0100
    public static final int STYLE_STRIKETHROUGH = 1 << 3; // 1000

    public void applyStyles(int styles) {
        // ...
    }
}

class Main {

    public static void main(String[] args) {
        Text text = new Text();
        text.applyStyles(STYLE_BOLD | STYLE_ITALIC); // 0011
    }
}
```

비트별 OR을 사용해 여러 상수를 하나의 집합으로 모을 수 있으며, 이러한 집합을 비트 필드(bit field)라고 한다.  
비트 필드를 사용하면 비트별 연산을 사용해 집합 연산을 효율적으로 수행할 수 있으나, 정수 열거 상수의 단점을 그대로 갖고 있으며, 추가적인 단점도 존재한다.

- 비트 필드 값이 그대로 출력되면 단순한 정수 열거 상수를 출력할 때보다 해석하기가 훨씬 어려움
- 비트 필드에 적용된 모든 원소를 순회하기 까다로움
- 최대 몇 비트가 필요한지를 API 작성 시 미리 예측하여 적절한 타입을 선택해야 함

## EnumSet

이러한 단점을 보완하기 위해 Java는 `EnumSet`이라는 특수한 Set 구현체를 제공한다.  
내부적으로는 비트 벡터로 구현되어 있어, 원소가 총 64개 이하라면 `long` 변수 하나(`RegularEnumSet`)로 표현하며, 그 이상이라면 `long` 배열(`JumboEnumSet`)을 사용한다.  
EnumSet을 사용함으로써 얻을 수 있는 장점은 아래와 같다.

- 열거 타입 상수의 값으로 구성된 집합을 효과적으로 표현
- 타입 안전하고 다른 Set 구현체와도 함께 사용 가능
- 비트를 직접 다룰 때 겪을 수 있는 모든 문제를 덜어줌

```java
class Text {
    public enum Style {BOLD, ITALIC, UNDERLINE, STRIKETHROUGH}

    public void applyStyles(Set<Style> styles) { // 일반적으로 인터페이스를 받는 것이 좋음
        // ...
    }
}

class Main {

    public static void main(String[] args) {
        Text text = new Text();
        text.applyStyles(EnumSet.of(Style.BOLD, Style.ITALIC));
    }
}
```
