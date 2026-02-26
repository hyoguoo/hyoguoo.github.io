---
title: "Constant Interface(상수 인터페이스)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 인터페이스는 타입을 정의하는 용도로만 사용하라.

클래스가 특정 인터페이스를 구현하는 것은 '그 인터페이스의 기능을 제공한다'는 것을 의미한다.  
하지만 메서드 없이 상수(`static final`)만 제공하는 상수 인터페이스는 인터페이스의 특징을 잘못 사용한 안티 패턴으로, 사용하지 않는 것이 좋다.

```java
public interface PhysicalConstants {
    static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    static final double BOLTZMANN_CONSTANT = 1.380_648_52e-23;
    static final double ELECTRON_MASS = 9.109_383_56e-31;
}
```

상수 인터페이스를 구현하면 결국 이 상수를 API로 노출하게 되어 인터페이스의 역할을 훼손하게 된다.  
게다가 클라이언트에게 혼란을 줄 수 있으며, 이 상수 값들에 종속되어 유지보수가 어려워진다.(자바 플랫폼 라이브러리에서도 상수 인터페이스가 존재하나, 잘못 사용한 예라고 할 수 있다.)

## 상수 인터페이스의 대안

상수 인터페이스를 사용하는 것보다는 인스턴스화할 수 없는 유틸리티 클래스를 사용하는 것이 좋다.

```java
public class PhysicalConstants {
    private PhysicalConstants() {} // 인스턴스화 방지

    public static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    public static final double BOLTZMANN_CONSTANT = 1.380_648_52e-23;
    public static final double ELECTRON_MASS = 9.109_383_56e-31;
}
```