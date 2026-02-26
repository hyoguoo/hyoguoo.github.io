---
title: "Excessive Synchronization"
date: 2024-03-10
lastUpdated: 2025-02-20
tags: [Java]
description: ""
---

> 과도한 동기화는 피하라

동기화는 스레드 안전성을 보장하기 위해 사용되는데, 과도한 동기화는 성능을 저하시키거나, 데드락을 발생시키고, 더 큰 문제를 발생시킬 수 있다.  
이러한 문제를 피하기 위해선, 동기화 메서드나 동기화 블록 안의 제어를 클라이언트에게 넘기는 아래와 같은 사용은 피해야 한다.

- 동기화된 영역 안에서 재정의할 수 있는 메서드 호출
- 클라이언트가 넘겨준 함수 객체 호출

외부에서 잔달 받은 코드는 동기화 된 영역 내에서 예외를 발생시키거나, 데드락에 빠지거나 데이터를 손상시킬 수 있다.

## 예외가 발생하는 예시

아래는 집합(Set)을 감싼 래퍼 클래스로, 집합에 원소가 추가되면 알림을 받을 수 있는 관찰자 패턴을 구현한 코드이다.

```java
public class ObservableSet<E> extends ForwardingSet<E> {

    private final List<SetObserver<E>> observers = new ArrayList<>();

    public ObservableSet(Set<E> set) {
        super(set);
    }

    // 구독 추가
    public void addObserver(SetObserver<E> observer) {
        synchronized (observers) {
            observers.add(observer);
        }
    }

    // 구독 제거
    public boolean removeObserver(SetObserver<E> observer) {
        synchronized (observers) {
            return observers.remove(observer);
        }
    }

    // 원소 추가 알림 메서드
    private void notifyElementAdded(E element) {
        synchronized (observers) {
            for (SetObserver<E> observer : observers) {
                observer.added(this, element);
            }
        }
    }

    // 원소 추가 메서드, 추가되면 알림
    @Override
    public boolean add(E element) {
        boolean added = super.add(element);
        if (added) {
            notifyElementAdded(element);
        }
        return added;
    }

    // 원소 추가 메서드, 추가되면 알림
    @Override
    public boolean addAll(Collection<? extends E> c) {
        boolean result = false;
        for (E element : c) {
            result |= add(element);
        }
        return result;
    }
}

public class Test {

    public static void main(String[] args) {
        ObservableSet<Integer> set = new ObservableSet<>(new HashSet<>());

        // 관찰자 추가
        set.addObserver(new SetObserver<>() {
            @Override
            public void added(ObservableSet<Integer> set, Integer element) {
                System.out.println(element);
                // 특정 원소(=23)이 추가되면 자기 자신(관찰자)을 제거
                if (element == 23) {
                    set.removeObserver(this);
                }
            }
        });

        for (int i = 0; i < 100; i++) {
            set.add(i);
        }
    }
}
```

위 코드는 SetObserver를 구현한 관찰자를 추가하고, 원소가 추가될 때마다 관찰자에게 알림을 보내는 ObservableSet 클래스이다.  
여기서 특정 원소에서 관찰자 스스로를 제거하는 코드를 추가했는데, 이 코드에서 `ConcurrentModificationException` 에러가 발생한다.

1. `set.add(i)` 메서드 내부에서 `notifyElementAdded`를 호출하고, 해당 메서드 내부에서 `added` 메서드를 호출하게 됨
2. 즉, `added` 메서드는 `notifyElementAdded`에서 리스트를 순회하는 도중에 수행됨
3. 구현한 `added` 메서드 내부에서 `removeObserver`를 호출하여 리스트를 수정하려 시도
4. 하지만 `notifyElementAdded` 메서드 내부에서 리스트 순회 도중 리스트를 수정하려 시도했기 때문에 에러 발생

