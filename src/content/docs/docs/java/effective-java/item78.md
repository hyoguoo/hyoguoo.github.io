---
title: "Mutable Data Sharing"
date: 2024-03-07
lastUpdated: 2025-02-20
tags: [Java]
description: "멀티스레드 환경에서 가변 데이터를 안전하게 공유하기 위한 synchronized, volatile, Atomic 클래스 활용법을 정리한다."
---

> 공유 중인 가변 데이터는 동기화해 사용하라

`synchronized` 키워드는 해당 메서드나 블록을 한 번에 한 스레드씩 수행하도록 보장하며, 아래의 특징을 가진다.

- 한 객체가 일관된 상태를 가지고 생성되었을 때, 해당 객체에 접근하는 메서드는 해당 객체이 Lock을 획득
- Lock을 획득한 메서드는 객체의 상태를 확인하거나 변경할 수 있음
- 메서드 실행이 종료되면 Lock을 해제
- 동기화 없이는 한 스레드가 객체의 일관성이 깨진 상태를 보게 될 수 있음
    - 동기화는 메서드나 블록에 들어간 스레드가 객체의 일관성이 깨진 상태를 보지 못하도록 보장

## Java에서 가변 데이터 스레드간 통신

아래 코드는 boolean 필드를 검사하면서 그 값이 true가 아니면 무한 루프를 돌며 값을 증가시키는 코드이다.

```java
class StopThread {

    private static boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {

        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested) {
                i++;
                System.out.println(i);
            }
        });

        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

1초 후 메인 스레드에서 stopRequested 필드의 값을 true로 변경하고 있지만, 실제론 변경된 값을 바로 읽지 못하는 경우가 발생할 수 있다.  
** 실행 환경에 따라 1초 후에 바로 종료될 수도 있다.

### synchronized 메서드를 이용한 동기화

해당 문제를 해결하기 위해선 stopRequested 필드에 접근하는 메서드를 동기화 하는 방법이 있다.

```java
class StopThread {

    private static boolean stopRequested;

    private static synchronized void requestStop() {
        stopRequested = true;
    }

    private static synchronized boolean stopRequested() {
        return stopRequested;
    }

    public static void main(String[] args) throws InterruptedException {

        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested()) {
                i++;
            }
        });

        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        requestStop();
    }
}
```

쓰기(`requestStop`)와 읽기(`stopRequested`) 메서드 모두 `synchronized` 키워드를 사용하고 있는데,  
읽기와 쓰기 전부 `synchronized` 키워드를 사용하지 않으면 동기화가 제대로 이루어지지 않는다.(간혹 잘 동작하는 것 처럼 보일 수 있지만 실제론 그렇지 않다.)

### volatile 필드를 이용한 동기화

`volatile` 키워드를 사용하여 해당 필드를 읽고 쓰는 동작이 항상 메인 메모리에 반영되도록 보장하는 방법이 있다.

```java
class StopThread {

    private static volatile boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {

        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested) {
                i++;
            }
        });

        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

## volatile 주의사항

위의 문제는 `volatile` 키워드를 사용하여 문제를 해결했지만, 해당 키워드는 필드를 읽고 쓰는 통신만 보장하며, 동시성을 보장하지는 않는다.

```java
class AddTest {

    private static volatile int count = 0;

    public static void main(String[] args) throws InterruptedException {
        Thread thread1 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                count++;
            }
        });

        Thread thread2 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                count++;
            }
        });

        thread1.start();
        thread2.start();

        thread1.join();
        thread2.join();

        System.out.println(count); // 1592872
    }
}
```

위 코드를 실행해보면 2000000이 나와야 할 것 같지만, 실제로는 1592872(2000000이 아닌 값)가 나오는 것을 확인할 수 있다.  
이는 `volatile` 키워드는 해당 필드를 읽고 쓰는 통신만 보장하며, 동시성을 보장하지는 않기 때문이다.

### synchronized 블록을 이용한 동기화

처음 나왔던 `synchronized` 키워드를 사용하여 해당 필드를 읽고 쓰는 통신과 동시성을 보장하는 방법이 있다.

```java
class AddTest {

    private static int count = 0;

    private static synchronized void add() {
        count++;
    }

    public static void main(String[] args) throws InterruptedException {

        Thread thread1 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                add();
            }
        });

        Thread thread2 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                add();
            }
        });

        thread1.start();
        thread2.start();

        thread1.join();
        thread2.join();

        System.out.println(count);
    }
}
```

### Atomic 클래스를 이용한 동기화

멀티 스레드 환경에서 동기화 문제를 별도의 synchronized 키워드 없이 해결할 수 있는 방법으로 `java.util.concurrent.atomic` 패키지에 있는 Atomic 클래스를 사용하는 방법이 있다.  
(내부적으로 volatile 키워드와 CAS 알고리즘을 사용하여 동시성 문제를 해결하고 있다.)

```java
import java.util.concurrent.atomic.AtomicInteger;

class AddTest {

    private static final AtomicInteger count = new AtomicInteger(0);


    public static void main(String[] args) throws InterruptedException {
        Thread thread1 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                count.incrementAndGet();
            }
        });

        Thread thread2 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                count.incrementAndGet();
            }
        });

        thread1.start();
        thread2.start();

        thread1.join();
        thread2.join();

        System.out.println(count.get());
    }
}
```

## 결론

가변 데이터를 공유하는 방법을 다루었지만, 더 복잡한 로직에서는 문제가 어디서 발생할지 예측할 수 없으므로 가변 데이터를 공유하지 않는 방법을 사용하는 것이 가장 좋다.  
만약 멀티 스레드 환경에서 가변 데이터를 공유해야 한다면 아래 사항을 주의하자.

- 해당 데이터를 읽고 쓰는 메서드 전부 `synchronized` 키워드를 사용하여 동기화
- `volatile` 키워드를 사용하면 통신은 보장되지만, 동시성은 보장되지 않는 것을 주의
- 가변 데이터가 `java.util.concurrent.atomic` 패키지에서 제공한다면 해당 클래스를 고려해도 좋음
