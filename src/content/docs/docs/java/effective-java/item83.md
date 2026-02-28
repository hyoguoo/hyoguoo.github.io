---
title: "Lazy Initialization"
date: 2024-03-14
lastUpdated: 2024-03-14
tags: [Java]
description: "지연 초기화의 적절한 사용 시점과 정적 필드의 홀더 클래스 관용구 및 인스턴스 필드의 이중검사 관용구를 비교 정리한다."
---

> 지연 초기화는 신중히 사용하라

일반적으로 필드를 초기화 할 때 아래와 같이 초기화를 한다.

```java
class Init {

    private final FieldType field = computeFieldValue();
}
```

하지만 초기화 시점을 처음에 하는 것이 아니라 필요한 시점에 하는 지연 초기화 기법을 사용할 수 있다.  
다른 최적화와 마찬가지로 지연 초기화는 모든 상황에서 성능을 향상시키지 않으며, 오히려 성능을 저하시킬 수도 있다.  
지연 초기화는 보통 아래와 같은 경우에 사용한다.

- 필드의 초기화 비용이 높은 경우 최적화 목적으로 사용
- 순환 문제를 해결해야 하는 경우

## 초기화 순환성(Initialization circularity) 해결 방법

초기화 순환성 문제를 해결하기 위해 지연 초기화를 사용하는 경우, 아래와 같이 `synchornized` 키워드를 사용하면 간단하게 해결할 수 있다.

```java
class LazyInit {

    private FieldType field;

    private synchronized FieldType getField() {
        if (field == null) {
            field = computeFieldValue();
        }
        return field;
    }
}
```

## 성능 문제로 인한 지연 초기화(정적 필드)

만약 성능 문제로 정적 필드를 지연 초기화해야하는 경우엔 지연 초기화 홀더 클래스 관용구를 사용할 수 있다.  
클래스는 클래스가 처임 쓰일 때 초기화되는 특성을 이용하여 필드를 지연 초기화하는 방법이다.

```java
class LazyInit {

    private static class FieldHolder {

        static final FieldType field = computeFieldValue();
    }

    private static FieldType getField() {
        return FieldHolder.field;
    }
}
```

`getField` 메서드가 처음 호출될 때 `FieldHolder` 클래스가 초기화되며, 내부의 `field` 필드가 초기화된다.  
이 방식은 동기화 없이도 지연 초기화를 수행할 수 있어, 성능이 저하될 요인이 전혀 없다는 장점이 있다.

## 성능 문제로 인한 지연 초기화(인스턴스 필드)

인스턴스 필드의 경우엔 이중검사 관용구를 사용해 지연 초기화를 수행할 수 있다.  
이 방식은 한 번 초기화된 필드에 접근할 때 동기화 비용을 없애주는 방식이다.

```java
class LazyInit {

    private volatile FieldType field;

    private FieldType getField() {
        FieldType result = field; // 지역 변수를 사용해 필드를 한 번만 읽도록 보장
        if (result != null) { // 첫 번째 검사: 락 없이 수행
            return result; // null이 아니면 이미 초기화된 상태이므로 반환
        }

        synchronized (this) { // 두 번째 검사: 락을 걸고 수행
            if (field == null) { // 필드가 아직 초기화되지 않았다면
                field = computeFieldValue(); // 필드를 초기화
            }
            return field; // 필드를 반환
        }
    }
}
```

`volatile` 키워드를 사용하여 필드를 선언하여, 필드에 대한 모든 읽기/쓰기가 메인 메모리에서 수행되기 때문에 이중검사 관용구를 사용할 수 있게 된다.  
이 방식은 정적 필드에도 사용할 수 있지만, 굳이 그럴 필요 없이 정적 필드의 경우엔 지연 초기화 홀더 클래스 관용구를 사용하는 것이 더 좋다.
