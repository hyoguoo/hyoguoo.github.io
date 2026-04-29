---
title: "JVM JIT Compiler"
date: 2026-04-29
lastUpdated: 2026-04-29
tags: [ Java ]
description: "HotSpot JIT의 Mixed Mode와 Hot Method Detection, C1/C2 계층 컴파일, Code Cache, Deoptimization, 주요 최적화 기법, Warm-up 전략을 정리한다."
---

JIT(Just-In-Time) 컴파일러는 JVM이 실행 중 자주 사용되는 바이트 코드를 네이티브 기계어로 변환하여 인터프리터의 한계를 극복하는 핵심 메커니즘이다.

- 인터프리터로 즉시 시작, 핫스팟은 JIT가 백그라운드에서 컴파일
- 계층적 컴파일(C1/C2)로 빠른 응답성과 최종 성능을 동시에 달성
- 런타임 프로파일을 활용하여 정적 컴파일이 도달할 수 없는 영역까지 최적화

## JIT 컴파일러의 개념과 필요성

JIT 컴파일러는 프로그램을 실행하는 시점에 바이트 코드를 해당 플랫폼의 네이티브 기계어로 번역하는 역할을 수행한다.

- 하이브리드 실행 모델: 초기 구동 시에는 인터프리터로 즉시 실행하고, 핫스팟 코드는 JIT로 컴파일하여 실행 성능 극대화
- 런타임 최적화: 실행 중 수집된 프로파일링 데이터를 기반으로 실제 사용 패턴에 최적화된 기계어 생성
- 지연 컴파일: 모든 코드를 미리 컴파일하지 않고 필요한 시점에만 수행하여 메모리와 CPU 자원 효율화

인터프리터 방식의 특성상 네이티브 언어 대비 성능이 낮은 한계가 있어, JIT 컴파일러로 실행 중 반복되는 코드를 탐지하고 기계어로 최적화하여 이러한 성능 제약을 해결한다.

### Just-In-Time 생명 주기

"필요한 그 시점에 컴파일"이라는 어원 때문에 매 호출마다 컴파일이 일어난다고 오해할 수 있지만 실제 동작은 정반대다.

- 컴파일은 호출 누적 횟수가 임계치를 넘은 메서드에 대해 한 번만 수행
- 컴파일 결과는 Code Cache에 저장되며, 다음 호출부터는 인터프리트도 재컴파일도 없이 캐시된 네이티브 코드를 직접 실행
- 한 번도 핫스팟이 되지 않은 코드는 끝까지 인터프리트로만 실행
- 한 번 컴파일된 메서드는 역최적화(Deoptimization) 트리거가 발생하지 않는 한 계속 재사용

## 프로그램 실행의 시작과 Mixed Mode

자바 실행 환경인 HotSpot JVM은 기본적으로 인터프리터와 JIT 컴파일러 방식을 혼합한 `-Xmixed` 모드로 동작한다.

- 초기 실행: JVM은 바이트 코드를 인터프리터 방식으로 즉시 한 줄씩 실행하여, 컴파일을 기다리지 않고 애플리케이션의 구동 속도 확보
- 백그라운드 최적화: 코드가 실행되는 동안, JIT 컴파일러는 별도의 컴파일러 스레드에서 비동기적으로 핫스팟 코드를 찾아 네이티브 코드로 변환하는 최적화 작업 수행

## Hot Method Detection 및 OSR

JVM은 한 번에 모든 코드를 컴파일하지 않고, 실행 빈도가 높은 핫스팟(Hot Spot)을 효율적으로 찾아내어 최적화한다.

- 감지 메커니즘
    - `Invocation Counter`: 메소드가 호출된 누적 횟수를 기록
    - `Backedge Counter`: 루프 본문의 반복 횟수(정확히는 루프 끝에서 시작점으로 돌아가는 분기 횟수) 기록
    - 두 카운터의 합이 JVM이 설정한 임계치(Threshold)를 초과하면 해당 코드는 컴파일 대상 큐에 등록
