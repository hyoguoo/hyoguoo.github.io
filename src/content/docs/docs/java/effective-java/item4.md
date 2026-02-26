---
title: "Noninstantiability"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 인스턴스화를 막으려거든 private 생성자를 사용하라

보통의 상황은 아니지만 아래와 같은 경우에는 인스턴스화 불가 클래스를 만들어 사용하는 경우가 존재한다.

- 정적 메서드와 정적 필드만을 담은 클래스가 필요할 때(ex. java.lang.Math, java.util.Arrays)
- 특정 인터페이스를 구현하는 객체를 생성해주는 정적 메서드를 담은 클래스가 필요할 때(ex. java.util.Collections)
- final 클래스와 관련한 메서드들을 모아놓을 때(ex. java.lang.reflect.Method)

때문에 위와 같은 유틸리티 클래스들은 인스턴스를 만들어 쓰려고 설계한게 아니기 때문에 인스턴스화 불가 클래스로 만들어 사용하는 것이 좋다.

## 인스턴스화 불가 클래스를 만드는 방법

생성자를 명시하지 않으면 컴파일러가 자동으로 기본 생성자를 만들어주지만, 명시적으로 private 생성자를 선언하면 컴파일러가 기본 생성자를 만들지 않는다.  
(**추상 클래스로 만들어도 인스턴스화 불가 클래스가 되지만, 상속을 받아 인스턴스화 가능한 클래스가 만들어질 수 있기 때문에 이 방법은 사용하지 않는 것이 좋다.)

```java
class UtilityClass {
    // 기본 생성자를 private으로 선언하고, 에러를 발생해 reflection이나 내부 메서드를 통해 생성자를 호출하는 것을 막는다.
    private UtilityClass() {
        throw new AssertionError();
    }
}
```

private 생성자로 선언하면 상속도 불가능하게 하는 효과도 있어 하위 클래스가 생기는 것도 막을 수 있다.