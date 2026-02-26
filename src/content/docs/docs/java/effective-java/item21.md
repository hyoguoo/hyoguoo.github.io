---
title: "Interface"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 인터페이스는 구현하는 쪽을 생각해 설계하라.

Java 8부터는 인터페이스도 디폴트 메서드를 통해 구현 코드를 포함할 수 있게 되었다.  
하지만 모든 디폴트 메서드들이 구현 클래스에 매끄럽게 동작될 것이라는 보장은 없기 때문에 주의해서 사용해야 한다.

Java 8에서 핵심 컬렉션 인터페이스에 디폴트 메서드가 추가되었고, 자바 라이브러리의 디폴트 메서드는 코드 품질이 높고 잘 동작하여 좋은 예라고 할 수 있다.  
하지만 모든 디폴트 메서드가 그렇지 않은데, 그 예로는 `Collection` 인터페이스의 `removeIf` 메서드가 있다.

```java
// Java 8의 Collection 인터페이스의 removeIf 메서드
public interface Collection<E> extends Iterable<E> {
    
    // ...
    
    default boolean removeIf(Predicate<? super E> filter) {
        Objects.requireNonNull(filter);
        boolean result = false;
        for (Iterator<E> it = iterator(); it.hasNext(); ) {
            if (filter.test(it.next())) {
                it.remove();
                result = true;
            }
        }
        return result;
    }
}
```

위 코드 자체가 문제가 있는 코드는 아니지만, 모든 Collection 구현체에 적용될 수 없다.  
예를 들어 자바 플랫폼 라이브러리에서는 이 문제를 예방하기 위해 인터페이스의 디폴트 메서드를 재정의하고, 다른 메서드에서는 디폴드 메서드를 호출하기 전에 필요한 작업을 수행하도록 하여 해결하고 있다.  
하지만 자바 플랫폼에 속하지 않은 서드 파티 기존 컬렉션 구현체들은 바로 대응을 하지 못하여 문제가 발생할 수 있다.(아파치의 `SynchronizedCollection`에서 동기화 관련 문제가 발생한다.)  

## 결론

이처럼 디폴트 메서드는 기존 구현체에 런타임 오류를 일으킬 수 있으니, 디폴트 메서드를 추가하는 것은 꼭 필요한 경우가 아니라면 피해야 한다.  
하지만 새로운 인터페이스를 생성하는 경우엔 디폴트 메서드를 통해 표준적인 메서드 구현을 제공하는 데 아주 유용하기 때문에 장점은 많다.