- On-Stack Replacement(OSR)
    - 메소드 전체 호출 횟수는 낮더라도 특정 루프가 매우 길게 실행되는 경우에 적용되는 특수한 최적화 기법
    - 인터프리터로 루프를 실행하던 도중, 해당 루프가 포함된 메소드의 컴파일이 완료되면 즉시 실행 지점을 컴파일된 네이티브 코드로 교체하여 성능 향상

## 실행 엔진의 구조와 JIT 컴파일러

실행 엔진은 바이트 코드를 실행하는 주체이며, 크게 다음과 같은 요소로 구성된다.

```mermaid
graph TD
    subgraph 실행 엔진
        Interpreter[인터프리터]

        subgraph JIT_Compiler [JIT 컴파일러]
            direction TB
            C1[C1 컴파일러<br>Client Compiler]
            C2[C2 컴파일러<br>Server Compiler]
        end

        Profiler[프로파일러]
        GC[가비지 컬렉터]
    end

    Interpreter -- 프로파일링 요청 --> Profiler
    Profiler -- Hot Spot 정보 전달 --> JIT_Compiler
```

- 인터프리터(Interpreter): 바이트 코드를 한 줄씩 해석하고 실행
- JIT 컴파일러(Just-In-Time Compiler): 인터프리터가 수집한 프로파일링 정보를 바탕으로 Hot Spot 코드를 찾아 네이티브 코드로 컴파일
    - C1 컴파일러: 빠른 컴파일 속도에 중점
    - C2 컴파일러: 최종 코드의 실행 성능을 극대화하는 데 중점
- 프로파일러(Profiler): 코드의 실행 빈도, 분기 예측 등 최적화에 필요한 정보를 수집
- 가비지 컬렉터(Garbage Collector, GC): 더 이상 사용되지 않는 객체를 메모리에서 해제하는 역할

C1과 C2 컴파일러는 실행 엔진 내 JIT 컴파일러의 일부로서, 인터프리터 및 프로파일러와 상호작용하며 계층적 컴파일을 수행한다.

### C1 vs C2 컴파일러

- C1(Client) 컴파일러
    - 빠른 컴파일 속도와 낮은 응답 지연 시간
    - 코드 최적화는 덜 정교하지만, 빠른 컴파일로 초기 실행 성능 향상
    - 즉시 실행해야 하는 애플리케이션에 적합
- C2(Server) 컴파일러
    - 컴파일 비용이 높더라도 최종 실행 성능의 극대화
    - 실행 속도는 느리지만, 높은 최적화 수준으로 warm-up 시간이 지난 후 빠른 성능 제공
    - 장기 실행되는 애플리케이션에 적합

## 계층적 컴파일 구조

현대 JVM은 빠른 응답성과 최종 성능을 모두 만족시키기 위해 5단계의 계층형 컴파일 체계를 활용하며, 각 레벨은 컴파일 속도와 최적화 수준의 트레이드오프 관계를 가진다.

|   레벨    |          명칭           |                       상세 특징                       |
|:-------:|:---------------------:|:-------------------------------------------------:|
| Level 0 |      Interpreter      |             프로파일링 데이터를 수집하며 바이트 코드 실행             |
| Level 1 |      C1(Simple)       |      최적화나 프로파일링 없이 가장 단순하게 C1으로 컴파일하여 속도 향상       |
| Level 2 |  C1(Limited Profile)  |           낮은 수준의 카운터 정보만 포함하여 C1으로 컴파일            |
| Level 3 |   C1(Full Profile)    |   분기 예측, 타입 정보 등 상세 데이터를 수집하며 C1으로 컴파일(C2 최적화용)   |
| Level 4 | C2(Full Optimization) | 수집된 모든 데이터를 바탕으로 C2 컴파일러가 고도의 최적화를 적용한 네이티브 코드 생성 |

계층적 컴파일의 전체 흐름은 다음과 같다.

