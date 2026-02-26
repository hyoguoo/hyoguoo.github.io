---
title: "Access Modifier"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 클래스와 멤버의 접근 권한을 최소화하라

좋은 컴포넌트는 내부 구현을 숨겨, 구현과 제공 API를 깔끔히 분리해주어 개발의 유연성을 높여준다.  
자바에서는 접근 제한자를 통해 클래스와 멤버의 접근 권한을 제어해 내부 구현을 감추는 것이 가능하다.

## 접근 제한 설정 원칙

기본 원칙은 최소한의 접근 권한으로 설정하여 모든 클래스와 멤버의 접근성을 가능한 한 좁히는 것이 좋다.  
가장 상위의 클래스와 인터페이스 부여할 수 있는 접근 수준은 아래 두 가지가 있다.

- package-private(default): 같은 패키지 내에서만 접근 가능, 내부 구현이므로 유연하게 변경 가능
- public: 모든 곳에서 접근 가능, 공개 API가 되므로 클라이언트가 항상 접근 가능

때문에 외부에서 접근할 필요가 없는 클래스나 멤버는 package-private으로 설정하여 내부 구현을 감추고,  
꼭 필요한 경우에만 public으로 설정하여 공개 API를 제공하는 것이 좋다.

마찬가지로 멤버의 경우 private, package-private, protected, public의 4가지 접근 수준을 부여할 수 있는데,  
공개 API를 세심히 설계한 후, 그 외의 멤버는 private으로 설정한 뒤 필요한 경우에만 접근 수준을 높이는 것이 좋다.

그 외에 상위 클래스 메서드를 재정의 시, 상위 클래스보다 접근 수준을 좁게 설정할 수 없다는 점도 주의해야 한다.(리스코프 치환 원칙)

## 접근 제한 설정 시 주의사항

### 테스트를 목적으로 접근 수준을 높이는 경우엔 package-private 까지만 허용하는 것이 좋음

보통 테스트 코드는 테스트 대상 코드와 같은 패키지에 위치하기 때문에 package-private까지만 허용하면 테스트 코드에서 접근 가능하다.

### public 클래스의 인스턴스 필드는 되도록 public이 아니어야 함

public인 경우 불변성을 보장할 수 없으며, 아래와 같은 문제가 발생할 수 있다.  
(예외로 필요한 구성요소로서 기본 타입이나 불변 객체를 참조하는 상수라면 public static final로 공개해도 무방하다.)

- final이 있더라도 가변 객체를 참조하는 경우 불변성을 보장할 수 없으며, 스레드 안전성도 보장할 수 없음
- 이미 공개된 필드이기 때문에 public 필드를 없애는 방식으로 리팩터링을 하면 클라이언트 코드를 망가뜨릴 수 있음

만약 가변(배열) 필드를 공개해야 한다면, 아래 두 가지 해결 방법이 있다.

```java
class Example {
    // 문제 발생 가능
    public static final Thing[] VALUES = {/* ... */};

    // 해결 방법 1: public 배열을 private으로 만들고 public 불변 리스트를 추가
    private static final Thing[] PRIVATE_VALUES = {/* ... */};
    public static final List<Thing> VALUES = Collections.unmodifiableList(Arrays.asList(PRIVATE_VALUES));

    // 해결 방법 2: public 배열을 private으로 만들고 public 배열 복사본을 추가
    private static final Thing[] PRIVATE_VALUES = {/* ... */};

    public static final Thing[] values() {
        return PRIVATE_VALUES.clone();
    }
}
```

## 모듈 시스템

Java 9에서는 접근 제어를 할 수 있는 모듈 시스템 개념이 도입되었지만, 많은 작업이 필요하고 아직까지는 널리 사용되지 않기 때문에 생략한다.