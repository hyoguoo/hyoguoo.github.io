---
title: "hashCode"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> equals를 재정의하려거든 hashCode도 재정의하라

[아이템 10](/docs/java/effective-java/item10/)에서 equals를 재정의할 때 hashCode도 재정의해야 한다고 언급했다.  
Object 명세에는 아래와 같이 정의되어 있다.

- equals 비교에 사용되는 정보가 변경되지 않으면, hashCode 반환 값도 항상 같아야 함(일관성)
- equals가 두 객체를 같다고 판단하면, 두 객체의 hashCode는 같은 값을 반환해야 함
- equals가 두 객체를 다르다고 판단해도, 두 객체의 hashCode가 서로 다른 값을 반환할 필요는 없음(단, 다른 객체에 대해서는 다른 값을 반환해야 성능이 좋아짐)

재정의를 올바르게 하지 않으면 HashMap / HashSet 같은 Hash 기반 컬렉션에서 제대로 동작하지 않게 된다.

## hashCode 재정의 방법

좋은 hashCode를 작성하는 방법은 아래와 같다.  
우선 주의해야할 부분은 equals에서 사용하는 필드들과 동일한 필드들을 사용해야 한다는 것이다.

1. int 변수 result를 선언한 후 값 c로 초기화
2. 해당 객체의 각 핵심 필드에 대해 아래와 같이 수행하여 해시코드 c를 계산
    - 기본 타입: Type.hashCode(f) 수행
    - 참조 타입: 재귀적으로 hashCode를 호출하며, 아래와 같은 규칙으로 계산
        - null: 0
        - 배열: Arrays.hashCode를 사용
        - 핵심 필드: 핵심 필드의 hashCode를 사용
        - 필드가 핵심이 아니면, 해당 필드의 hashCode를 계산하지 않음
3. 계산된 해시코드 c를 result에 더함(`result = 31 * result + c`)

Objects 클래스에는 임의의 개수만큼 객체를 받아 해시코드를 계산해주는 정적 메서드인 hash가 있다.  
위의 요구사항을 충족하여 잘 구현되어 있으므로, 이 메서드를 사용하는 것이 가장 좋지만 속도가 느리기 때문에 성능이 중요한 상황에서는 직접 구현하는 것이 좋다.

### 곱셈에 31을 사용하는 이유

홀수이면서 소수이기 때문인데, 사실 소수를 쓰는 이유는 명확하진 않고 전통적으로 사용하는 값이라고 한다.  
하지만 짝수를 사용하면서 오버플로우가 발생하면 정보를 잃을 수 있기 때문에 짝수 값을 사용하는 것은 좋지 않다.

## 캐싱

위에서도 언급했듯이 해시코드를 계산하는 과정은 비용이 많이 들 수 있는 작업이기 때문에 필드에 값을 캐싱하는 방법이 있다.  
하지만 이 방법은 필드가 변경되면 해시코드를 다시 계산해야 하므로, 불변 필드에만 사용하는 것이 좋다.

```java
class Test {
    private int hashCode;

    // 호출할 때 캐싱되는 지연 초기화(lazy initialization) 기법 사용
    @Override
    public int hashCode() {
        int result = hashCode;
        if (result == 0) {
            result = 31 * result + ...;
            hashCode = result;
        }
        return result;
    }
}
```