```mermaid
graph TD
    A[Bytecode] --> B[Interpreter<br>Level 0]
    B -->|Profiling Data| C{Hot Spot?}
    C -- No --> B
    C -- Yes --> D[Compile Queue]
    D --> E[C1 Compiler]
    E -->|Level 1 - 3| F[Code Cache]
    F -->|More Profiling| G[C2 Compiler]
    G -->|Level 4| F
    F -->|Deoptimization| B
```

## Code Cache 및 Sweeper 관리

컴파일된 네이티브 코드는 `Code Cache`라는 JVM 내 전용 메모리 영역에 저장된다.

- 위치: 힙·메타스페이스와 분리된 별도의 네이티브 메모리 영역, 실행 권한이 부여된 페이지에 배치되어 CPU가 직접 fetch 가능
- 기본 최대 크기: Tiered Compilation 활성 시 약 240MB, 비활성 시 48MB
    - `-XX:ReservedCodeCacheSize`로 최대 크기, `-XX:InitialCodeCacheSize`로 초기 크기 별도 지정 가능
- 한도 초과 시: 새 컴파일이 중단되고 모든 코드가 인터프리터로만 실행 → 시스템 성능 급격히 저하

코드 상태는 다음 세 단계를 거치며 변화한다.

1. `Active`: 현재 활발히 실행 중인 상태
2. `Not-Entrant`: 역최적화 등으로 인해 새로운 진입은 차단되었으나, 기존 실행 스레드는 남아있는 상태
3. `Zombie`: 어떤 스레드도 참조하지 않는 완전한 폐기 대상 상태

## Deoptimization (역최적화)

JIT는 런타임에 관찰한 패턴이 앞으로도 유지된다는 가정을 깔고 공격적으로 최적화하는데, 이 가정이 깨지면 컴파일된 네이티브 코드를 폐기하고 인터프리터로 되돌아가는 일이 발생한다.

- 트리거 예시
    - 인라인 캐싱한 가상 메서드의 실제 구현체가 바뀜 (지금까지 한 종류만 호출됐는데 새 타입의 객체가 들어옴)
    - 한 번도 발생하지 않으리라 가정한 분기·예외가 실제로 발생
    - 새 서브클래스가 로딩되어 "이 메서드는 단일 구현체만 가진다"는 가정이 무너짐
- 동작: 해당 메서드의 실행 흐름이 컴파일된 네이티브 코드에서 인터프리터로 되돌아가고, 카운터가 다시 쌓이면 재컴파일
- 비용: 자주 일어나면 Code Cache의 `Not-Entrant` 코드가 누적되어 단편화로 가용 용량 감소
- 빈도: 일반 애플리케이션에서는 거의 보이지 않으며, 다형성이 극단적으로 높은 코드에서 종종 관찰

## 주요 JIT 최적화 기법

JIT는 단순히 바이트 코드를 기계어로 1:1 번역하는 것이 아니라, 런타임 프로파일을 기반으로 추측을 깔고 정적 컴파일러가 할 수 없는 공격적 최적화를 수행한다.

- 정적 컴파일러는 모든 입력·실행 경로에 안전한 코드를 생성해야 하므로 가장 일반적인 형태로만 최적화 가능
- JIT는 실제 관찰된 분기·타입·호출 대상을 가정으로 잡고 가지치기, 예측이 빗나가면 Deoptimization으로 안전하게 인터프리터로 회복
- "런타임 정보 + 빠른 회복 메커니즘"의 조합이 JIT가 정적 컴파일을 추월할 수 있는 본질

### Method Inlining(메소드 인라이닝)

호출 빈도가 높고 크기가 작은 메소드의 코드를 호출 지점에 직접 삽입하는 기법으로, 함수 호출에 필요한 비용을 제거하여 성능을 향상시킨다.

