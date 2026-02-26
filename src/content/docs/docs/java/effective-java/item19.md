---
title: "Inheritance(상속)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 상속을 고려해 설계하고 문서화하라. 그러지 않았다면 상속을 금지하라

## 상속의 위험성

앞의 아이템에서 다뤘듯이 상속은 코드를 재사용하기 위해 유용한 도구이지만, 항상 최선이 아니며, 잘못 사용하게되면 오류를 내기 쉽게 된다.  
때문에 클래스를 설계할 때 상속을 고려해야하고 각 메서드마다 어떤 식으로 동작할지 상세하게 문서화해야 한다.  
만약 상속을 하기에 부적절한 클래스라면 상속을 금지하는 조치를 취해야 한다.

## 상속을 고려한 설계와 문서화

상속을 고려한 설계와 문서화를 하고자 한다면 아래의 사항들을 지키는 것이 좋다.

### 1. @implSpec을 통한 문서화

주석에 `@implSpec` 태그를 추가하여 `Implentation Requirements` 내용을 문서화하여 클라이언트에게 정보를 제공해 줄 수 있다.

```java
/**
 * {@inheritDoc}
 *
 * @implSpec 이 구현은 다음과 같다.
 * {@code
 *  return 1;
 * }
 */
```

### 2. protected를 이용한 메서드 공개

클래스의 내부 동작 과정 중간에 끼어들 수 있는 훅을 잘 선별하여 protected 메서드 형태로 공개하여 큰 어려움 없이 효율적인 하위 클래스를 만들 수 있도록 할 수 있다.  
실제로 `java.util.AbstractList`의 `removeRange` 메서드는 protected로 선언되어 있다.  
`List` 구현체를 사용하는 클라이언트는 해당 메서드의 존재를 모르지만, `AbstractList`를 상속한 하위 클래스는 해당 메서드를 사용하여 효율적으로 `clear` 메서드를 구현할 수 있게 된다.

`protect`의 공개 여부는 정확히 정해진 것은 없으며, 하위 클래스를 만들어보고 테스트해보면서 적절한지 판단해야 한다.  
하지만 많은 메서드를 노출하면 캡슐화가 어려워지고, 적게 노출하면 하위 클래스를 만들기 어려워진다는 점을 명심해야 한다.

### 3. 상속용 클래스의 생성자

상속용 클래스의 생성자는 직/간접적으로 재정의 가능 메서드를 호출해서는 안된다. 자세한 예시 및 이유는 아래의 코드를 참고하자.

```java
import java.time.Instant;

class Super {

    public Super() {
        overrideMe(); // 3. overrideMe() 호출
    }

    public void overrideMe() {
    }
}

// 하위 클래스
final class Sub extends Super {

    private final Instant instant;

    Sub() {
        super(); // 2. 상위 클래스의 생성자 호출
        instant = Instant.now(); // 6. instant 초기화
    }

    // 4. 상위 클래스에서 호출 받아 오버라이딩 된 메서드 실행
    public void overrideMe() {
        System.out.println(instant); // 5. 아직 초기화되지 않은 instant 출력
    }
}

class Main {
    public static void main(String[] args) {
        Sub sub = new Sub(); // 1. 생성자 호출
        sub.overrideMe(); // 7. overrideMe() 호출하여 정상적으로 instant 출력
    }
}
```

예시 코드에서는 `System.out.println`이 `null`을 에러 없이 실행시키지만, 만약 다른 메서드를 호출한다면 `NullPointerException`이 발생하게 될 수 있다.  
때문에 생성자 내부에서는 `private`, `final`, `static` 같은 재정의 불가능한 메서드만 호출해야 한다.

### 4. Cloneable, Serializable 인터페이스

`Cloneable`과 `Serializable` 인터페이스를 구현한 클래스는 상속용으로 설계하기에 적합하지 않으며, 일반적으로 권장하지 않는다.  
`Cloneable`은 `clone` 메서드를, `Serializable`은 `readObject` 메서드를 각각 구현해야 하기 때문에 하위 클래스에서는 이를 구현해야 하기 때문에 확장의 부담이 더 커지게 된다.

`clone`과 `readObject` 메서드는 생성자와 비슷한 효과(새로운 인스턴스 생성)를 내기 때문에, 만약 구현 해야한다면 마찬가지로 직/간접적으로 재정의 가능 메서드를 호출해서는 안된다.

### 5. 상속용 클래스의 직렬화

`Serializable`을 구현한 상속용 클래스가 `readResolve` 혹은 `writeReplace` 메서드를 선언하는 경우 `protected`로 선언해야 한다.  
(`private`으로 선언하면 하위 클래스에서는 해당 메서드를 사용할 수 없게 된다.)

## 상속 금지

위에서 보았듯이 상속 가능한 클래스를 설계하기 위해선 많은 노력이 필요하기 때문에 상속을 금지하는 것이 더 좋을 수 있다.  
상속을 금지하는 방법은 아래 두 가지가 있다.

- 클래스를 final로 선언
- 모든 생성자를 private 혹은 package-private으로 선언하고, public 정적 팩터리를 제공

## 현실적인 대안

사실 많은 개발자들이 철저한 설계 안에서 개발 할 수 없기 때문에, 위의 원칙을 지키는 것은 현실적으로 어렵다.  
때문에 완벽한 설계가 아니더라도 무조건 상속을 금지하는 것이 아니라 클래스 내부에서 재정의 가능 메서드를 사용하지 않게 만들고, 해당 사실을 문서화하는 정도만 하더라도 오동작을 방지할 수 있다.
