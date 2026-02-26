---
title: "Thread Safety Level"
date: 2024-03-13
lastUpdated: 2024-03-13
---

> 스레드 안전성 수준을 문서화하라

메서드에 `synchronized` 한정자가 있다고 해서 스레드 안정성이 확실한 것이 아니다.  
단순 `synchronized` 유무로 스레드 안정성을 판단할 수 없으며, 스레드 안정성에도 수준이 나뉘기 때문에 그 수준에 대해 우선 잘 알아야 한다.  
아래는 일반적인 경우에 대해 스레드 안정성 수준이 높은 순으로 나열한 것이다.

1. 불변(immutable)
    - 상수와 같아서 외부 동기화가 필요 없음
    - String, Long, BigInteger 등 존재
2. 무조건적 스레드 안전(unconditionally thread-safe)
    - 수정될 수 있으나, 내부에서 동기화를 처리하여 외부에서 별도의 동기화가 필요 없음
    - AtomicLong, ConcurrentHashMap 등 존재
3. 조건부 스레드 안전(conditionally thread-safe)
    - 일부 메서드는 외부에서 동기화가 필요 없으나, 일부 메서드는 외부에서 동기화가 필요함
    - Collections.synchronized 래퍼 메서드가 반환한 컬렉션들이 해당
4. 스레드 안전하지 않음(not thread-safe)
    - 인스턴스가 수정될 수 있으며, 동시에 사용하기 위해선 메서드 호출을 외부 동기화 매커니즘으로 감싸야 함
    - ArrayList, HashMap 등 기본 컬렉션들이 해당
5. 스레드 적대적(thread-hostile)
    - 외부에서 동기화를 처리해도 스레드 안정성을 보장할 수 없음
    - 동시성을 고려하지 않고 설계된 클래스들이 해당하며, 일반적으로 고쳐져서 재배포 되거나 deprecated 되는 경우가 많음

API를 작성하고 안전하게 사용하기 위해선, 위의 스레드 안정성 수준을 명시해주는 것이 좋다.  
특히 아래의 경우엔 주의하거나 반드시 문서화해주는 것이 좋다.

- 조건부 스레드 안전 클래스인 경우 어떤 순서로 호출할 때 외부 동기화가 필요한지, 그 순서로 호출하기 위해 어떤 락을 사용해야 하는지 명시해야 함
- 정적 팩터리인 경우 자신이 반환하는 객체의 스레드 안정성 수준을 문서화해야 함

## 외부 Lock 제공과 서비스 거부 공격

클래스에서 외부에서 사용할 수 있는 락을 제공하면 클라이언트에서 여러 개의 메서드 호출을 원자적으로 수행할 수 있게 된다.  
하지만 이 유연성으로 인해, 내부에서 처리하는 동시성 제어 매커니즘을 혼용할 수 없다는 점과 서비스 거부 공격에 노출될 수 있다는 점을 주의해야 한다.  
(** 서비스 거부 공격: 클라이언트에서 락을 획득한 채로 놓지 않는 것)

`synchornized` 메서드는 해당 인스턴스나 클래스에 대해 락을 걸게 되는데, 그렇게 되면 클라이언트가 락을 획득한 채로 놓지 않을 수 있다.  
때문에 서비스 거부 공격을 막기 위해선 `synchornized` 메서드 대신 비공개 락 객체를 사용해야 한다.

```java
class Counter {

    private final Object lock = new Object(); // 비공개 락 객체
    private int count;

    public Counter() {
        this.count = 0;
    }

    public void increment() {
        synchronized (lock) {
            count++;
        }
    }

    public void decrement() {
        synchronized (lock) {
            count--;
        }
    }

    public int getCount() {
        synchronized (lock) {
            return count;
        }
    }
}

```

위와 같이 비공개 락 객체를 `private` + `final`로 선언하면 클라이언트가 객체 동기화에 관여할 수 없게 되면서 서비스 거부 공격을 막을 수 있다.  
비공개 락 객체 관용구는 무조건적 스레드 안전 클래스에만 사용할 수 있으며, 조건부 스레드 안전 클래서에선 필요한 락이 무엇인지 클라이언트에서 알려줘야 하므로 사용할 수 없다.