```java
// 최적화 전 Java 코드
public int calculate() {
    int result = 0;
    for (int i = 0; i < 1000; i++) {
        result = add(result, i); // add 메소드를 반복 호출
    }
    return result;
}

private int add(int a, int b) {
    return a + b;
}

// JIT 컴파일러 최적화 후
public int calculate() {
    int result = 0;
    for (int i = 0; i < 1000; i++) {
        result = result + i; // 메소드 호출 없이 연산이 직접 수행
    }
    return result;
}

```

위처럼 `add` 메소드는 크기가 작고 자주 호출되므로 인라이닝 대상이 되어, 호출 오버헤드가 제거되고 루프 내에서 추가적인 최적화가 가능해진다.

### Escape Analysis(탈출 분석)

객체의 사용 범위를 분석하여 특정 객체가 메소드나 스레드의 경계를 벗어나는지(escape) 확인하는 기법으로, 탈출하지 않는 객체에 대해 여러 최적화를 적용한다.

#### Scalar Replacement(스칼라 대체)

객체를 힙에 할당하는 대신, 객체의 필드들을 각각의 지역 변수(스칼라 값)로 분해하여 스택이나 레지스터에 할당한다.

```java
// 최적화 전 Java 코드
// Point 객체는 이 메소드 내에서만 생성되고 사용된 후 사라짐(탈출하지 않음)
public void getPointDistance() {
    Point p = new Point(10, 20);
    double distance = Math.sqrt(p.x * p.x + p.y * p.y);
    // ...Point 객체 미사용
}

// JIT 컴파일러의 최적화 후
// JIT 컴파일러는 Point 객체가 힙에 할당될 필요가 없다고 판단하고, 필드 x와 y를 지역 변수로 대체
public void getPointDistance() {
    int x = 10;
    int y = 20;
    double distance = Math.sqrt(x * x + y * y);
    // ...Point 객체 미사용
}
```

#### Lock Elision(락 제거)

탈출 분석을 통해 특정 객체(Lock)가 단일 스레드에서만 사용되는 것을 확인하면, 해당 객체에 대한 동기화 구문(`synchronized`)을 불필요하다고 판단하여 제거한다.

```java
// 최적화 전 Java 코드
// 아래 getSafeCount 메소드 내의 'counter' 객체는 이 메소드 안에서만 생성되고 사용
class Counter {

    private int count = 0;

    // 동기화된 메소드
    public synchronized void increment() {
        count++;
    }

    public int getCount() {
        return count;
    }
}

public int getSafeCount() {
    Counter counter = new Counter(); // counter 객체는 이 메소드를 탈출하지 않음
    counter.increment();
    counter.increment();
    return counter.getCount();
}

// JIT 컴파일러의 최적화 후 
// JIT은 'counter' 객체가 스레드 로컬임을 인지하고, increment() 메소드를 호출할 때 동기화(락) 비용을 제거
class Counter {

    private int count = 0;

    // 락이 제거된 메소드 (개념적 표현)
    public void increment() {
        count++;
    }

    public int getCount() {
        return count;
    }
}

public int getSafeCount() {
    Counter counter = new Counter();
    counter.increment(); // 동기화 없이 호출
    counter.increment(); // 동기화 없이 호출
    return counter.getCount();
}
```

### Loop Optimization(루프 최적화)

루프는 프로그램 성능에 큰 영향을 미치므로 JIT 컴파일러는 다양한 루프 관련 최적화를 수행한다.

#### Loop Unrolling(루프 펼치기)

루프의 반복 횟수를 줄이기 위해 루프 본문을 여러 번 복제하는 기법이며, 루프 제어에 드는 분기 예측 비용을 감소시킨다.

```java
// 최적화 전 Java 코드
public void exampleLoop() {
    for (int i = 0; i < 4; i++) {
        process(i);
    }
}

// JIT 컴파일러의 최적화 후
// JIT은 루프 제어에 드는 비용(분기 예측)을 줄이기 위해 루프 본문을 펼침
public void exampleLoop() {
    process(0);
    process(1);
    process(2);
    process(3);
}
```

#### Lock Coarsening(락 병합)