위 코드에선 `notifyElementAdded` 동기화 블록 안에 내부에서 순회하는 코드가 있어 동시 수정이 일어나지 않도록 보장하지만, 콜백을 거쳐 수정하는 부분은 동기화 블록 밖 영역이기 때문에 막지 못한다.

## 데드락이 발생하는 예시

다음엔 테스트 수행 부분을 수정하여, 다른 스레드에서 관찰자를 제거하도록 수정해보자.

```java
public class Test {

    public static void main(String[] args) {
        ObservableSet<Integer> set = new ObservableSet<>(new HashSet<>());

        // 관찰자 추가
        set.addObserver(new SetObserver<>() {
            @Override
            public void added(ObservableSet<Integer> set, Integer element) {
                System.out.println(element);

                if (element == 23) {
                    // removeObserver를 직접 호출하지 않고 다른 스레드에서 수행
                    ExecutorService exec = Executors.newSingleThreadExecutor();
                    try {
                        exec.submit(() -> set.removeObserver(this)).get();
                    } catch (InterruptedException | ExecutionException e) {
                        throw new AssertionError(e);
                    } finally {
                        exec.shutdown();
                    }
                }
            }
        });

        for (int i = 0; i < 100; i++) {
            set.add(i);
        }
    }
}
```

이번 코드에선 예외가 발생하진 않지만 데드락이 발생하여 계속 대기하는 상태가 된다.

1. 다른 스레드에서 `set.removeObserver(this)`를 호출하면서 잠금을 획득하려 시도
2. 하지만 이미 순회 중인 메인 스레드가 `notifyElementAdded` 메서드 내부에서 잠금을 획득하고 있어 대기
3. 또한 메인 스레드는 다른 스레드에서 `set.removeObserver(this)`를 대기하고 있어 데드락 발생

## 해결 방법

이러한 문제를 해결하기 위해선, 동기화된 영역 안에서 `클라이언트가 넘겨준 함수 객체 호출`을 피하면 된다.

```java
private void notifyElementAdded(E element) {
    List<SetObserver<E>> snapshot = null;
    synchronized (observers) {
        snapshot = new ArrayList<>(observers);
    }
    for (SetObserver<E> observer : snapshot) {
        // 동기화 블록 밖에서 외부 정의 된 `added` 메서드 호출 
        observer.added(this, element);
    }
}
```

이렇게 직접 로직을 일부 수정하여 해결하는 방법도 존재하지만, 자바에서 제공하는 동시성 컬렉션을 사용하는 방법도 있다.

```java
private final Set<SetObserver<E>> observers = new CopyOnWriteArraySet<>();

public void addObserver(SetObserver<E> observer) {
//        synchronized (observers) {
    observers.add(observer);
//        }
}

public boolean removeObserver(SetObserver<E> observer) {
//        synchronized (observers) {
    return observers.remove(observer);
//        }
}

private void notifyElementAdded(E element) {
//    synchronized (observers) {
    for (SetObserver<E> observer : observers) {
        observer.added(this, element);
    }
//    }
}
```

`ArrayList` 대신 `CopyOnWriteArraySet`로 수정하기만 하면 기존 코드에서도 동시 수정이 일어나도 안전하게 동작한다.  
또한 컬렉션 내부에서 동기화를 처리하기 때문에 명식적으로 추가한 동기화 블록은 제거해도 된다.

## 결론

단순히 예외 발생이나 데드락을 피하는 것도 중요하지만, 멀티 스레드 처리의 목적은 성능 향상이다.  
멀티 스레드 수행 중 가장 많은 비용이 발생하는 부분은 지연 시간으로, 지연 시간을 줄이는 것은 곧 성능 향상으로 이어진다.  
동기화를 효과적으로, 그리고 안정적으로 사용하기 위해선 아래 규칙을 따르자.

- 재정의할 수 있거나 외부에서 넘어온 메서드 동기화 영역 내에서 수행 금지
- 동기화 영역 내에서 수행하는 일을 적게하여 락을 가지고 있는 시간을 최소화

