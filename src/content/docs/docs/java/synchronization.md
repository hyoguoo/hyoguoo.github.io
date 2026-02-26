---
title: "스레드 동기화(Synchronization)"
date: 2025-01-07
lastUpdated: 2025-11-26
---

멀티 스레드 환경에서는 여러 스레드가 하나의 공유 자원에 동시에 접근할 때 데이터의 무결성이 깨지는 경쟁 상태(Race Condition)가 발생할 수 있다.

## `synchronized`를 이용한 동기화

Java는 `synchronized` 키워드를 통해 객체의 모니터를 이용하여, 가장 사용하기 쉽고 안전한 기본적인 동기화 메커니즘을 제공한다.

### 사용 방법 및 범위

Java는 `synchronized` 키워드를 통해 임계 영역을 손쉽게 설정할 수 있다.

1. 해당 코드 영역을 임계 영역으로 지정
2. 공유 데이터(객체)가 가지고 있는 잠금을 획득한 단 하나의 스레드만 이 영역 내의 코드를 수행할 수 있게 함
3. 임계 영역을 점유한 A 스레드가 코드 실행 중인 경우, B 스레드는 잠금 해제될 때까지 대기
4. A 스레드가 임계 영역 실행 완료 후 락을 반납하면, B 스레드가 락을 획득하여 코드를 수행

```java
// 1. 메서드 전체를 임계 영역 지정
public synchronized void method() {
    // ...
}

public void method() {
    // 2. 메서드 내의 특정 영역을 임계 영역 지정
    synchronized (this) { // 해당 객체(this)를 잠금의 대상으로 지정
        // ...
    }
}
```

### 한계

`synchronized`는 임계 영역을 손쉽게 지정할 수 있는 장점이 있지만 다음과 같은 단점이 있다.

- 락 획득 대기 시간을 설정할 수 없어 무한 대기 가능성 존재
- 대기 중인 스레드에 인터럽트를 걸 수 없음
- 읽기/쓰기를 구분하는 등 세밀한 제어가 불가능

## 조건 변수(Condition Variable)

단순히 접근을 막는 것을 넘어 스레드 간에 특정 조건을 기다리고, 조건이 만족되었음을 알려주는 협력 매커니즘이 필요할 땐 Java 모니터의 조건 변수 기능을 사용할 수 있다.

- `wait()`
    - 임계 영역을 실행하던 스레드가 특정 조건을 만족하지 못했을 때 호출
    - 스레드는 락을 반납하고 `WAITING` 상태로 전환되어 대기 셋(Wait Set)으로 이동
- `notify()`
    - 다른 스레드가 특정 조건을 만족시키는 작업을 완료했을 때 호출
    - 대기 셋에 있는 스레드 중 임의의 하나를 깨워 엔트리 셋(락 획득 대기 상태)로 이동
- `notifyAll()`
    - 대기 셋에 있는 모든 스레드를 깨워 엔트리 셋으로 이동

### wait()와 notify() 동작 과정

1. 스레드 A가 락을 획득하고 임계 영역을 실행
2. 조건이 만족되지 않아 스레드 A가 `wait()`를 호출
3. 스레드 A는 락을 반납하고 대기 셋으로 이동
4. 다른 스레드 B가 락을 획득하고 임계 영역을 실행하여 조건을 만족시킴
5. 스레드 B가 `notify()`를 호출하고 자신의 작업을 마친 뒤 락을 반납
6. `notify()` 호출로 깨어난 스레드 A는 대기 셋에서 엔트리 셋으로 이동
7. 스레드 A는 엔트리 셋에서 락 획득을 다시 시도하고, 성공하면 `wait()`가 호출됐던 지점부터 실행을 재개

### `synchronized` + `wait()`/`notify()` 사용 예시

스레드가 깨어났을 때 조건이 여전히 유효한지 재검사해야 하므로 `if` 대신 `while` 문을 사용해야 한다.

```java
class SharedBuffer {

    private final Queue<String> queue = new LinkedList<>();
    private final int CAPACITY = 5;

    public synchronized void produce(String data) throws InterruptedException {
        // 버퍼가 가득 찼으면 대기 (while 루프 사용 필수)
        while (queue.size() == CAPACITY) {
            wait();
        }
        queue.add(data);
        notifyAll(); // 대기 중인 소비자들을 모두 깨움
    }

    public synchronized String consume() throws InterruptedException {
        // 버퍼가 비었으면 대기 (while 루프 사용 필수)
        while (queue.isEmpty()) {
            wait();
        }
        String data = queue.poll();
        notifyAll(); // 대기 중인 생산자들을 모두 깨움
        return data;
    }
}
```