루프 내부에서 동일한 락 객체에 대한 `lock-unlock` 작업이 반복될 경우, 이를 루프 바깥으로 빼내어 락의 범위를 확장하고 락 획득/해제 횟수를 줄인다.

```java
// 최적화 전 Java 코드
public void synchronizedLoop() {
    for (int i = 0; i < 1000; i++) {
        synchronized (this) {
            // do something
        }
    }
}

// JIT 컴파일러의 최적화 후
// JIT은 여러 번의 락 연산을 하나의 큰 락으로 병합하여 오버헤드를 줄임
public void synchronizedLoop() {
    synchronized (this) {
        for (int i = 0; i < 1000; i++) {
            // do something
        }
    }
}
```

## Graal 및 JVMCI

최근 자바는 자바 언어 자체로 작성된 고성능 컴파일러를 도입하여 확장성과 효율성을 높이고 있다.

- JVMCI(JVM Compiler Interface): JVM과 외부 컴파일러를 연결하는 표준 인터페이스로, 컴파일러를 플러그인처럼 교체할 수 있도록 지원
- Graal Compiler: JVMCI를 통해 HotSpot JVM에 연결되는 차세대 컴파일러로, 정교한 탈출 분석 등 C2보다 공격적인 최적화 제공

## JVM Warm-up

JIT 컴파일과 클래스 로딩의 지연 특성으로 인해, JVM 기반 애플리케이션은 배포 직후 첫 요청들의 처리 시간이 정상 상태 대비 수십~수백 배 느려질 수 있다.

- 클래스 로딩 지연: JVM은 모든 클래스를 기동 시점에 로딩하지 않고, 실제 코드 경로가 실행될 때 해당 클래스를 동적으로 로딩
- JIT 컴파일 대기: 첫 요청은 인터프리터 모드로 실행되며, 핫스팟으로 감지되어 네이티브 코드로 컴파일되기까지 반복 실행이 필요
- 복합 지연: 클래스 로딩과 인터프리터 실행이 동시에 발생하여 CPU 사용률이 급증하고, 이 시간 동안 점유된 자원(DB 커넥션, 스레드 등)이 반환되지 않아 후속 요청에 연쇄 지연 유발

### 웜업의 목적

실제 트래픽이 유입되기 전에 주요 코드 경로를 미리 실행하여, 클래스 로딩과 JIT 컴파일을 사전에 완료하는 전략이다.

- 클래스 로딩 완료: 비즈니스 로직에 필요한 클래스(ORM, JSON 파서, 쿼리 빌더 등)를 메모리에 미리 적재
- Code Cache 축적: 반복 실행을 통해 핫스팟 코드가 C1/C2 컴파일러를 거쳐 네이티브 코드로 변환되고 Code Cache에 저장

### 웜업 구현 방식

Spring Boot 환경에서는 `ApplicationRunner` 인터페이스를 활용하여 애플리케이션 구동 직후 핵심 서비스 로직을 반복 실행하는 방식이 존재한다.

- 대상 선정: 호출 빈도가 높고 외부 라이브러리(JPA, Jackson 등) 의존성이 큰 조회 로직
- 반복 횟수: 클래스 로딩이 주 목적이면 수십 회로도 초기 지연을 감소시킬 수 있으며, JIT 최적화까지 목표로 하면 계층적 컴파일의 임계치(C1 Level 3 → C2 Level 4 승격 기준)를 고려하여 설정
- 부작용 방지: DB 쓰기 작업이나 외부 API 호출이 포함된 경우 조회 전용 로직을 선정하거나 별도 격리 필요

### 트래픽 유입 제어

웜업이 완료되기 전에 실제 트래픽이 유입되면 웜업의 효과가 상쇄된다.

- Kubernetes 환경에서는 `startupProbe`를 활용하여 웜업 완료 전까지 `readinessProbe`를 비활성화하고, 로드밸런서가 해당 Pod로 트래픽을 라우팅하지 않도록 제어

```yaml
# startupProbe 설정 예시
startupProbe:
  httpGet:
    path: /api/warmup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```