또한 특정 스레드만 계속 대기하는 기아 현상을 막기 위해 일반적으로 `notifyAll` 사용이 권장된다.

## `ReentrantLock`를 이용한 동기화

JDK 1.5부터 제공되는 `java.util.concurrent.locks.ReentrantLock`은 `synchronized`의 단점을 보완하고 더 강력한 기능을 제공한다.

### 주요 기능 및 장점

1. 락 획득 타임아웃 설정 가능
    - `tryLock(long timeout, TimeUnit unit)` 메서드를 사용하여 락 획득 시도 시간 설정 가능
    - 락 획득 실패 시 다른 로직을 수행하거나 재시도를 하여 데드락을 방지
2. 인터럽트 처리 가능
    - `lockInterruptibly()` 메서드를 사용하여 락 대기 중에 인터럽트 신호를 감지하여 대기 취소 가능
3. Condition 객체 분리
    - `Wait Set`을 여러 개로 분리하여 관리 가능
    - 생산자 스레드와 소비자 스레드를 구분하여 깨우는 등 정교한 신호 전달 가능

기존 `synchronized`와는 다르게 모니터 락이 아닌 직접적인 락 객체를 사용하는 방식으로 동작한다.

|    **특징**    |        **`synchronized`**         |        **`ReentrantLock`**         |
|:------------:|:---------------------------------:|:----------------------------------:|
|   **락 타입**   |           모니터 락(JVM 관리)           |          객체 기반 락 (직접 관리)           |
| **타임아웃 지원**  |                미지원                |           지원 (`tryLock`)           |
| **인터럽트 지원**  |                미지원                |      지원 (`lockInterruptibly`)      |
|  **락 세분화**   |                불가능                | 가능 (여러 개의 `ReentrantLock` 인스턴스 사용) |
| **대기/알림 제어** | `wait()` / `notify()` 메서드로 제한적 제어 |    `Condition` 객체를 통한 세부적 제어 가능    |

### `ReentrantLock` 동작 방식

`syncronized` 키워드와 유사하게 두 가지 대기 상태를 관리한다.

- `ReentrantLock` 객체 대기 큐: 락을 획득하려는 스레드 대기 공간
- `Condition` 객체 스레드 대기 공간: `await()` 메서드에 의해 대기 중인 스레드 대기 공간

동작 과정은 아래와 같다.

1. 스레드에서 `lock()` 메서드를 호출하여 락을 획득하려 시도
2. 이미 사용 중인 경우 대기 큐로 이동하여 락을 획득할 때까지 대기
3. `unlock()` 메서드를 호출하여 락을 반납하면 대기 큐에서 대기 중인 스레드 중 하나가 락을 획득
4. `await()` 메서드를 호출하면 스레드 대기 공간으로 이동하고 락을 반납
5. 다른 스레드에서 `signal()` 메서드를 호출하면 스레드 대기 공간에 있는 대기 중인 스레드 중 하나를 깨움
6. 깨어난 스레드는 대기 큐로 이동
7. 락 획득을 시도
8. 성공하면 `await()`를 호출한 부분부터 다시 실행

### `ReentrantLock` 사용 예시

```java

class PrinterQueue {

    private final Lock lock = new ReentrantLock();
    private final Condition notFullCondition = lock.newCondition();
    private final Condition notEmptyCondition = lock.newCondition();

    private final Queue<String> queue = new LinkedList<>();
    private final int maxCapacity;

    public PrinterQueue(int maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    // 프린트 작업 추가
    public void addPrintJob(String job) {
        lock.lock();
        try {
            while (queue.size() == maxCapacity) {
                System.out.println(Thread.currentThread().getName() + " is waiting to add print job: " + job);
                notFullCondition.await(); // 큐가 가득 찬 경우 대기
            }
            queue.offer(job);
            System.out.println(Thread.currentThread().getName() + " added print job: " + job);
            notEmptyCondition.signal(); // 큐에 데이터가 추가되었으므로 소비자 알림
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.out.println(Thread.currentThread().getName() + " was interrupted while adding a print job.");
        } finally {
            lock.unlock();
        }
    }

    // 프린트 작업 처리
    public void processPrintJob() {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                System.out.println(Thread.currentThread().getName() + " is waiting for a print job to process.");
                notEmptyCondition.await(); // 큐가 비어 있는 경우 대기
            }
            String job = queue.poll();
            System.out.println(Thread.currentThread().getName() + " is processing print job: " + job);
            notFullCondition.signal(); // 큐에 공간이 생겼으므로 생산자 알림
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.out.println(Thread.currentThread().getName() + " was interrupted while processing a print job.");
        } finally {
            lock.unlock();
        }
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
